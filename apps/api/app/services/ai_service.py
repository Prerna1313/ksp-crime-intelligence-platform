import os
import httpx
from typing import Dict, Any

# In a deployed Catalyst environment, this would point to the AI Engine AppSail URL
AI_ENGINE_URL = os.getenv("AI_ENGINE_URL", "http://localhost:8001/api/v1/reason")
AI_ENGINE_STREAM_URL = os.getenv("AI_ENGINE_STREAM_URL", "http://localhost:8001/api/v1/reason/stream")

async def get_ai_reasoning(query: str, case_id: str, language: str = "en") -> Dict[str, Any]:
    """
    Calls the AI Engine to process a reasoning query.
    """
    payload = {
        "query": query,
        "case_id": case_id,
        "language": language
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(AI_ENGINE_URL, json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as exc:
            print(f"Error calling AI Engine: {exc}")
            return {
                "status": "error",
                "confidence": "●○○○○",
                "response": "Could not connect to the AI Reasoning service.",
                "sources": [],
                "error_details": str(exc)
            }

async def stream_ai_reasoning(query: str, case_id: str, language: str = "en"):
    """
    Streams the reasoning trace and final response from the AI Engine.
    This prepares the API to consume SSE from the AI Engine once it's implemented.
    """
    payload = {
        "query": query,
        "case_id": case_id,
        "language": language
    }
    
    try:
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", AI_ENGINE_STREAM_URL, json=payload, timeout=60.0) as response:
                if response.status_code == 404:
                    # Fallback to the old mock behavior if AI engine stream endpoint is not ready yet
                    import json
                    import asyncio
                    steps = [
                        {"stage": "INTENT", "content": "Analyzing query intent..."},
                        {"stage": "RETRIEVAL", "content": "Querying local case records (CBR)..."},
                        {"stage": "HYPOTHESIS", "content": "Formulating competing hypotheses..."},
                        {"stage": "EVALUATION", "content": "Validating evidence and estimating confidence..."}
                    ]
                    for step in steps:
                        yield f"data: {json.dumps(step)}\n\n"
                        await asyncio.sleep(0.3)
                        
                    # Call the synchronous endpoint for the final result
                    final_res = await get_ai_reasoning(query, case_id, language)
                    final_payload = {
                        "stage": "COMPOSITION",
                        "status": "success",
                        "confidence": final_res.get("confidence", "Moderate"),
                        "confidence_dots": final_res.get("confidence_dots", 3),
                        "response": final_res.get("response", ""),
                        "sources": final_res.get("sources", [])
                    }
                    yield f"data: {json.dumps(final_payload)}\n\n"
                    return

                # If the endpoint exists, stream the real SSE lines
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        yield f"{line}\n\n"
    except httpx.HTTPError as exc:
        import json
        error_payload = {
            "stage": "ERROR",
            "status": "error",
            "response": f"Error running reasoning engine stream: {str(exc)}"
        }
        yield f"data: {json.dumps(error_payload)}\n\n"
