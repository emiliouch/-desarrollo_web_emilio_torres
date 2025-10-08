from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship

# definimos la base declarativa que se usara para crear las clases mapeadas a tablas
Base = declarative_base()

class Region(Base):
    __tablename__ = "region" # nombre de la tabla en la base de datos

    id = Column(Integer, primary_key=True)
    nombre = Column(String(200), nullable=False)  # nombre de la region no puede ser nulo

    # una region puede tener muchas comunas
    comunas = relationship("Comuna", back_populates="region")

    def __repr__(self):
        return f"<Region id={self.id} nombre={self.nombre!r}>"

class Comuna(Base):
    __tablename__ = "comuna"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(200), nullable=False)
    region_id = Column(Integer, ForeignKey("region.id"), nullable=False)  # fk que conecta con region

    # relacion inversa con region y con los avisos
    region = relationship("Region", back_populates="comunas")
    avisos = relationship("AvisoAdopcion", back_populates="comuna")

    def __repr__(self):
        return f"<Comuna id={self.id} nombre={self.nombre!r} region_id={self.region_id}>"

class AvisoAdopcion(Base):
    __tablename__ = "aviso_adopcion"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # fecha de ingreso se completa automaticamente al crear el aviso
    fecha_ingreso = Column(DateTime, nullable=False, default=datetime.utcnow)
    comuna_id = Column(Integer, ForeignKey("comuna.id"), nullable=False)  # relacion con comuna

    # datos de contacto
    sector = Column(String(100))
    nombre = Column(String(200), nullable=False)
    email = Column(String(100), nullable=False)
    celular = Column(String(15))

    # datos del animal y aviso
    tipo = Column(Enum("gato", "perro", name="tipo_mascota"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    edad = Column(Integer, nullable=False)
    unidad_medida = Column(Enum("a", "m", name="unidad_medida"), nullable=False)
    fecha_entrega = Column(DateTime, nullable=False)
    descripcion = Column(Text)  # se valida en el backend que no supere 500 caracteres

    # relaciones con otras tablas
    comuna = relationship("Comuna", back_populates="avisos")  # comuna asociada al aviso
    fotos = relationship("Foto", back_populates="aviso", cascade="all, delete-orphan")  # fotos vinculadas
    contactos = relationship("ContactarPor", back_populates="aviso", cascade="all, delete-orphan")  # metodos de contacto

    def __repr__(self):
        return f"<AvisoAdopcion id={self.id} tipo={self.tipo} comuna_id={self.comuna_id}>"

class Foto(Base):
    __tablename__ = "foto"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ruta_archivo = Column(String(300), nullable=False)
    nombre_archivo = Column(String(300), nullable=False)
    # se usa atributo aviso_id pero en la base se llama actividad_id
    aviso_id = Column("actividad_id", Integer, ForeignKey("aviso_adopcion.id"),
                      primary_key=True, nullable=False)

    # cada foto pertenece a un aviso
    aviso = relationship("AvisoAdopcion", back_populates="fotos")

    def __repr__(self):
        return f"<Foto id={self.id} aviso_id={self.aviso_id} archivo={self.nombre_archivo!r}>"

class ContactarPor(Base):
    __tablename__ = "contactar_por"

    id = Column(Integer, primary_key=True, autoincrement=True)
    # enum con los metodos validos de contacto
    nombre = Column(Enum("whatsapp", "telegram", "X", "instagram", "tiktok", "otra",
                         name="metodo_contacto"), nullable=False)
    identificador = Column(String(150), nullable=False)
    # se mantiene el nombre real actividad_id segun la tabla
    aviso_id = Column("actividad_id", Integer, ForeignKey("aviso_adopcion.id"),
                      primary_key=True, nullable=False)

    # relacion hacia aviso
    aviso = relationship("AvisoAdopcion", back_populates="contactos")

    def __repr__(self):
        return f"<ContactarPor id={self.id} aviso_id={self.aviso_id} metodo={self.nombre}>"