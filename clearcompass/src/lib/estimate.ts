// Enhanced estimation logic for knee arthroscopy (CPT 29881) costs

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

export function calculateComprehensiveEstimate(
  input: EstimateInput,
  negotiatedRate: NegotiatedRateData,
  facility: FacilityData,
  plan?: InsurancePlan
): EstimateResult {
  const assumptions: string[] = []
  
  // Determine if facility is in-network
  const planNetwork = plan ? "BCBS Network" : null // Default network for demo
  const isInNetwork = planNetwork ? facility.networkTags.includes(planNetwork) : false
  
  // Calculate base allowed amount
  let allowedAmount: number
  if (negotiatedRate.payerAllowed && isInNetwork) {
    allowedAmount = negotiatedRate.payerAllowed
    assumptions.push('In-network negotiated rate applied')
  } else if (!isInNetwork) {
    allowedAmount = (negotiatedRate.cashPrice + negotiatedRate.minAllowed + negotiatedRate.maxAllowed) / 3
    assumptions.push('Out-of-network facility - higher costs expected')
  } else {
    allowedAmount = (negotiatedRate.cashPrice + negotiatedRate.minAllowed + negotiatedRate.maxAllowed) / 3
  }

  // Enhanced cost breakdown with bundled components
  const facilityFee = allowedAmount * 0.65 // 65% facility
  const physicianFee = allowedAmount * 0.25 // 25% physician
  
  // Anesthesia calculation (based on time and ASA class)
  const anesthesiaTime = input.anesthesiaTime || 45 // Default 45 minutes
  const asaMultiplier = getASAMultiplier(input.asaClass || 'P2')
  const anesthesiaFee = (anesthesiaTime / 15) * 85 * asaMultiplier // Base units * rate * complexity
  
  // Medication costs (post-op pain management)
  const medicationFee = input.includeMeds ? calculateMedicationCosts() : 0
  
  // Rehabilitation/PT costs (typical follow-up)
  const rehabFee = calculateRehabCosts()
  
  const totalProcedureCost = facilityFee + physicianFee + anesthesiaFee + medicationFee + rehabFee

  // Calculate patient responsibility using plan details
  const planDetails = plan || getDefaultPlan()
  const coverageRule = plan?.coverageRules
  
  const effectiveCoinsurance = coverageRule?.coinsurance || planDetails.coinsurance
  const effectiveCopay = coverageRule?.copay || planDetails.copaySpecialist || 0
  
  let patientCost: number
  const deductibleRemaining = input.deductibleMet ? 0 : Math.max(0, planDetails.deductible - input.oopYTD)

  if (deductibleRemaining > 0) {
    const deductiblePortion = Math.min(totalProcedureCost, deductibleRemaining)
    const coinsurancePortion = Math.max(0, totalProcedureCost - deductibleRemaining) * effectiveCoinsurance
    patientCost = deductiblePortion + coinsurancePortion + (isInNetwork ? effectiveCopay : 0)
    
    assumptions.push(`$${deductiblePortion.toLocaleString()} applied to deductible`)
    if (coinsurancePortion > 0) {
      assumptions.push(`$${coinsurancePortion.toLocaleString()} coinsurance (${(effectiveCoinsurance * 100)}%)`)
    }
  } else {
    patientCost = totalProcedureCost * effectiveCoinsurance + (isInNetwork ? effectiveCopay : 0)
    assumptions.push('Deductible already met - coinsurance only')
  }

  // Apply out-of-pocket maximum
  const remainingOOP = Math.max(0, planDetails.oopMax - input.oopYTD)
  patientCost = Math.min(patientCost, remainingOOP)

  if (patientCost === remainingOOP && remainingOOP < totalProcedureCost * effectiveCoinsurance) {
    assumptions.push('Cost limited by out-of-pocket maximum')
  }

  // Calculate confidence score
  const confidence = calculateConfidenceScore(negotiatedRate, facility)
  
  // Add confidence-related assumptions
  if (confidence < 0.7) {
    assumptions.push('Lower confidence due to data age or facility variance')
  }
  
  // Create range estimates based on confidence
  const variance = Math.max(0.1, 0.3 - confidence * 0.2) // Lower confidence = higher variance
  const lowEstimate = Math.max(0, patientCost * (1 - variance))
  const midEstimate = patientCost
  const highEstimate = patientCost * (1 + variance)

  // Add procedure-specific assumptions
  assumptions.push('Includes typical anesthesia and post-operative medications')
  assumptions.push('Physical therapy costs estimated for standard recovery')
  assumptions.push('Estimates based on CPT 29881 - knee arthroscopy with meniscectomy')
  
  if (coverageRule?.priorAuth) {
    assumptions.push('Prior authorization required for this procedure')
  }

  return {
    patientCost: {
      low: Math.round(lowEstimate),
      mid: Math.round(midEstimate),
      high: Math.round(highEstimate)
    },
    breakdown: {
      facilityFee: Math.round(facilityFee),
      physicianFee: Math.round(physicianFee),
      anesthesiaFee: Math.round(anesthesiaFee),
      medicationFee: Math.round(medicationFee),
      rehabFee: Math.round(rehabFee),
      total: Math.round(totalProcedureCost)
    },
    confidence,
    assumptions
  }
}

function getASAMultiplier(asaClass: string): number {
  const multipliers: Record<string, number> = {
    'P1': 1.0, // Normal healthy patient
    'P2': 1.0, // Mild systemic disease
    'P3': 1.2, // Severe systemic disease
    'P4': 1.5, // Severe disease that is constant threat to life
    'P5': 2.0  // Moribund patient
  }
  return multipliers[asaClass] || 1.0
}

function calculateMedicationCosts(): number {
  // Typical post-op medications for knee arthroscopy
  return 45 // Hydrocodone + Ibuprofen + anti-nausea
}

function calculateRehabCosts(): number {
  // Typical PT sessions (6-8 sessions at ~$150 each)
  return 1050 // 7 sessions average
}

function getDefaultPlan(): InsurancePlan {
  return {
    deductible: 2000,
    coinsurance: 0.20,
    copaySpecialist: 50,
    oopMax: 6000
  }
}

function calculateConfidenceScore(
  negotiatedRate: NegotiatedRateData,
  facility: FacilityData
): number {
  let confidence = 0.8 // Base confidence
  
  // Adjust for data freshness
  const daysSinceUpdate = Math.floor((Date.now() - negotiatedRate.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceUpdate > 90) {
    confidence -= 0.1
  }
  if (daysSinceUpdate > 180) {
    confidence -= 0.1
  }
  
  // Adjust for facility quality metrics
  if (facility.qualityScore > 4.5) {
    confidence += 0.05
  }
  if (facility.complicationRate && facility.complicationRate < 0.02) {
    confidence += 0.05
  }
  
  // Adjust for rate variance
  const rateVariance = (negotiatedRate.maxAllowed - negotiatedRate.minAllowed) / negotiatedRate.cashPrice
  if (rateVariance > 0.5) {
    confidence -= 0.1
  }
  
  return Math.max(0.3, Math.min(1.0, confidence))
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
