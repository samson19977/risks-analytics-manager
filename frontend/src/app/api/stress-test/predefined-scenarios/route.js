import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    { id: 'mild_recession', name: 'Mild Recession', description: 'GDP contraction of 2%, moderate unemployment rise', par_shock: 1.5, npl_multiplier: 1.3, default_rate_increase: 0.05, gdp_change: -2, unemployment_change: 2 },
    { id: 'severe_recession', name: 'Severe Recession', description: 'GDP contraction of 5%, significant unemployment', par_shock: 2.5, npl_multiplier: 1.8, default_rate_increase: 0.12, gdp_change: -5, unemployment_change: 5 },
    { id: 'currency_crisis', name: 'Currency Crisis', description: '30% RWF depreciation, import cost surge', par_shock: 2.0, npl_multiplier: 1.6, default_rate_increase: 0.09, gdp_change: -1, unemployment_change: 3 },
    { id: 'agricultural_shock', name: 'Agricultural Shock', description: 'Drought affecting rural agricultural clients', par_shock: 3.0, npl_multiplier: 2.0, default_rate_increase: 0.15, gdp_change: -3, unemployment_change: 4 },
    { id: 'interest_rate_hike', name: 'Interest Rate Hike', description: 'Central bank raises rates by 500bps', par_shock: 1.8, npl_multiplier: 1.4, default_rate_increase: 0.07, gdp_change: 0, unemployment_change: 1 },
  ])
}
