Option Explicit

'Guarda datos para exportar un producto al repositorio
Public Type tExportParams
    RepoPath As String
    CondorInputPath As String
    CondorOutputPath As String
    FxEURCLP As Double
    
    CodigoTarifa As String
    Poliza As String
    IdBizagi As String
    Socio As String
    ValidTerr As String
    ValidTec As String
    ValidVC As String
    
    CutOffRunOff As String
    FechaCutOff As Variant
    Inflacion As String
    ProfitSharing As String
    PctProfitSharing As Variant
    
    Reaseguro As String
    PctPrimaCedida As Variant
    PctSiniestroCedido As Variant
    
    AplicaFormulaSiniestralidad As String
    
    Brim As String
    KpiBrim As String
    LinInf As String
    LinSup As String
    MotivoSeguimiento As String
    SolicitaSeguimiento As String
    PlanAccionPos As String
    PlanAccionNeg As String
    ComentariosAdic As String
    
    Observacion As String
    
    Ventas As Variant
    GastosDirectosPct As Variant
    GastosIndirectosPct As Variant
    RetencionPct As Variant
    MesesVenta As Variant
    TasaEntrada As Variant
    DuracionMediaMeses As Variant
    CuotasPromedio As Variant
    ValorClientePct As Variant
    
    AsistenciaMensual As Variant
    AsistenciaVenta As Variant
    CostosMensuales As Variant
    CostosVenta As Variant
    OtrosCostosDirectosFijo As Variant
End Type

'Abre el formulario existente del proyecto
Public Sub abrir_rep_condor()
    Dim frm As Object
    Set frm = VBA.UserForms.Add("Repositorio")
    frm.Show
End Sub

'Lee el formulario abre condor y escribe una fila nueva en Base
Public Sub exportar_rep_condor()
    Dim p As tExportParams
    Dim frm As Object
    
    Set frm = GetLoadedUserForm("Repositorio")
    If frm Is Nothing Then
        Set frm = VBA.UserForms.Add("Repositorio")
    End If
    
    If Not GetParamsFromForm(frm, p) Then Exit Sub
    
    ExportarCore p, True
End Sub

