# Deployment Guide

## Frontend (Vercel)
The frontend is built with Vite and React.
- Connected via GitHub integration to Vercel.
- Environment variables: `VITE_API_URL`, `VITE_WS_URL`.

## Backend (Render)
The backend is a FastAPI app deployed on Render as a Web Service.
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set all environment variables (Database URL, JWT Secret, etc.) in the Render dashboard.

## Database (Supabase)
PostgreSQL provided by Supabase.
- Ensure the connection string uses `postgresql://` instead of `postgres://` (handled in `db.py`).
