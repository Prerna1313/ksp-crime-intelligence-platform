from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class IRAGService(ABC):
    """
    Contract interface for the RAG retrieval pipeline, per RAG CONTRACT requirements.
    This architecture isolates AI reasoning orchestration from specific vector or graph databases.
    """
    
    @abstractmethod
    def retrieve(self, query: str, case_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Generic retrieval of raw semantic blocks.
        """
        pass

    @abstractmethod
    def retrieve_context(self, query: str, case_id: Optional[str] = None) -> str:
        """
        Retrieves context as a compiled formatted string ready for LLM consumption.
        """
        pass

    @abstractmethod
    def retrieve_entities(self, query: str, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves graph/semantic entities related to the query.
        """
        pass

    @abstractmethod
    def retrieve_documents(self, query: str, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves CCTNS case file details or unstructured document chunks.
        """
        pass


class PlaceholderRAGService(IRAGService):
    """
    Placeholder implementation of IRAGService to isolate reasoning testing
    until the separate RAG engineering track completes implementation.
    """
    
    def retrieve(self, query: str, case_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        return [
            {
                "id": "doc-placeholder-1",
                "text": "First Information Report filed at station regarding theft.",
                "score": 0.89,
                "metadata": {"case_id": case_id, "record_type": "FIR"}
            }
        ]

    def retrieve_context(self, query: str, case_id: Optional[str] = None) -> str:
        return "PLACEHOLDER RETRIEVED CONTEXT: Relevant incident logs show suspect activity at target coordinates."

    def retrieve_entities(self, query: str, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return [
            {
                "id": "ent-placeholder-1",
                "canonical_name": "Ramesh Kumar",
                "entity_type": "PERSON",
                "pg_id": "uuid-ramesh",
                "role": "ACCUSED"
            }
        ]

    def retrieve_documents(self, query: str, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return [
            {
                "id": "case-file-1",
                "title": "FIR CR-2024-0012",
                "path": "fir_files/CR-2024-0012.pdf"
            }
        ]


import sqlite3
import os
import re

def clean_query_words(query: str) -> List[str]:
    # Extract candidate keywords
    words = re.findall(r'\b[a-zA-Z0-9-]+\b', query)
    stopwords = {
        'what', 'is', 'the', 'case', 'registered', 'on', 'for', 'about', 'in', 
        'of', 'to', 'and', 'a', 'an', 'with', 'by', 'at', 'from', 'who', 'show', 
        'me', 'details', 'find', 'search', 'any', 'similar', 'there', 'was'
    }
    return [w for w in words if w.lower() not in stopwords and len(w) > 2]

class SQLiteRAGService(IRAGService):
    """
    Actual RAG service that retrieves cases, entities, and relationships 
    directly from the SQLite database (ksp_intelligence.db) to populate the AI context.
    """
    
    def __init__(self, db_path: Optional[str] = None):
        if not db_path:
            # rag_interface.py is in services/ai-engine/engine/retrieval/rag_interface.py
            # Go up 4 levels to the project root and then down into apps/api/ksp_intelligence.db
            current_dir = os.path.dirname(os.path.abspath(__file__))
            self.db_path = os.path.abspath(os.path.join(current_dir, "../../../../apps/api/ksp_intelligence.db"))
        else:
            self.db_path = db_path

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def retrieve(self, query: str, case_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        results = []
        
        try:
            if case_id:
                cursor.execute(
                    "SELECT id, case_number, case_type, narrative FROM cases WHERE id = ? OR case_number = ?", 
                    (case_id, case_id)
                )
                rows = cursor.fetchall()
            else:
                # 1. Check if there's a case number in the query
                case_match = re.search(r'CR-\d{4}-\d{5}', query, re.IGNORECASE)
                if case_match:
                    cursor.execute(
                        "SELECT id, case_number, case_type, narrative FROM cases WHERE case_number = ?",
                        (case_match.group(0).upper(),)
                    )
                    rows = cursor.fetchall()
                else:
                    # 2. Extract keywords and search cases narrative or find cases linked to matching entities
                    keywords = clean_query_words(query)
                    if not keywords:
                        # Fallback to general search with full query (truncated if long)
                        cursor.execute(
                            "SELECT id, case_number, case_type, narrative FROM cases LIMIT ?",
                            (limit,)
                        )
                        rows = cursor.fetchall()
                    else:
                        # Find cases containing any keyword in narrative
                        query_parts = ["narrative LIKE ?"] * len(keywords)
                        sql = f"SELECT id, case_number, case_type, narrative FROM cases WHERE {' OR '.join(query_parts)} LIMIT ?"
                        params = [f"%{w}%" for w in keywords] + [limit]
                        cursor.execute(sql, params)
                        rows = cursor.fetchall()
                        
                        # If no direct cases found, find cases linked to matching entities
                        if not rows:
                            entity_query_parts = ["e.canonical_name LIKE ? OR ea.alias_text LIKE ?"] * len(keywords)
                            sql = f"""
                                SELECT DISTINCT c.id, c.case_number, c.case_type, c.narrative
                                FROM cases c
                                JOIN case_entity_links cel ON c.id = cel.case_id
                                JOIN entities e ON cel.entity_id = e.id
                                LEFT JOIN entity_aliases ea ON e.id = ea.entity_id
                                WHERE {' OR '.join(entity_query_parts)}
                                LIMIT ?
                            """
                            params = []
                            for w in keywords:
                                params.extend([f"%{w}%", f"%{w}%"])
                            params.append(limit)
                            cursor.execute(sql, params)
                            rows = cursor.fetchall()
            
            for r in rows:
                results.append({
                    "id": r[0],
                    "text": f"Case {r[1]} ({r[2]}) - Narrative: {r[3]}",
                    "score": 1.0,
                    "metadata": {"case_id": r[0], "record_type": "CASE"}
                })
        except Exception as e:
            print(f"Error in SQLiteRAGService.retrieve: {e}")
        finally:
            conn.close()
            
        return results

    def retrieve_context(self, query: str, case_id: Optional[str] = None) -> str:
        cases = self.retrieve(query, case_id=case_id)
        if not cases:
            return "No matching case records found in SQLite."
            
        context_parts = []
        for c in cases:
            case_desc = c["text"]
            # Fetch entities linked to this case
            entities = self.retrieve_entities(query, case_id=c["id"])
            entity_descriptions = []
            for e in entities:
                entity_descriptions.append(f"- {e['canonical_name']} ({e['entity_type']}) as {e['role']} (Confidence: {e['confidence']})")
                
            entities_str = "\n".join(entity_descriptions) if entity_descriptions else "No linked entities."
            context_parts.append(f"{case_desc}\nLinked Entities:\n{entities_str}")
            
        return "\n\n---\n\n".join(context_parts)

    def retrieve_entities(self, query: str, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        results = []
        
        try:
            if case_id:
                cursor.execute(
                    """
                    SELECT e.id, e.canonical_name, e.entity_type, cel.role, cel.confidence
                    FROM entities e
                    JOIN case_entity_links cel ON e.id = cel.entity_id
                    WHERE cel.case_id = ? OR cel.case_id = (SELECT id FROM cases WHERE case_number = ?)
                    """,
                    (case_id, case_id)
                )
                rows = cursor.fetchall()
            else:
                keywords = clean_query_words(query)
                if not keywords:
                    cursor.execute(
                        "SELECT id, canonical_name, entity_type, NULL, NULL FROM entities LIMIT 5"
                    )
                    rows = cursor.fetchall()
                else:
                    entity_query_parts = ["e.canonical_name LIKE ? OR ea.alias_text LIKE ?"] * len(keywords)
                    sql = f"""
                        SELECT DISTINCT e.id, e.canonical_name, e.entity_type, cel.role, cel.confidence
                        FROM entities e
                        LEFT JOIN case_entity_links cel ON e.id = cel.entity_id
                        LEFT JOIN entity_aliases ea ON e.id = ea.entity_id
                        WHERE {' OR '.join(entity_query_parts)}
                    """
                    params = []
                    for w in keywords:
                        params.extend([f"%{w}%", f"%{w}%"])
                    cursor.execute(sql, params)
                    rows = cursor.fetchall()
                
            for r in rows:
                results.append({
                    "id": r[0],
                    "canonical_name": r[1],
                    "entity_type": r[2],
                    "pg_id": r[0],
                    "role": r[3] or "Unknown",
                    "confidence": float(r[4]) if r[4] else 1.0
                })
        except Exception as e:
            print(f"Error in SQLiteRAGService.retrieve_entities: {e}")
        finally:
            conn.close()
            
        return results

    def retrieve_documents(self, query: str, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
        cases = self.retrieve(query, case_id=case_id)
        return [
            {
                "id": f"doc-{c['id'][:8]}",
                "title": f"Case File {c['metadata']['case_id']}",
                "path": f"cases/{c['id']}/docket.pdf"
            }
            for c in cases
        ]
