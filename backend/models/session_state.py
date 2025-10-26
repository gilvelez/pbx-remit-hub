from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict, Annotated
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

class ActivityItem(BaseModel):
    id: str
    type: str  # 'transfer', 'conversion', etc.
    amount_usd: float = Field(alias="amountUSD")
    est_php: float = Field(alias="estPhp")
    fees_usd: float = Field(alias="feesUSD")
    status: str  # 'pending', 'completed', 'failed'
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

class SessionState(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: str  # anonymous or authenticated user id
    access_token: Optional[str] = None  # Plaid mock token
    accounts: List[Any] = Field(default_factory=list)  # last fetched accounts
    transactions: List[Any] = Field(default_factory=list)  # last fetched transactions
    activity: List[ActivityItem] = Field(default_factory=list)  # mock Circle activity
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "user_id": "anonymous_12345",
                "access_token": "mock_plaid_token_abc123",
                "accounts": [{"id": "acc_123", "balance": 1250.00}],
                "transactions": [{"id": "tx_123", "amount": 200}],
                "activity": [
                    {
                        "id": "act_123",
                        "type": "transfer",
                        "amountUSD": 200.0,
                        "estPhp": 11300.0,
                        "feesUSD": 2.99,
                        "status": "completed",
                        "created_at": "2025-08-15T10:30:00Z"
                    }
                ],
                "updated_at": "2025-08-15T10:30:00Z"
            }
        }

class SessionStateCreate(BaseModel):
    user_id: str
    access_token: Optional[str] = None

class SessionStateUpdate(BaseModel):
    access_token: Optional[str] = None
    accounts: Optional[List[Any]] = None
    transactions: Optional[List[Any]] = None
    activity: Optional[List[ActivityItem]] = None

class SessionStateResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    access_token: Optional[str] = None
    accounts: List[Any] = []
    transactions: List[Any] = []
    activity: List[Dict] = []
    updated_at: datetime

    class Config:
        allow_population_by_field_name = True
