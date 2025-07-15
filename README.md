# Complaint Management System

A simple web app for tracking part-order complaints with analytics dashboard.

## Quick Start

### 1. Setup Backend
```bash
cd complaint-system/backend
pip install -r requirements.txt
python init_db.py
python main.py
```

### 2. Setup Frontend
```bash
cd complaint-system/frontend
npm install
npm run dev
```

### 3. Open Browser
Visit http://localhost:3000

## What's New

### 📊 Command Center Dashboard
- **RAR Metrics**: Real-time Return, Authorization, and Rejection rates
- **Live Charts**: Sparklines update every 30 seconds
- **Top Issues**: See the 3 most common failure modes
- **Navigate**: Click "Dashboard" in the top menu

### 🧪 Testing Suite
- **Unit Tests**: 90%+ coverage with Vitest
- **E2E Tests**: Playwright browser automation
- **Run Tests**: `npm test` or `npm run test:e2e`

## What You Can Do

- **Submit complaints** with title, description, severity
- **Search companies** and parts with auto-complete
- **Upload files** (images, PDFs, text) up to 10MB
- **View all complaints** in real-time
- **Analyze trends** in the dashboard

## Tech Stack

- **Backend**: FastAPI + SQLite
- **Frontend**: React + TypeScript + Tailwind CSS
- **Charts**: Recharts for real-time analytics
- **File Storage**: Local filesystem
- **Testing**: Vitest + Playwright

## Development

Backend runs on http://localhost:8000  
Frontend runs on http://localhost:5173

## Troubleshooting

- Port in use? Check `ARCHITECTURE.md` for fixes
- Missing dependencies? Run install commands again
- Database issues? Delete `complaints.db` and run `python init_db.py`
- Tests failing? Ensure backend is running for E2E tests

## Project Structure
```
complaint-system/
├── backend/          # FastAPI server
├── frontend/         # React app
└── uploads/          # File storage
README.md         # This file