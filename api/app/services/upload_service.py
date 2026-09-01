import uuid
import base64
from typing import Dict
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class UploadService:
    @staticmethod
    async def upload_image(file: UploadFile) -> Dict[str, str]:
        """Validate and upload an image file (supports Cloudinary integration with base64 data URL fallback)."""
        filename = file.filename or "image.png"
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed formats: {', '.join(ALLOWED_EXTENSIONS).upper()}",
            )

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum limit of 5MB",
            )

        public_id = f"commercehub_logo_{uuid.uuid4().hex[:10]}"

        # If Cloudinary API credentials exist in settings, attempt Cloudinary upload
        cloudinary_cloud = getattr(settings, "CLOUDINARY_CLOUD_NAME", None)
        if cloudinary_cloud:
            try:
                import cloudinary
                import cloudinary.uploader
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=getattr(settings, "CLOUDINARY_API_KEY", ""),
                    api_secret=getattr(settings, "CLOUDINARY_API_SECRET", ""),
                )
                res = cloudinary.uploader.upload(content, public_id=public_id, folder="company_logos")
                return {
                    "url": res.get("secure_url", res.get("url")),
                    "public_id": res.get("public_id", public_id),
                }
            except Exception:
                pass

        # Fallback: Convert to clean data URI URL for reliable development/testing
        b64 = base64.b64encode(content).decode("utf-8")
        mime = f"image/{ext}" if ext != "jpg" else "image/jpeg"
        data_url = f"data:{mime};base64,{b64}"
        
        return {
            "url": data_url,
            "public_id": public_id,
        }