'Hace toda la exportacion abre libros calcula metricas y escribe en Base
Private Sub ExportarCore(ByRef p As tExportParams, ByVal closeRepoAfter As Boolean)
    Dim prevScreenUpdating As Boolean
    Dim prevEnableEvents As Boolean
    Dim prevDisplayAlerts As Boolean
    Dim prevAskToUpdateLinks As Boolean
    Dim prevCalculation As XlCalculation
    
    Dim repoWB As Workbook
    Dim baseWS As Worksheet
    
    Dim inWB As Workbook
    Dim outWB As Workbook
    Dim outWS As Worksheet
    
    Dim headers As Object
    Dim nextRow As Long
    Dim nextId As Long
    
    Dim writtenPremiumEUR As Double
    Dim devolucionesEUR As Double
    Dim earnedPremiumEUR As Double
    Dim claimsEUR As Double
    
    Dim primaCLP As Variant
    Dim devolPct As Variant
    Dim lossRatio As Variant
    Dim commPct As Variant
    
    On Error GoTo FAIL
    
    'Guardamos settings actuales
    prevScreenUpdating = Application.ScreenUpdating
    prevEnableEvents = Application.EnableEvents
    prevDisplayAlerts = Application.DisplayAlerts
    prevAskToUpdateLinks = Application.AskToUpdateLinks
    prevCalculation = Application.Calculation
    
    'Estabilidad
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    Application.DisplayAlerts = False
    Application.AskToUpdateLinks = False
    Application.Calculation = xlCalculationManual
    
    'Abrimos el repositorio
    Set repoWB = Workbooks.Open(Filename:=p.RepoPath, UpdateLinks:=0, ReadOnly:=False, AddToMru:=False)
    Set baseWS = GetWorksheet(repoWB, "Base")
    
    'Mapa de headers
    Set headers = BuildHeaderMap(baseWS, 1)
    
    'Nuevo ID sumando 1 al ultimo ID disponible
    nextId = NextIdFromHeader(baseWS, headers, "ID_INTERNO", 2)
    
    'Siguiente fila libre
    nextRow = NextFreeRowFromHeader(baseWS, headers, "ID_INTERNO", 2)
    
    'Input de condor
    Set inWB = Workbooks.Open(Filename:=p.CondorInputPath, UpdateLinks:=0, ReadOnly:=True, AddToMru:=False)
    
    'Output de condor
    Set outWB = Workbooks.Open(Filename:=p.CondorOutputPath, UpdateLinks:=0, ReadOnly:=True, AddToMru:=False)
    Set outWS = GetWorksheet(outWB, "Results_IFRS4_Net")
    
    'Written premium net of tax fila 24 desde C
    writtenPremiumEUR = SumRowFromColC(outWS, 24)
    
    'Devoluciones fila 29 desde C
    devolucionesEUR = SumRowFromColC(outWS, 29)
    
    'EP fila 39 desde C
    earnedPremiumEUR = SumRowFromColC(outWS, 39)
    
    'Claims fila 66 desde C
    claimsEUR = SumRowFromColC(outWS, 66)
    
    'Comisiones input Product 1 C63
    commPct = NormalizePct(ReadCell(inWB, "Product_1", "C63"))
    
    'Meses de venta input Product 1 C20
    p.MesesVenta = ReadCell(inWB, "Product_1", "C20")
    
    'Retencion input Global C108
    p.RetencionPct = NormalizePct(ReadCell(inWB, "Global", "C108"))
    
    'Siniestralidad como Claims sobre EP
    If earnedPremiumEUR <> 0 Then
        lossRatio = claimsEUR / earnedPremiumEUR
    Else
        lossRatio = Empty
    End If
    
    'Devoluciones como Devoluciones sobre Written premium
    If writtenPremiumEUR <> 0 Then
        devolPct = devolucionesEUR / writtenPremiumEUR
    Else
        devolPct = Empty
    End If
    
    'Prima cliente neta en CLP usando fx
    If p.FxEURCLP > 0 Then
        primaCLP = writtenPremiumEUR * p.FxEURCLP
    Else
        primaCLP = Empty
    End If
    
    'Escritura en Base por nombre de header
    WriteByHeader baseWS, headers, nextRow, "ID_INTERNO", nextId
    WriteByHeader baseWS, headers, nextRow, "CODIGO_TARIFA", p.CodigoTarifa
    WriteByHeader baseWS, headers, nextRow, "RUTA", p.CondorOutputPath
    WriteByHeader baseWS, headers, nextRow, "ID_BIZAGI", p.IdBizagi
    WriteByHeader baseWS, headers, nextRow, "POLIZA", p.Poliza
    WriteByHeader baseWS, headers, nextRow, "SOCIO", p.Socio
    
    WriteByHeader baseWS, headers, nextRow, "VALIDACION_TERRITORIAL", p.ValidTerr
    WriteByHeader baseWS, headers, nextRow, "VALIDACION_TECNICA", p.ValidTec
    WriteByHeader baseWS, headers, nextRow, "VALIDACION_VALOR_CLIENTE", p.ValidVC
    
    WriteByHeader baseWS, headers, nextRow, "PRIMA_CLIENTE_NETA", primaCLP
    WriteByHeader baseWS, headers, nextRow, "UNIDAD_PRIMA_CLIENTE_NETA", "CLP"
    
    WriteByHeader baseWS, headers, nextRow, "COMISIONES", commPct
    
    WriteByHeader baseWS, headers, nextRow, "GASTOS_DIRECTOS", NormalizePct(p.GastosDirectosPct)
    WriteByHeader baseWS, headers, nextRow, "GASTOS_INDIRECTOS", NormalizePct(p.GastosIndirectosPct)
    WriteByHeader baseWS, headers, nextRow, "RETENCION", NormalizePct(p.RetencionPct)
    
    WriteByHeader baseWS, headers, nextRow, "VENTAS", p.Ventas
    WriteByHeader baseWS, headers, nextRow, "MESES_DE_VENTA", p.MesesVenta
    WriteByHeader baseWS, headers, nextRow, "DURACION_MEDIA_MESES", p.DuracionMediaMeses
    WriteByHeader baseWS, headers, nextRow, "TASA_DE_ENTRADA", p.TasaEntrada
    
    WriteByHeader baseWS, headers, nextRow, "SINIESTRO_MEDIO", Empty
    WriteByHeader baseWS, headers, nextRow, "UNIDAD_SINIESTRO_MEDIO", "CLP"
    
    WriteByHeader baseWS, headers, nextRow, "SINIESTRALIDAD", lossRatio
    WriteByHeader baseWS, headers, nextRow, "DEVOLUCIONES", devolPct
    
    WriteByHeader baseWS, headers, nextRow, "CUOTAS_PROMEDIO", p.CuotasPromedio
    WriteByHeader baseWS, headers, nextRow, "VALOR_CLIENTE", NormalizePct(p.ValorClientePct)
    
    WriteByHeader baseWS, headers, nextRow, "ASISTENCIA_MENSUAL", ConvertEURToCLP(p.AsistenciaMensual, p.FxEURCLP)
    WriteByHeader baseWS, headers, nextRow, "UNIDAD_ASISTENCIA_MENSUAL", "CLP"
    
    WriteByHeader baseWS, headers, nextRow, "ASISTENCIA_VENTA", ConvertEURToCLP(p.AsistenciaVenta, p.FxEURCLP)
    WriteByHeader baseWS, headers, nextRow, "UNIDAD_ASISTENCIA_VENTA", "CLP"
    
    WriteByHeader baseWS, headers, nextRow, "COSTOS_MENSUALES", ConvertEURToCLP(p.CostosMensuales, p.FxEURCLP)
    WriteByHeader baseWS, headers, nextRow, "UNIDAD_COSTOS_MENSUALES", "CLP"
    
    WriteByHeader baseWS, headers, nextRow, "COSTOS_VENTA", ConvertEURToCLP(p.CostosVenta, p.FxEURCLP)
    WriteByHeader baseWS, headers, nextRow, "UNIDAD_COSTOS_VENTA", "CLP"
    
    WriteByHeader baseWS, headers, nextRow, "OTROS_COSTOS_DIRECTOS_FIJO", ConvertEURToCLP(p.OtrosCostosDirectosFijo, p.FxEURCLP)
    WriteByHeader baseWS, headers, nextRow, "UNIDAD_OTROS_COSTOS_DIRECTOS_FIJO", "CLP"
    
    WriteByHeader baseWS, headers, nextRow, "CUT_OFF_RUN_OFF", p.CutOffRunOff
    WriteByHeader baseWS, headers, nextRow, "FECHA_CUT_OFF", p.FechaCutOff
    
    WriteByHeader baseWS, headers, nextRow, "INFLACION", p.Inflacion
    WriteByHeader baseWS, headers, nextRow, "PROFIT_SHARING", p.ProfitSharing
    WriteByHeader baseWS, headers, nextRow, "PORCENTAJE_PROFIT_SHARING", p.PctProfitSharing
    
    WriteByHeader baseWS, headers, nextRow, "REASEGURO", p.Reaseguro
    WriteByHeader baseWS, headers, nextRow, "PRIMA_CEDIDA", p.PctPrimaCedida
    WriteByHeader baseWS, headers, nextRow, "SINIESTRO_CEDIDO", p.PctSiniestroCedido
    
    WriteByHeader baseWS, headers, nextRow, "FORMULA_SINIESTRALIDAD_APLI", p.AplicaFormulaSiniestralidad
    
    WriteByHeader baseWS, headers, nextRow, "BRIM", p.Brim
    WriteByHeader baseWS, headers, nextRow, "KPI_BRIM", p.KpiBrim
    WriteByHeader baseWS, headers, nextRow, "LIN_INFERIOR", p.LinInf
    WriteByHeader baseWS, headers, nextRow, "LIN_SUPERIOR", p.LinSup
    WriteByHeader baseWS, headers, nextRow, "MOTIVO_SEGUIMIENTO", p.MotivoSeguimiento
    WriteByHeader baseWS, headers, nextRow, "SOLICITA_SEGUIMIENTO", p.SolicitaSeguimiento
    WriteByHeader baseWS, headers, nextRow, "PLAN_ACCION_ESCENARIO_POSI", p.PlanAccionPos
    WriteByHeader baseWS, headers, nextRow, "PLAN_ACCION_ESCENARIO_NEGA", p.PlanAccionNeg
    WriteByHeader baseWS, headers, nextRow, "COMENTARIOS_ADICIONALES_BRI", p.ComentariosAdic
    
    WriteByHeader baseWS, headers, nextRow, "FECHA_FIN_TARIFA", Date
    WriteByHeader baseWS, headers, nextRow, "OBSERVACION", p.Observacion
    
    repoWB.Save
    
