import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    {
      id: 'mild_recession', name: 'Mild Recession', type: 'macro_shock',
      description: 'GDP contraction of 2%, moderate unemployment rise',
      par_shock: 1.5, npl_multiplier: 1.3, default_rate_increase: 0.05,
      params: { fuel_price_increase: 15, food_inflation: 10, income_shock: 8, sector_affected: null }
    },
    {
      id: 'severe_recession', name: 'Severe Recession', type: 'macro_shock',
      description: 'GDP contraction of 5%, significant unemployment spike',
      par_shock: 2.5, npl_multiplier: 1.8, default_rate_increase: 0.12,
      params: { fuel_price_increase: 30, food_inflation: 25, income_shock: 20, sector_affected: null }
    },
    {
      id: 'currency_crisis', name: 'Currency Crisis', type: 'macro_shock',
      description: '30% RWF depreciation, import cost surge',
      par_shock: 2.0, npl_multiplier: 1.6, default_rate_increase: 0.09,
      params: { fuel_price_increase: 40, food_inflation: 20, income_shock: 12, sector_affected: null }
    },
    {
      id: 'agricultural_shock', name: 'Agricultural Shock', type: 'sector_shock',
      description: 'Drought affecting rural agricultural clients',
      par_shock: 3.0, npl_multiplier: 2.0, default_rate_increase: 0.15,
      params: { fuel_price_increase: 0, food_inflation: 35, income_shock: 25, sector_affected: 'agriculture' }
    },
    {
      id: 'interest_rate_hike', name: 'Interest Rate Hike', type: 'macro_shock',
      description: 'Central bank raises rates by 500bps',
      par_shock: 1.8, npl_multiplier: 1.4, default_rate_increase: 0.07,
      params: { fuel_price_increase: 0, food_inflation: 5, income_shock: 15, sector_affected: null }
    },
  ])
}
