from sqlalchemy.orm import Session
from app.models.report import Report
from app.schemas.report import ReportCreate
from app.core.database import SessionLocal
from typing import List, Optional
import uuid

class ReportService:
    @staticmethod
    def get_report(db: Session, report_id: str) -> Optional[Report]:
        return db.query(Report).filter(Report.id == report_id).first()

    @staticmethod
    def list_reports(db: Session, user_id: str = None) -> List[Report]:
        query = db.query(Report)
        if user_id:
            query = query.filter(Report.created_by == user_id)
        return query.all()

    @staticmethod
    def _generate_pdf_task(report_id: str):
        # We need a new session since it's background
        db = SessionLocal()
        try:
            import time
            time.sleep(2)  # Simulate PDF generation
            db_report = db.query(Report).filter(Report.id == report_id).first()
            if db_report:
                db_report.status = "COMPLETED"
                db_report.content_json = {"status": "pdf_generated"}
                db.commit()
        except Exception as e:
            print(f"Error generating PDF: {e}")
            db_report = db.query(Report).filter(Report.id == report_id).first()
            if db_report:
                db_report.status = "FAILED"
                db.commit()
        finally:
            db.close()

    @staticmethod
    def create_report(db: Session, user_id: str, report_in: ReportCreate, background_tasks) -> Report:
        """
        Creates a new report draft.
        Schedules a BackgroundTask for PDF generation to return immediately to the client.
        """
        db_report = Report(
            created_by=user_id,
            case_id=report_in.case_id,
            title=report_in.title,
            content_json={"status": "draft_created"},
            pdf_path=f"reports/{uuid.uuid4()}.pdf",
            status="DRAFT"
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        # Schedule the background task
        background_tasks.add_task(ReportService._generate_pdf_task, str(db_report.id))
        return db_report

    @staticmethod
    def delete_report(db: Session, report_id: str) -> bool:
        db_report = ReportService.get_report(db, report_id)
        if not db_report:
            return False
        db.delete(db_report)
        db.commit()
        return True
