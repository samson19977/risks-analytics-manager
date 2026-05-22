'use client'
import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { api, formatRWF, formatPct } from '@/lib/api'
import {
  FileText, TrendingUp, TrendingDown, BarChart2, Building2,
  Upload, Download, CheckCircle, AlertCircle, X, Table, Info,
} from 'lucide-react'

// ── Sample data ───────────────────────────────────────────────────────────────
const SAMPLE_EXEC = {
  portfolio_overview: { gross_loan_portfolio: 4_820_000_000, active_loans: 3_412, active_clients: 2_987, branches: 8 },
  risk_metrics: { par30_pct: 8.4, par30_amount: 404_880_000, npl_pct: 3.2, write_offs: 96_400_000 },
  trend_summary: { par30_q1: 6.1, par30_q3: 8.4, npl_q1: 2.1, npl_q3: 3.2, writeoff_q1: 54_000_000, writeoff_q3: 96_400_000 },
}
const SAMPLE_BRANCH = [
  { branch: 'Kigali Central', province: 'Kigali City', total_loans: 980, total_outstanding: 1_420_000_000, par30_rate: 6.2, npl_rate: 2.4, total_clients: 843, risk_level: 'medium' },
  { branch: 'Musanze Branch', province: 'Northern', total_loans: 512, total_outstanding: 680_000_000, par30_rate: 12.8, npl_rate: 4.7, total_clients: 448, risk_level: 'high' },
  { branch: 'Huye Branch', province: 'Southern', total_loans: 430, total_outstanding: 520_000_000, par30_rate: 9.1, npl_rate: 3.1, total_clients: 376, risk_level: 'medium' },
  { branch: 'Rubavu Branch', province: 'Western', total_loans: 390, total_outstanding: 490_000_000, par30_rate: 7.6, npl_rate: 2.9, total_clients: 341, risk_level: 'medium' },
  { branch: 'Nyagatare Branch', province: 'Eastern', total_loans: 360, total_outstanding: 430_000_000, par30_rate: 15.3, npl_rate: 6.8, total_clients: 312, risk_level: 'critical' },
  { branch: 'Rwamagana Branch', province: 'Eastern', total_loans: 280, total_outstanding: 330_000_000, par30_rate: 5.8, npl_rate: 2.1, total_clients: 244, risk_level: 'low' },
  { branch: 'Muhanga Branch', province: 'Southern', total_loans: 250, total_outstanding: 260_000_000, par30_rate: 6.9, npl_rate: 2.6, total_clients: 218, risk_level: 'medium' },
  { branch: 'Rusizi Branch', province: 'Western', total_loans: 210, total_outstanding: 220_000_000, par30_rate: 8.2, npl_rate: 3.0, total_clients: 205, risk_level: 'medium' },
]

