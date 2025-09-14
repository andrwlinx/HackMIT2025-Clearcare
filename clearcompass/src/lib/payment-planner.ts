// Payment planning logic converted from Python to TypeScript

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

// Federal Poverty Level guidelines for 2024
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

// Financial aid programs
const AID_PROGRAMS = [
  {
    name: "Hospital Charity Care",
    type: "hospital",
    incomeLimit: 200,
    coverage: "100% if under 150% FPL, sliding scale 150-200%",
    requirements: ["Tax returns", "Pay stubs", "Bank statements"],
    applicationUrl: "Contact hospital financial counselor"
  },
  {
    name: "Massachusetts Health Safety Net",
    type: "state",
    incomeLimit: 300,
    coverage: "Sliding scale based on income",
    requirements: ["Proof of MA residency", "Income verification"],
    applicationUrl: "https://www.mass.gov/health-safety-net"
  },
  {
    name: "Patient Advocate Foundation",
    type: "nonprofit",
    incomeLimit: 400,
    coverage: "Case-by-case assistance",
    requirements: ["Medical bills", "Financial hardship documentation"],
    applicationUrl: "https://www.patientadvocate.org"
  },
  {
    name: "Medicaid Emergency Services",
    type: "government",
    incomeLimit: 138,
    coverage: "Emergency medical services",
    requirements: ["Emergency medical situation", "Income verification"],
    applicationUrl: "https://www.mass.gov/medicaid"
  },
  {
    name: "CareCredit Medical Financing",
    type: "financing",
    incomeLimit: 999,
    coverage: "0% APR promotional periods available",
    requirements: ["Credit check", "Minimum credit score"],
    applicationUrl: "https://www.carecredit.com"
  }
];

// Hospital payment plan options
const HOSPITAL_PLANS: Record<string, any> = {
  "Boston Medical Center": {
    interestFreeMonths: 12,
    extendedPlanMonths: 24,
    extendedPlanApr: 0.05,
    minimumMonthly: 50
  },
  "Mass General Hospital": {
    interestFreeMonths: 6,
    extendedPlanMonths: 36,
    extendedPlanApr: 0.03,
    minimumMonthly: 100
  },
  "Brigham Surgery Center": {
    interestFreeMonths: 18,
    extendedPlanMonths: 24,
    extendedPlanApr: 0.04,
    minimumMonthly: 75
  }
};

export function calculateFplPercentage(annualIncome: number, familySize: number): number {
  let fplAmount: number;
  
  if (familySize > 8) {
    // Add $5,380 for each additional family member
    fplAmount = FPL_GUIDELINES[8] + (familySize - 8) * 5380;
  } else {
    fplAmount = FPL_GUIDELINES[familySize] || FPL_GUIDELINES[1];
  }
  
  return (annualIncome / fplAmount) * 100;
}

export function assessFinancialCapacity(
  annualIncome: number,
  familySize: number,
  monthlyExpenses: number
): FinancialCapacity {
  const monthlyIncome = annualIncome / 12;
  const disposableIncome = monthlyIncome - monthlyExpenses;
  
  // Conservative payment capacity (10-15% of disposable income)
  const conservativePayment = Math.max(25, disposableIncome * 0.10);
  const moderatePayment = Math.max(50, disposableIncome * 0.15);
  const aggressivePayment = Math.max(100, disposableIncome * 0.25);
  
  return {
    monthlyIncome,
    disposableIncome,
    conservativePayment,
    moderatePayment,
    aggressivePayment
  };
}

