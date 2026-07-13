from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.entity_service import EntityService
from app.schemas.entity import EntityResponse, EntityDetailResponse, EntityResolutionResult
from app.schemas.case import CaseResponse
from app.schemas.common import StandardResponse

router = APIRouter(prefix="/entities", tags=["entities"])

@router.get("/", response_model=StandardResponse)
async def search_entities(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    entities = EntityService.search_entities(db, q)
    return {"status": "success", "data": [EntityResponse.model_validate(e) for e in entities]}

@router.get("/resolve", response_model=StandardResponse)
async def resolve_entities(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    result = EntityService.resolve_entities(db, query)
    return {"status": "success", "data": EntityResolutionResult(**result)}

@router.get("/{entity_id}", response_model=StandardResponse)
async def get_entity_profile(
    entity_id: str, 
    db: Session = Depends(get_db), 
    user=Depends(get_current_user)
):
    profile = EntityService.get_entity_profile(db, entity_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Entity profile not found")
        
    # Build complete detail schema including relationships and case links
    detail_data = EntityDetailResponse(
        id=profile["entity"].id,
        canonical_name=profile["entity"].canonical_name,
        entity_type=profile["entity"].entity_type,
        neo4j_node_id=profile["entity"].neo4j_node_id,
        created_at=profile["entity"].created_at,
        updated_at=profile["entity"].updated_at,
        aliases=profile["aliases"],
        case_links=[],
        relationships=[]
    )
    return {"status": "success", "data": detail_data}

@router.get("/{entity_id}/cases", response_model=StandardResponse)
async def get_entity_cases(
    entity_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    cases = EntityService.get_entity_cases(db, entity_id)
    return {"status": "success", "data": [CaseResponse.model_validate(c) for c in cases]}

@router.get("/{entity_id}/network", response_model=StandardResponse)
async def get_entity_network(
    entity_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    network = EntityService.get_entity_network(db, entity_id)
    return {"status": "success", "data": network}


