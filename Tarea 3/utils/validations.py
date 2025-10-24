from datetime import datetime
import re
from sqlalchemy import select
from models import Comuna

# expresiones regulares para validar email y celular
EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
CELULAR_RE = re.compile(r"^\+569\d{8}$") # formato +569XXXXXXXX


def parse_fecha(fecha_str):
    try:
        return datetime.fromisoformat(fecha_str)
    except Exception:
        return datetime.strptime(fecha_str, "%Y-%m-%d")
    
def validar_email(email):
    # entrega true si el email es valido, false si no
    return EMAIL_RE.match(email) is not None

def validar_celular(celular):
    # entrega true si el celular es valido, false si no
    return CELULAR_RE.match(celular) is not None

def _is_blank(v):
    if v is None:
        return True
    if isinstance(v, str) and v.strip() == "":
        return True
    return False

def validate_form(db, form):
    # creamos una lista vacia para almacenar los errores
    errores = []

    # campos obligatorios
    req = ["comuna_id", "nombre", "email", "tipo", "cantidad", "edad", "unidad_medida", "fecha_entrega"]
    faltan = [k for k in req if _is_blank(form.get(k))]
    if faltan:
        errores.append(f"Faltan campos obligatorios: {', '.join(faltan)}")

    # longitudes segun esquema
    if form.get("sector") and len(form["sector"]) > 100:
        errores.append("El sector no puede tener más de 100 caracteres")
    if form.get("nombre") and len(form["nombre"]) > 200:
        errores.append("El nombre no puede tener más de 200 caracteres")

    # validamos email y celular agregando las funciones auxiliares
    if form.get("email") and (len(form["email"]) > 100 or not validar_email(form["email"])):
        errores.append("El email no es válido o tiene más de 100 caracteres")
    if form.get("celular") and (len(form["celular"]) > 12 or not validar_celular(form["celular"])):
        errores.append("El celular no es válido o tiene más de 12 caracteres")

    if form.get("descripcion") and len(form["descripcion"]) > 500:
        errores.append("La descripción no puede tener más de 500 caracteres")
    if form.get("tipo") and form["tipo"] not in ("gato", "perro"):
        errores.append("El tipo debe ser 'gato' o 'perro'")
    if form.get("unidad_medida") and form["unidad_medida"] not in {"a", "m"}:
        errores.append("La unidad de medida debe ser 'a' (años) o 'm' (meses)")


    # validamos enteros y rangos
    try:
        cantidad = int(form.get("cantidad", ""))
        if cantidad < 1:
            errores.append("La cantidad debe ser mayor o igual a 1")
        
    except Exception:
        errores.append("La cantidad debe ser un entero")

    try: 
        edad = int(form.get("edad", ""))
        if edad < 0:
            errores.append("La edad no puede ser negativa")
    except Exception:
        errores.append("La edad debe ser un entero")

    # validamos que la comuna exista en la base de datos
    try:
        comuna_id = int(form["comuna_id"])
        ok = db.execute(select(Comuna).where(Comuna.id == comuna_id)).scalar_one_or_none()
        if not ok:
            errores.append("La comuna no existe")
    except Exception:
        errores.append("La comuna no es válida")

    # validamos que la fecha de entrega sea valida y futura
    try:
        fecha = parse_fecha(form["fecha_entrega"])
        if fecha < datetime.now():
            errores.append("La fecha de entrega debe ser futura")
    except Exception:
        errores.append("La fecha de entrega no es válida")

    return errores


# Validaciones extra para los comentarios
def validar_commentario_name(nombre):
    if not nombre:
        return False
    s = nombre.strip()
    return 3 <= len(s) <= 80

def validar_commentario_text(texto):
    if not texto:
        return False
    s = texto.strip()
    return len(s) >= 5

def validar_comentario_payload(payload):
    # Toma un diccionario con los datos del comentario y entrenga errores si los hay
    nombre = (payload.get("nombre") or "").strip()
    texto  = (payload.get("texto") or "").strip()
    errores = {}
    if not validar_commentario_name(nombre):
        errores["nombre"] = "Largo 3 a 80."
    if not validar_commentario_text(texto):
        errores["texto"] = "Mínimo 5 caracteres."
    return nombre, texto, errores