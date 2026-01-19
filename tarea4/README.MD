## Arquitectura general

El proyecto está separado en capa de presentación (Thymeleaf + JS) y capa de negocio/acceso a datos (Spring Boot + JPA):

- **Frontend**
  - `src/main/resources/templates/fragments/nav.html`: fragmento con la barra de navegación y estilos reutilizables.
  - `src/main/resources/templates/avisos.html`: vista principal con la tabla de avisos y la paginación.
  - `src/main/resources/static/js/ratings.js`: script que consulta la API de avisos, renderiza la tabla en el navegador y envía las evaluaciones con `fetch`.
  - `src/main/resources/static/css/styles.css`: hoja de estilos reutilizada y adaptada desde la tarea anterior.

- **Backend (Java / Spring Boot)**
  - `controllers/ApiController.java`: expone los endpoints REST para listar avisos paginados y registrar nuevas notas.
  - `controllers/AppController.java`: controla las rutas de la parte web y resuelve la vista `avisos.html`.
  - `services/ApiService.java`: contiene la lógica para construir el resumen de avisos (incluyendo promedio y cantidad de notas) y guardar nuevas evaluaciones.
  - `services/AppService.java`: capa de servicio para la parte web (actualmente simple, pero separada para mantener la estructura).
  - `models/*.java`: entidades JPA (`AvisoAdopcion`, `Comuna`, `Nota`) que mapean las tablas de la base de datos.
  - `dto/*.java`: clases de transferencia (`AvisoResumenDTO`, `NotaRequest`, `NotaResponseDTO`) usadas para separar la representación de la API del modelo de datos.
  - `models/AvisoRepository.java` y `models/NotaRepository.java`: repositorios JPA para consultar avisos y notas.

## Flujo de uso

1. El usuario entra a `/` y es redirigido a `/avisos`, donde se renderiza `avisos.html`.
2. Al cargar la página, `ratings.js` llama a `GET /api/avisos?page=...&size=...` para obtener un listado paginado con los avisos y sus datos agregados (promedio de nota y cantidad de notas).
3. La tabla se construye dinámicamente en el navegador. Si un aviso no tiene evaluaciones, la columna de nota muestra `-`.
4. Al hacer clic en “Evaluar”, el script pide una nota entre 1 y 7 y la envía con `POST /api/avisos/{id}/notas` en formato JSON.

5. El backend valida la nota, la guarda en la tabla `nota`, recalcula el promedio y el total de evaluaciones de ese aviso y el frontend vuelve a cargar la página actual para reflejar los nuevos valores.

Option Explicit

'========================
' CONFIG GENERAL
'========================
Private Const REPO_BASE_SHEET As String = "Base"
Private Const REPO_HEADER_ROW As Long = 1
Private Const REPO_ID_COL As Long = 1          'Columna A (ID_INTERNO)

'En Automation_Repo.xlsm puedes tener una hoja "Config" con:
' - B2 = ruta completa a Repositorio.xlsx (opcional)
' - B3 = nombre del UserForm de export (opcional)
Private Const MACRO_CONFIG_SHEET As String = "Config"
Private Const CELL_REPO_PATH As String = "B2"
Private Const CELL_USERFORM_NAME As String = "B3"

'========================
' CONDOR INPUT (confirmado por ti)
'========================
Private Const IN_SHEET_PRODUCT As String = "Product_1"
Private Const IN_CELL_COMISIONES As String = "C63"
Private Const IN_CELL_MESES_VENTA As String = "C20"
Private Const IN_CELL_SINIESTRALIDAD As String = "C124"

Private Const IN_SHEET_GLOBAL As String = "Global"
Private Const IN_CELL_RETENCION As String = "C108"

'========================
' CONDOR OUTPUT (confirmado por ti)
'========================
'Tuviste: "fila 24 a partir de C en IFRS4"
'Dejo fallback por si el nombre real es el anterior (Results_IFRS4_Net)
Private Const OUT_SHEET_PRIMARY As String = "IFRS4"
Private Const OUT_SHEET_FALLBACK As String = "Results_IFRS4_Net"

