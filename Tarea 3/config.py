import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# flask
SECRET_KEY = os.getenv("SECRET_KEY", "dev")
MAX_CONTENT_LENGTH = 16 * 1024 * 1024

# db config    
DB_USER = os.getenv("DB_USER", "cc5002")
DB_PASS = os.getenv("DB_PASS", "programacionweb")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "tarea2")

SQLALCHEMY_DATABASE_URI = (
    f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# uploads
UPLOAD_FOLDER = str(BASE_DIR / "static" / "uploads")