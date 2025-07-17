


# Complaint Management System - Bug Tracker

**Last Updated:** 2025-07-15 1:03 PM  
**Purpose:** Centralized tracking of known issues, triaging workflow, and bug reporting guidelines.

---

## Known Issues

1. **ID-001** - **Severity:** High - **FIXED** ✅
   **Summary:** White-screen on load, console errors cascade from Navigation, ComplaintForm, and ComplaintList components
   **Reproduction Steps:**
   1. Start the development server
   2. Navigate to http://localhost:3000
   3. Observe white screen and console errors
   **Expected vs Actual:** Expected: Application loads normally. Actual: White screen with console errors
   **Environment:** All browsers, development mode
   **Assignee:** Kilo code
   **Status:** **CLOSED** ✅
   **Root Cause:** useLanguage hook invoked outside LanguageProvider
   **Resolution:** Added LanguageProvider wrapper to App.tsx root component
   **Commit:** Fixed in commit with LanguageProvider wrapping Router

2. **ID-002** - **Severity:** Low - **FIXED** ✅
   **Summary:** Tooltip icon misaligned
   **Reproduction Steps:**
   1. Go to home page
   2. Look at tooltip icons
   **Expected Behavior:** Tooltip icons should be properly aligned with labels
   **Actual Behavior:** Tooltip icons appear slightly misaligned
   **Environment:** Browser
   **Assignee:** Kilo code
   **Status:** **CLOSED** ✅
   **Resolution:** Fixed CSS positioning in Tooltip component with proper flex alignment

3. **ID-003** - **Severity:** Low - **FIXED** ✅
   **Summary:** Duplicate titles for fields part number and company number
   **Reproduction Steps:**
   1. Go to home page
   2. Look at form fields
   **Expected Behavior:** Only one label per field should be displayed
   **Actual Behavior:** Duplicate labels for part number and company fields
   **Environment:** Browser
   **Assignee:** Kilo code
   **Status:** **CLOSED** ✅
   **Resolution:** Restructured label rendering to use single label with tooltip icon, eliminating duplication

4. **ID-004** - **Severity:** High - **FIXED** ✅
   **Summary:** Application crashes shortly after loading with TypeError
   **Reproduction Steps:**
   1. Start the development server
   2. Navigate to http://localhost:3000
   3. Application loads briefly then crashes
   **Expected Behavior:** Application should remain stable and display complaints
   **Actual Behavior:** Application crashes with "Cannot read properties of undefined (reading 'toUpperCase')"
   **Environment:** All browsers, development mode
   **Assignee:** Kilo code
   **Status:** **CLOSED** ✅
   **Root Cause:** Translation key mismatch between issue type values and translation keys
   **Resolution:** Added proper mapping function in ComplaintList to handle translation key conversion
   **Commit:** Fixed translation mapping in ComplaintList.tsx

5. **ID-005** - **Severity:** Low - **FIXED** ✅
   **Summary:** Wrong text wrapping for recent complaints in French
   **Reproduction Steps:**
   1. Go to home page
   2. Look at Recent complaints in French
   **Expected Behavior:** Good formatting for text, looks well made
   **Actual Behavior:** All the text is squished since French text is a bit larger, so it takes 2 lines, but it's not centered
   **Environment:** Browser
   **Assignee:** Kilo code
   **Status:** **CLOSED** ✅
   **Resolution:** Improved flex layout with proper spacing, alignment, and text wrapping for French content

6. **ID-006** - **Severity:** Low - **FIXED** ✅
   **Summary:** Title not translated
   **Reproduction Steps:**
   1. Go to home page
   2. Look at the page in French
   **Expected Behavior:** Title should be in French and also the page should be called système de plainte, and not système de réclamation
   **Actual Behavior:** Title is not in French, but in English when the page is in French
   **Environment:** Browser
   **Assignee:** Kilo code
   **Status:** **CLOSED** ✅
   **Resolution:** Added translation support to HomePage and updated French system title to "Système de plainte"