CLEANUP:
    On Error Resume Next
    
    If Not inWB Is Nothing Then inWB.Close SaveChanges:=False
    If Not outWB Is Nothing Then outWB.Close SaveChanges:=False
    
    If closeRepoAfter Then
        If Not repoWB Is Nothing Then repoWB.Close SaveChanges:=True
    End If
    
    Application.Calculation = prevCalculation
    Application.AskToUpdateLinks = prevAskToUpdateLinks
    Application.DisplayAlerts = prevDisplayAlerts
    Application.EnableEvents = prevEnableEvents
    Application.ScreenUpdating = prevScreenUpdating
    
    Exit Sub
    
FAIL:
    MsgBox "Error exportando al Repositorio", vbCritical
    Resume CLEANUP
End Sub

'Lee campos desde el formulario existente
Private Function GetParamsFromForm(ByVal frm As Object, ByRef p As tExportParams) As Boolean
    Dim v As Variant
    
    p.RepoPath = Trim$(CStr(TryGetCtrlValue(frm, "txtRepoPath")))
    If Len(p.RepoPath) = 0 Then p.RepoPath = PickExcelFile("Selecciona Repositorio")
    If Len(p.RepoPath) = 0 Then Exit Function
    
    p.CondorInputPath = Trim$(CStr(TryGetCtrlValue(frm, "txtCondorInputPath")))
    If Len(p.CondorInputPath) = 0 Then p.CondorInputPath = PickExcelFile("Selecciona input Condor")
    If Len(p.CondorInputPath) = 0 Then Exit Function
    
    p.CondorOutputPath = Trim$(CStr(TryGetCtrlValue(frm, "txtCondorOutputPath")))
    If Len(p.CondorOutputPath) = 0 Then p.CondorOutputPath = PickExcelFile("Selecciona output Condor")
    If Len(p.CondorOutputPath) = 0 Then Exit Function
    
    v = TryGetCtrlValue(frm, "txtFxEURCLP")
    If IsNumeric(v) Then p.FxEURCLP = CDbl(v) Else p.FxEURCLP = 0#
    If p.FxEURCLP <= 0 Then
        v = Application.InputBox("Ingresa tipo cambio EUR a CLP", "Tipo cambio", Type:=1)
        If v = False Then Exit Function
        p.FxEURCLP = CDbl(v)
        If p.FxEURCLP <= 0 Then Exit Function
    End If
    
    p.CodigoTarifa = Trim$(CStr(TryGetCtrlValue(frm, "txtCodigoTarifa")))
    p.Poliza = Trim$(CStr(TryGetCtrlValue(frm, "txtPoliza")))
    p.IdBizagi = Trim$(CStr(TryGetCtrlValue(frm, "txtIdBizagi")))
    p.Socio = Trim$(CStr(TryGetCtrlValue(frm, "txtSocio")))
    
    p.ValidTerr = Trim$(CStr(TryGetCtrlValue(frm, "cmbValidTerr")))
    p.ValidTec = Trim$(CStr(TryGetCtrlValue(frm, "cmbValidTec")))
    p.ValidVC = Trim$(CStr(TryGetCtrlValue(frm, "cmbValidVC")))
    
    p.CutOffRunOff = Trim$(CStr(TryGetCtrlValue(frm, "cmbCutOffRunOff")))
    p.FechaCutOff = TryGetCtrlValue(frm, "dtpFechaCutOff")
    
    p.Inflacion = BoolToSiNo(TryGetCtrlValue(frm, "chkInflacion"))
    p.ProfitSharing = BoolToSiNo(TryGetCtrlValue(frm, "chkProfitSharing"))
    p.PctProfitSharing = EmptyIfBlank(TryGetCtrlValue(frm, "txtPctProfitSharing"))
    
    p.Reaseguro = Trim$(CStr(TryGetCtrlValue(frm, "cmbReaseguro")))
    p.PctPrimaCedida = EmptyIfBlank(TryGetCtrlValue(frm, "txtPctPrimaCedida"))
    p.PctSiniestroCedido = EmptyIfBlank(TryGetCtrlValue(frm, "txtPctSiniestroCedido"))
    
    p.AplicaFormulaSiniestralidad = BoolToSiNo(TryGetCtrlValue(frm, "chkAplicaFormulaSin"))
    
    p.Brim = BoolToSiNo(TryGetCtrlValue(frm, "chkBRIM"))
    p.KpiBrim = Trim$(CStr(TryGetCtrlValue(frm, "txtKPI")))
    p.LinInf = Trim$(CStr(TryGetCtrlValue(frm, "txtLinInf")))
    p.LinSup = Trim$(CStr(TryGetCtrlValue(frm, "txtLinSup")))
    p.MotivoSeguimiento = Trim$(CStr(TryGetCtrlValue(frm, "txtMotivoSeguimiento")))
    p.SolicitaSeguimiento = Trim$(CStr(TryGetCtrlValue(frm, "txtSolicitaSeguimiento")))
    p.PlanAccionPos = Trim$(CStr(TryGetCtrlValue(frm, "txtPlanAccionPos")))
    p.PlanAccionNeg = Trim$(CStr(TryGetCtrlValue(frm, "txtPlanAccionNeg")))
    p.ComentariosAdic = Trim$(CStr(TryGetCtrlValue(frm, "txtComentariosAdic")))
    
    p.Observacion = Trim$(CStr(TryGetCtrlValue(frm, "txtObservacion")))
    
    p.CuotasPromedio = EmptyIfBlank(TryGetCtrlValue(frm, "txtCuotasPromedio"))
    p.GastosDirectosPct = EmptyIfBlank(TryGetCtrlValue(frm, "txtGastosDirectos"))
    p.GastosIndirectosPct = EmptyIfBlank(TryGetCtrlValue(frm, "txtGastosIndirectos"))
    
    p.Ventas = EmptyIfBlank(TryGetCtrlValue(frm, "txtVentas"))
    p.DuracionMediaMeses = EmptyIfBlank(TryGetCtrlValue(frm, "txtDuracionMedia"))
    p.TasaEntrada = EmptyIfBlank(TryGetCtrlValue(frm, "txtTasaEntrada"))
    p.ValorClientePct = EmptyIfBlank(TryGetCtrlValue(frm, "txtValorCliente"))
    
    p.AsistenciaMensual = EmptyIfBlank(TryGetCtrlValue(frm, "txtAsistenciaMensual"))
    p.AsistenciaVenta = EmptyIfBlank(TryGetCtrlValue(frm, "txtAsistenciaVenta"))
    p.CostosMensuales = EmptyIfBlank(TryGetCtrlValue(frm, "txtCostosMensuales"))
    p.CostosVenta = EmptyIfBlank(TryGetCtrlValue(frm, "txtCostosVenta"))
    p.OtrosCostosDirectosFijo = EmptyIfBlank(TryGetCtrlValue(frm, "txtOtrosCostosDirectosFijo"))
    
    If Len(p.CodigoTarifa) = 0 Then
        MsgBox "Falta Codigo Tarifa", vbExclamation
        Exit Function
    End If
    
    If Len(p.Poliza) = 0 Then
        MsgBox "Falta Poliza", vbExclamation
        Exit Function
    End If
    
    GetParamsFromForm = True
