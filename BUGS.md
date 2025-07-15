# Complaint Management System - Bug Tracker

**Last Updated:** 2025-07-15 12:19 PM  
**Purpose:** Centralized tracking of known issues, triaging workflow, and bug reporting guidelines.

---

## Known Issues

1. **ID-001** - **Severity:** High  
   **Summary:** White-screen on load, console errors cascade from Navigation, ComplaintForm, and ComplaintList components  
   **Reproduction Steps:**  
   1. Start the development server  
   2. Navigate to http://localhost:3000  
   3. Observe white screen and console errors  
   **Expected vs Actual:** Expected: Application loads normally. Actual: White screen with console errors  
   **Environment:** All browsers, development mode  
   **Assignee:** Unassigned  
   **Status:** Open  
   **Root Cause:** useLanguage hook invoked outside LanguageProvider  
   **Stack Trace:**  
   ```
   chunk-PJEEZAML.js?v=9a7831e9:14032 The above error occurred in the <Navigation> component:
   at Navigation (http://localhost:3000/src/components/Navigation/Navigation.tsx:24:20)
   at div
   at Router (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=9a7831e9:6131:13)
   at BrowserRouter (http://localhost:3000/node_modules/.vite/deps/react-router-dom.js?v=9a7831e9:9149:3)
   at App
   Similar errors repeat for ComplaintForm and ComplaintList.
   Final uncaught error: useLanguage must be used within a LanguageProvider
   at useLanguage (LanguageContext.tsx:51:11)
   at Navigation (Navigation.tsx:9:17)
   ```

2. **ID-002** - **Severity:** Low  
   **Summary:** Tooltip icon misaligned  
   **Reproduction Steps:**  
   1. Go to home page  
   2. Look at tooltip icons  
   **Expected Behavior:** Tooltip icons should be properly aligned with labels  
   **Actual Behavior:** Tooltip icons appear slightly misaligned  
   **Environment:** Browser  
   **Assignee:** Kilo code  
   **Status:** Open

3. **ID-002** - **Severity:** Low  
   **Summary:** Duplicate titles for fields part number and company number
   **Reproduction Steps:**  
   1. Go to home page  
   2. Look at tooltip icons  
   **Expected Behavior:** Only one label per field should be there
   **Actual Behavior:** Two label per field for part number and company number
   **Environment:** Browser  
   **Assignee:** Kilo code  
   **Status:** Open

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