7. **ID-007** **Status**: Fixed
   **Severity**: High
   **Description**: Dashboard page fails to load when clicking the "Dashboard" button
   **Error**: `No QueryClient set, use QueryClientProvider to set one`
   **Reproduction Steps**:
   1. Start the application
   2. Click on "Dashboard" in the navigation
   3. Page crashes with React Query error

   **Root Cause**: Missing QueryClientProvider wrapper in the React Router setup
   **Fix**: Added QueryClientProvider to main.tsx to wrap the entire App component
   **Date Fixed**: 2025-07-15
7. **ID-008** - **Severity:** High - **FIXED** ✅
   **Summary:** API returns 500 Internal Server Error when filtering complaints by status
   **Reproduction Steps:**
   1. Navigate to the complaint management tab
   2. Apply any status filter (e.g., "open", "in_progress", "resolved", "closed")
   3. Observe the 500 Internal Server Error in the browser console
   4. Check backend logs for the detailed error

   **Expected Behavior:** Complaints should be filtered by status and displayed correctly
   **Actual Behavior:** API returns 500 Internal Server Error with ResponseValidationError
   **Environment:** All browsers, backend API
   **Assignee:** Kilo code
   **Status:** **CLOSED** ✅

   **Console Logs:**
   ```
   fastapi.exceptions.ResponseValidationError: 1 validation errors:
     {'type': 'missing', 'loc': ('response', 'pagination', 'total_pages'), 'msg': 'Field required', 'input': {'page': 1, 'size': 10, 'total': 3, 'totalPages': 1}}
   ```

   **Root Cause Analysis:**
   The API endpoint `/api/complaints/` is returning a response with camelCase field `totalPages` but the Pydantic schema `ComplaintSearchResponse` expects snake_case field `total_pages`. This field name mismatch causes FastAPI's response validation to fail.

   **Resolution:** Fixed field name inconsistency by changing `totalPages` to `total_pages` in complaints.py response to match schema expectations
   **Commit:** Fixed camelCase to snake_case field name in complaints.py pagination response
   **Date Fixed:** 2025-07-15
8. **ID-009** - **Severity:** High - **FIXED** ✅
    **Summary:** SQLAlchemy TypeError when searching complaints - "Object '' associated with '.type' attribute is not a TypeEngine class"
    **Reproduction Steps:**
    1. Navigate to the complaint management tab
    2. Enter any search term in the search input field
    3. Observe the 500 Internal Server Error in the browser console
    4. Check backend logs for the detailed SQLAlchemy error

    **Expected Behavior:** Search should return filtered complaints matching the search term
    **Actual Behavior:** API returns 500 Internal Server Error with SQLAlchemy TypeError
    **Environment:** All browsers, backend API, SQLAlchemy
    **Assignee:** Kilo code
    **Status:** **CLOSED** ✅

    **Console Logs:**
    ```
    TypeError: Object '' associated with '.type' attribute is not a TypeEngine class or object
    ```
    **Detailed Error:**
    ```
    sqlalchemy.sql.elements.TypeError: Object '' associated with '.type' attribute is not a TypeEngine class or object
    ```
    
    **Root Cause Analysis:**
    The issue occurred in the `get_complaints` endpoint in `complaints.py` at line 65. The SQLAlchemy query was trying to use `.cast(str)` on `Complaint.id`, but there was a type casting issue with SQLite database.

    **Resolution:** Replaced problematic `.cast(str).like()` syntax with proper integer comparison for ID search and string-based ILIKE for text fields
    **Fix Applied:** Updated search functionality to handle ID search by attempting integer conversion for exact ID matches, while maintaining text-based search for other fields
    **Commit:** Fixed SQLAlchemy cast issue in complaints.py search functionality
    **Date Fixed:** 2025-07-15

