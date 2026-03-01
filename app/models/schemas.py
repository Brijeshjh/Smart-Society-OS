from pydantic import BaseModel
from typing import Optional

class ComplaintRequest(BaseModel):
    user_id: str
    description: str

class ComplaintResponse(BaseModel):
    status: str
    message: str
    severity: str
    # Depending on how the AI responds, you might also have things like location, type, etc.
    location: Optional[str] = None
    complaint_type: Optional[str] = None