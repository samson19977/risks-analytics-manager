# AB Rwanda Risk Analytics Platform

> **Live Demo:** [risks-analytics-manager.vercel.app](https://risks-analytics-manager.vercel.app)

Advanced Risk Analytics & AI-Powered Decision Intelligence for AB Rwanda PLC — a microfinance institution managing loan portfolios across Rwanda.

---

## Screenshots

| Dashboard | Risk Alerts | Fraud Detection |
|---|---|---|
| Portfolio KPIs, PAR trends, branch network | Auto-generated alerts from live loan data | Anomaly detection across disbursements |

---

## Features

- 📊 **Portfolio Dashboard** — Real-time KPIs: PAR>30, NPL ratio, write-offs, active clients
- 🏦 **Branch Analytics** — Per-branch performance, PAR rates, loan officer rankings
- 👥 **Client Risk Profiles** — Risk scoring, high-risk client identification
- ⚠️ **Risk Alerts** — Auto-generated from live loan data (PAR>90, NPL breaches, sector concentration)
- 🧪 **Stress Testing** — Simulate recession, currency crisis, agricultural shock scenarios
- 🕵️ **Fraud Detection** — Detect multiple active loans, month-end spikes, officer PAR anomalies
- 🤖 **AI Insights** — Claude-powered portfolio analysis and recommendations
- 📈 **Portfolio Analytics** — Sector concentration, PAR aging, repayment patterns

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Recharts |
| Database | Supabase (PostgreSQL) |
| API Routes | Next.js API Routes (direct Supabase queries — no separate backend needed) |
| AI | Anthropic Claude API |
| Auth | JWT (demo users built-in) |
| Deployment | Vercel |

---

## Project Structure

```
risks-analytics-manager/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/                   # Next.js API routes (Supabase-backed)
│   │   │   │   ├── auth/              # login, me
│   │   │   │   ├── portfolio/         # summary, sector-concentration
│   │   │   │   ├── branches/          # list with enriched stats
│   │   │   │   ├── clients/           # list, high-risk, [id]
│   │   │   │   ├── alerts/            # auto-generated from loan data
│   │   │   │   ├── analytics/         # risk-heatmap, loan-officer-performance
│   │   │   │   ├── reports/           # executive-summary, branch-performance
│   │   │   │   ├── fraud/             # signals, summary, scan
│   │   │   │   ├── stress-test/       # run, predefined-scenarios, history
│   │   │   │   └── ai/                # analyze, quick-insights, history
│   │   │   ├── dashboard/page.js
│   │   │   ├── branches/page.js
│   │   │   ├── clients/page.js
│   │   │   ├── alerts/page.js
│   │   │   ├── analytics/page.js
│   │   │   ├── stress-test/page.js
│   │   │   ├── fraud/page.js
│   │   │   ├── ai-insights/page.js
│   │   │   └── login/page.js
│   │   ├── components/layout/
│   │   │   └── DashboardLayout.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   └── lib/
│   │       ├── api.js                 # Axios client
│   │       └── supabase.js            # Supabase REST helper
│   ├── next.config.js
│   ├── package.json
│   └── .env.local                     # ← your credentials go here
└── README.md
```

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/samson19977/risks-analytics-manager.git
cd risks-analytics-manager/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create `frontend/.env.local`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_KEY=your_supabase_anon_key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Login

| Email | Role |
|---|---|
| `admin@abrwanda.rw` | Admin |
| `risk@abrwanda.com` | Risk Manager |
| `analyst@abrwanda.com` | Portfolio Analyst |
| `branch@abrwanda.com` | Branch Manager |

> No password needed — demo auth is built in.

---

## Deploying to Vercel

### 1. Push to GitHub
```bash
git add .
git commit -m "your message"
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select `risks-analytics-manager`
3. Set **Root Directory** to `frontend`

### 3. Add environment variables in Vercel

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `SUPABASE_KEY` | Supabase anon key |
| `ANTHROPIC_API_KEY` | *(optional)* Anthropic Claude API key — enables AI analysis |

### 4. Deploy
Click **Deploy** — Vercel auto-deploys on every push to `main`.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Service role key (server-side only) |
| `SUPABASE_KEY` | ✅ | Anon/publishable key |
| `ANTHROPIC_API_KEY` | ⚪ Optional | Enables Claude AI analysis. Falls back to rule-based insights if not set. |

---

## Architecture

This project runs entirely on **Next.js + Supabase** with no separate backend server required.

```
Browser → Next.js (Vercel) → Supabase (PostgreSQL)
                           ↘ Anthropic API (AI insights)
```

All `/api/*` routes are Next.js API route handlers that query Supabase directly via the REST API using the service key. Risk alerts and fraud signals are computed dynamically from loan and client data — no pre-seeding of alert tables required.

---

## License

MIT © AB Rwanda Risk Platform
