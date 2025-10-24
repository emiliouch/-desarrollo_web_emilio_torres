import os
from pathlib import Path
from uuid import uuid4
from werkzeug.utils import secure_filename
import filetype



extensiones_permitidas = {".png", ".jpg", ".jpeg", ".webp"}
MAX_MB = 5
MAX_FILES = 8
AL_MENOS_UN_ARCHIVO = False # define si es obligatorio subir al menos un archivo o no

def _file_is_empty(file):
    # considera vacio si no hay objeto o no hay nombre de archivo
    return file is None or getattr(file, "filename", "") == ""

def validar_archivos(files):
    # valida extension, tamaño y tipo real del archivo
    
    # creamos una lista vacia para almacenar errores
    errores = []
    efectivos = [f for f in files if not _file_is_empty(f)]

    if not efectivos:
        if AL_MENOS_UN_ARCHIVO:
            errores.append("Debe adjuntar al menos una imagen")
        return errores, efectivos
    
    if len(efectivos) > MAX_FILES:
        errores.append(f"Se permiten máximo {MAX_FILES} archivos")
        efectivos = efectivos[:MAX_FILES]  # recortamos la lista al numero maximo de archivos permitidos

    for f in efectivos:
        # extraemos la extension
        ext = os.path.splitext(f.filename)[1].lower()

        # validamos extension
        if ext not in extensiones_permitidas:
            errores.append(f"El archivo {f.filename} no tiene un formato permitido")
            continue

        # validamos tamaño
        try:
            pos = f.tell()
        
        except Exception:
            pos = 0
        f.seek(0, os.SEEK_END) # movemos el puntero al final
        size_mb = f.tell() / (1024 * 1024)  # convertir a megabytes
        f.seek(pos)  # volvemos a la posicion original
        if size_mb > MAX_MB:
            errores.append(f"El archivo {f.filename} excede el tamaño máximo de {MAX_MB} MB")
            continue

        # validamos tipo real del archivo
        cabecera = f.read(261)  # leer los primeros bytes
        f.seek(pos)  # volvemos a la posicion original
        tipo = filetype.guess(cabecera)
        if not tipo or not tipo.MIME.startswith("image/"):
            errores.append(f"El archivo {f.filename} no es una imagen válida")
            continue

    return errores, efectivos


def guardar_archivos(static_folder, aviso_id, files):
    # guarda los archivos en static 

    guardados = []
    carpeta = Path(static_folder) / "uploads" / str(aviso_id) # cada aviso tiene su propio subdirectorio
    carpeta.mkdir(parents=True, exist_ok=True)  # crear la carpeta si no existe


    for f in files:
        if _file_is_empty(f):
            continue
        safe = secure_filename(f.filename)
        nuevo = f"{uuid4().hex}_{safe}"  # nombre unico para evitar colisiones
        abs_path = carpeta / nuevo
        try:
            f.seek(0) # aseguramos que el puntero este al inicio
        except Exception:
            pass # si no se puede hacer seek, no se interrumpe
        f.save(abs_path)
        ruta_relativa =f"uploads/{aviso_id}/{nuevo}"
        guardados.append((ruta_relativa, safe)) # guardamos en la lista la ruta relativa y el nombre original

    return guardados # retornamos la lista con la información de todos los archivos guardados
