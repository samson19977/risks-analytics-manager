-- AB Rwanda Risk Analytics Platform v3 - Supabase Schema
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users / Staff
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'analyst',
    branch_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Branches
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    province TEXT NOT NULL,
    district TEXT NOT NULL,
    manager_name TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    national_id TEXT,
    phone TEXT,
    email TEXT,
    gender TEXT,
    date_of_birth DATE,
    province TEXT,
    district TEXT,
    sector TEXT,
    branch_id UUID REFERENCES branches(id),
    client_segment TEXT,
    business_type TEXT,
    registration_date DATE DEFAULT CURRENT_DATE,
    risk_score NUMERIC(5,2) DEFAULT 50.0,
    risk_category TEXT DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loan Products
CREATE TABLE IF NOT EXISTS loan_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    min_amount NUMERIC(15,2),
    max_amount NUMERIC(15,2),
    min_term_months INT,
    max_term_months INT,
    interest_rate NUMERIC(5,2),
    is_active BOOLEAN DEFAULT TRUE
);

-- Loans
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_number TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id),
    branch_id UUID REFERENCES branches(id),
    product_id UUID REFERENCES loan_products(id),
    loan_officer TEXT,
    disbursement_date DATE,
    maturity_date DATE,
    principal_amount NUMERIC(15,2) NOT NULL,
    outstanding_balance NUMERIC(15,2),
    interest_rate NUMERIC(5,2),
    term_months INT,
    status TEXT DEFAULT 'active',
    par_days INT DEFAULT 0,
    days_past_due INT DEFAULT 0,
    restructured BOOLEAN DEFAULT FALSE,
    restructure_count INT DEFAULT 0,
    write_off_amount NUMERIC(15,2) DEFAULT 0,
    sector TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id),
    client_id UUID REFERENCES clients(id),
    branch_id UUID REFERENCES branches(id),
    payment_date DATE NOT NULL,
    scheduled_date DATE,
    amount_due NUMERIC(15,2),
    amount_paid NUMERIC(15,2) NOT NULL,
    principal_paid NUMERIC(15,2),
    interest_paid NUMERIC(15,2),
    penalty_paid NUMERIC(15,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    is_late BOOLEAN DEFAULT FALSE,
    days_late INT DEFAULT 0,
    reference TEXT,
    recorded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Snapshots
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_date DATE NOT NULL,
    branch_id UUID REFERENCES branches(id),
    sector TEXT,
    gross_loan_portfolio NUMERIC(15,2),
    active_loans INT,
    active_clients INT,
    disbursements NUMERIC(15,2),
    par_30 NUMERIC(5,2),
    par_60 NUMERIC(5,2),
    par_90 NUMERIC(5,2),
    npl_ratio NUMERIC(5,2),
    write_offs NUMERIC(15,2),
    restructured_loans_pct NUMERIC(5,2),
    repeat_borrower_rate NUMERIC(5,2),
    avg_loan_size NUMERIC(15,2),
    collection_rate NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Alerts
CREATE TABLE IF NOT EXISTS risk_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    branch_id UUID REFERENCES branches(id),
    client_id UUID REFERENCES clients(id),
    loan_id UUID REFERENCES loans(id),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context TEXT NOT NULL,
    prompt_summary TEXT,
    recommendation TEXT NOT NULL,
    confidence_score NUMERIC(3,2),
    branch_id UUID REFERENCES branches(id),
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stress Test Results
CREATE TABLE IF NOT EXISTS stress_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_name TEXT NOT NULL,
    scenario_type TEXT NOT NULL,
    parameters JSONB,
    results JSONB,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fraud Signals
CREATE TABLE IF NOT EXISTS fraud_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    signal_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT,
    loan_id UUID REFERENCES loans(id),
    client_id UUID REFERENCES clients(id),
    branch_id UUID REFERENCES branches(id),
    loan_officer TEXT,
    is_investigated BOOLEAN DEFAULT FALSE,
    investigation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_email TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans(client_id);
CREATE INDEX IF NOT EXISTS idx_loans_branch_id ON loans(branch_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_par_days ON loans(par_days);
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_clients_branch_id ON clients(branch_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_severity ON risk_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_fraud_signals_branch ON fraud_signals(branch_id);
