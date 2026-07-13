import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.conversation_service import ConversationService
from app.services.ai_service import get_ai_reasoning, stream_ai_reasoning
from app.schemas.conversation import (
    ConversationCreate, 
    ConversationResponse, 
    MessageCreate, 
    MessageResponse, 
    ConversationDetailResponse
)
from app.schemas.common import StandardResponse
from app.models.user import User

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.post("/", response_model=StandardResponse)
async def create_conversation(
    request: ConversationCreate, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    conversation = ConversationService.create_conversation(db, user_id=user.id, case_id=request.case_id)
    return {
        "status": "success", 
        "data": ConversationResponse.model_validate(conversation)
    }

@router.get("/", response_model=StandardResponse)
async def list_conversations(
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    # Retrieve all conversations for this user
    from app.models.conversation import Conversation
    conversations = db.query(Conversation).filter(Conversation.user_id == user.id).all()
    return {
        "status": "success", 
        "data": [ConversationResponse.model_validate(c) for c in conversations]
    }

@router.get("/{conversation_id}", response_model=StandardResponse)
async def get_conversation(
    conversation_id: str, 
    db: Session = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    conversation = ConversationService.get_conversation(db, conversation_id)
    if not conversation or conversation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = ConversationService.get_messages(db, conversation_id)
    
    return {
        "status": "success",
        "data": ConversationDetailResponse(
            conversation=ConversationResponse.model_validate(conversation),
            messages=[MessageResponse.model_validate(m) for m in messages]
        )
    }

@router.get("/{conversation_id}/messages", response_model=StandardResponse)
async def list_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    conversation = ConversationService.get_conversation(db, conversation_id)
    if not conversation or conversation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = ConversationService.get_messages(db, conversation_id)
    return {
        "status": "success",
        "data": [MessageResponse.model_validate(m) for m in messages]
    }

@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    request: MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    conversation = ConversationService.get_conversation(db, conversation_id)
    if not conversation or conversation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # 1. Save user query message to database
    ConversationService.add_message(
        db=db,
        conversation_id=conversation_id,
        role="USER",
        content=request.query
    )

    # 2. Return SSE Stream yielding reasoning progress followed by the final answer
    async def sse_event_generator():
        # Call the streaming AI engine endpoint (with fallback built-in)
        async for chunk in stream_ai_reasoning(
            query=request.query,
            case_id=conversation.case_id,
            language=request.language
        ):
            # We intercept the final composition stage to log it in the DB
            try:
                if chunk.startswith("data: "):
                    import json
                    payload = json.loads(chunk[6:].strip())
                    if payload.get("stage") == "COMPOSITION" and payload.get("status") == "success":
                        ConversationService.add_message(
                            db=db,
                            conversation_id=conversation_id,
                            role="ASSISTANT",
                            content=payload.get("response", ""),
                            confidence_tier=payload.get("confidence", "Moderate"),
                            sources=payload.get("sources", []),
                            has_conflict=payload.get("status") == "violation"
                        )
            except Exception as e:
                print(f"Error parsing SSE chunk for DB storage: {e}")
            
            yield chunk

    return StreamingResponse(sse_event_generator(), media_type="text/event-stream")

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    conversation = ConversationService.get_conversation(db, conversation_id)
    if not conversation or conversation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    db.delete(conversation)
    db.commit()
    return