Private Const OUT_START_COL As Long = 3 'C
Private Const OUT_ROW_WRITTEN_PREM_NET_TAX As Long = 24 'serie desde col C
Private Const OUT_ROW_DEVOLUCIONES As Long = 29         'serie desde col C
Private Const OUT_ROW_EP As Long = 39                   'serie desde col C
Private Const OUT_ROW_CLAIMS As Long = 66               'serie desde col C

'========================
' ENTRYPOINT (UI)
'========================
Public Sub abrir_rep_condor()
    'El UserForm existe físicamente en el proyecto (carpeta Formularios).
    'Para no hardcodear el nombre, lo leo desde Config!B3.
    'Si no existe o está vacío, cae a ejecución por prompts.
    Dim formName As String
    formName = GetConfigText(CELL_USERFORM_NAME)

    If Len(formName) > 0 Then
        On Error GoTo FALLBACK
        Dim uf As Object
        Set uf = VBA.UserForms.Add(formName)
        uf.Show
        Exit Sub
    End If

FALLBACK:
    'Sin form o error de nombre => flujo por prompts
    exportar_rep_condor
End Sub

'========================================================
' EXPORT (Condor INPUT + OUTPUT -> Repositorio.xlsx / Base)
'========================================================
Public Sub exportar_rep_condor( _
    Optional ByVal repoPath As String = vbNullString, _
    Optional ByVal condorInputPath As String = vbNullString, _
    Optional ByVal condorOutputPath As String = vbNullString, _
    Optional ByVal fxEURCLP As Double = 0#, _
    Optional ByVal codigoTarifa As String = vbNullString, _
    Optional ByVal poliza As String = vbNullString, _
    Optional ByVal idBizagi As String = vbNullString, _
    Optional ByVal socio As String = vbNullString, _
    Optional ByVal validTerr As String = vbNullString, _
    Optional ByVal validTec As String = vbNullString, _
    Optional ByVal validVC As String = vbNullString, _
    Optional ByVal cutOffRunOff As String = vbNullString, _
    Optional ByVal fechaCutOff As Variant, _
    Optional ByVal inflacion As String = vbNullString, _
    Optional ByVal profitSharing As String = vbNullString, _
    Optional ByVal pctProfitSharing As Variant, _
    Optional ByVal reaseguro As String = vbNullString, _
    Optional ByVal pctPrimaCedida As Variant, _
    Optional ByVal pctSiniestroCedido As Variant, _
    Optional ByVal aplicaFormulaSiniestralidad As String = vbNullString, _
    Optional ByVal brim As String = vbNullString, _
    Optional ByVal kpiBrim As String = vbNullString, _
    Optional ByVal linInf As String = vbNullString, _
    Optional ByVal linSup As String = vbNullString, _
    Optional ByVal motivoSeguimiento As String = vbNullString, _
    Optional ByVal solicitaSeguimiento As String = vbNullString, _
    Optional ByVal planAccionPos As String = vbNullString, _
    Optional ByVal planAccionNeg As String = vbNullString, _
    Optional ByVal comentariosAdic As String = vbNullString, _
    Optional ByVal closeRepoAfter As Boolean = True _
)

    Dim macroWB As Workbook
    Set macroWB = ThisWorkbook 'Automation_Repo.xlsm (archivo del macro)

    Dim repoWB As Workbook
    Dim baseWS As Worksheet

    Dim wbIn As Workbook, wbOut As Workbook
    Dim wsOut As Worksheet

    '--- Excel state
    Dim prevScreenUpdating As Boolean
    Dim prevEnableEvents As Boolean
    Dim prevDisplayAlerts As Boolean
    Dim prevAskToUpdateLinks As Boolean
    Dim prevCalculation As XlCalculation

    '--- Datos que extraemos
    Dim comisiones As Double
    Dim retencion As Double
    Dim mesesVenta As Variant
    Dim siniestralidadIn As Double

    Dim writtenPremNetTaxTotal_EUR As Double
    Dim writtenPremNetTaxTotal_CLP As Double
    Dim epTotal As Double, claimsTotal As Double, devolTotal As Double
    Dim siniestralidadOut As Variant
    Dim devolPct As Variant

    '--- Repo: columnas (por header)
    Dim col_ID As Long, col_TARIFA As Long, col_POLIZA As Long, col_RUTA As Long
    Dim col_BIZAGI As Long, col_SOCIO As Long
    Dim col_VT As Long, col_VTEC As Long, col_VVC As Long
    Dim col_CUTOFF As Long, col_FECHA_CUTOFF As Long
    Dim col_INFL As Long, col_PS As Long, col_PCT_PS As Long
    Dim col_REA As Long, col_PRIMA_CED As Long, col_SIN_CED As Long
    Dim col_FORM_SIN As Long
    Dim col_BRIM As Long, col_KPI As Long, col_LIN_INF As Long, col_LIN_SUP As Long
    Dim col_MOTIVO As Long, col_SOLICITA As Long, col_PLAN_POS As Long, col_PLAN_NEG As Long, col_COM_AD As Long
    Dim col_FECHA_FIN_TARIFA As Long
    Dim col_OBS As Long

    Dim col_PRIMA As Long, col_UNI_PRIMA As Long
    Dim col_COM As Long, col_RET As Long, col_MV As Long, col_LR As Long, col_DEV As Long
    Dim col_UF As Long

    Dim nextRow As Long
    Dim nextId As Long
    Dim obsFinal As String

    On Error GoTo FAIL

    '========================
    ' 0) Inputs mínimos (si no vienen desde UserForm)
    '========================
    If Len(repoPath) = 0 Then repoPath = GetRepoPathFromConfigOrPicker()
    If Len(repoPath) = 0 Then Exit Sub

    If Len(condorInputPath) = 0 Then condorInputPath = PickExcelFile("Selecciona el archivo INPUT de Condor")
    If Len(condorInputPath) = 0 Then Exit Sub

    If Len(condorOutputPath) = 0 Then condorOutputPath = PickExcelFile("Selecciona el archivo OUTPUT de Condor")
    If Len(condorOutputPath) = 0 Then Exit Sub

    If fxEURCLP <= 0 Then
        fxEURCLP = PromptNumberRequired("Tipo de cambio EUR -> CLP (ej: 950.5)", "Export Condor")
        If fxEURCLP <= 0 Then Exit Sub
    End If

    If Len(codigoTarifa) = 0 Then codigoTarifa = PromptRequired("CODIGO_TARIFA (manual)", "Export Condor")
    If Len(codigoTarifa) = 0 Then Exit Sub

    If Len(poliza) = 0 Then poliza = PromptRequired("POLIZA (manual)", "Export Condor")
    If Len(poliza) = 0 Then Exit Sub

    '========================
    ' 1) Guardar estado Excel + optimizar
    '========================
    prevScreenUpdating = Application.ScreenUpdating
    prevEnableEvents = Application.EnableEvents
    prevDisplayAlerts = Application.DisplayAlerts
    prevAskToUpdateLinks = Application.AskToUpdateLinks
    prevCalculation = Application.Calculation

    Application.ScreenUpdating = False
    Application.EnableEvents = False
    Application.DisplayAlerts = False
    Application.AskToUpdateLinks = False
    Application.Calculation = xlCalculationManual

    '========================
    ' 2) Abrir repo + Condor (input/output)
    '========================
    Set repoWB = OpenWorkbookReadWrite(repoPath)
    Set baseWS = GetWorksheet(repoWB, REPO_BASE_SHEET)

    Set wbIn = Workbooks.Open(Filename:=condorInputPath, UpdateLinks:=0, ReadOnly:=True, AddToMru:=False)
    Set wbOut = Workbooks.Open(Filename:=condorOutputPath, UpdateLinks:=0, ReadOnly:=True, AddToMru:=False)

    Set wsOut = GetWorksheetEither(wbOut, OUT_SHEET_PRIMARY, OUT_SHEET_FALLBACK)

    '========================
    ' 3) Calcular nuevo ID (Base!A)
    '========================
    nextId = NextIdFromBase(baseWS, REPO_ID_COL, REPO_HEADER_ROW + 1)

    '========================
    ' 4) Extraer valores desde Condor
    '========================
    'INPUT
    comisiones = NormalizePct(ReadNum(wbIn, IN_SHEET_PRODUCT, IN_CELL_COMISIONES))
    retencion = NormalizePct(ReadNum(wbIn, IN_SHEET_GLOBAL, IN_CELL_RETENCION))
    mesesVenta = ReadVar(wbIn, IN_SHEET_PRODUCT, IN_CELL_MESES_VENTA)
    siniestralidadIn = NormalizePct(ReadNum(wbIn, IN_SHEET_PRODUCT, IN_CELL_SINIESTRALIDAD))

    'OUTPUT series
    writtenPremNetTaxTotal_EUR = SumRowSeriesWS(wsOut, OUT_ROW_WRITTEN_PREM_NET_TAX, OUT_START_COL)
    writtenPremNetTaxTotal_CLP = writtenPremNetTaxTotal_EUR * fxEURCLP

    epTotal = SumRowSeriesWS(wsOut, OUT_ROW_EP, OUT_START_COL)
    claimsTotal = SumRowSeriesWS(wsOut, OUT_ROW_CLAIMS, OUT_START_COL)
    devolTotal = SumRowSeriesWS(wsOut, OUT_ROW_DEVOLUCIONES, OUT_START_COL)

    'Siniestralidad preferible desde output si EP existe (claims/EP); si no, cae a input
    If epTotal <> 0 Then
        siniestralidadOut = SafeDiv(claimsTotal, epTotal)
    Else
        siniestralidadOut = Empty
    End If

    'Devoluciones % sobre prima neta de IVA => / Written premium net of tax
    If writtenPremNetTaxTotal_EUR <> 0 Then
        'Si refunds vienen negativos, dejamos % positivo
        If devolTotal < 0 Then
            devolPct = SafeDiv(Abs(devolTotal), writtenPremNetTaxTotal_EUR)
        Else
            devolPct = SafeDiv(devolTotal, writtenPremNetTaxTotal_EUR)
        End If
    Else
        devolPct = vbNullString
    End If

    '========================
    ' 5) Ubicar columnas en Base por header
    '========================
    col_ID = GetColByHeader(baseWS, "ID_INTERNO")
    col_TARIFA = GetColByHeader(baseWS, "CODIGO_TARIFA")
    col_RUTA = GetColByHeader(baseWS, "RUTA")
    col_POLIZA = GetColByHeader(baseWS, "POLIZA")
    col_BIZAGI = TryGetColByHeader(baseWS, "ID_BIZAGI")
    col_SOCIO = TryGetColByHeader(baseWS, "SOCIO")

    col_VT = TryGetColByHeader(baseWS, "VALIDACION_TERRITORIAL")
    col_VTEC = TryGetColByHeader(baseWS, "VALIDACION_TECNICA")
    col_VVC = TryGetColByHeader(baseWS, "VALIDACION_VALOR_CLIENTE")

    col_PRIMA = TryGetColByHeader(baseWS, "PRIMA_CLIENTE_NETA")
    col_UNI_PRIMA = TryGetColByHeader(baseWS, "UNIDAD_PRIMA_CLIENTE_NETA")
    col_COM = TryGetColByHeader(baseWS, "COMISIONES")
    col_RET = TryGetColByHeader(baseWS, "RETENCION")
    col_MV = TryGetColByHeader(baseWS, "MESES_DE_VENTA")
    col_LR = TryGetColByHeader(baseWS, "SINIESTRALIDAD")
    col_DEV = TryGetColByHeader(baseWS, "DEVOLUCIONES")

    col_CUTOFF = TryGetColByHeader(baseWS, "CUT_OFF_RUN_OFF")
    col_FECHA_CUTOFF = TryGetColByHeader(baseWS, "FECHA_CUT_OFF")

    col_INFL = TryGetColByHeader(baseWS, "INFLACION")
    col_PS = TryGetColByHeader(baseWS, "PROFIT_SHARING")
    col_PCT_PS = TryGetColByHeader(baseWS, "PORCENTAJE_PROFIT_SHARING")

    col_REA = TryGetColByHeader(baseWS, "REASEGURO")
    col_PRIMA_CED = TryGetColByHeader(baseWS, "PRIMA_CEDIDA")
    col_SIN_CED = TryGetColByHeader(baseWS, "SINIESTRO_CEDIDO")

    col_FORM_SIN = TryGetColByHeader(baseWS, "FORMULA_SINIESTRALIDAD_APLI")

    col_BRIM = TryGetColByHeader(baseWS, "BRIM")
    col_KPI = TryGetColByHeader(baseWS, "KPI_BRIM")
    col_LIN_INF = TryGetColByHeader(baseWS, "LIN_INFERIOR")
    col_LIN_SUP = TryGetColByHeader(baseWS, "LIN_SUPERIOR")
    col_MOTIVO = TryGetColByHeader(baseWS, "MOTIVO_SEGUIMIENTO")
    col_SOLICITA = TryGetColByHeader(baseWS, "SOLICITA_SEGUIMIENTO")
    col_PLAN_POS = TryGetColByHeader(baseWS, "PLAN_ACCION_ESCENARIO_POSI")
    col_PLAN_NEG = TryGetColByHeader(baseWS, "PLAN_ACCION_ESCENARIO_NEGA")
    col_COM_AD = TryGetColByHeader(baseWS, "COMENTARIOS_ADICIONALES_BRI")

    col_FECHA_FIN_TARIFA = TryGetColByHeader(baseWS, "FECHA_FIN_TARIFA")
    col_UF = TryGetColByHeader(baseWS, "UF")
    col_OBS = TryGetColByHeader(baseWS, "OBSERVACION")

    '========================
    ' 6) Siguiente fila y escritura
    '========================
    nextRow = NextFreeRow(baseWS, col_ID, REPO_HEADER_ROW + 1)

    'Campos mínimos (siempre)
    baseWS.Cells(nextRow, col_ID).Value2 = nextId
    baseWS.Cells(nextRow, col_TARIFA).Value2 = codigoTarifa
    baseWS.Cells(nextRow, col_POLIZA).Value2 = poliza

    'RUTA: guardo OUTPUT (y meto INPUT en OBS)
    baseWS.Cells(nextRow, col_RUTA).Value2 = condorOutputPath

    'Opcionales desde form/prompts
    If col_BIZAGI > 0 Then baseWS.Cells(nextRow, col_BIZAGI).Value2 = idBizagi
    If col_SOCIO > 0 Then baseWS.Cells(nextRow, col_SOCIO).Value2 = socio

    If col_VT > 0 Then baseWS.Cells(nextRow, col_VT).Value2 = validTerr
    If col_VTEC > 0 Then baseWS.Cells(nextRow, col_VTEC).Value2 = validTec
    If col_VVC > 0 Then baseWS.Cells(nextRow, col_VVC).Value2 = validVC

    If col_CUTOFF > 0 Then baseWS.Cells(nextRow, col_CUTOFF).Value2 = cutOffRunOff
    If col_FECHA_CUTOFF > 0 Then
        If IsDate(fechaCutOff) Then baseWS.Cells(nextRow, col_FECHA_CUTOFF).Value2 = CDate(fechaCutOff)
    End If

    If col_INFL > 0 Then baseWS.Cells(nextRow, col_INFL).Value2 = inflacion
    If col_PS > 0 Then baseWS.Cells(nextRow, col_PS).Value2 = profitSharing
    If col_PCT_PS > 0 Then
        If IsNumeric(pctProfitSharing) Then baseWS.Cells(nextRow, col_PCT_PS).Value2 = NormalizePct(CDbl(pctProfitSharing))
    End If

    If col_REA > 0 Then baseWS.Cells(nextRow, col_REA).Value2 = reaseguro
    If col_PRIMA_CED > 0 Then
        If IsNumeric(pctPrimaCedida) Then baseWS.Cells(nextRow, col_PRIMA_CED).Value2 = NormalizePct(CDbl(pctPrimaCedida))
    End If
    If col_SIN_CED > 0 Then
        If IsNumeric(pctSiniestroCedido) Then baseWS.Cells(nextRow, col_SIN_CED).Value2 = NormalizePct(CDbl(pctSiniestroCedido))
    End If

    If col_FORM_SIN > 0 Then baseWS.Cells(nextRow, col_FORM_SIN).Value2 = aplicaFormulaSiniestralidad

    If col_BRIM > 0 Then baseWS.Cells(nextRow, col_BRIM).Value2 = brim
    If col_KPI > 0 Then baseWS.Cells(nextRow, col_KPI).Value2 = kpiBrim
    If col_LIN_INF > 0 Then baseWS.Cells(nextRow, col_LIN_INF).Value2 = linInf
    If col_LIN_SUP > 0 Then baseWS.Cells(nextRow, col_LIN_SUP).Value2 = linSup
    If col_MOTIVO > 0 Then baseWS.Cells(nextRow, col_MOTIVO).Value2 = motivoSeguimiento
    If col_SOLICITA > 0 Then baseWS.Cells(nextRow, col_SOLICITA).Value2 = solicitaSeguimiento
    If col_PLAN_POS > 0 Then baseWS.Cells(nextRow, col_PLAN_POS).Value2 = planAccionPos
    If col_PLAN_NEG > 0 Then baseWS.Cells(nextRow, col_PLAN_NEG).Value2 = planAccionNeg
    If col_COM_AD > 0 Then baseWS.Cells(nextRow, col_COM_AD).Value2 = comentariosAdic

    If col_FECHA_FIN_TARIFA > 0 Then baseWS.Cells(nextRow, col_FECHA_FIN_TARIFA).Value2 = Date

    'Métricas Condor (automatizables hoy)
    If col_PRIMA > 0 Then baseWS.Cells(nextRow, col_PRIMA).Value2 = writtenPremNetTaxTotal_CLP
    If col_UNI_PRIMA > 0 Then baseWS.Cells(nextRow, col_UNI_PRIMA).Value2 = "CLP"

    If col_COM > 0 Then baseWS.Cells(nextRow, col_COM).Value2 = comisiones
    If col_RET > 0 Then baseWS.Cells(nextRow, col_RET).Value2 = retencion
    If col_MV > 0 Then baseWS.Cells(nextRow, col_MV).Value2 = mesesVenta

    If col_LR > 0 Then
        If Not IsEmpty(siniestralidadOut) Then
            baseWS.Cells(nextRow, col_LR).Value2 = CDbl(siniestralidadOut)
        Else
            baseWS.Cells(nextRow, col_LR).Value2 = siniestralidadIn
        End If
    End If

    If col_DEV > 0 Then
        If Not IsEmpty(devolPct) And Len(CStr(devolPct)) > 0 Then
            baseWS.Cells(nextRow, col_DEV).Value2 = CDbl(devolPct)
        End If
    End If

    'UF (si lo alimentan manualmente desde el form)
    If col_UF > 0 Then
        'Si tu UserForm lo rellena, pásalo por parámetro y setéalo aquí.
        'Por ahora se deja sin tocar.
    End If

    'OBSERVACION: agrego trazabilidad de archivos y FX sin borrar lo que venga del form
    obsFinal = ""
    If Len(observacionFromInputs(observacion, condorInputPath, condorOutputPath, fxEURCLP)) > 0 Then
        obsFinal = observacionFromInputs(observacion, condorInputPath, condorOutputPath, fxEURCLP)
    End If
    If col_OBS > 0 Then baseWS.Cells(nextRow, col_OBS).Value2 = obsFinal

    'Guardar repo
    repoWB.Save

