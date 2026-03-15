"""
Source schemas.
"""
from pydantic import BaseModel
from uuid import UUID


class SourceResponse(BaseModel):
    id: UUID
    name: str
    platform: str

    model_config = {"from_attributes": True}
