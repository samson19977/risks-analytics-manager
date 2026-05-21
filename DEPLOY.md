# Deployment Guide — AB Rwanda Risk Analytics Platform

## Prerequisites
- GitHub account
- Supabase account (free tier works)
- Railway or Render account (free tier available)
- Anthropic API key

---

## Step 1: Push to GitHub

### First time setup
```bash
# On your Windows machine, open terminal in C:\Users\Francis Musoke\Downloads\Risks_Analytics_Manager

git init
git add .
git commit -m "Initial commit: AB Rwanda Risk Analytics Platform v3"

# Create a new repo on github.com (name it: risks-analytics-manager)
# Then connect:
git remote add origin https://github.com/YOUR_USERNAME/risks-analytics-manager.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your `risks-analytics-manager` repo
3. Set **Root Directory** to `backend`
4. Railway auto-detects Python. Add a `Procfile` (already included):
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. Add Environment Variables in Railway dashboard:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   JWT_SECRET=generate-a-long-random-string-here
   ANTHROPIC_API_KEY=sk-ant-xxxxxx
   ```
6. Deploy → copy the generated URL (e.g. `https://risks-backend-production.up.railway.app`)

---

## Step 3: Deploy Frontend on Vercel (Recommended for Next.js)

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select your repo
3. Set **Root Directory** to `frontend`
4. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://risks-backend-production.up.railway.app
   ```
5. Click Deploy → Your frontend is live!

---

## Step 4: Update CORS (Backend)

After deployment, update `backend/main.py` CORS to only allow your frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Push the change → Railway redeploys automatically.

---

## Alternative: Deploy Backend on Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect GitHub repo, set root to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add same environment variables as above

---

## Alternative: Ubuntu VPS Deployment

```bash
# On your VPS (Ubuntu 22.04)
sudo apt update && sudo apt install python3.11 python3.11-venv nodejs npm nginx -y

# Clone your repo
git clone https://github.com/YOUR_USERNAME/risks-analytics-manager.git
cd risks-analytics-manager

# Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
nano .env  # fill in your values

# Run with systemd (production)
sudo nano /etc/systemd/system/risk-backend.service
```

Paste:
```ini
[Unit]
Description=AB Rwanda Risk Analytics Backend
After=network.target

[Service]
WorkingDirectory=/root/risks-analytics-manager/backend
ExecStart=/root/risks-analytics-manager/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
User=root

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable risk-backend
sudo systemctl start risk-backend

# Frontend build
cd ../frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:8000" > .env.local
npm run build
npm start  # or configure nginx to serve it
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| CORS error in browser | Check `allow_origins` in `main.py` includes your frontend URL |
| 401 Unauthorized | Make sure `JWT_SECRET` is same in .env |
| Supabase connection error | Double-check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` |
| Frontend can't reach backend | Check `NEXT_PUBLIC_API_URL` in Vercel env vars |
| `branches` router missing | Already fixed — `routers/branches.py` now included |
