from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from sqlalchemy import select, desc
from sqlalchemy.orm import joinedload
import config
from database.db import SessionLocal
from models import Region, Comuna, AvisoAdopcion, Foto, ContactarPor
from utils.validations import validate_form, parse_fecha
from utils.files import validar_archivos, guardar_archivos

app = Flask(__name__)
app.config["SECRET_KEY"] = config.SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH
app.config["UPLOAD_FOLDER"] = config.UPLOAD_FOLDER

# portada con ultimos 5 avisos
@app.get("/")
def portada():
    # consultamos los ultimos 5 avisos con su respectiva comuna
    with SessionLocal() as db:
        avisos =(
            db.execute(
                select(AvisoAdopcion)
                .options(joinedload(AvisoAdopcion.comuna))
                .order_by(desc(AvisoAdopcion.id))
                .limit(5)
            ).scalars().all()
        )
        # pasamos la lista de avisos al index
    return render_template("index.html", avisos=avisos)

# formulario para agregar un nuevo aviso
@app.get("/avisos/nuevo")
def form_aviso():
    return render_template("adopciones/agregar.html", contactos=[("", "")])

# crea aviso con validacion servidor e insercion en 3 tablas
@app.post("/avisos")
def crear_aviso():
    files = request.files.getlist("fotos")

    with SessionLocal() as db:
        file_errores, files_ok = validar_archivos(files)
        errores = validate_form(db, request.form) + file_errores

        # reconstruye pares (metodo, identificador) para el re-render del formulario
        metodos = request.form.getlist("metodo[]")
        idents = request.form.getlist("identificador[]")
        contactos = list(zip(metodos, idents))
        if not contactos:
            contactos = [("", "")]

        if errores:
            return (
                render_template(
                    "adopciones/agregar.html",
                    errores=errores,
                    data=request.form,
                    contactos=contactos,
                ),
                400,
            )

        aviso = AvisoAdopcion(
            comuna_id=int(request.form["comuna_id"]),
            sector=(request.form.get("sector") or None),
            nombre=request.form["nombre"],
            email=request.form["email"],
            celular=(request.form.get("celular") or None),
            tipo=request.form["tipo"],
            cantidad=int(request.form["cantidad"]),
            edad=int(request.form["edad"]),
            unidad_medida=request.form["unidad_medida"],
            fecha_entrega=parse_fecha(request.form["fecha_entrega"]),
            descripcion=(request.form.get("descripcion") or "")[:500],
        )
        db.add(aviso)
        db.flush()  # id disponible

        # fotos
        saved = guardar_archivos(app.static_folder, aviso.id, files_ok)
        for ruta, nombre in saved:
            db.add(Foto(aviso_id=aviso.id, ruta_archivo=ruta, nombre_archivo=nombre))

        # metodos de contacto segun nombre del form
        for m, ident in contactos:
            if m and ident:
                db.add(ContactarPor(aviso_id=aviso.id, nombre=m, identificador=ident))

        db.commit()

    flash("Aviso creado correctamente")
    return redirect(url_for("portada"))

# listado paginado de 5
@app.get("/adopciones")
def listado():
    page = max(1, int(request.args.get("page", 1)))
    per = 5
    with SessionLocal() as db:
        filas = (
            db.execute(
                select(AvisoAdopcion)
                .options(joinedload(AvisoAdopcion.comuna))
                .order_by(desc(AvisoAdopcion.id))
                .limit(per + 1)
                .offset((page - 1) * per)
            )
            .scalars()
            .all()
        )
    has_next = len(filas) > per
    return render_template(
        "adopciones/listado.html",
        avisos=filas[:per],
        page=page,
        has_next=has_next,
    )

# detalle por id
@app.get("/adopciones/<int:aviso_id>")
def detalle(aviso_id):
    with SessionLocal() as db:
        aviso = (
            db.execute(
                select(AvisoAdopcion)
                .options(
                    joinedload(AvisoAdopcion.comuna),
                    joinedload(AvisoAdopcion.fotos),
                    joinedload(AvisoAdopcion.contactos),
                )
                .where(AvisoAdopcion.id == aviso_id)
            )
            .scalars()
            .first()
        )
    if not aviso:
        return ("No encontrado", 404)
    return render_template("adopciones/detalle.html", aviso=aviso)

# api para selects dependientes
@app.get("/api/regiones")
def api_regiones():
    with SessionLocal() as db:
        regs = db.execute(select(Region).order_by(Region.nombre)).scalars().all()
    return jsonify([{"id": r.id, "nombre": r.nombre} for r in regs])

@app.get("/api/comunas")
def api_comunas():
    region_id = int(request.args["region_id"])
    with SessionLocal() as db:
        coms = (
            db.execute(
                select(Comuna).where(Comuna.region_id == region_id).order_by(Comuna.nombre)
            )
            .scalars()
            .all()
        )
    return jsonify([{"id": c.id, "nombre": c.nombre} for c in coms])

# handler simple de 404
@app.errorhandler(404)
def not_found(e):
    return ("No encontrado", 404)

if __name__ == "__main__":
    app.run(debug=True)

@app.get("/estadisticas")
def estadisticas():
    return render_template("estadistica.html")