// ── CSV download helpers ──────────────────────────────────────────────────────
function toCSV(headers, rows) {
  const escape = v => (v == null ? '' : String(v).includes(',') ? `"${v}"` : String(v))
  return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
}
function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Upload format reference ───────────────────────────────────────────────────
const UPLOAD_FORMATS = [
  {
    title: 'Loan Portfolio CSV',
    file: 'loans.csv',
    description: 'Upload current loan data for portfolio metrics',
    required: true,
    columns: [
      { name: 'loan_id', type: 'string', example: 'LN-2024-001', desc: 'Unique loan identifier' },
      { name: 'client_id', type: 'string', example: 'CL-1234', desc: 'Client reference' },
      { name: 'branch_id', type: 'string', example: 'BR-KGL', desc: 'Branch code' },
      { name: 'disbursed_amount', type: 'number', example: '500000', desc: 'RWF disbursed' },
      { name: 'outstanding_balance', type: 'number', example: '420000', desc: 'Current balance (RWF)' },
      { name: 'par_days', type: 'integer', example: '45', desc: 'Days past due (0 if current)' },
      { name: 'status', type: 'enum', example: 'active | npl | written_off', desc: 'Loan status' },
      { name: 'disbursement_date', type: 'date', example: '2024-01-15', desc: 'YYYY-MM-DD format' },
    ],
  },
  {
    title: 'Client Data CSV',
    file: 'clients.csv',
    description: 'Client master data for risk classification',
    required: true,
    columns: [
      { name: 'client_id', type: 'string', example: 'CL-1234', desc: 'Unique identifier' },
      { name: 'full_name', type: 'string', example: 'Jean Mutabazi', desc: 'Client full name' },
      { name: 'national_id', type: 'string', example: '1199880012345678', desc: '16-digit Rwanda NID' },
      { name: 'branch_id', type: 'string', example: 'BR-KGL', desc: 'Assigned branch' },
      { name: 'risk_category', type: 'enum', example: 'low | medium | high | critical', desc: 'Risk tier' },
      { name: 'is_active', type: 'boolean', example: 'true', desc: 'Active status' },
    ],
  },
  {
    title: 'Branch Performance CSV',
    file: 'branches.csv',
    description: 'Branch-level aggregated metrics',
    required: false,
    columns: [
      { name: 'branch', type: 'string', example: 'Kigali Central', desc: 'Branch name' },
      { name: 'province', type: 'string', example: 'Kigali City', desc: 'Province' },
      { name: 'total_loans', type: 'integer', example: '980', desc: 'Active loan count' },
      { name: 'total_outstanding', type: 'number', example: '1420000000', desc: 'Total portfolio (RWF)' },
      { name: 'par30_rate', type: 'number', example: '6.2', desc: 'PAR >30 percentage' },
      { name: 'npl_rate', type: 'number', example: '2.4', desc: 'NPL percentage' },
      { name: 'total_clients', type: 'integer', example: '843', desc: 'Active client count' },
      { name: 'risk_level', type: 'enum', example: 'low | medium | high | critical', desc: 'Branch risk tier' },
    ],
  },
]

function StatRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-2)', fontSize: 13 }}>
      <span style={{ color: 'var(--text-3)' }}>{label}</span>
      <span style={{ color: highlight || 'var(--text)', fontWeight: 600 }}>{value ?? '—'}</span>
    </div>
  )
}

function TypeBadge({ type }) {
  const colors = { string: '#3b82f6', number: '#10b981', integer: '#10b981', date: '#8b5cf6', boolean: '#f59e0b', enum: '#ec4899' }
  return (
    <span style={{ padding: '1px 7px', borderRadius: 10, background: `${colors[type] || '#6b7280'}22`, color: colors[type] || '#6b7280', fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }}>
      {type}
    </span>
  )
}