export function generatePaymentPlans(
  totalCost: number,
  hospital: string,
  financialCapacity: FinancialCapacity
): PaymentPlan[] {
  const plans: PaymentPlan[] = [];
  const hospitalOptions = HOSPITAL_PLANS[hospital] || HOSPITAL_PLANS["Boston Medical Center"];
  
  // Plan 1: Interest-free hospital plan
  if (totalCost > 0) {
    const monthlyPayment1 = totalCost / hospitalOptions.interestFreeMonths;
    if (monthlyPayment1 >= hospitalOptions.minimumMonthly) {
      plans.push({
        name: `${hospitalOptions.interestFreeMonths}-Month Interest-Free Plan`,
        monthlyPayment: Math.round(monthlyPayment1 * 100) / 100,
        totalMonths: hospitalOptions.interestFreeMonths,
        totalCost: totalCost,
        interestRate: 0,
        provider: hospital,
        recommendation: "Best option - no interest charges"
      });
    }
  }
  
  // Plan 2: Extended hospital plan with low interest
  const monthlyPayment2 = totalCost / hospitalOptions.extendedPlanMonths;
  if (monthlyPayment2 >= hospitalOptions.minimumMonthly) {
    const totalWithInterest = totalCost * (1 + hospitalOptions.extendedPlanApr * 
                                         hospitalOptions.extendedPlanMonths / 12);
    plans.push({
      name: `${hospitalOptions.extendedPlanMonths}-Month Extended Plan`,
      monthlyPayment: Math.round((totalWithInterest / hospitalOptions.extendedPlanMonths) * 100) / 100,
      totalMonths: hospitalOptions.extendedPlanMonths,
      totalCost: Math.round(totalWithInterest * 100) / 100,
      interestRate: hospitalOptions.extendedPlanApr,
      provider: hospital,
      recommendation: "Lower monthly payments with minimal interest"
    });
  }
  
  // Plan 3: Capacity-based custom plan
  const targetPayment = financialCapacity.moderatePayment;
  if (targetPayment > 0) {
    const monthsNeeded = Math.ceil(totalCost / targetPayment);
    plans.push({
      name: "Income-Based Custom Plan",
      monthlyPayment: Math.round(targetPayment * 100) / 100,
      totalMonths: monthsNeeded,
      totalCost: totalCost,
      interestRate: 0,
      provider: "Custom",
      recommendation: `Based on ${Math.round(targetPayment/financialCapacity.disposableIncome*100)}% of disposable income`
    });
  }
  
  return plans;
}

export function matchFinancialAid(
  annualIncome: number,
  familySize: number,
  totalCost: number
): AidProgram[] {
  const fplPercentage = calculateFplPercentage(annualIncome, familySize);
  const eligiblePrograms: AidProgram[] = [];
  
  for (const program of AID_PROGRAMS) {
    if (fplPercentage <= program.incomeLimit) {
      let savings = 0;
      
      // Calculate potential savings
      if (program.name === "Hospital Charity Care") {
        if (fplPercentage <= 150) {
          savings = totalCost; // 100% coverage
        } else {
          // Sliding scale 150-200%
          const discountRate = 1 - ((fplPercentage - 150) / 50 * 0.5);
          savings = totalCost * discountRate;
        }
      } else if (program.name === "Massachusetts Health Safety Net") {
        // Sliding scale based on income
        const discountRate = Math.max(0.3, 1 - (fplPercentage / 300));
        savings = totalCost * discountRate;
      } else {
        // Conservative estimate for other programs
        savings = Math.min(totalCost * 0.5, 5000);
      }
      
      eligiblePrograms.push({
        ...program,
        estimatedSavings: Math.round(savings * 100) / 100,
        fplPercentage: Math.round(fplPercentage * 10) / 10,
        priority: fplPercentage <= 200 ? 'High' : 'Medium'
      });
    }
  }
  
  return eligiblePrograms.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
}

export function createPaymentPlan(inputs: PaymentPlannerInputs): PaymentPlannerResult {
  const {
    hospital,
    procedureCost,
    insuranceType,
    annualSalary,
    familyMembers,
    monthlyExpenses
  } = inputs;
  
  // Calculate financial capacity
  const financialCapacity = assessFinancialCapacity(annualSalary, familyMembers, monthlyExpenses);
  
  // Generate payment plans
  const paymentPlans = generatePaymentPlans(procedureCost, hospital, financialCapacity);
  
  // Match financial aid programs
  const aidPrograms = matchFinancialAid(annualSalary, familyMembers, procedureCost);
  
  // Calculate FPL percentage
  const fplPercentage = calculateFplPercentage(annualSalary, familyMembers);
  
  // Create recommendation
  let recommendation = "";
  if (aidPrograms.length > 0 && aidPrograms[0].estimatedSavings > procedureCost * 0.5) {
    recommendation = `1. Apply for ${aidPrograms[0].name} - could save you $${aidPrograms[0].estimatedSavings.toLocaleString()}\n2. Use ${paymentPlans[0]?.name || 'a payment plan'} for any remaining balance`;
  } else {
    recommendation = `1. Choose ${paymentPlans[0]?.name || 'the best payment plan'} - most affordable option`;
    if (aidPrograms.length > 0) {
      recommendation += `\n2. Consider applying for ${aidPrograms[0].name} for additional savings`;
    }
  }
  
  return {
    summary: {
      procedureCost,
      hospital,
      insuranceType,
      annualIncome: annualSalary,
      familySize: familyMembers,
      fplPercentage: Math.round(fplPercentage * 10) / 10,
      monthlyDisposableIncome: Math.round(financialCapacity.disposableIncome * 100) / 100
    },
    paymentPlans,
    aidPrograms,
    recommendation
  };
}
