# PBX Backend - MongoDB Setup Complete

## Database Architecture

### Connection
- **Environment Variable**: `MONGODB_URI` (with fallback to `MONGO_URL`)
- **Database Name**: `pbx_database`
- **Connection Pooling**: Reuses single connection across requests
- **Location**: `/app/backend/database/connection.py`

### Models

#### 1. Lead Model (`/app/backend/models/lead.py`)
```python
{
  "_id": ObjectId,
  "email": String (unique, required, lowercase, trimmed),
  "created_at": Date (default now)
}
```

**Features**:
- Email validation with EmailStr
- Automatic lowercase and trim
- Unique email constraint
- Auto-generated timestamps

#### 2. SessionState Model (`/app/backend/models/session_state.py`)
```python
{
  "_id": ObjectId,
  "user_id": String,            # anonymous or auth user id
  "access_token": String,       # Plaid mock token
  "accounts": [Any],            # last fetched accounts
  "transactions": [Any],        # last fetched transactions
  "activity": [                 # mock Circle activity
    {
      "id": String,
      "type": String,
      "amountUSD": Number,
      "estPhp": Number,
      "feesUSD": Number,
      "status": String,
      "createdAt": Date
    }
  ],
  "updated_at": Date
}
```

**Features**:
- Flexible storage for accounts and transactions
- Activity tracking with proper typing
- Auto-updated timestamps

### Services

#### LeadService (`/app/backend/services/lead_service.py`)
- `create_lead(lead_data)` - Create new lead with duplicate prevention
- `get_all_leads(skip, limit)` - Paginated lead retrieval
- `get_lead_by_email(email)` - Find lead by email
- `delete_lead(lead_id)` - Delete lead
- `get_lead_count()` - Count total leads

#### SessionService (`/app/backend/services/session_service.py`)
- `create_session(session_data)` - Create new session
- `get_session_by_user_id(user_id)` - Retrieve session
- `update_session(user_id, update_data)` - Update session state
- `add_activity(user_id, activity)` - Add activity item
- `delete_session(user_id)` - Delete session
- `get_or_create_session(user_id)` - Get existing or create new

## API Endpoints

### Lead Management
- `POST /api/leads` - Create new lead
- `GET /api/leads` - Get all leads (with pagination)
- `GET /api/leads/count` - Get lead count
- `DELETE /api/leads/{lead_id}` - Delete lead

### Session Management
- `POST /api/sessions` - Create session
- `GET /api/sessions/{user_id}` - Get or create session
- `PUT /api/sessions/{user_id}` - Update session
- `POST /api/sessions/{user_id}/activity` - Add activity
- `DELETE /api/sessions/{user_id}` - Delete session

### Health
- `GET /api/` - API info
- `GET /api/health` - Health check

## Testing

```bash
# Test lead creation
curl -X POST http://localhost:8001/api/leads \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Test session creation
curl -X POST http://localhost:8001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_123", "access_token": "mock_token"}'

# Get all leads
curl http://localhost:8001/api/leads

# Get session
curl http://localhost:8001/api/sessions/user_123
```

## Next Steps

Frontend integration is required to:
1. Replace localStorage with API calls
2. Connect email signup form to `/api/leads`
3. Connect demo interface to `/api/sessions`
4. Update admin page to fetch from `/api/leads`

## Notes

- All ObjectIds are automatically converted to strings in API responses
- Email addresses are automatically lowercased and trimmed
- Unique constraints are enforced on email field
- Connection is established on startup and closed on shutdown
- Pydantic v2 compatible with proper validation