// ── Upload panel ──────────────────────────────────────────────────────────────
function UploadPanel({ onData }) {
  const [uploads, setUploads] = useState({})
  const [errors, setErrors] = useState({})
  const refs = { 'loans.csv': useRef(), 'clients.csv': useRef(), 'branches.csv': useRef() }

  const handleFile = (key, file) => {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setErrors(e => ({ ...e, [key]: 'Only .csv files are accepted.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const rows = lines.slice(1).map(l => {
        const vals = l.split(',')
        return headers.reduce((obj, h, i) => { obj[h] = vals[i]?.trim() ?? ''; return obj }, {})
      })
      setUploads(u => ({ ...u, [key]: { name: file.name, rows, headers } }))
      setErrors(e => ({ ...e, [key]: null }))
      if (onData) onData(key, rows)
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {UPLOAD_FORMATS.map(fmt => {
        const up = uploads[fmt.file]
        const err = errors[fmt.file]
        return (
          <div key={fmt.file} style={{ padding: 16, background: 'var(--bg-3)', borderRadius: 10, border: `1px solid ${up ? 'rgba(16,185,129,0.3)' : err ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{fmt.title}</span>
                  {fmt.required && <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(37,99,235,0.15)', color: '#3b82f6', borderRadius: 8, fontWeight: 600 }}>required</span>}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{fmt.description}</p>
                {up && <p style={{ fontSize: 11, color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={11} /> {up.name} — {up.rows.length} rows loaded</p>}
                {err && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} /> {err}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <input ref={refs[fmt.file]} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(fmt.file, e.target.files[0])} />
                <button onClick={() => refs[fmt.file].current?.click()} style={{
                  padding: '7px 14px', background: up ? 'rgba(16,185,129,0.12)' : 'rgba(37,99,235,0.12)',
                  border: `1px solid ${up ? 'rgba(16,185,129,0.3)' : 'rgba(37,99,235,0.3)'}`,
                  borderRadius: 7, color: up ? '#10b981' : '#3b82f6',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {up ? <><CheckCircle size={12} /> Re-upload</> : <><Upload size={12} /> Choose file</>}
                </button>
              </div>
            </div>

            {/* Format guide */}
            <details style={{ marginTop: 12 }}>
              <summary style={{ fontSize: 11, color: '#3b82f6', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={11} /> View required columns for {fmt.file}
              </summary>
              <div style={{ marginTop: 10, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      {['Column', 'Type', 'Example', 'Description'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--border-2)', color: 'var(--text-3)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fmt.columns.map(col => (
                      <tr key={col.name}>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>{col.name}</td>
                        <td style={{ padding: '5px 8px' }}><TypeBadge type={col.type} /></td>
                        <td style={{ padding: '5px 8px', fontFamily: 'monospace', color: 'var(--text-2)', fontSize: 10 }}>{col.example}</td>
                        <td style={{ padding: '5px 8px', color: 'var(--text-3)' }}>{col.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('summary')
  const [uploadedData, setUploadedData] = useState({})

  const { data: execRaw, isLoading } = useQuery({
    queryKey: ['exec-summary'],
    queryFn: () => api.get('/api/reports/executive-summary').then(r => r.data).catch(() => null),
    retry: false,
  })
  const { data: branchRaw } = useQuery({
    queryKey: ['branch-report'],
    queryFn: () => api.get('/api/reports/branch-performance').then(r => r.data).catch(() => null),
    retry: false,
  })

  const execSummary = execRaw || SAMPLE_EXEC
  const branchReport = branchRaw || SAMPLE_BRANCH
  const isDemo = !execRaw

  const portfolio = execSummary.portfolio_overview || execSummary.portfolio || {}
  const risk = execSummary.risk_metrics || {}
  const trend = execSummary.trend_summary || {}

  // ── Download handlers ────────────────────────────────────────────────────
  const downloadPortfolioCSV = () => {
    const headers = ['metric', 'value']
    const rows = [
      ['Total Portfolio (RWF)', portfolio.gross_loan_portfolio || portfolio.total_outstanding || 0],
      ['Active Loans', portfolio.active_loans || portfolio.total_loans || 0],
      ['Active Clients', portfolio.active_clients || 0],
      ['Branches', portfolio.branches || 0],
      ['PAR >30 Rate (%)', risk.par30_pct || portfolio.par30_rate || 0],
      ['PAR >30 Amount (RWF)', risk.par30_amount || portfolio.par30_amount || 0],
      ['NPL Ratio (%)', risk.npl_pct || portfolio.npl_ratio || 0],
      ['Write-offs (RWF)', risk.write_offs || portfolio.total_writeoffs || 0],
      ...(Object.keys(trend).length ? [
        ['PAR 30 Q1 (%)', trend.par30_q1 || 0],
        ['PAR 30 Q3 (%)', trend.par30_q3 || 0],
        ['NPL Q1 (%)', trend.npl_q1 || 0],
        ['NPL Q3 (%)', trend.npl_q3 || 0],
        ['Write-offs Q1 (RWF)', trend.writeoff_q1 || 0],
        ['Write-offs Q3 (RWF)', trend.writeoff_q3 || 0],
      ] : []),
    ]
    downloadCSV(`ABRwanda_Portfolio_Summary_${new Date().toISOString().slice(0, 10)}.csv`, toCSV(headers, rows))
  }

  const downloadBranchCSV = () => {
    const headers = ['branch', 'province', 'total_loans', 'total_outstanding_rwf', 'par30_rate_pct', 'npl_rate_pct', 'total_clients', 'risk_level']
    const rows = branchReport.map(b => [
      b.branch || b.name, b.province,
      b.total_loans || 0, b.total_outstanding || 0,
      b.par30_rate || 0, b.npl_rate || 0,
      b.total_clients || b.client_count || 0, b.risk_level || '',
    ])
    downloadCSV(`ABRwanda_Branch_Report_${new Date().toISOString().slice(0, 10)}.csv`, toCSV(headers, rows))
  }

  const downloadUploadedCSV = (key) => {
    const d = uploadedData[key]
    if (!d || !d.rows.length) return
    const headers = Object.keys(d.rows[0])
    const rows = d.rows.map(r => headers.map(h => r[h]))
    downloadCSV(`${key}_processed_${new Date().toISOString().slice(0, 10)}.csv`, toCSV(headers, rows))
  }

  const TABS = [
    { id: 'summary', label: 'Portfolio Summary', icon: BarChart2 },
    { id: 'branches', label: 'Branch Report', icon: Building2 },
    { id: 'upload', label: 'Upload Data', icon: Upload },
  ]

  return (
    <DashboardLayout>
      <div className="fade-in">
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={22} color="var(--blue)" /> Reports
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Portfolio summaries, branch performance, and data management</p>
          </div>
          {isDemo && (
            <div style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
              ⚡ Sample data — upload your own CSV or connect your backend
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-2)', padding: 4, borderRadius: 10, width: 'fit-content', border: '1px solid var(--border-2)' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: activeTab === id ? 'var(--bg-3)' : 'transparent',
              color: activeTab === id ? 'var(--text)' : 'var(--text-3)',
              transition: 'all 0.18s',
            }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* ── Portfolio Summary ─── */}
            {activeTab === 'summary' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BarChart2 size={14} color="var(--blue)" /> Portfolio Metrics
                    </h2>
                    <button onClick={downloadPortfolioCSV} style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                      background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)',
                      borderRadius: 7, color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}>
                      <Download size={12} /> Export CSV
                    </button>
                  </div>
                  <StatRow label="Total Portfolio" value={formatRWF(portfolio.gross_loan_portfolio || portfolio.total_outstanding)} />
                  <StatRow label="Active Loans" value={(portfolio.active_loans || portfolio.total_loans || 0).toLocaleString()} />
                  <StatRow label="Active Clients" value={(portfolio.active_clients || 0).toLocaleString()} />
                  <StatRow label="Branches" value={portfolio.branches || 0} />
                  <StatRow label="PAR > 30 Rate" value={formatPct(risk.par30_pct || portfolio.par30_rate)} highlight={(risk.par30_pct || 0) > 10 ? '#ef4444' : (risk.par30_pct || 0) > 5 ? '#f59e0b' : '#10b981'} />
                  <StatRow label="PAR > 30 Amount" value={formatRWF(risk.par30_amount || portfolio.par30_amount)} />
                  <StatRow label="NPL Ratio" value={formatPct(risk.npl_pct || portfolio.npl_ratio)} highlight={(risk.npl_pct || 0) > 5 ? '#ef4444' : '#10b981'} />
                  <StatRow label="Total Write-offs" value={formatRWF(risk.write_offs || portfolio.total_writeoffs)} />
                </div>

                {Object.keys(trend).length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TrendingUp size={14} color="var(--green)" /> Trend Analysis (Q1 vs Q3)
                    </h2>
                    {[
                      { label: 'PAR 30 — Q1', value: formatPct(trend.par30_q1) },
                      { label: 'PAR 30 — Q3', value: formatPct(trend.par30_q3), highlight: (trend.par30_q3 || 0) > (trend.par30_q1 || 0) ? '#ef4444' : '#10b981' },
                      { label: 'NPL — Q1', value: formatPct(trend.npl_q1) },
                      { label: 'NPL — Q3', value: formatPct(trend.npl_q3), highlight: (trend.npl_q3 || 0) > (trend.npl_q1 || 0) ? '#ef4444' : '#10b981' },
                      { label: 'Write-offs — Q1', value: formatRWF(trend.writeoff_q1) },
                      { label: 'Write-offs — Q3', value: formatRWF(trend.writeoff_q3) },
                    ].map(({ label, value, highlight }) => (
                      <StatRow key={label} label={label} value={value} highlight={highlight} />
                    ))}
                    <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                      {(trend.par30_q3 || 0) > (trend.par30_q1 || 0)
                        ? <span style={{ color: '#ef4444' }}>⚠ PAR 30 increased by {formatPct((trend.par30_q3 || 0) - (trend.par30_q1 || 0))} from Q1 to Q3.</span>
                        : <span style={{ color: '#10b981' }}>✓ PAR 30 improved by {formatPct((trend.par30_q1 || 0) - (trend.par30_q3 || 0))} from Q1 to Q3.</span>
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Branch Report ─── */}
            {activeTab === 'branches' && (
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={14} color="var(--violet)" /> Branch Performance Report
                  </h2>
                  <button onClick={downloadBranchCSV} style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                    background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)',
                    borderRadius: 7, color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                    <Download size={12} /> Export CSV
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Branch</th><th>Province</th><th>Total Loans</th>
                        <th>Outstanding</th><th>PAR 30</th><th>NPL</th>
                        <th>Clients</th><th>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchReport.map((b, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, fontSize: 12 }}>{b.branch || b.name}</td>
                          <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{b.province}</td>
                          <td style={{ fontSize: 12 }}>{(b.total_loans || 0).toLocaleString()}</td>
                          <td style={{ fontSize: 12 }}>{formatRWF(b.total_outstanding)}</td>
                          <td>
                            <span style={{ fontSize: 12, fontWeight: 700, color: (b.par30_rate || 0) > 15 ? '#ef4444' : (b.par30_rate || 0) > 10 ? '#f59e0b' : '#10b981' }}>
                              {formatPct(b.par30_rate)}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, fontWeight: 600, color: (b.npl_rate || 0) > 5 ? '#ef4444' : '#10b981' }}>{formatPct(b.npl_rate)}</td>
                          <td style={{ fontSize: 12 }}>{(b.total_clients || b.client_count || 0).toLocaleString()}</td>
                          <td><span className={`badge badge-${b.risk_level || 'medium'}`}>{b.risk_level || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Upload ─── */}
            {activeTab === 'upload' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
                <div>
                  <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={14} color="var(--blue)" /> Upload Portfolio Data
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 18 }}>
                      Upload your CSV files to populate the dashboard with real data. Each file must follow the column schema shown in the format guide.
                    </p>
                    <UploadPanel onData={(key, rows) => setUploadedData(d => ({ ...d, [key]: { rows } }))} />
                  </div>

                  {/* Uploaded data previews */}
                  {Object.entries(uploadedData).map(([key, d]) => (
                    <div key={key} className="card" style={{ padding: 20, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Table size={13} color="#10b981" /> {key} — {d.rows.length} rows loaded
                        </h3>
                        <button onClick={() => downloadUploadedCSV(key)} style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                          borderRadius: 6, color: '#10b981', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}>
                          <Download size={11} /> Download processed
                        </button>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
                          <thead>
                            <tr>
                              {Object.keys(d.rows[0] || {}).slice(0, 8).map(h => (
                                <th key={h} style={{ padding: '4px 10px', borderBottom: '1px solid var(--border-2)', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {d.rows.slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                {Object.values(row).slice(0, 8).map((v, j) => (
                                  <td key={j} style={{ padding: '5px 10px', borderBottom: '1px solid var(--border-2)', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{v}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {d.rows.length > 5 && <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>Showing 5 of {d.rows.length} rows</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Side guide */}
                <div>
                  <div className="card" style={{ padding: 18 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Info size={13} color="#3b82f6" /> How data upload works
                    </h3>
                    {[
                      { step: '1', text: 'Prepare your CSV files following the column schema shown on each upload card.' },
                      { step: '2', text: 'Click "Choose file" next to each dataset and select your .csv file.' },
                      { step: '3', text: 'A row-count confirmation appears when the file is parsed successfully.' },
                      { step: '4', text: 'Preview the first 5 rows below to verify the data was read correctly.' },
                      { step: '5', text: 'Click "Download processed" to export the validated data as a clean CSV.' },
                    ].map(({ step, text }) => (
                      <div key={step} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#3b82f6' }}>{step}</div>
                        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>{text}</p>
                      </div>
                    ))}

                    <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
                      <p style={{ fontSize: 11, color: '#f59e0b', margin: 0, lineHeight: 1.5 }}>
                        <strong>Note:</strong> Client data (NID, names) is processed locally in your browser and never sent to any server.
                      </p>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 18, marginTop: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Download report templates</h3>
                    {[
                      { label: 'Portfolio Summary', fn: downloadPortfolioCSV },
                      { label: 'Branch Performance', fn: downloadBranchCSV },
                    ].map(({ label, fn }) => (
                      <button key={label} onClick={fn} style={{
                        width: '100%', marginBottom: 8, padding: '9px 12px',
                        background: 'var(--bg-3)', border: '1px solid var(--border)',
                        borderRadius: 7, color: 'var(--text-2)', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left',
                      }}>
                        <Download size={13} color="#3b82f6" /> {label} (.csv)
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
