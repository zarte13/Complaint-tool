# Complaint Management System

A simple web app for tracking part-order complaints with file attachments.

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

## What You Can Do

- **Submit complaints** with title, description, severity
- **Search companies** and parts with auto-complete
- **Upload files** (images, PDFs, text) up to 10MB
- **View all complaints** in real-time

## Tech Stack

- **Backend**: FastAPI + SQLite
- **Frontend**: React + TypeScript + Tailwind CSS
- **File Storage**: Local filesystem

## Development

Backend runs on http://localhost:8000  
Frontend runs on http://localhost:5173

## Troubleshooting

- Port in use? Check `ARCHITECTURE.md` for fixes
- Missing dependencies? Run install commands again
- Database issues? Delete `complaints.db` and run `python init_db.py`

## Project Structure
```
complaint-system/
├── backend/          # FastAPI server
├── frontend/         # React app
├── uploads/          # File storage
└── README.md         # This file