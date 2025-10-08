from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Credenciales y parámetros de conexión a la base de datos
DB_USER = "cc5002"
DB_PASS = "programacionweb"
DB_HOST = "localhost"
DB_PORT = 3306
DB_NAME = "tarea2"

DB_URI = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DB_URI, pool_pre_ping=True, future=True)

# Crear una clase de sesión
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)