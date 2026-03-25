from pydantic import BaseModel
from typing import Optional


# Phase 2: Lead submission (stub — implemented in Phase 2)
class LeadSubmitRequest(BaseModel):
    client_id: str
    homeowner_name: str
    phone: str
    email: Optional[str] = None
    zip_code: str
    service_type: str  # ac_repair | furnace_repair | installation | maintenance | other
    source: str = "landing_page"


class LeadSubmitResponse(BaseModel):
    success: bool
    lead_id: Optional[str] = None
    error: Optional[str] = None
