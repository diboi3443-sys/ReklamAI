"""
ReklamAI v2.0 — File Upload & Download Routes
Local file storage for dev; replace with S3/MinIO in production.
"""
import os
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["files"])

# Upload directory — relative to backend working directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    purpose: str = Form("referenceImage"),
    user: User = Depends(get_current_user),
):
    """
    Загрузить файл (изображение/видео).
    Возвращает путь, который можно передать в /api/generate.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate purpose
    allowed_purposes = {"startFrame", "endFrame", "referenceImage", "referenceVideo"}
    if purpose not in allowed_purposes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid purpose. Allowed: {allowed_purposes}",
        )

    # Validate file type
    content_type = file.content_type or ""
    if not content_type.startswith(("image/", "video/")):
        raise HTTPException(
            status_code=400,
            detail="Only image and video files are allowed",
        )

    # Limit file size (50MB)
    MAX_SIZE = 50 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    # Generate unique filename
    ext = Path(file.filename).suffix or ".bin"
    unique_name = f"{user.id}/{purpose}/{uuid.uuid4().hex}{ext}"

    # Save to local filesystem
    save_path = UPLOAD_DIR / unique_name
    save_path.parent.mkdir(parents=True, exist_ok=True)

    with open(save_path, "wb") as f:
        f.write(contents)

    # Return the path that the frontend can use
    # In production, this would be an S3 URL
    file_url = f"/api/files/{unique_name}"

    return {
        "success": True,
        "bucket": "uploads",
        "path": file_url,
        "generationId": None,
    }


@router.get("/files/{user_id}/{purpose}/{filename}")
async def serve_file(
    user_id: str,
    purpose: str,
    filename: str,
):
    """Serve uploaded files (dev only; in production use S3/CDN)."""
    file_path = UPLOAD_DIR / user_id / purpose / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)
