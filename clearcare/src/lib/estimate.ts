// This file previously contained fake estimation logic.
// All cost estimates now come from the real Cerebras-powered API endpoints:
// - /api/cost/estimate for intelligent cost predictions
// - /api/cost/compare for cost comparisons
// Use the apiClient.getCostEstimate() and apiClient.compareCosts() methods instead.

export interface EstimateInput {
  facilityId: string
  planId?: string
  deductibleMet: boolean
  oopYTD: number
  distance?: number
  anesthesiaTime?: number
  asaClass?: string
  includeMeds?: boolean
}

export interface InsurancePlan {
  deductible: number
  coinsurance: number
  copaySpecialist?: number
  oopMax: number
  coverageRules?: {
    coinsurance?: number
    copay?: number
    priorAuth: boolean
  }
}

export interface CostBreakdown {
  facilityFee: number
  physicianFee: number
  anesthesiaFee: number
  medicationFee: number
  rehabFee: number
  total: number
}

export interface EstimateRange {
  low: number
  mid: number
  high: number
}

export interface EstimateResult {
  patientCost: EstimateRange
  breakdown: CostBreakdown
  confidence: number
  assumptions: string[]
}

export interface NegotiatedRateData {
  cashPrice: number
  minAllowed: number
  maxAllowed: number
  payerAllowed: number | null
  lastSeenAt: Date
}

export interface FacilityData {
  networkTags: string[]
  qualityScore: number
  readmitRate?: number
  complicationRate?: number
}

// DEPRECATED: Use apiClient.getCostEstimate() instead
export function calculateComprehensiveEstimate(
  input: EstimateInput,
  negotiatedRate: NegotiatedRateData,
  facility: FacilityData,
  plan?: InsurancePlan
): EstimateResult {
  console.warn('calculateComprehensiveEstimate is deprecated. Use apiClient.getCostEstimate() instead.');
  
  // Return empty result - all estimates should come from Cerebras API
  return {
    patientCost: { low: 0, mid: 0, high: 0 },
    breakdown: {
      facilityFee: 0,
      physicianFee: 0,
      anesthesiaFee: 0,
      medicationFee: 0,
      rehabFee: 0,
      total: 0
    },
    confidence: 0,
    assumptions: ['Use apiClient.getCostEstimate() for real Cerebras-powered estimates']
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Haversine formula for distance calculation
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Financial assistance eligibility calculation
export function calculateFPLPercentage(
  householdIncome: number,
  householdSize: number,
  year: number = 2024
): number {
  // 2024 Federal Poverty Level guidelines
  const fplBase = 15060 // Base for 1 person
  const fplIncrement = 5380 // Additional per person
  
  const fplThreshold = fplBase + (householdSize - 1) * fplIncrement
  return (householdIncome / fplThreshold) * 100
}

// Payment plan calculation
export function calculatePaymentPlan(
  totalAmount: number,
  months: number,
  apr: number,
  fees: number = 0
): {
  monthlyPayment: number
  totalInterest: number
  totalCost: number
} {
  const monthlyRate = apr / 12
  const monthlyPayment = monthlyRate > 0 
    ? (totalAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : totalAmount / months
  
  const totalCost = monthlyPayment * months + fees
  const totalInterest = totalCost - totalAmount - fees
  
  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100
  }
}
