import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const PaymentSimulationSchema = z.object({
  totalAmount: z.number().min(0),
  hsaBalance: z.number().min(0).optional(),
  fsaBalance: z.number().min(0).optional(),
  creditScore: z.number().min(300).max(850).optional(),
  monthlyIncome: z.number().min(0).optional(),
  existingDebt: z.number().min(0).optional(),
  facilityId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = PaymentSimulationSchema.parse(body)

    // Get facility-specific payment plans if facilityId provided
    let facilityPlans: any[] = []
    if (validatedData.facilityId) {
      const facility = await prisma.facility.findUnique({
        where: { id: validatedData.facilityId },
        include: { paymentPlans: true }
      })
      facilityPlans = facility?.paymentPlans || []
    }

    // Calculate available balances
    const hsaAvailable = validatedData.hsaBalance || 0
    const fsaAvailable = validatedData.fsaBalance || 0
    const taxAdvantageTotal = hsaAvailable + fsaAvailable

    // Amount after using tax-advantaged accounts
    const remainingAmount = Math.max(0, validatedData.totalAmount - taxAdvantageTotal)

    // Generate payment options
    const paymentOptions = []

    // Option 1: Full payment with tax-advantaged accounts
    if (taxAdvantageTotal >= validatedData.totalAmount) {
      paymentOptions.push({
        id: 'full-tax-advantaged',
        type: 'immediate',
        title: 'Pay with HSA/FSA',
        description: 'Use your tax-advantaged accounts to pay the full amount',
        totalCost: validatedData.totalAmount,
        monthlyCost: 0,
        termMonths: 0,
        interestRate: 0,
        savings: validatedData.totalAmount * 0.22, // Estimated tax savings
        breakdown: {
          hsaUsed: Math.min(hsaAvailable, validatedData.totalAmount),
          fsaUsed: Math.min(fsaAvailable, Math.max(0, validatedData.totalAmount - hsaAvailable)),
          outOfPocket: 0
        },
        pros: ['No interest charges', 'Tax savings', 'Immediate payment'],
        cons: ['Reduces emergency fund'],
        recommended: true
      })
    }

    // Option 2: Partial tax-advantaged + payment plan
    if (remainingAmount > 0 && taxAdvantageTotal > 0) {
      const monthlyPayment = calculateMonthlyPayment(remainingAmount, 0, 12) // 12-month 0% plan
      paymentOptions.push({
        id: 'partial-tax-advantaged',
        type: 'hybrid',
        title: 'HSA/FSA + Payment Plan',
        description: 'Use available tax-advantaged funds plus a payment plan',
        totalCost: validatedData.totalAmount,
        monthlyCost: monthlyPayment,
        termMonths: 12,
        interestRate: 0,
        savings: taxAdvantageTotal * 0.22,
        breakdown: {
          hsaUsed: hsaAvailable,
          fsaUsed: fsaAvailable,
          outOfPocket: remainingAmount
        },
        pros: ['Partial tax savings', 'Manageable payments', 'No interest'],
        cons: ['Monthly commitment'],
        recommended: remainingAmount < 5000
      })
    }

    // Option 3: Hospital payment plans (if available)
    facilityPlans.forEach(plan => {
      const monthlyPayment = calculateMonthlyPayment(
        remainingAmount || validatedData.totalAmount,
        plan.interestRate,
        plan.termMonths
      )
      
      paymentOptions.push({
        id: `facility-${plan.id}`,
        type: 'payment_plan',
        title: plan.name,
        description: plan.description,
        totalCost: monthlyPayment * plan.termMonths,
        monthlyCost: monthlyPayment,
        termMonths: plan.termMonths,
        interestRate: plan.interestRate,
        savings: 0,
        breakdown: {
          hsaUsed: 0,
          fsaUsed: 0,
          outOfPocket: monthlyPayment * plan.termMonths
        },
        pros: plan.features || ['Direct with provider', 'No credit check required'],
        cons: [`${plan.termMonths} month commitment`],
        recommended: false
      })
    })

    // Option 4: Standard payment plans (0%, 6%, 12% options)
    const standardPlans = [
      { months: 6, rate: 0, title: '6-Month Interest-Free' },
      { months: 12, rate: 0, title: '12-Month Interest-Free' },
      { months: 24, rate: 0.06, title: '24-Month Low Interest' },
      { months: 36, rate: 0.12, title: '36-Month Extended' }
    ]

    standardPlans.forEach(plan => {
      const amount = remainingAmount || validatedData.totalAmount
      const monthlyPayment = calculateMonthlyPayment(amount, plan.rate, plan.months)
      const totalCost = monthlyPayment * plan.months

      paymentOptions.push({
        id: `standard-${plan.months}`,
        type: 'payment_plan',
        title: plan.title,
        description: `Spread payments over ${plan.months} months`,
        totalCost,
        monthlyCost: monthlyPayment,
        termMonths: plan.months,
        interestRate: plan.rate,
        savings: 0,
        breakdown: {
          hsaUsed: 0,
          fsaUsed: 0,
          outOfPocket: totalCost
        },
        pros: plan.rate === 0 ? ['No interest charges'] : ['Lower monthly payments'],
        cons: plan.rate > 0 ? [`$${(totalCost - amount).toFixed(2)} in interest`] : [`${plan.months} month commitment`],
        recommended: plan.months === 12 && plan.rate === 0
      })
    })

    // Option 5: Medical credit cards (if credit score available)
    if (validatedData.creditScore && validatedData.creditScore >= 650) {
      const amount = remainingAmount || validatedData.totalAmount
      const monthlyPayment = calculateMonthlyPayment(amount, 0.1899, 24) // Typical medical credit card rate
      const totalCost = monthlyPayment * 24

      paymentOptions.push({
        id: 'medical-credit',
        type: 'credit',
        title: 'Medical Credit Card',
        description: 'Specialized healthcare financing',
        totalCost,
        monthlyCost: monthlyPayment,
        termMonths: 24,
        interestRate: 0.1899,
        savings: 0,
        breakdown: {
          hsaUsed: 0,
          fsaUsed: 0,
          outOfPocket: totalCost
        },
        pros: ['Quick approval', 'Immediate payment'],
        cons: [`High interest rate (18.99%)`, `$${(totalCost - amount).toFixed(2)} in interest`],
        recommended: false
      })
    }

    // Calculate affordability score
    const affordabilityScore = calculateAffordabilityScore(
      validatedData.totalAmount,
      validatedData.monthlyIncome,
      validatedData.existingDebt,
      taxAdvantageTotal
    )

    // Generate recommendations
    const recommendations = generateRecommendations(
      paymentOptions,
      validatedData,
      affordabilityScore
    )

    // Sort options by recommendation score
    const sortedOptions = paymentOptions.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1
      if (!a.recommended && b.recommended) return 1
      return a.totalCost - b.totalCost
    })

    return NextResponse.json({
      totalAmount: validatedData.totalAmount,
      taxAdvantageAvailable: taxAdvantageTotal,
      remainingAmount,
      affordabilityScore,
      paymentOptions: sortedOptions,
      recommendations,
      disclaimer: 'Payment options are estimates. Actual terms may vary based on credit approval and provider policies.'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error simulating payment options:', error)
    return NextResponse.json(
      { error: 'Failed to simulate payment options' },
      { status: 500 }
    )
  }
}

