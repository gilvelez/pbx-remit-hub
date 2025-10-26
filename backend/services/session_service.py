from database.connection import get_database
from models.session_state import SessionState, SessionStateCreate, SessionStateUpdate, SessionStateResponse, ActivityItem
from typing import Optional, List
from datetime import datetime
import logging
from bson import ObjectId

logger = logging.getLogger(__name__)

class SessionService:
    def __init__(self):
        self.collection_name = "session_states"

    async def create_session(self, session_data: SessionStateCreate) -> SessionStateResponse:
        """Create a new session state."""
        db = get_database()
        collection = db[self.collection_name]
        
        session = SessionState(
            user_id=session_data.user_id,
            access_token=session_data.access_token,
            updated_at=datetime.utcnow()
        )
        
        result = await collection.insert_one(session.dict(by_alias=True, exclude={"id"}))
        created_session = await collection.find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string
        created_session["_id"] = str(created_session["_id"])
        
        logger.info(f"Created session for user: {session.user_id}")
        return SessionStateResponse(**created_session)

    async def get_session_by_user_id(self, user_id: str) -> Optional[SessionStateResponse]:
        """Get session by user ID."""
        db = get_database()
        collection = db[self.collection_name]
        
        session = await collection.find_one({"user_id": user_id})
        if session:
            session["_id"] = str(session["_id"])
            return SessionStateResponse(**session)
        return None

    async def update_session(self, user_id: str, update_data: SessionStateUpdate) -> Optional[SessionStateResponse]:
        """Update session state."""
        db = get_database()
        collection = db[self.collection_name]
        
        update_dict = {k: v for k, v in update_data.dict(exclude_unset=True).items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await collection.find_one_and_update(
            {"user_id": user_id},
            {"$set": update_dict},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
            logger.info(f"Updated session for user: {user_id}")
            return SessionStateResponse(**result)
        return None

    async def add_activity(self, user_id: str, activity: ActivityItem) -> Optional[SessionStateResponse]:
        """Add activity to session."""
        db = get_database()
        collection = db[self.collection_name]
        
        result = await collection.find_one_and_update(
            {"user_id": user_id},
            {
                "$push": {"activity": activity.dict(by_alias=True)},
                "$set": {"updated_at": datetime.utcnow()}
            },
            return_document=True
        )
        
        if result:
            logger.info(f"Added activity to session for user: {user_id}")
            return SessionStateResponse(**result)
        return None

    async def delete_session(self, user_id: str) -> bool:
        """Delete session by user ID."""
        db = get_database()
        collection = db[self.collection_name]
        
        result = await collection.delete_one({"user_id": user_id})
        return result.deleted_count > 0

    async def get_or_create_session(self, user_id: str) -> SessionStateResponse:
        """Get existing session or create new one."""
        session = await self.get_session_by_user_id(user_id)
        if session:
            return session
        
        # Create new session
        session_data = SessionStateCreate(user_id=user_id)
        return await self.create_session(session_data)
