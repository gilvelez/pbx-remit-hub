from database.connection import get_database
from models.lead import Lead, LeadCreate, LeadResponse
from typing import List, Optional
from datetime import datetime
import logging
from pymongo.errors import DuplicateKeyError

logger = logging.getLogger(__name__)

class LeadService:
    def __init__(self):
        self.collection_name = "leads"

    async def create_lead(self, lead_data: LeadCreate) -> LeadResponse:
        """Create a new lead. Returns error if email already exists."""
        db = get_database()
        collection = db[self.collection_name]
        
        # Ensure unique index on email
        await collection.create_index("email", unique=True)
        
        lead = Lead(
            email=lead_data.email,
            created_at=datetime.utcnow()
        )
        
        try:
            result = await collection.insert_one(lead.dict(by_alias=True, exclude={"id"}))
            created_lead = await collection.find_one({"_id": result.inserted_id})
            
            # Convert ObjectId to string for response
            created_lead["_id"] = str(created_lead["_id"])
            
            logger.info(f"Created lead with email: {lead.email}")
            return LeadResponse(**created_lead)
        except DuplicateKeyError:
            logger.warning(f"Duplicate email attempted: {lead.email}")
            raise ValueError(f"Email {lead.email} is already registered")

    async def get_all_leads(self, skip: int = 0, limit: int = 1000) -> List[LeadResponse]:
        """Get all leads with pagination."""
        db = get_database()
        collection = db[self.collection_name]
        
        cursor = collection.find().sort("created_at", -1).skip(skip).limit(limit)
        leads = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for each lead
        for lead in leads:
            lead["_id"] = str(lead["_id"])
        
        return [LeadResponse(**lead) for lead in leads]

    async def get_lead_by_email(self, email: str) -> Optional[LeadResponse]:
        """Get a lead by email."""
        db = get_database()
        collection = db[self.collection_name]
        
        lead = await collection.find_one({"email": email.lower().strip()})
        if lead:
            return LeadResponse(**lead)
        return None

    async def delete_lead(self, lead_id: str) -> bool:
        """Delete a lead by ID."""
        db = get_database()
        collection = db[self.collection_name]
        
        from bson import ObjectId
        result = await collection.delete_one({"_id": ObjectId(lead_id)})
        return result.deleted_count > 0

    async def get_lead_count(self) -> int:
        """Get total number of leads."""
        db = get_database()
        collection = db[self.collection_name]
        return await collection.count_documents({})
