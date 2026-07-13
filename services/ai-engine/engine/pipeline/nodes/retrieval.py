from engine.pipeline.state import InvestigationState
from engine.retrieval.rag_interface import SQLiteRAGService

# Instantiate abstract retrieval provider
rag_service = SQLiteRAGService()

def retrieve_evidence(state: InvestigationState) -> InvestigationState:
    """
    Stage 5: Knowledge Discovery (CBR: Retrieve).
    Retrieves semantic cases, entities, and relationships.
    """
    query = state.get("query", "")
    case_id = state.get("case_id")
    
    # Expose strict interface call for RAG pipeline mapping
    cases = rag_service.retrieve(query, case_id=case_id)
    entities = rag_service.retrieve_entities(query, case_id=case_id)
    documents = rag_service.retrieve_documents(query, case_id=case_id)
    
    state["retrieved_cases"] = cases
    state["retrieved_entities"] = entities
    state["retrieved_relationships"] = [
        {
            "source": ent["id"], 
            "target": case_id or "cross-case", 
            "type": ent.get("role", "ASSOCIATE")
        } for ent in entities
    ]
    
    # Check for inconsistencies/contradictions in retrieved data
    # (Stage 6: Evidence Correlation)
    state["conflicts_detected"] = []
    if len(cases) > 1 and len(entities) > 1:
        # Dummy conflict detection
        state["conflicts_detected"].append({
            "type": "TIMELINE_OVERLAP",
            "description": "Witness places suspect at two separate spots concurrently"
        })
        
    trace = state.get("reasoning_trace") or []
    trace.append({
        "stage": "RETRIEVAL", 
        "output": f"retrieved {len(cases)} cases, {len(entities)} entities"
    })
    state["reasoning_trace"] = trace
    
    return state
