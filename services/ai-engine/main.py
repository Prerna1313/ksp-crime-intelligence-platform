from fastapi import FastAPI
from pydantic import BaseModel
import os
from engine.pipeline.graph import build_graph

app = FastAPI(
    title="KSP AI Engine", 
    description="LangGraph pipeline on Catalyst AppSail"
)

class QueryRequest(BaseModel):
    query: str
    case_id: str = None
    language: str = "en"

# Initialize graph once at startup
reasoning_graph = build_graph()

@app.post("/api/v1/reason")
async def reason_query(request: QueryRequest):
    # Prepare the initial state
    initial_state = {
        "query": request.query,
        "case_id": request.case_id,
        "language": request.language,
        "intent": None,
        "evidence": [],
        "hypotheses": [],
        "diagnosticity_gap": None,
        "confidence_score": 1,
        "final_response": None
    }
    
    # Run the compiled StateGraph
    try:
        final_state = await reasoning_graph.ainvoke(initial_state)
        response_text = final_state.get("final_response", "")
        confidence_tier = final_state.get("confidence_tier", "Moderate")
        
        confidence_str = str(confidence_tier).title()
        confidence_dots = 4 if "HIGH" in str(confidence_tier).upper() else 3
        
        response_data = {
            "text": response_text,
            "confidence": confidence_str,
            "confidence_dots": confidence_dots
        }
        
        # Enforce governance substrate verification
        from engine.governance.exclusion_filter import check_exclusions
        check_res = check_exclusions(request.query, response_data.get("text", ""))
        if check_res.startswith("VIOLATION_DETECTED"):
            return {
                "status": "violation",
                "confidence": "●○○○○",
                "response": "This query or generated response violates platform governance guidelines.",
                "sources": []
            }
            
        return {
            "status": "success",
            "confidence": response_data.get("confidence", "Moderate"),
            "confidence_dots": response_data.get("confidence_dots", 3),
            "response": response_data.get("text", ""),
            "sources": []
        }
    except Exception as e:
        return {
            "status": "error",
            "confidence": "●○○○○",
            "response": f"AI Engine pipeline error: {str(e)}",
            "sources": []
        }

from fastapi.responses import StreamingResponse
import json
import asyncio

@app.post("/api/v1/reason/stream")
async def stream_reason(request: QueryRequest):
    async def event_generator():
        initial_state = {
            "query": request.query,
            "case_id": request.case_id,
            "language": request.language,
            "intent": None,
            "evidence": [],
            "hypotheses": [],
            "diagnosticity_gap": None,
            "confidence_score": 1,
            "final_response": None
        }
        
        try:
            # Stream the LangGraph pipeline node updates
            async for output in reasoning_graph.astream(initial_state):
                for node_name, state_update in output.items():
                    if node_name == "intent":
                        intent_val = state_update.get("intent")
                        intent_str = str(intent_val).upper() if intent_val else "RETRIEVAL"
                        yield f"data: {json.dumps({'stage': 'INTENT', 'content': f'Classified query intent as: {intent_str}'})}\n\n"
                    elif node_name == "context":
                        yield f"data: {json.dumps({'stage': 'CONTEXT_RECOVERY', 'content': 'Successfully recovered active case details and station scopes from session context.'})}\n\n"
                    elif node_name == "retrieval":
                        cases = state_update.get("retrieved_cases", [])
                        entities = state_update.get("retrieved_entities", [])
                        cases_str = ", ".join([c.get("text", "").split(" - ")[0] for c in cases])
                        entities_str = ", ".join([e.get("canonical_name") for e in entities])
                        content_msg = f"Queried local SQLite. Found associated cases: [{cases_str or 'None'}] and suspect matches: [{entities_str or 'None'}]."
                        yield f"data: {json.dumps({'stage': 'RETRIEVAL', 'content': content_msg})}\n\n"
                    elif node_name == "entity_resolution":
                        resolved = state_update.get("resolved_entities", [])
                        resolved_names = ", ".join([r.get("canonical_name") for r in resolved])
                        content_msg = f"Aligned spelling variations and resolved canonical identities for: [{resolved_names or 'None'}]."
                        yield f"data: {json.dumps({'stage': 'ENTITY_RESOLUTION', 'content': content_msg})}\n\n"
                    elif node_name == "hypothesis":
                        hypotheses = state_update.get("hypotheses", [])
                        hypotheses_str = " vs ".join([f"{h.get('id')}: {h.get('text')}" for h in hypotheses])
                        content_msg = f"Formulated competing hypotheses to prevent investigative bias: [{hypotheses_str or 'None'}]."
                        yield f"data: {json.dumps({'stage': 'HYPOTHESIS_GENERATION', 'content': content_msg})}\n\n"
                    elif node_name == "evaluation":
                        gap = state_update.get("diagnosticity_gap", False)
                        gap_str = "Diagnosticity gap detected. Further evidence required." if gap else "Evidence diagnostics verified."
                        content_msg = f"Evaluated evidence against hypotheses. {gap_str}"
                        yield f"data: {json.dumps({'stage': 'EVALUATION', 'content': content_msg})}\n\n"
                    elif node_name == "confidence":
                        tier = state_update.get("confidence_tier", "Moderate")
                        content_msg = f"Assessed weak links. Resolved final calibrated confidence as: {str(tier).title()}."
                        yield f"data: {json.dumps({'stage': 'CONFIDENCE_ASSESSMENT', 'content': content_msg})}\n\n"
                    elif node_name == "composition":
                        response_text = state_update.get("final_response", "")
                        confidence_tier = state_update.get("confidence_tier", "Moderate")
                        confidence_str = str(confidence_tier).title()
                        confidence_dots = 4 if "HIGH" in str(confidence_tier).upper() else 3
                        
                        final_payload = {
                            "stage": "COMPOSITION",
                            "status": "success",
                            "confidence": confidence_str,
                            "confidence_dots": confidence_dots,
                            "response": response_text,
                            "sources": state_update.get("sources_cited", [])
                        }
                        yield f"data: {json.dumps(final_payload)}\n\n"
                
                await asyncio.sleep(0.2) # Smooth interval between states
                
        except Exception as e:
            err_payload = {
                "stage": "ERROR",
                "status": "error",
                "response": f"AI Engine pipeline stream error: {str(e)}",
                "sources": []
            }
            yield f"data: {json.dumps(err_payload)}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/health")
def health():
    return {"status": "ai-engine is running on Catalyst"}

if __name__ == "__main__":
    import uvicorn
    # Catalyst AppSail typically sets X-ZOHO-CATALYST-PORT
    port = int(os.environ.get("X_ZOHO_CATALYST_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