9. **ID-010** - **Severity:** High - **FIXED** ✅
    **Summary:** Complaints page crashes with "TypeError: complaints.map is not a function"
    **Reproduction Steps:**
    1. Navigate to the complaints management tab (`/complaints`)
    2. Page loads briefly then crashes with JavaScript error
    3. Console shows: `Uncaught TypeError: complaints.map is not a function`

    **Expected Behavior:** Complaints page should load and display complaint list with search functionality
    **Actual Behavior:** Application crashes immediately after loading
    **Environment:** All browsers, development mode
    **Assignee:** Kilo code
    **Status:** **CLOSED** ✅

    **Console Logs:**
    ```
    Uncaught TypeError: complaints.map is not a function
        at ComplaintList (ComplaintList.tsx:125:21)
    ```

    **Root Cause Analysis:**
    The ComplaintList component was expecting either a direct array response or a paginated response with `.items` property, but the API response structure was inconsistent. The component was trying to call `.map()` on `undefined` when the response format didn't match expectations.

    **Resolution:** Enhanced API response handling in ComplaintList component to properly handle both direct array responses and paginated responses with `.items` property. Added defensive programming with empty array fallback.
    **Fix Applied:** Updated fetchComplaints function to safely handle different response formats and ensure complaints is always an array before calling .map()
    **Commit:** Fixed API response handling in ComplaintList component
    **Date Fixed:** 2025-07-15

---


## Triaging Workflow

1. **Reproduce** - Attempt to reproduce the issue in the reported environment
2. **Search Duplicates** - Check existing issues for similar reports
3. **Assign Severity** - Use severity matrix (Critical/High/Medium/Low)
4. **Label and Assign** - Add appropriate labels and assign to team member
5. **Update Status** - Change status to In-Progress when work begins
6. **Close Issue** - Update status to Closed with commit hash or PR link

---

## Reporting New Bugs

Copy the template below, fill it out, and append to "Known Issues":

```markdown
**ID-XXX** - **Severity:** [Critical/High/Medium/Low]  
**Summary:** [One-sentence description]  
**Reproduction Steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:** [What should happen]  
**Actual Behavior:** [What actually happens]  
**Environment:** [OS/Browser/Version]  
**Assignee:** [Team member or Unassigned]  
**Status:** Open

**Console Logs:** [Link to logs or paste relevant errors]  
**Screenshots:** [Link to screenshots]
```
---

## Critical Security & Performance Issues (Code Review 2025-07-17)

11. **ID-011** - **Severity:** Critical - **OPEN** 🔴
    **Summary:** Missing last_edit timestamp update in complaint update endpoint
    **Reproduction Steps:**
    1. Open EnhancedComplaintDetailDrawer
    2. Edit any field and save
    3. Check complaint.last_edit field in database
    **Expected Behavior:** last_edit should be updated to current timestamp
    **Actual Behavior:** last_edit remains null or unchanged
    **Environment:** Backend API, complaint update endpoint
    **File Location:** [`complaint-system/backend/app/api/complaints.py:162-179`](complaint-system/backend/app/api/complaints.py:162)
    **Root Cause:** PUT endpoint doesn't set last_edit timestamp when updating complaints
    **Impact:** High - Users cannot track when complaints were last modified
    **Suggested Fix:** Add `complaint.last_edit = datetime.utcnow()` before commit in update_complaint function

12. **ID-012** - **Severity:** High - **OPEN** 🔴
    **Summary:** Hardcoded API base URL without environment configuration
    **Reproduction Steps:**
    1. Check EnhancedComplaintDetailDrawer.tsx line 136
    2. Observe hardcoded `/api/complaints/` URL
    **Expected Behavior:** API URLs should use configurable base URL
    **Actual Behavior:** Hardcoded URLs make deployment and testing difficult
    **Environment:** Frontend, API calls
    **File Location:** [`complaint-system/frontend/src/components/ComplaintDetailDrawer/EnhancedComplaintDetailDrawer.tsx:136`](complaint-system/frontend/src/components/ComplaintDetailDrawer/EnhancedComplaintDetailDrawer.tsx:136)
    **Impact:** Medium - Deployment flexibility and environment management issues
    **Suggested Fix:** Use centralized API configuration from services/api.ts

13. **ID-013** - **Severity:** High - **OPEN** 🔴
    **Summary:** Missing CSRF protection and authentication
    **Reproduction Steps:**
    1. Access any API endpoint without authentication
    2. Observe successful access to sensitive operations
    **Expected Behavior:** API should require authentication and CSRF protection
    **Actual Behavior:** All endpoints are publicly accessible
    **Environment:** Backend API, all endpoints
    **File Location:** [`complaint-system/backend/main.py`](complaint-system/backend/main.py)
    **Impact:** Critical - Complete security vulnerability
    **Suggested Fix:** Implement JWT authentication and CSRF tokens

