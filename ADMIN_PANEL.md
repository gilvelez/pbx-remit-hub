# Admin Panel - Lead Management

## Overview

The admin panel at `/admin` provides secure access to view and manage early access email submissions.

## Features

### 1. Authentication
- **Basic Auth** with username `admin` and password from `.env` (`ADMIN_PASSWORD`)
- Session-based authentication stored in `sessionStorage`
- Auto-login on return visits (within session)
- Secure logout functionality

### 2. Lead Management
- View all email submissions in a sortable table
- **Client-side search** - filter by email or date
- **Empty state** - helpful message when no leads exist
- **Error state** - clear error messages with retry option
- **Loading state** - spinner during data fetch

### 3. Data Display
- **Table columns**: Email, Created At, Status
- **Statistics cards**: Total Leads, Today, This Week
- Real-time filtering based on search query
- Responsive design for mobile and desktop

### 4. Export Functionality
- **RFC4180 compliant CSV export**
- Proper field escaping (commas, quotes, newlines)
- CRLF line endings
- ISO 8601 timestamps
- Filename with current date
- Exports filtered results if search is active

### 5. Search
- Client-side filtering (instant results)
- Searches both email and created_at fields
- Shows result count when searching
- Clear search button when no results

## Access

**URL**: `http://localhost:3000/admin` or `/admin`

**Credentials**:
- Username: `admin` (fixed)
- Password: Value of `ADMIN_PASSWORD` from `/app/backend/.env`

Default password: `pbx_admin_2025`

## Usage Guide

### Login
1. Navigate to `/admin`
2. Username is pre-filled as "admin"
3. Enter the admin password
4. Click "Access Admin Panel"

### View Leads
- Table shows all leads with email and timestamp
- Stats cards show totals for all time, today, and this week

### Search Leads
1. Type in the search box
2. Results filter instantly
3. Shows "X of Y leads" when filtering
4. Click "Clear search" to reset

### Export CSV
1. Click "Export CSV" button
2. File downloads automatically as `pbx-leads-YYYY-MM-DD.csv`
3. If search is active, only filtered results are exported

### Logout
- Click "Logout" button in header
- Clears session and returns to login screen

## CSV Export Format

### RFC4180 Compliance

The CSV export follows RFC4180 standard:

**Features:**
- CRLF line endings (`\r\n`)
- Comma-separated values
- Double quotes for fields containing commas, quotes, or newlines
- Double-quote escaping (`""` for `"`)
- UTF-8 encoding with BOM

**Example CSV:**
```csv
Email,Created At
john@example.com,2025-10-26T09:15:32.123Z
"maria,smith@example.com",2025-10-26T08:45:12.456Z
```

**Field Escaping Rules:**
```javascript
// Contains comma → wrapped in quotes
"john,doe@example.com" → "john,doe@example.com"

// Contains quote → wrapped and escaped
'John "The Boss" Doe' → "John ""The Boss"" Doe"

// Contains newline → wrapped
"john\ndoe@example.com" → "john
doe@example.com"
```

## API Integration

### GET /api/leads
- **Auth**: Basic Auth (admin:{password})
- **Returns**: Array of lead objects
- **Response**:
  ```json
  [
    {
      "_id": "68fde42a37dff03f01e96ecb",
      "email": "user@example.com",
      "created_at": "2025-10-26T09:04:42.744000"
    }
  ]
  ```

## Error Handling

### Authentication Errors

**Invalid Password:**
```
Invalid credentials. Please check your password and try again.
```
→ Red alert box with error icon
→ Can retry immediately

**Network Error:**
```
Failed to load submissions. Please try again.
```
→ Red alert box
→ Can retry by re-entering password

### Empty States

**No Leads Yet:**
```
📧 No leads yet
Email submissions will appear here
```

**No Search Results:**
```
📧 No matches found
Try a different search term
[Clear search button]
```

### Loading State

```
⏳ Loading submissions...
```
→ Animated spinner
→ Shown during initial load and authentication

## Security

1. **Password Protection**: Admin password stored in `.env`, not in code
2. **Session Management**: Credentials stored in `sessionStorage` (cleared on tab close)
3. **Basic Auth**: Credentials sent via Authorization header
4. **Logout**: Clears session and forces re-authentication
5. **No Password Exposure**: Password never logged or displayed

## Testing

### Test Login
```bash
# 1. Navigate to admin page
open http://localhost:3000/admin

# 2. Enter credentials:
Username: admin
Password: pbx_admin_2025

# 3. Should load lead table
```

### Test Search
```bash
# 1. In search box, type: "test"
# 2. Should filter leads containing "test"
# 3. Shows: "Showing X of Y leads"
# 4. Clear search to see all leads
```

### Test CSV Export
```bash
# 1. Click "Export CSV"
# 2. File downloads: pbx-leads-2025-10-26.csv
# 3. Open in Excel/LibreOffice
# 4. Verify proper formatting
```

### Test Empty State
```bash
# Clear all leads from database
curl -u admin:pbx_admin_2025 http://localhost:8001/api/leads

# Refresh admin page
# Should show: "No leads yet"
```

### Test Error State
```bash
# 1. Enter wrong password
Password: wrongpassword

# 2. Should show error:
"Invalid credentials. Please check your password and try again."
```

## Code Structure

```
/app/frontend/src/pages/Admin.jsx
├── Login Form (when not authenticated)
│   ├── Username field (disabled, shows "admin")
│   ├── Password field (autofocus)
│   ├── Error message (if auth fails)
│   └── Submit button with loading state
│
└── Admin Panel (when authenticated)
    ├── Header
    │   ├── Logo and title
    │   └── Logout + Back buttons
    │
    ├── Page Header
    │   ├── Title and description
    │   └── Export CSV button
    │
    ├── Stats Cards
    │   ├── Total Leads
    │   ├── Today
    │   └── This Week
    │
    ├── Search Box
    │   ├── Search input with icon
    │   └── Result count (when searching)
    │
    ├── Leads Table
    │   ├── Headers: Email, Created At, Status
    │   ├── Rows (filtered by search)
    │   ├── Empty state (if no leads)
    │   └── No results state (if search has no matches)
    │
    └── Info Note
        └── Authentication and CSV info
```

## Keyboard Shortcuts

- **Tab**: Navigate form fields
- **Enter**: Submit login form
- **Escape**: (Could add to close modals in future)

## Responsive Design

**Desktop (≥1024px):**
- Full table layout
- 3-column stats grid
- Side-by-side header buttons

**Tablet (768-1023px):**
- Scrollable table
- 3-column stats grid
- Stacked header on smaller tablets

**Mobile (<768px):**
- Scrollable table
- Stacked stats cards
- Stacked buttons
- Full-width search

## Accessibility

- **Semantic HTML**: Proper table structure
- **ARIA labels**: Icons have proper labels
- **Focus states**: Clear focus indicators on inputs
- **Keyboard navigation**: All interactive elements accessible via keyboard
- **Loading indicators**: Screen reader announcements
- **Error messages**: Clearly associated with form fields

## Performance

- **Client-side filtering**: Instant search results
- **Cached credentials**: Auto-login on return
- **Optimized rendering**: Only re-renders filtered results
- **Lazy loading**: Could add pagination for large datasets

## Future Enhancements

1. **Pagination**: For datasets > 100 leads
2. **Sorting**: Click column headers to sort
3. **Bulk actions**: Select multiple and delete/export
4. **Date range filter**: Filter by date range
5. **Export options**: JSON, XML formats
6. **Lead details**: Click row to see full details
7. **Activity log**: Track who accessed admin panel
8. **Multi-user**: Support multiple admin accounts
