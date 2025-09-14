// This file previously contained fake payment planning logic.
// All payment plans and financial aid now come from the real Cerebras-powered API endpoints:
// - /api/payment/options for intelligent payment recommendations
// - /api/aid/eligibility for financial aid analysis
// Use the apiClient.getPaymentOptions() and apiClient.getAidEligibility() methods instead.

export interface PaymentPlan {
  name: string;
  monthlyPayment: number;
  totalMonths: number;
  totalCost: number;
  interestRate: number;
  provider: string;
  recommendation: string;
}

export interface AidProgram {
  name: string;
  type: string;
  incomeLimit: number;
  coverage: string;
  requirements: string[];
  applicationUrl: string;
  estimatedSavings: number;
  fplPercentage: number;
  priority: 'High' | 'Medium' | 'Low';
}

export interface FinancialCapacity {
  monthlyIncome: number;
  disposableIncome: number;
  conservativePayment: number;
  moderatePayment: number;
  aggressivePayment: number;
}

export interface PaymentPlannerInputs {
  hospital: string;
  procedureCost: number;
  insuranceType: string;
  annualSalary: number;
  familyMembers: number;
  monthlyExpenses: number;
}

export interface PaymentPlannerResult {
  summary: {
    procedureCost: number;
    hospital: string;
    insuranceType: string;
    annualIncome: number;
    familySize: number;
    fplPercentage: number;
    monthlyDisposableIncome: number;
  };
  paymentPlans: PaymentPlan[];
  aidPrograms: AidProgram[];
  recommendation: string;
}

// Keep FPL calculation as it's a standard calculation
export function calculateFplPercentage(annualIncome: number, familySize: number): number {
  const FPL_GUIDELINES: Record<number, number> = {
    1: 15060,
    2: 20440,
    3: 25820,
    4: 31200,
    5: 36580,
    6: 41960,
    7: 47340,
    8: 52720
  };

  let fplAmount: number;
  
  if (familySize > 8) {
    // Add $5,380 for each additional family member
    fplAmount = FPL_GUIDELINES[8] + (familySize - 8) * 5380;
  } else {
    fplAmount = FPL_GUIDELINES[familySize] || FPL_GUIDELINES[1];
  }
  
  return (annualIncome / fplAmount) * 100;
}

// DEPRECATED: Use apiClient.getPaymentOptions() instead
export function assessFinancialCapacity(
  annualIncome: number,
  familySize: number,
  monthlyExpenses: number
): FinancialCapacity {
  console.warn('assessFinancialCapacity is deprecated. Use apiClient.getPaymentOptions() instead.');
  
  const monthlyIncome = annualIncome / 12;
  const disposableIncome = monthlyIncome - monthlyExpenses;
  
  return {
    monthlyIncome,
    disposableIncome,
    conservativePayment: 0,
    moderatePayment: 0,
    aggressivePayment: 0
  };
}

// DEPRECATED: Use apiClient.getPaymentOptions() instead
export function generatePaymentPlans(
  totalCost: number,
  hospital: string,
  financialCapacity: FinancialCapacity
): PaymentPlan[] {
  console.warn('generatePaymentPlans is deprecated. Use apiClient.getPaymentOptions() instead.');
  return [];
}

// DEPRECATED: Use apiClient.getAidEligibility() instead
export function matchFinancialAid(
  annualIncome: number,
  familySize: number,
  totalCost: number
): AidProgram[] {
  console.warn('matchFinancialAid is deprecated. Use apiClient.getAidEligibility() instead.');
  return [];
}

// DEPRECATED: Use apiClient.getPaymentOptions() and apiClient.getAidEligibility() instead
export function createPaymentPlan(inputs: PaymentPlannerInputs): PaymentPlannerResult {
  console.warn('createPaymentPlan is deprecated. Use apiClient.getPaymentOptions() and apiClient.getAidEligibility() instead.');
  
  return {
    summary: {
      procedureCost: inputs.procedureCost,
      hospital: inputs.hospital,
      insuranceType: inputs.insuranceType,
      annualIncome: inputs.annualSalary,
      familySize: inputs.familyMembers,
      fplPercentage: calculateFplPercentage(inputs.annualSalary, inputs.familyMembers),
      monthlyDisposableIncome: 0
    },
    paymentPlans: [],
    aidPrograms: [],
    recommendation: 'Use apiClient.getPaymentOptions() and apiClient.getAidEligibility() for real Cerebras-powered recommendations'
  };
}