End Function

'Busca un formulario ya cargado
Private Function GetLoadedUserForm(ByVal formClassName As String) As Object
    Dim uf As Object
    For Each uf In VBA.UserForms
        If StrComp(TypeName(uf), formClassName, vbTextCompare) = 0 Then
            Set GetLoadedUserForm = uf
            Exit Function
        End If
    Next uf
End Function

'Lee el value de un control sin romper si no existe
Private Function TryGetCtrlValue(ByVal frm As Object, ByVal ctrlName As String) As Variant
    On Error GoTo EH
    TryGetCtrlValue = frm.Controls(ctrlName).Value
    Exit Function
EH:
    TryGetCtrlValue = Empty
End Function

'Convierte boolean a Si No
Private Function BoolToSiNo(ByVal v As Variant) As String
    If IsEmpty(v) Then Exit Function
    If VarType(v) = vbBoolean Then
        BoolToSiNo = IIf(CBool(v), "Si", "No")
    Else
        BoolToSiNo = IIf(CStr(v) = "True" Or CStr(v) = "1", "Si", "No")
    End If
End Function

'Devuelve Empty si viene vacio
Private Function EmptyIfBlank(ByVal v As Variant) As Variant
    If IsEmpty(v) Then
        EmptyIfBlank = Empty
    ElseIf Trim$(CStr(v)) = vbNullString Then
        EmptyIfBlank = Empty
    Else
        EmptyIfBlank = v
    End If
