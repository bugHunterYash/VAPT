from minio import Minio
import os
import uuid
from io import BytesIO

MINIO_URL = os.environ.get("MINIO_URL", "localhost:9000")
MINIO_ACCESS_KEY = os.environ.get("MINIO_ROOT_USER", "minioadmin")
MINIO_SECRET_KEY = os.environ.get("MINIO_ROOT_PASSWORD", "minioadmin")
BUCKET_NAME = "vmt-evidence"

client = Minio(
    MINIO_URL,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

def init_storage():
    try:
        if not client.bucket_exists(BUCKET_NAME):
            client.make_bucket(BUCKET_NAME)
    except Exception as e:
        print(f"Minio init error: {e}")

def upload_evidence(file_data: bytes, content_type: str, filename: str) -> str:
    init_storage()
    # Generate unique filename to prevent path traversal and collisions
    ext = filename.split(".")[-1] if "." in filename else "png"
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    
    stream = BytesIO(file_data)
    client.put_object(
        BUCKET_NAME,
        unique_filename,
        data=stream,
        length=len(file_data),
        content_type=content_type
    )
    return f"{BUCKET_NAME}/{unique_filename}"

def get_evidence_bytes(file_path: str) -> bytes:
    # file_path format expected: "vmt-evidence/xxxx.png"
    parts = file_path.split("/")
    if len(parts) != 2:
        raise ValueError("Invalid file path format")
    bucket, object_name = parts[0], parts[1]
    
    response = client.get_object(bucket, object_name)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()
