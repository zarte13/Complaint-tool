import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image
import mimetypes

# File upload configuration
UPLOAD_DIR = Path("uploads")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'
}
ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
}

def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename while preserving extension"""
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File extension {ext} not allowed")
    
    unique_id = str(uuid.uuid4())
    return f"{unique_id}{ext}"

def validate_file(file_path: Path, mime_type: str) -> bool:
    """Validate file type and size"""
    # Check file size
    if file_path.stat().st_size > MAX_FILE_SIZE:
        return False
    
    # Check MIME type
    if mime_type not in ALLOWED_MIME_TYPES:
        return False
    
    return True

async def save_upload_file(file, complaint_id: int) -> Tuple[str, str]:
    """Save uploaded file and return (unique_filename, file_path)"""
    # Create complaint directory if it doesn't exist
    complaint_dir = UPLOAD_DIR / "complaints" / str(complaint_id)
    complaint_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = generate_unique_filename(file.filename)
    file_path = complaint_dir / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return unique_filename, str(file_path)

def create_thumbnail(image_path: Path, thumbnail_path: Path, size: Tuple[int, int] = (150, 150)) -> bool:
    """Create thumbnail for image files"""
    try:
        with Image.open(image_path) as img:
            img.thumbnail(size, Image.Resampling.LANCZOS)
            img.save(thumbnail_path)
        return True
    except Exception:
        return False

def get_file_info(file_path: str) -> dict:
    """Get file information including MIME type and size"""
    path = Path(file_path)
    if not path.exists():
        return {}
    
    mime_type, _ = mimetypes.guess_type(str(path))
    return {
        "size": path.stat().st_size,
        "mime_type": mime_type or "application/octet-stream",
        "filename": path.name
    }

def delete_file(file_path: str) -> bool:
    """Delete file from filesystem"""
    try:
        path = Path(file_path)
        if path.exists():
            path.unlink()
            return True
    except Exception:
        pass
    return False