14. **ID-014** - **Severity:** High - **OPEN** 🔴
    **Summary:** File upload vulnerability - insufficient MIME type validation
    **Reproduction Steps:**
    1. Upload file with spoofed MIME type
    2. Check file_handler.py validation logic
    **Expected Behavior:** Robust file type validation using magic numbers
    **Actual Behavior:** Relies only on MIME type headers which can be spoofed
    **Environment:** Backend, file upload system
    **File Location:** [`complaint-system/backend/app/utils/file_handler.py:30-40`](complaint-system/backend/app/utils/file_handler.py:30)
    **Impact:** High - Potential malicious file upload
    **Suggested Fix:** Implement python-magic for actual file content validation

15. **ID-015** - **Severity:** Medium - **OPEN** 🔴
    **Summary:** SQL injection potential in search functionality
    **Reproduction Steps:**
    1. Test search endpoint with SQL injection payloads
    2. Check complaints.py search implementation
    **Expected Behavior:** Parameterized queries prevent SQL injection
    **Actual Behavior:** Uses ilike() which should be safe but needs verification
    **Environment:** Backend API, search functionality
    **File Location:** [`complaint-system/backend/app/api/complaints.py:62-84`](complaint-system/backend/app/api/complaints.py:62)
    **Impact:** Medium - Potential data breach
    **Suggested Fix:** Audit all query construction for injection vulnerabilities

16. **ID-016** - **Severity:** Medium - **OPEN** 🔴
    **Summary:** Missing input sanitization in EnhancedComplaintDetailDrawer
    **Reproduction Steps:**
    1. Enter XSS payload in editable fields
    2. Save and view complaint details
    **Expected Behavior:** Input should be sanitized and escaped
    **Actual Behavior:** Raw input displayed without sanitization
    **Environment:** Frontend, complaint detail drawer
    **File Location:** [`complaint-system/frontend/src/components/ComplaintDetailDrawer/EnhancedComplaintDetailDrawer.tsx:189-248`](complaint-system/frontend/src/components/ComplaintDetailDrawer/EnhancedComplaintDetailDrawer.tsx:189)
    **Impact:** Medium - XSS vulnerability
    **Suggested Fix:** Implement DOMPurify for input sanitization

17. **ID-017** - **Severity:** Medium - **OPEN** 🔴
    **Summary:** Inconsistent validation between frontend and backend
    **Reproduction Steps:**
    1. Compare validation rules in EnhancedComplaintDetailDrawer.tsx:41-73
    2. Compare with backend schemas.py validation
    3. Observe mismatches in required fields and constraints
    **Expected Behavior:** Frontend and backend validation should be identical
    **Actual Behavior:** Different validation rules can cause inconsistent behavior
    **Environment:** Full stack validation
    **File Locations:** Frontend validation, Backend schemas
    **Impact:** Medium - Data integrity and user experience issues
    **Suggested Fix:** Create shared validation schema or ensure consistency

18. **ID-018** - **Severity:** Medium - **OPEN** 🔴
    **Summary:** Memory leak potential in useUndoRedo hook
    **Reproduction Steps:**
    1. Perform many edit operations in EnhancedComplaintDetailDrawer
    2. Check memory usage growth
    **Expected Behavior:** Memory should be managed efficiently
    **Actual Behavior:** Unlimited history growth could cause memory issues
    **Environment:** Frontend, undo/redo functionality
    **File Location:** [`complaint-system/frontend/src/components/ComplaintDetailDrawer/useUndoRedo.ts:19-32`](complaint-system/frontend/src/components/ComplaintDetailDrawer/useUndoRedo.ts:19)
    **Impact:** Low-Medium - Performance degradation over time
    **Suggested Fix:** Implement proper history cleanup and size limits

19. **ID-019** - **Severity:** Low - **OPEN** 🔴
    **Summary:** Missing error boundaries in React components
    **Reproduction Steps:**
    1. Cause runtime error in EnhancedComplaintDetailDrawer
    2. Observe entire application crash
    **Expected Behavior:** Error should be contained with graceful fallback
    **Actual Behavior:** Entire application becomes unusable
    **Environment:** Frontend, React error handling
    **File Location:** Component hierarchy
    **Impact:** Medium - Poor user experience during errors
    **Suggested Fix:** Implement React Error Boundaries

