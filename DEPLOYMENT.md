# Vercel Deployment Guide

## Project Structure

This project uses a monorepo structure:
- `frontend/` - React (Vite) application
- `backend/` - FastAPI Python backend

---

## Option 1: Frontend Only on Vercel + Backend on Railway (Recommended)

This is the **recommended** approach for production.

### Step 1: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Set up the backend:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. Add Environment Variables in Railway:
   ```
   JWT_SECRET_KEY=your-super-secret-key-minimum-32-characters-here
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION_HOURS=24
   GEMINI_API_KEY=your-gemini-api-key
   DATABASE_URL=sqlite:///./data.db
   ```

6. Copy your Railway backend URL (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

6. Click "Deploy"

---

## Option 2: Full Stack on Vercel (Serverless)

⚠️ **Note:** This has limitations - SQLite won't persist, and cold starts may occur.

### Setup

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Configure:
   - **Root Directory:** (leave empty - monorepo)
   - Build and Output settings will be auto-detected from `vercel.json`

4. Add Environment Variables:
   ```
   JWT_SECRET_KEY=your-super-secret-key-minimum-32-characters-here
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION_HOURS=24
   GEMINI_API_KEY=your-gemini-api-key
   VITE_API_URL=/api
   ```

5. Click "Deploy"

---

## Important Security Notes

### JWT Secret Key
Generate a secure random key:
```bash
openssl rand -hex 32
```
Use this output as your `JWT_SECRET_KEY`.

### GEMINI API Key
Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## Environment Variables Summary

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_API_URL` | Vercel (Frontend) | Backend API URL |
| `JWT_SECRET_KEY` | Railway/Vercel (Backend) | Secret for JWT signing |
| `JWT_ALGORITHM` | Railway/Vercel (Backend) | `HS256` |
| `JWT_EXPIRATION_HOURS` | Railway/Vercel (Backend) | Token expiration (e.g., `24`) |
| `GEMINI_API_KEY` | Railway/Vercel (Backend) | Google Gemini API key |
| `DATABASE_URL` | Railway (Backend) | Database connection string |

---

## Testing Locally Before Deploy

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## After Deployment Checklist

- [ ] Test user registration
- [ ] Test user login
- [ ] Test file upload
- [ ] Test AI query
- [ ] Test dashboard creation
- [ ] Verify JWT tokens work correctly
