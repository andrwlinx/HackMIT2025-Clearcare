import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { FAKE_FACILITIES } from '@/data/facilities'

const EstimateRequestSchema = z.object({
  facilityId: z.string(),
  deductibleMet: z.boolean(),
  outOfPocketSpent: z.number().min(0),
  userId: z.string().optional() // Optional for demo
})

// Simple hardcoded estimate calculation for demo
function calculateHardcodedEstimate(
  facilityId: string,
  deductibleMet: boolean,
  outOfPocketSpent: number,
  negotiatedRates: { cashPrice: number; minAllowed: number; maxAllowed: number; payerAllowed: number | null }
) {
  const basePrice = negotiatedRates.payerAllowed || negotiatedRates.minAllowed
  const facilityFee = Math.round(basePrice * 0.7)
  const physicianFee = Math.round(basePrice * 0.3)
  
  // Simple coinsurance calculation
  const coinsurance = deductibleMet ? 0.2 : 0.3 // 20% if deductible met, 30% if not
  const patientShare = Math.round(basePrice * coinsurance)
  
  return {
    patientCost: {
      low: Math.round(patientShare * 0.8),
      mid: patientShare,
      high: Math.round(patientShare * 1.2)
    },
    breakdown: {
      facilityFee,
      physicianFee,
      total: facilityFee + physicianFee
    },
    assumptions: [
      deductibleMet ? "Deductible already met" : "Deductible not yet met",
      `${Math.round(coinsurance * 100)}% coinsurance applies`,
      "Estimate based on negotiated rates",
      "Actual costs may vary"
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = EstimateRequestSchema.parse(body)

    // Find facility in hardcoded data
    const facility = FAKE_FACILITIES.find(f => f.id === validatedData.facilityId)

    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      )
    }

    // Calculate estimate using hardcoded logic
    const estimateResult = calculateHardcodedEstimate(
      validatedData.facilityId,
      validatedData.deductibleMet,
      validatedData.outOfPocketSpent,
      facility.negotiatedRates
    )

    return NextResponse.json({
      estimate: estimateResult,
      facility: {
        id: facility.id,
        name: facility.name,
        address: facility.address,
        qualityScore: facility.qualityScore,
        network: facility.network
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating estimate:', error)
    return NextResponse.json(
      { error: 'Failed to create estimate' },
      { status: 500 }
    )
  }
}
