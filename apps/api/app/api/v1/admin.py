from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.models.user import User
from app.services.user_service import UserService
from app.services.audit_service import AuditService
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.audit import AuditEventResponse
from app.schemas.common import StandardResponse
from datetime import datetime
from typing import Optional

# Role validation: Admin role for user management, Auditor/Admin for audit logs
require_admin = RoleChecker(["ADMIN"])
require_auditor_or_admin = RoleChecker(["AUDITOR", "ADMIN"])

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=StandardResponse)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db), 
    user: User = Depends(require_admin)
):
    users = UserService.list_users(db, skip=skip, limit=limit)
    return {
        "status": "success", 
        "data": [UserResponse.model_validate(u) for u in users]
    }

@router.post("/users", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: UserCreate, 
    db: Session = Depends(get_db), 
    user: User = Depends(require_admin)
):
    # Check if user badge number already exists
    existing = UserService.get_user_by_badge(db, request.badge_number)
    if existing:
         raise HTTPException(status_code=400, detail="Badge number already registered")
         
    new_user = UserService.create_user(db, request)
    return {
        "status": "success", 
        "data": UserResponse.model_validate(new_user)
    }

@router.patch("/users/{user_id}", response_model=StandardResponse)
async def update_user(
    user_id: str,
    request: UserUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    updated = UserService.update_user(db, user_id, request)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "status": "success", 
        "data": UserResponse.model_validate(updated)
    }

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin)
):
    """
    Deactivates a user (never deletes from system of record).
    """
    deactivate_req = UserUpdate(is_active=False)
    updated = UserService.update_user(db, user_id, deactivate_req)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return

@router.get("/audit", response_model=StandardResponse)
async def list_audit_logs(
    user_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_auditor_or_admin)
):
    logs = AuditService.list_audit_events(
        db, user_id=user_id, event_type=event_type, 
        date_from=date_from, date_to=date_to, skip=skip, limit=limit
    )
    return {
        "status": "success", 
        "data": [AuditEventResponse.model_validate(l) for l in logs]
    }

@router.get("/audit/{audit_id}", response_model=StandardResponse)
async def get_audit_log_detail(
    audit_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_auditor_or_admin)
):
    event = AuditService.get_audit_event(db, audit_id)
    if not event:
        raise HTTPException(status_code=404, detail="Audit event not found")
    return {
        "status": "success", 
        "data": AuditEventResponse.model_validate(event)
    }