End Function

'Selector de archivo excel
Private Function PickExcelFile(ByVal titleText As String) As String
    Dim fd As FileDialog
    Set fd = Application.FileDialog(msoFileDialogFilePicker)
    
    With fd
        .Title = titleText
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

'Devuelve una hoja por nombre
Private Function GetWorksheet(ByVal wb As Workbook, ByVal sheetName As String) As Worksheet
    On Error GoTo EH
    Set GetWorksheet = wb.Worksheets(sheetName)
    Exit Function
EH:
    Err.Raise vbObjectError + 513, "GetWorksheet", _
              "No existe la hoja " & sheetName & " en el archivo " & wb.Name
End Function

'Arma diccionario header a columna
Private Function BuildHeaderMap(ByVal ws As Worksheet, ByVal headerRow As Long) As Object
    Dim d As Object
    Dim lastCol As Long
    Dim c As Long
    Dim k As String
    
    Set d = CreateObject("Scripting.Dictionary")
    d.CompareMode = 1
    
    lastCol = ws.Cells(headerRow, ws.Columns.Count).End(xlToLeft).Column
    For c = 1 To lastCol
        k = Trim$(CStr(ws.Cells(headerRow, c).Value2))
        If Len(k) > 0 Then
            If Not d.Exists(k) Then d.Add k, c
        End If
    Next c
    
    Set BuildHeaderMap = d
