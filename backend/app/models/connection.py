from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

class ConnectionBase(BaseModel):
    doctor_id: str
    message: Optional[str] = None

class ConnectionCreate(ConnectionBase):
    pass

class ConnectionUpdate(BaseModel):
    status: Literal["approved", "rejected", "blocked"]
    reason: Optional[str] = None

class ConnectionOut(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    status: str
    initiated_by: str
    requested_at: datetime
    responded_at: Optional[datetime] = None
    message: Optional[str] = None
    
    # Optional enriched data
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