CLEANUP:
    On Error Resume Next
    If Not wbIn Is Nothing Then wbIn.Close SaveChanges:=False
    If Not wbOut Is Nothing Then wbOut.Close SaveChanges:=False

    If Not repoWB Is Nothing Then
        If closeRepoAfter Then repoWB.Close SaveChanges:=True
    End If

    Application.Calculation = prevCalculation
    Application.AskToUpdateLinks = prevAskToUpdateLinks
    Application.DisplayAlerts = prevDisplayAlerts
    Application.EnableEvents = prevEnableEvents
    Application.ScreenUpdating = prevScreenUpdating
    Exit Sub

FAIL:
    MsgBox "Error exportar_rep_condor: " & Err.Number & " - " & Err.Description, vbCritical
    Resume CLEANUP
End Sub

'========================
' Helpers - Repo / Config
'========================
Private Function GetRepoPathFromConfigOrPicker() As String
    Dim p As String
    p = GetConfigText(CELL_REPO_PATH)
    If Len(p) > 0 Then
        GetRepoPathFromConfigOrPicker = p
    Else
        GetRepoPathFromConfigOrPicker = PickExcelFile("Selecciona Repositorio.xlsx")
    End If
End Function

Private Function GetConfigText(ByVal addr As String) As String
    On Error GoTo EH
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets(MACRO_CONFIG_SHEET)
    GetConfigText = Trim$(CStr(ws.Range(addr).Value2))
    Exit Function
