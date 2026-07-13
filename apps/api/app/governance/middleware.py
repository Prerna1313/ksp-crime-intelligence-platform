import json
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from .boundary_check import check_boundary_violations
from .confidence import annotate_confidence
from .audit import emit_audit_event

class GovernanceMiddleware(BaseHTTPMiddleware):
    """
    Mandatory passthrough — applied to EVERY response.
    This middleware cannot be disabled by any application code.
    """
    EXCLUDED_PATHS = {"/api/v1/health", "/api/v1/auth/login", "/health", "/"}

    async def dispatch(self, request: Request, call_next):
        # Allow health checks and login path without interception
        if request.url.path in self.EXCLUDED_PATHS or request.url.path.startswith("/api/v1/auth"):
            return await call_next(request)

        # Pre-request audit
        request_body = b""
        # We can read request body if it is JSON or post data
        if request.method in ["POST", "PUT", "PATCH"]:
            request_body = await request.body()
            
        request_audit_id = await emit_audit_event(
            event_type="QUERY",
            request=request,
            content=request_body.decode("utf-8", errors="ignore")
        )

        response = await call_next(request)

        response.headers["X-KSP-Governance-Audit-Id"] = request_audit_id

        # Post-response processing (non-streaming only — SSE handled separately)
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            body = b""
            async for chunk in response.body_iterator:
                body += chunk

            try:
                data = json.loads(body)

                # 1. Boundary violation check
                violation = check_boundary_violations(data)
                if violation.severity == "HIGH":
                    await emit_audit_event(
                        event_type="BOUNDARY_VIOLATION_FLAG", 
                        request=request, 
                        content=json.dumps({"violated_pattern": violation.matched_pattern, "suppressed_data": data}),
                        request_audit_id=request_audit_id
                    )
                    # Suppress high-severity violations (e.g. demographic profiling)
                    res_suppressed = Response(
                        content=json.dumps({"error": "Response suppressed pending review"}),
                        status_code=451,
                        media_type="application/json"
                    )
                    res_suppressed.headers["X-KSP-Governance-Audit-Id"] = request_audit_id
                    return res_suppressed

                # 2. Confidence annotation (ensure every response has it)
                data = annotate_confidence(data)

                # 3. Post-response audit
                response_content = json.dumps(data)
                if len(response_content) > 10000:
                    response_content = response_content[:10000] + "... [TRUNCATED DUE TO SIZE]"
                    
                await emit_audit_event(
                    event_type="RESPONSE",
                    request=request,
                    content=response_content,
                    request_audit_id=request_audit_id
                )

                res = Response(
                    content=json.dumps(data),
                    status_code=response.status_code,
                    media_type="application/json"
                )
                res.headers["X-KSP-Governance-Audit-Id"] = request_audit_id
                return res
            except Exception as e:
                print(f"Governance Middleware error during post-response process: {e}")
                response.headers["X-KSP-Governance-Audit-Id"] = request_audit_id
                return Response(body, status_code=response.status_code,
                                media_type=response.media_type)

        return response


