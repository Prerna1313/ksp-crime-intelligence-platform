from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.services.alert_service import AlertService
from app.schemas.alert import AlertResponse
from app.schemas.common import StandardResponse
from app.models.user import User

# Role restriction: alert monitoring is SHO+ per Phase 9 spec
allowed_roles = ["SHO", "ACP", "SP", "ANALYST", "ADMIN", "AUDITOR"]
require_sho_plus = RoleChecker(allowed_roles)

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/", response_model=StandardResponse)
async def list_alerts(
    db: Session = Depends(get_db), 
    user: User = Depends(require_sho_plus)
):
    # SP and District Supervisors see district level alerts, SHOs see station level alerts
    district_id = user.district_id if user.role in ["SP", "ACP"] else None
    station_id = user.station_id if user.role == "SHO" else None
    
    alerts = AlertService.list_alerts(db, district_id=district_id, station_id=station_id)
    return {
        "status": "success", 
        "data": [AlertResponse.model_validate(a) for a in alerts]
    }

@router.get("/{alert_id}", response_model=StandardResponse)
async def get_alert_detail(
    alert_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(require_sho_plus)
):
    alert = AlertService.get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {
        "status": "success", 
        "data": AlertResponse.model_validate(alert)
    }

@router.patch("/{alert_id}/acknowledge", response_model=StandardResponse)
async def acknowledge_alert(
    alert_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(require_sho_plus)
):
    alert = AlertService.acknowledge_alert(db, alert_id, user_id=user.id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {
        "status": "success", 
        "data": AlertResponse.model_validate(alert)
    }