20. **ID-020** - **Severity:** Low - **OPEN** 🔴
    **Summary:** Accessibility issues in EnhancedComplaintDetailDrawer
    **Reproduction Steps:**
    1. Navigate drawer using only keyboard
    2. Use screen reader to access content
    **Expected Behavior:** Full keyboard navigation and screen reader support
    **Actual Behavior:** Missing ARIA labels, focus management issues
    **Environment:** Frontend, accessibility
    **File Location:** [`complaint-system/frontend/src/components/ComplaintDetailDrawer/EnhancedComplaintDetailDrawer.tsx`](complaint-system/frontend/src/components/ComplaintDetailDrawer/EnhancedComplaintDetailDrawer.tsx)
    **Impact:** Medium - Accessibility compliance issues
    **Suggested Fix:** Add proper ARIA attributes and focus management

21. **ID-021** - **Severity:** Medium - **OPEN** 🔴
    **Summary:** Database performance issues with missing indexes
    **Reproduction Steps:**
    1. Check database schema for indexes
    2. Run performance tests on search queries
    **Expected Behavior:** Optimized queries with proper indexing
    **Actual Behavior:** Missing indexes on frequently queried fields
    **Environment:** Backend, database performance
    **File Location:** [`complaint-system/backend/app/models/models.py`](complaint-system/backend/app/models/models.py)
    **Impact:** Medium - Poor performance with large datasets
    **Suggested Fix:** Add indexes on work_order_number, occurrence, part_received fields

22. **ID-022** - **Severity:** Low - **OPEN** 🔴
    **Summary:** Inconsistent error handling across components
    **Reproduction Steps:**
    1. Compare error handling in different components
    2. Observe different error display patterns
    **Expected Behavior:** Consistent error handling and display
    **Actual Behavior:** Mixed error handling approaches
    **Environment:** Frontend, error handling
    **File Location:** Multiple components
    **Impact:** Low - Inconsistent user experience
    **Suggested Fix:** Implement centralized error handling system

23. **ID-023** - **Severity:** Medium - **OPEN** 🔴
    **Summary:** Type safety issues in attachment handling
    **Reproduction Steps:**
    1. Check Attachment interface in types/index.ts:49-56
    2. Compare with backend AttachmentResponse schema
    3. Observe field mismatches (file_type vs mime_type)
    **Expected Behavior:** Perfect type alignment between frontend and backend
    **Actual Behavior:** Type mismatches cause runtime errors
    **Environment:** Full stack, type definitions
    **File Location:** [`complaint-system/frontend/src/types/index.ts:49-56`](complaint-system/frontend/src/types/index.ts:49)
    **Impact:** Medium - Runtime errors and type safety issues
    **Suggested Fix:** Align TypeScript interfaces with backend schemas

24. **ID-024** - **Severity:** High - **OPEN** 🔴
    **Summary:** Analytics endpoint returns incorrect status values
    **Reproduction Steps:**
    1. Check analytics.py RAR metrics endpoint
    2. Observe hardcoded status values that don't match actual complaint statuses
    **Expected Behavior:** Analytics should use actual complaint status values
    **Actual Behavior:** Uses non-existent status values (returned, authorized, rejected)
    **Environment:** Backend, analytics API
    **File Location:** [`complaint-system/backend/app/api/analytics.py:16-18`](complaint-system/backend/app/api/analytics.py:16)
    **Impact:** High - Incorrect analytics data
    **Suggested Fix:** Use correct status values: open, in_progress, resolved, closed

25. **ID-025** - **Severity:** Medium - **OPEN** 🔴
    **Summary:** Missing rate limiting on API endpoints
    **Reproduction Steps:**
    1. Send rapid requests to any API endpoint
    2. Observe no rate limiting applied
    **Expected Behavior:** Rate limiting should prevent abuse
    **Actual Behavior:** Unlimited requests allowed
    **Environment:** Backend API, all endpoints
    **File Location:** [`complaint-system/backend/main.py`](complaint-system/backend/main.py)
    **Impact:** Medium - Potential DoS vulnerability
    **Suggested Fix:** Implement slowapi or similar rate limiting middleware

---