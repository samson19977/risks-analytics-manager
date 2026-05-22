# AB Rwanda Risk Analytics Platform v3

Advanced Risk Analytics & AI-Powered Decision Intelligence for AB Rwanda PLC.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Recharts |
| Backend | FastAPI (Python 3.11+) |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API |
| Auth | JWT + bcrypt |

## Project Structure

```
Risks_Analytics_Manager/
├── backend/                 # FastAPI backend
│   ├── main.py              # App entry point
│   ├── config.py            # Settings & Supabase client
│   ├── schema.sql           # Database schema (run in Supabase)
│   ├── seed.py              # Seed demo data
│   ├── requirements.txt
│   ├── .env.example         # → copy to .env and fill in
│   └── routers/
│       ├── auth.py
│       ├── portfolio.py
│       ├── clients.py
│       ├── branches.py
│       ├── alerts.py
│       ├── analytics.py
│       ├── ai_insights.py
│       ├── stress_test.py
│       ├── fraud.py
│       └── reports.py
│
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js
│   │   │   ├── page.js
│   │   │   ├── providers.js
│   │   │   └── globals.css
│   │   ├── components/layout/
│   │   │   └── DashboardLayout.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   └── lib/
│   │       └── api.js
│   ├── package.json
│   ├── next.config.js
│   ├── jsconfig.json
│   ├── tailwind.config.js
│   └── .env.example         # → copy to .env.local and fill in
│
└── README.md
```

## Quick Start (Local Development)

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Go to **SQL Editor** → paste and run `backend/schema.sql`
3. Copy your **Project URL**, **anon key**, and **service_role key** from Settings → API

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # Windows
# cp .env.example .env       # Mac/Linux
# Edit .env with your Supabase & Anthropic keys

# Seed demo data (optional but recommended)
python seed.py

# Start server
uvicorn main:app --reload --port 8000
```
Backend runs at: http://localhost:8000  
API docs at: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.example .env.local   ## Windows
# cp .env.example .env.local   # Mac/Linux
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000

# Start dev server
npm run dev
```
Frontend runs at: http://localhost:3000

### Default Login (after seeding)
- **Email:** `admin@abrwanda.rw`
- **Password:** `Admin@2024`

---

## Deployment

### Option A — Railway (Recommended, free tier available)
See DEPLOY.md for full step-by-step instructions.

### Option B — Render
See DEPLOY.md.

### Option C — VPS / Ubuntu Server
See DEPLOY.md.

---

## Environment Variables

### Backend `.env`
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `JWT_SECRET` | Random secret for JWT signing |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |

### Frontend `.env.local`
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of your deployed backend |

