


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