EH:
    GetConfigText = vbNullString
End Function

Private Function OpenWorkbookReadWrite(ByVal fullPath As String) As Workbook
    Dim wb As Workbook
    For Each wb In Application.Workbooks
        If LCase$(wb.FullName) = LCase$(fullPath) Then
            Set OpenWorkbookReadWrite = wb
            Exit Function
        End If
    Next wb

    Set OpenWorkbookReadWrite = Workbooks.Open(Filename:=fullPath, UpdateLinks:=0, ReadOnly:=False, AddToMru:=False)
End Function

Private Function NextIdFromBase(ws As Worksheet, ByVal idCol As Long, ByVal firstDataRow As Long) As Long
    Dim lastCell As Range
    Dim r As Long, v As Variant

    'Busca última celda con valor en la columna A
    Set lastCell = ws.Columns(idCol).Find(What:="*", After:=ws.Cells(firstDataRow, idCol), _
        LookIn:=xlValues, LookAt:=xlPart, SearchOrder:=xlByRows, SearchDirection:=xlPrevious)

    If lastCell Is Nothing Then
        NextIdFromBase = 1
        Exit Function
    End If

    'Camina hacia arriba hasta encontrar un número válido (por si hay texto o huecos)
    For r = lastCell.Row To firstDataRow Step -1
        v = ws.Cells(r, idCol).Value2
        If IsNumeric(v) Then
            NextIdFromBase = CLng(v) + 1
            Exit Function
        End If
    Next r

    NextIdFromBase = 1
