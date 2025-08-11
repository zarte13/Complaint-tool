## Frontend

### Tech Stack
- React + TypeScript (Vite)
- Tailwind CSS
- Zustand for auth state
- Axios with retry/backoff and offline queue for mutations

### Key Components
- Navigation, LanguageToggle, ErrorBoundary
- ComplaintForm (intake): CompanySearch, PartAutocomplete
- ComplaintDetailDrawer (view/edit) with inline editing and validations
- FileUpload (attachments)
- DashboardPage (EvilCharts-styled charts)

### Offline Mode
- `public/sw.js` — caches app shell and GET API responses
- `services/api.ts` — queues POST/PUT/DELETE to IndexedDB when offline
- Background Sync tag: `sync-offline-requests`

### Build & Host
```
cd complaint-system/frontend
npm run build
npx serve -s dist -l 3000
```
Set `VITE_API_BASE_URL` before building to point to your backend.


