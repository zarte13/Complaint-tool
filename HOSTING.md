## Local Production-like Hosting Guide (PowerShell + npx serve)

This guide shows how to build the frontend for production, serve the static files locally with `npx serve`, and point the app to a running backend API. Commands use PowerShell syntax (Windows).

### 1) Start the backend API (prod-like)

Run FastAPI with Uvicorn on port 8000.

```powershell
cd complaint-system/backend
$env:ENV = 'prod'
$env:JWT_SECRET = 'change-me'
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Notes:
- Ensure the DB files exist in `complaint-system/backend/database/`.
- CORS in `backend/main.py` currently allows `http://localhost:3000` and `http://localhost:5173` (dev). For production-like local hosting via an IP (e.g., `http://192.168.1.42:3000`), either access by `http://localhost:3000`, or temporarily extend `allow_origins` to include your LAN URL for testing.

### 2) Build the frontend for production

The build outputs static files to `complaint-system/frontend/dist`.

```powershell
cd ..\frontend
$env:VITE_API_BASE_URL = 'http://127.0.0.1:8000'
npm ci --no-audit --no-fund
npm run build
```

Why set `VITE_API_BASE_URL`?
- The frontend uses this to call the backend. If not set, it defaults to `http://127.0.0.1:8000` anyway, but it’s best to be explicit for production tests.

### 3) Serve the built frontend with npx serve

Serve the `dist` folder. Pick a port (3000 below):

```powershell
npx serve -s dist -l 3000
```

You’ll see an output with local and network URLs, such as:
- Local: `http://localhost:3000`
- On Your Network: `http://192.168.1.42:3000`

Use the Local URL for the safest CORS behavior unless you update backend CORS to include your LAN URL.

### 4) Verify service worker path

`public/sw.js` is built/copied to the site root. With `npx serve -s dist`, it will be available at `/sw.js`. This is required for offline mode.

### 5) Common issues and fixes

- Problem: “Offline mode” shows when using the network URL (e.g., `http://192.168.1.42:3000`).
  - Cause: CORS or mixed base URLs. The backend allows only certain origins by default.
  - Fix: Access via `http://localhost:3000` OR update backend CORS to include your LAN URL for testing:
    - In `complaint-system/backend/main.py`, add your LAN origin: `http://192.168.1.42:3000` to `allow_origins` and restart the backend.

- Problem: TypeError Cannot read properties of undefined (reading 'map') on Dashboard.
  - Cause: The dashboard expected data arrays but got `undefined` (e.g., backend unreachable or empty response).
  - Fix: This has been hardened in code to guard null/undefined. Ensure the backend is reachable at `VITE_API_BASE_URL`. If using the network URL, also apply the CORS fix above.

- Problem: Frontend calls go to the wrong origin (e.g., your static server instead of the backend).
  - Fix: Always build with `VITE_API_BASE_URL` pointing to the backend:
    ```powershell
    cd complaint-system/frontend
    $env:VITE_API_BASE_URL = 'http://127.0.0.1:8000'
    npm run build
    npx serve -s dist -l 3000
    ```

- Problem: Using external IP for the frontend but backend still on 127.0.0.1.
  - Fix: Keep `VITE_API_BASE_URL` as `http://127.0.0.1:8000` when testing on the same machine. If testing from another device on the LAN, set `VITE_API_BASE_URL` to your host’s LAN IP (e.g., `http://192.168.1.42:8000`) and update backend CORS to include that frontend origin (e.g., `http://192.168.1.42:3000`). Rebuild after changing.

### 6) End-to-end local test checklist

1. Backend running and reachable:
   - `curl http://127.0.0.1:8000/health` should return JSON status.
2. Frontend built with correct API base:
   - `set VITE_API_BASE_URL` before `npm run build`.
3. Serve `dist`:
   - `npx serve -s dist -l 3000`.
4. Open `http://localhost:3000` in browser and navigate around (Dashboard, Complaints, etc.).
5. If you must use the network URL, update backend CORS to include your LAN origin, rebuild if you changed `VITE_API_BASE_URL`, then retest.

### 7) Optional: run both on LAN for another device

- Backend:
  ```powershell
  cd complaint-system/backend
  $env:ENV = 'prod'
  $env:JWT_SECRET = 'change-me'
  python -m uvicorn main:app --host 0.0.0.0 --port 8000
  ```
- Frontend build:
  ```powershell
  cd ..\frontend
  $env:VITE_API_BASE_URL = 'http://<YOUR_LAN_IP>:8000'
  npm run build
  npx serve -s dist -l 3000
  ```
- Backend CORS: include `http://<YOUR_LAN_IP>:3000` in `allow_origins` during testing.


