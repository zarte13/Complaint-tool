


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