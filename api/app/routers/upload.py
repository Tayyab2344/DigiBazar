from fastapi import APIRouter, File, UploadFile, status
from app.services.upload_service import UploadService

router = APIRouter(prefix="/api/v1/upload", tags=["upload"])


@router.post(
    "/image",
    status_code=status.HTTP_200_OK,
    summary="Upload image (business logo, product photo)",
)
async def upload_image(file: UploadFile = File(...)):
    return await UploadService.upload_image(file)