End Function

Private Function observacionFromInputs(ByVal obs As String, ByVal inPath As String, ByVal outPath As String, ByVal fx As Double) As String
    Dim s As String
    s = Trim$(obs)
    If Len(s) > 0 Then s = s & vbCrLf
    s = s & "INPUT=" & inPath & " | OUTPUT=" & outPath & " | FX(EUR->CLP)=" & CStr(fx)
    observacionFromInputs = s
End Function

'========================
' Helpers - Lectura Condor
'========================
Private Function GetWorksheet(wb As Workbook, sheetName As String) As Worksheet
    On Error GoTo EH
    Set GetWorksheet = wb.Worksheets(sheetName)
    Exit Function
EH:
    Err.Raise vbObjectError + 513, "GetWorksheet", _
              "No existe la hoja '" & sheetName & "' en '" & wb.Name & "'."
End Function

Private Function GetWorksheetEither(wb As Workbook, primaryName As String, fallbackName As String) As Worksheet
    On Error GoTo TRY_FALLBACK
    Set GetWorksheetEither = wb.Worksheets(primaryName)
    Exit Function

TRY_FALLBACK:
    On Error GoTo EH
    Set GetWorksheetEither = wb.Worksheets(fallbackName)
    Exit Function

EH:
    Err.Raise vbObjectError + 514, "GetWorksheetEither", _
              "No existe la hoja '" & primaryName & "' ni '" & fallbackName & "' en '" & wb.Name & "'."