End Function

'Escribe un valor usando nombre de header
Private Sub WriteByHeader(ByVal ws As Worksheet, ByVal headers As Object, ByVal rowIndex As Long, ByVal headerName As String, ByVal value As Variant)
    Dim col As Long
    If headers.Exists(headerName) Then
        col = CLng(headers(headerName))
        ws.Cells(rowIndex, col).Value2 = value
    End If
End Sub

'Calcula proximo id
Private Function NextIdFromHeader(ByVal ws As Worksheet, ByVal headers As Object, ByVal headerName As String, ByVal firstDataRow As Long) As Long
    Dim col As Long
    Dim lastRow As Long
    Dim rng As Range
    Dim m As Variant
    
    If Not headers.Exists(headerName) Then
        Err.Raise vbObjectError + 701, "NextIdFromHeader", "No existe el header " & headerName
    End If
    
    col = CLng(headers(headerName))
    lastRow = ws.Cells(ws.Rows.Count, col).End(xlUp).Row
    
    If lastRow < firstDataRow Then
        NextIdFromHeader = 1
        Exit Function
    End If
    
    Set rng = ws.Range(ws.Cells(firstDataRow, col), ws.Cells(lastRow, col))
    On Error Resume Next
    m = Application.WorksheetFunction.Max(rng)
    On Error GoTo 0
    
    If IsError(m) Or IsEmpty(m) Then
        NextIdFromHeader = 1
    Else
        NextIdFromHeader = CLng(m) + 1
    End If
