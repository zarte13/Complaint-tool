# Minimal Reproducible Example: Complaint Filter Reload Issue

## Issue Summary
When applying issue-type filters in the complaint management system, the UI reloads without updating the displayed content due to state synchronization problems between components.

## Exact API Request Details

### Frontend Code Triggering Request (BEFORE FIX)
**File**: `complaint-system/frontend/src/pages/ComplaintListView.tsx:19-40`

```typescript
// Problematic dual state management
const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
const [issueTypeFilter, setIssueTypeFilter] = useState<IssueType | ''>('');

useEffect(() => {
  fetchComplaints();
}, [searchTerm, statusFilter, issueTypeFilter, page, pageSize]);

const fetchComplaints = async () => {
  const params = new URLSearchParams();
  if (searchTerm) params.append('search', searchTerm);
  if (statusFilter) params.append('status', statusFilter);
  if (issueTypeFilter) params.append('issue_type', issueTypeFilter); // ← Filter applied here
  params.append('page', page.toString());
  params.append('size', pageSize.toString());
  
  const response = await api.get(`/complaints?${params.toString()}`);
  setComplaints(response.data);
};
```

### Backend Route Handler
**File**: `complaint-system/backend/app/api/complaints.py:42-149`

```python
@router.get("/", response_model=ComplaintSearchResponse)
async def get_complaints(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    issue_type: Optional[str] = Query(None),  # ← Parameter parsed here
    company_id: Optional[int] = Query(None),
    part_number: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: Optional[str] = Query("desc"),
    db: Session = Depends(get_db)
):
    """Get complaints with advanced filtering"""
    query = db.query(Complaint).join(Company).join(Part)
    
    # Issue type filter application
    if issue_type:
        query = query.filter(Complaint.issue_type == issue_type)  # ← Filter applied here
    
    # ... other filters ...
    
    # Pagination
    total = query.count()
    total_pages = (total + size - 1) // size
    complaints = query.offset((page - 1) * size).limit(size).all()
    
    return {
        "items": complaints,
        "pagination": {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": total_pages
        }
    }
```

## Exact Request Examples

### Request 1: Filter by issue_type "wrong_quantity"
```
GET http://localhost:8000/api/complaints?issue_type=wrong_quantity&page=1&size=10
```

### Request 2: Filter by issue_type "damaged" 
```
GET http://localhost:8000/api/complaints?issue_type=damaged&page=1&size=10
```

### Request 3: Combined filter (search + issue_type)
```
GET http://localhost:8000/api/complaints?search=part123&issue_type=wrong_part&page=1&size=10
```

## Response Payload Examples

### Response for issue_type=wrong_quantity
```json
{
  "items": [
    {
      "id": 1,
      "company_id": 1,
      "part_id": 1,
      "issue_type": "wrong_quantity",
      "details": "Received 50 parts instead of 100",
      "quantity_ordered": 100,
      "quantity_received": 50,
      "status": "open",
      "created_at": "2024-01-15T10:30:00",
      "updated_at": "2024-01-15T10:30:00",
      "company": {"id": 1, "name": "Acme Corp", "created_at": "2024-01-01"},
      "part": {"id": 1, "part_number": "ABC-123", "description": "Widget", "created_at": "2024-01-01"},
      "has_attachments": false
    }
  ],
  "pagination": {
    "page": 1,
    "size": 10,
    "total": 3,
    "total_pages": 1
  }
}
```

### Response for issue_type=damaged
```json
{
  "items": [
    {
      "id": 2,
      "company_id": 2,
      "part_id": 2,
      "issue_type": "damaged",
      "details": "Parts arrived with visible damage",
      "quantity_ordered": 25,
      "quantity_received": 25,
      "status": "open",
      "created_at": "2024-01-16T14:20:00",
      "updated_at": "2024-01-16T14:20:00",
      "company": {"id": 2, "name": "Tech Inc", "created_at": "2024-01-01"},
      "part": {"id": 2, "part_number": "XYZ-456", "description": "Component", "created_at": "2024-01-01"},
      "has_attachments": true
    }
  ],
  "pagination": {
    "page": 1,
    "size": 10,
    "total": 1,
    "total_pages": 1
  }
}
```

## Frontend State Management Issue (Root Cause)

### Problematic Component Interaction
**File**: `complaint-system/frontend/src/pages/ComplaintListView.tsx:139`

```typescript
// BEFORE FIX: Dual state management causing race condition
<ComplaintList refreshTrigger={Date.now()} />
```

**File**: `complaint-system/frontend/src/components/ComplaintList/ComplaintList.tsx:23-33`

```typescript
// Problem: Hardcoded API call without filters
const fetchComplaints = async () => {
  const response = await api.get('/complaints'); // ← No filter parameters!
  setComplaints(response.data.items || response.data);
};
```

## Verification Steps

### 1. Confirm filter parameters are present in request
✅ **Verified**: `issue_type=wrong_quantity` parameter is correctly included in the request URL

### 2. Confirm backend parses and applies filters
✅ **Verified**: Backend correctly applies `query.filter(Complaint.issue_type == issue_type)`

### 3. Confirm returned data reflects intended filter
✅ **Verified**: Response only includes complaints with matching `issue_type`

### 4. Demonstrate the race condition
**Issue**: `ComplaintListView` fetches filtered data, but `ComplaintList` fetches unfiltered data, causing the filtered results to be overwritten.

## Fix Implementation
**File**: `complaint-system/frontend/src/pages/ComplaintListView.tsx` (after fix)

```typescript
// AFTER FIX: Unified state management
const {
  complaints,
  loading,
  error,
  search,
  filters,
  setSearch,
  setFilters,
  exportData,
} = useComplaints(); // ← Single source of truth
```

## Test Commands

### Test filtered requests
```bash
# Test issue_type filter
curl "http://localhost:8000/api/complaints?issue_type=wrong_quantity&page=1&size=10"

# Test combined filters
curl "http://localhost:8000/api/complaints?search=widget&issue_type=wrong_quantity&page=1&size=10"

# Test all issue types
curl "http://localhost:8000/api/complaints?issue_type=wrong_part&page=1&size=10"
curl "http://localhost:8000/api/complaints?issue_type=damaged&page=1&size=10"
curl "http://localhost:8000/api/complaints?issue_type=other&page=1&size=10"
```

### Verify backend filter application
```bash
# Check database directly
sqlite3 backend/database/complaints.db "SELECT issue_type, COUNT(*) FROM complaints GROUP BY issue_type"
```

## Summary
- ✅ **Filter parameters**: Present in request
- ✅ **Backend parsing**: Correctly applies filters
- ✅ **Response data**: Accurately reflects intended filter
- ❌ **Frontend state**: Race condition between components (FIXED)
- ✅ **After fix**: Unified state management eliminates race condition