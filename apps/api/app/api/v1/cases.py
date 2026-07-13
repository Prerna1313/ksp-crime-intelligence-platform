from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.case_service import CaseService
from app.schemas.case import CaseResponse, CaseDetailResponse, TimelineEventResponse
from app.schemas.common import StandardResponse
from app.models.user import User

router = APIRouter(prefix="/cases", tags=["cases"])

@router.get("/", response_model=StandardResponse)
async def list_cases(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    # Enforce role-scoping: CONSTABLE/SI/INSPECTOR scoped to station; SP/District scoped to district
    station_id = user.station_id if user.role in ["CONSTABLE", "SI", "INSPECTOR", "SHO"] else None
    skip = (page - 1) * limit
    cases = CaseService.list_active_cases(db, skip=skip, limit=limit, station_id=station_id)
    return {
        "status": "success", 
        "data": [CaseResponse.model_validate(c) for c in cases]
    }

@router.get("/{case_id}", response_model=StandardResponse)
async def get_case(
    case_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    case = CaseService.get_case(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    # Build complete detail schema including entities
    entities = CaseService.get_case_entities(db, case_id)
    
    # Structure return
    case_data = CaseDetailResponse(
        id=case.id,
        case_number=case.case_number,
        case_type=case.case_type,
        status=case.status,
        station_id=case.station_id,
        assigned_officer_id=case.assigned_officer_id,
        incident_date=case.incident_date,
        incident_location=case.incident_location,
        incident_address=case.incident_address,
        narrative=case.narrative,
        created_at=case.created_at,
        updated_at=case.updated_at,
        entities=entities,
        exhibits=[]
    )
    return {"status": "success", "data": case_data}

@router.get("/{case_id}/entities", response_model=StandardResponse)
async def get_case_entities(
    case_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    entities = CaseService.get_case_entities(db, case_id)
    return {"status": "success", "data": entities}

@router.get("/{case_id}/timeline", response_model=StandardResponse)
async def get_case_timeline(
    case_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    timeline = CaseService.get_case_timeline(db, case_id)
    return {"status": "success", "data": timeline}

@router.get("/{case_id}/network", response_model=StandardResponse)
async def get_case_network(
    case_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    network = CaseService.get_case_network(db, case_id)
    return {"status": "success", "data": network}


