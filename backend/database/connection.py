from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Global connection instance
_client: Optional[AsyncIOMotorClient] = None
_db = None

def get_mongodb_uri() -> str:
    """Get MongoDB URI from environment variables.
    Tries MONGODB_URI first, falls back to MONGO_URL for backward compatibility.
    """
    mongodb_uri = os.environ.get('MONGODB_URI') or os.environ.get('MONGO_URL')
    if not mongodb_uri:
        raise ValueError("MONGODB_URI or MONGO_URL environment variable is not set")
    return mongodb_uri

def get_db_name() -> str:
    """Get database name from environment variable."""
    db_name = os.environ.get('DB_NAME', 'pbx_database')
    return db_name

async def connect_to_mongo():
    """Create MongoDB connection. Reuses existing connection if available."""
    global _client, _db
    
    if _client is not None:
        logger.info("Reusing existing MongoDB connection")
        return _db
    
    try:
        mongodb_uri = get_mongodb_uri()
        db_name = get_db_name()
        
        _client = AsyncIOMotorClient(mongodb_uri)
        _db = _client[db_name]
        
        # Test connection
        await _client.admin.command('ping')
        logger.info(f"Connected to MongoDB database: {db_name}")
        
        return _db
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection."""
    global _client, _db
    
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("Closed MongoDB connection")

def get_database():
    """Get database instance. Must be called after connect_to_mongo()."""
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return _db
