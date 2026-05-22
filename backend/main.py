from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, portfolio, clients, branches, alerts, analytics, ai_insights, stress_test, fraud, reports
from routers import import as import_router

app = FastAPI(
    title="AB Rwanda Risk Analytics Platform",
    description="Advanced Risk Analytics & AI-Powered Decision Intelligence for AB Rwanda PLC",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])
app.include_router(branches.router, prefix="/api/branches", tags=["Branches"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ai_insights.router, prefix="/api/ai", tags=["AI Insights"])
app.include_router(stress_test.router, prefix="/api/stress-test", tags=["Stress Testing"])
app.include_router(fraud.router, prefix="/api/fraud", tags=["Fraud Detection"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(import_router.router, prefix="/api/import", tags=["Data Import"])

@app.get("/")
async def root():
    return {
        "platform": "AB Rwanda Risk Analytics Platform v3",
        "status": "operational",
        "modules": ["Portfolio Risk", "Branch Analytics", "AI Insights", "Stress Testing", "Fraud Detection", "Reports", "Data Import"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
