from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, Annotated
from datetime import datetime
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type, _handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ], serialization=core_schema.plain_serializer_function_ser_schema(
            lambda x: str(x)
        ))

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class Lead(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('email')
    def email_to_lowercase(cls, v):
        return v.lower().strip()

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
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
        populate_by_name = True