End Function

'Encuentra siguiente fila libre
Private Function NextFreeRowFromHeader(ByVal ws As Worksheet, ByVal headers As Object, ByVal headerName As String, ByVal firstDataRow As Long) As Long
    Dim col As Long
    Dim lastRow As Long
    
    If Not headers.Exists(headerName) Then
        Err.Raise vbObjectError + 702, "NextFreeRowFromHeader", "No existe el header " & headerName
    End If
    
    col = CLng(headers(headerName))
    lastRow = ws.Cells(ws.Rows.Count, col).End(xlUp).Row
    
    If lastRow < firstDataRow Then
        NextFreeRowFromHeader = firstDataRow
    ElseIf Len(Trim$(CStr(ws.Cells(lastRow, col).Value2))) = 0 Then
        NextFreeRowFromHeader = lastRow
    Else
        NextFreeRowFromHeader = lastRow + 1
    End If
End Function

'Suma fila desde columna C
Private Function SumRowFromColC(ByVal ws As Worksheet, ByVal rowIndex As Long) As Double
    Dim c As Long
    Dim v As Variant
    Dim sum As Double
    
    c = 3
    Do
        v = ws.Cells(rowIndex, c).Value2
        If IsEmpty(v) Then Exit Do
        If IsNumeric(v) Then sum = sum + CDbl(v)
        c = c + 1
    Loop
    
    SumRowFromColC = sum
End Function

'Lee una celda por hoja y direccion
Private Function ReadCell(ByVal wb As Workbook, ByVal sheetName As String, ByVal address As String) As Variant
    On Error GoTo EH
    ReadCell = wb.Worksheets(sheetName).Range(address).Value2
    Exit Function
EH:
    ReadCell = Empty
End Function

'Normaliza porcentaje a decimal
Private Function NormalizePct(ByVal v As Variant) As Variant
    If IsEmpty(v) Or v = vbNullString Then
        NormalizePct = Empty
        Exit Function
    End If
    
    If Not IsNumeric(v) Then
        NormalizePct = v
        Exit Function
    End If
    
    If CDbl(v) > 1# Then
        NormalizePct = CDbl(v) / 100#
    Else
        NormalizePct = CDbl(v)
    End If
End Function

'Convierte monto EUR a CLP
Private Function ConvertEURToCLP(ByVal amount As Variant, ByVal fx As Double) As Variant
    If IsEmpty(amount) Or Not IsNumeric(amount) Then
        ConvertEURToCLP = Empty
        Exit Function
    End If
    
    If fx <= 0 Then
        ConvertEURToCLP = Empty
    Else
        ConvertEURToCLP = CDbl(amount) * fx
    End If
End Function


