from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class Lead(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('email')
    def email_to_lowercase(cls, v):
        return v.lower().strip()

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "created_at": "2025-08-15T10:30:00Z"
            }
        }

class LeadCreate(BaseModel):
    email: EmailStr

    @validator('email')
    def email_to_lowercase(cls, v):
        return v.lower().strip()

class LeadResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    created_at: datetime

    class Config:
        allow_population_by_field_name = True
