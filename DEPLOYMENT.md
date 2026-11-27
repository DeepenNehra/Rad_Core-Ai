# MEDIVISTA AI — Backend, Database & Vercel Connection Guide

Your frontend is on **Vercel** (`frontend/`). Below is how to deploy the **FastAPI Backend** + **Persistent PostgreSQL Database** and connect them cleanly.

---

## 1. Persistent Database (PostgreSQL — Free Tier)

> **Why PostgreSQL in Cloud?** On free cloud hosts (Render/Railway), local SQLite files reset whenever the container restarts. Setting `DATABASE_URL` automatically switches SQLAlchemy from SQLite to PostgreSQL so all studies and clinician accounts persist permanently.

Option A — **Render Managed Postgres** (Automatic if using `render.yaml` Blueprint below)  
Option B — **Neon.tech** or **Supabase** (Free Serverless Postgres):
1. Create a project on [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com).
2. Copy the PostgreSQL connection string:
   ```text
   postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require
   ```

---

## 2. Deploy Backend (Option A: Render — Recommended, 1-Click Blueprint)

This repo includes `render.yaml` and `backend/Dockerfile`:
1. Push this repo to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint**.
3. Connect `DeepenNehra/Rad_Core-Ai`. Render detects `render.yaml` and provisions both:
   - `medivista-ai-backend` (Dockerized FastAPI server with CPU PyTorch)
   - `medivista-postgres` (Managed PostgreSQL database wired automatically via `DATABASE_URL`)
4. Once deployed, copy your backend URL (e.g. `https://medivista-ai-backend.onrender.com`) and verify:
   - `https://medivista-ai-backend.onrender.com/api/v1/health`

*(Optional)* Add `FRONTEND_URL` in Render Environment Variables set to your Vercel URL (e.g. `https://rad-core-ai.vercel.app`). Note that `*.vercel.app` origins are already allowed automatically via `allow_origin_regex` in `backend/main.py`.

---

## 2. Deploy Backend (Option B: Railway CLI)

This repo includes `railway.toml` and `backend/Dockerfile`:
```powershell
railway login
railway init
railway add --database postgres
railway up
```
Then generate a public domain in Railway Settings → Networking and copy the URL.

---

## 3. Connect Your Vercel Frontend to the Live Backend

1. Open your project in **Vercel Dashboard** → **Settings** → **Environment Variables**.
2. Add:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://your-backend-url.onrender.com` *(no trailing slash)*
3. Trigger a **Redeploy** in Vercel (or push to `main` so Vercel builds automatically).
4. Verify:
   - Header badge turns green: `Engine Online (POSTGRESQL)`
   - Click **Case History** → JWT Login gate appears (`dr.nehra` / `doctor123` auto-seeded!)
   - Run an analysis → refresh **Case History** → data persists in PostgreSQL!