function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) {
    return principal / months
  }
  
  const monthlyRate = annualRate / 12
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                  (Math.pow(1 + monthlyRate, months) - 1)
  
  return Math.round(payment * 100) / 100
}

function calculateAffordabilityScore(
  totalAmount: number,
  monthlyIncome?: number,
  existingDebt?: number,
  taxAdvantageTotal?: number
): number {
  let score = 50 // Base score

  if (monthlyIncome) {
    const debtToIncomeRatio = (existingDebt || 0) / monthlyIncome
    if (debtToIncomeRatio < 0.2) score += 20
    else if (debtToIncomeRatio < 0.4) score += 10
    else score -= 10

    const affordableMonthly = monthlyIncome * 0.1 // 10% of income
    const estimatedMonthly = totalAmount / 12
    if (estimatedMonthly <= affordableMonthly) score += 15
    else if (estimatedMonthly <= affordableMonthly * 2) score += 5
    else score -= 15
  }

  if (taxAdvantageTotal) {
    const coverage = taxAdvantageTotal / totalAmount
    if (coverage >= 1) score += 25
    else if (coverage >= 0.5) score += 15
    else if (coverage >= 0.25) score += 10
  }

  return Math.max(0, Math.min(100, score))
}

function generateRecommendations(
  paymentOptions: any[],
  userData: any,
  affordabilityScore: number
): string[] {
  const recommendations = []

  const taxAdvantageOption = paymentOptions.find(opt => opt.id === 'full-tax-advantaged')
  if (taxAdvantageOption) {
    recommendations.push('Use HSA/FSA funds first for maximum tax savings')
  }

  if (affordabilityScore < 30) {
    recommendations.push('Consider longer payment terms to reduce monthly burden')
    recommendations.push('Look into financial assistance programs')
  } else if (affordabilityScore > 70) {
    recommendations.push('You can afford shorter payment terms to minimize total cost')
  }

  const zeroInterestOptions = paymentOptions.filter(opt => opt.interestRate === 0)
  if (zeroInterestOptions.length > 0) {
    recommendations.push('Prioritize 0% interest options to minimize total cost')
  }

  if (userData.creditScore && userData.creditScore < 650) {
    recommendations.push('Hospital payment plans may be easier to qualify for than credit cards')
  }

  return recommendations
}
