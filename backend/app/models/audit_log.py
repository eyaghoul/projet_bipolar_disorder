from pydantic import BaseModel
from datetime import datetime


class AuditLogOut(BaseModel):
    id: str
    userId: str
    userEmail: str
    action: str
    targetResource: str
    targetId: str
    ip: str
    timestamp: datetime