End Function

Private Function ReadNum(wb As Workbook, sheetName As String, addr As String) As Double
    ReadNum = CDbl(GetWorksheet(wb, sheetName).Range(addr).Value2)
End Function

Private Function ReadVar(wb As Workbook, sheetName As String, addr As String) As Variant
    ReadVar = GetWorksheet(wb, sheetName).Range(addr).Value2
End Function

Private Function NormalizePct(ByVal x As Double) As Double
    'Si viene 5 => 0.05 ; si viene 0.05 queda igual
    If x > 1 Then NormalizePct = x / 100# Else NormalizePct = x
End Function

Private Function SumRowSeriesWS(ws As Worksheet, rowNum As Long, startCol As Long) As Double
    Dim lastCell As Range, lastCol As Long
    Set lastCell = ws.Rows(rowNum).Find(What:="*", After:=ws.Cells(rowNum, startCol), _
        LookIn:=xlValues, LookAt:=xlPart, SearchOrder:=xlByColumns, SearchDirection:=xlPrevious)

    If lastCell Is Nothing Then
        SumRowSeriesWS = 0#
        Exit Function
    End If

    lastCol = lastCell.Column
    SumRowSeriesWS = Application.WorksheetFunction.Sum(ws.Range(ws.Cells(rowNum, startCol), ws.Cells(rowNum, lastCol)))
