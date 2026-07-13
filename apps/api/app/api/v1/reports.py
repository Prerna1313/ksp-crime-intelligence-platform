from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.report_service import ReportService
from app.schemas.report import ReportCreate, ReportResponse
from app.schemas.common import StandardResponse
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/", response_model=StandardResponse)
async def list_reports(
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    reports = ReportService.list_reports(db, user_id=user.id)
    return {
        "status": "success", 
        "data": [ReportResponse.model_validate(r) for r in reports]
    }

@router.post("/", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    request: ReportCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    report = ReportService.create_report(db, user_id=user.id, report_in=request, background_tasks=background_tasks)
    return {
        "status": "success", 
        "data": ReportResponse.model_validate(report)
    }

@router.get("/{report_id}", response_model=StandardResponse)
async def get_report_detail(
    report_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    report = ReportService.get_report(db, report_id)
    if not report or report.created_by != user.id:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "status": "success", 
        "data": ReportResponse.model_validate(report)
    }

@router.get("/{report_id}/download")
async def download_report(
    report_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    report = ReportService.get_report(db, report_id)
    if not report or report.created_by != user.id:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # In production, this would stream the file from Zoho Catalyst File Store
    # We return the placeholder redirect/download link
    return {
        "status": "success", 
        "download_url": f"https://catalyst.zoho.com/filestore/download/{report.pdf_path}"
    }

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    success = ReportService.delete_report(db, report_id)
    if not success:
         raise HTTPException(status_code=404, detail="Report not found")
    return

