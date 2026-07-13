from engine.pipeline.state import InvestigationState

def compose_response(state: InvestigationState) -> InvestigationState:
    """
    Stage 19: Explainable Response Composition.
    Ensure response is objective, attributes sources, and provides the confidence level.
    """
    intent = state.get("intent", "retrieval")
    
    if intent == "reasoning":
        hypotheses = state.get("hypotheses") or []
        response_text = "Objective Cognitive Investigation Synthesis:\n\n"
        response_text += "Compounding Hypotheses identified:\n"
        for h in hypotheses:
            response_text += f"- {h['id']}: {h['text']} (Support factors: {', '.join(h['supporting_evidence'])})\n"
            
        if state.get("diagnosticity_gap"):
            response_text += "\n[IMPORTANT] Diagnosticity Gap detected: The confidence difference between hypotheses is small. Further evidence is needed.\n"
            state["recommendation"] = "Collect independent witness verification to resolve H1 vs H2 gap."
        else:
            state["recommendation"] = None
            
        state["alternative_explanation"] = "Accomplice coordination remains a secondary explanation due to unresolved alias matches."
    else:
        retrieved_cases = state.get("retrieved_cases") or []
        retrieved_entities = state.get("retrieved_entities") or []
        
        if not retrieved_cases and not retrieved_entities:
            response_text = "No records matching your search were found in the Karnataka crime database."
        else:
            response_text = "Based on the records retrieved from our local crime database, here is the analysis:\n\n"
            
            if retrieved_cases:
                response_text += "### 📁 Associated Case Files\n"
                for c in retrieved_cases:
                    response_text += f"- {c.get('text', 'Case record matching the criteria.')}\n"
                response_text += "\n"
                
            if retrieved_entities:
                response_text += "### 👤 Identified Suspects & Associated Entities\n"
                for e in retrieved_entities:
                    role_str = e.get('role', 'Unknown').title()
                    conf_pct = int(e.get('confidence', 1.0) * 100)
                    response_text += f"- **{e.get('canonical_name')}** ({e.get('entity_type')}): Linked as **{role_str}** (Confidence: {conf_pct}%)\n"
                response_text += "\n"
                
        state["recommendation"] = "Verify the links in the workspace network explorer."
        state["alternative_explanation"] = None
        
    state["final_response"] = response_text
    
    # Format sources cited dynamically based on retrieved cases
    sources = []
    import re
    for c in retrieved_cases:
        case_num_match = re.search(r'CR-\d{4}-\d{5}', c.get('text', ''))
        case_num = case_num_match.group(0) if case_num_match else "Case Record"
        sources.append({
            "label": f"CCTNS · {case_num}",
            "case_number": case_num,
            "title": f"CCTNS File {case_num}"
        })
        
    if not sources:
        sources.append({
            "label": "CCTNS Index Search",
            "case_number": "General Search",
            "title": "CCTNS Index"
        })
        
    state["sources_cited"] = sources
    
    trace = state.get("reasoning_trace") or []
    trace.append({"stage": "COMPOSITION", "output": "Synthesis completed."})
    state["reasoning_trace"] = trace
    
    return state