End Function

Private Function SafeDiv(ByVal num As Double, ByVal den As Double) As Double
    If den = 0 Then
        SafeDiv = 0#
    Else
        SafeDiv = num / den
    End If
End Function

'========================
' Helpers - Base headers / rows
'========================
Private Function GetColByHeader(ws As Worksheet, headerName As String) As Long
    Dim c As Range
    Set c = ws.Rows(REPO_HEADER_ROW).Find(What:=headerName, LookIn:=xlValues, LookAt:=xlWhole, MatchCase:=False)
    If c Is Nothing Then
        Err.Raise vbObjectError + 515, "GetColByHeader", _
            "No encontré el header '" & headerName & "' en la fila " & REPO_HEADER_ROW & " de '" & ws.Name & "'."
    End If
    GetColByHeader = c.Column
End Function

Private Function TryGetColByHeader(ws As Worksheet, headerName As String) As Long
    Dim c As Range
    Set c = ws.Rows(REPO_HEADER_ROW).Find(What:=headerName, LookIn:=xlValues, LookAt:=xlWhole, MatchCase:=False)
    If c Is Nothing Then
        TryGetColByHeader = 0
    Else
        TryGetColByHeader = c.Column
    End If
End Function

Private Function NextFreeRow(ws As Worksheet, idCol As Long, firstDataRow As Long) As Long
    Dim lastCell As Range
    Set lastCell = ws.Columns(idCol).Find(What:="*", After:=ws.Cells(firstDataRow, idCol), _
        LookIn:=xlValues, LookAt:=xlPart, SearchOrder:=xlByRows, SearchDirection:=xlPrevious)

    If lastCell Is Nothing Then
        NextFreeRow = firstDataRow
    Else
        NextFreeRow = lastCell.Row + 1
    End If
End Function

'========================
' Helpers - Prompts / FilePicker
'========================
Private Function PickExcelFile(ByVal title As String) As String
    Dim fd As FileDialog
    Set fd = Application.FileDialog(msoFileDialogFilePicker)

    With fd
        .Title = title
        .Filters.Clear
        .Filters.Add "Excel", "*.xlsx; *.xlsm; *.xls"
        .AllowMultiSelect = False
        If .Show <> -1 Then
            PickExcelFile = vbNullString
        Else
            PickExcelFile = .SelectedItems(1)
        End If
    End With
End Function

Private Function PromptRequired(promptText As String, titleText As String) As String
    Dim v As Variant
    v = Application.InputBox(promptText, titleText, Type:=2)
    If v = False Then
        PromptRequired = vbNullString
    Else
        PromptRequired = Trim$(CStr(v))
    End If
End Function

Private Function PromptNumberRequired(promptText As String, titleText As String) As Double
    Dim v As Variant
    v = Application.InputBox(promptText, titleText, Type:=1)
    If v = False Then
        PromptNumberRequired = -1#
    Else
        PromptNumberRequired = CDbl(v)
    End If
End Function
