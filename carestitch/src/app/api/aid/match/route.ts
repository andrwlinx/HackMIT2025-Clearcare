import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { calculateFPLPercentage } from '@/lib/estimate'

const AidMatchRequestSchema = z.object({
  zip: z.string().min(5).max(5),
  householdIncome: z.number().min(0),
  householdSize: z.number().min(1).max(20),
  insuranceStatus: z.enum(['uninsured', 'underinsured', 'insured']),
  diagnosis: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = AidMatchRequestSchema.parse(body)

    // Calculate Federal Poverty Level percentage
    const fplPercentage = calculateFPLPercentage(
      validatedData.householdIncome,
      validatedData.householdSize
    )

    // Find matching aid programs
    const programs = await prisma.aidProgram.findMany({
      where: {
        AND: [
          // Income requirement
          {
            OR: [
              { incomePctFPL: null },
              { incomePctFPL: { gte: fplPercentage } }
            ]
          },
          // Insurance status requirement
          {
            OR: [
              { insuranceStatus: null },
              { insuranceStatus: 'any' },
              { insuranceStatus: validatedData.insuranceStatus }
            ]
          },
          // Residency requirement (simplified for demo)
          {
            OR: [
              { residencyRequired: null },
              { residencyRequired: 'Massachusetts' } // Assuming MA for demo
            ]
          }
        ]
      },
      orderBy: [
        { type: 'asc' }, // Hospital programs first
        { incomePctFPL: 'desc' } // Higher income limits first
      ]
    })

    // Score and rank programs
    const scoredPrograms = programs.map(program => {
      let score = 0
      const reasons: string[] = []

      // Income eligibility scoring
      if (program.incomePctFPL) {
        if (fplPercentage <= program.incomePctFPL) {
          score += 10
          reasons.push(`Income qualifies (${Math.round(fplPercentage)}% of FPL, limit ${program.incomePctFPL}%)`)
        } else {
          reasons.push(`Income too high (${Math.round(fplPercentage)}% of FPL, limit ${program.incomePctFPL}%)`)
        }
      } else {
        score += 5
        reasons.push('No income restrictions')
      }

      // Insurance status matching
      if (program.insuranceStatus === validatedData.insuranceStatus) {
        score += 8
        reasons.push(`Matches insurance status: ${validatedData.insuranceStatus}`)
      } else if (program.insuranceStatus === 'any') {
        score += 6
        reasons.push('Accepts all insurance statuses')
      }

      // Program type preference (hospital charity care often easier)
      if (program.type === 'hospital') {
        score += 3
        reasons.push('Hospital-based program (often streamlined application)')
      } else if (program.type === 'government') {
        score += 2
        reasons.push('Government program')
      }

      // Determine eligibility status
      let eligibilityStatus: 'eligible' | 'likely' | 'possible' | 'ineligible'
      if (score >= 15) {
        eligibilityStatus = 'eligible'
      } else if (score >= 10) {
        eligibilityStatus = 'likely'
      } else if (score >= 5) {
        eligibilityStatus = 'possible'
      } else {
        eligibilityStatus = 'ineligible'
      }

      return {
        ...program,
        eligibilityScore: score,
        eligibilityStatus,
        eligibilityReasons: reasons,
        estimatedProcessingTime: getProcessingTime(program.type),
        nextSteps: getNextSteps(program)
      }
    })

    // Filter to only show relevant programs and sort by score
    const relevantPrograms = scoredPrograms
      .filter(p => p.eligibilityStatus !== 'ineligible')
      .sort((a, b) => b.eligibilityScore - a.eligibilityScore)
      .slice(0, 10) // Limit to top 10 matches

    return NextResponse.json({
      fplPercentage: Math.round(fplPercentage),
      totalPrograms: programs.length,
      matchedPrograms: relevantPrograms.length,
      programs: relevantPrograms,
      recommendations: generateRecommendations(relevantPrograms, validatedData)
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error matching aid programs:', error)
    return NextResponse.json(
      { error: 'Failed to match aid programs' },
      { status: 500 }
    )
  }
}

function getProcessingTime(programType: string): string {
  switch (programType) {
    case 'hospital':
      return '1-2 weeks'
    case 'government':
      return '2-4 weeks'
    case 'nonprofit':
      return '2-6 weeks'
    default:
      return '2-4 weeks'
  }
}

function getNextSteps(program: any): string[] {
  const steps = []
  
  if (program.applicationUrl) {
    steps.push('Visit application website')
  }
  
  steps.push('Gather required documents')
  
  if (program.type === 'hospital') {
    steps.push('Contact hospital financial counselor')
  }
  
  steps.push('Submit complete application')
  steps.push('Follow up within 1 week if no response')
  
  return steps
}

function generateRecommendations(programs: any[], userData: any): string[] {
  const recommendations = []
  
  if (programs.length === 0) {
    recommendations.push('Consider contacting facility financial counselors directly')
    recommendations.push('Look into payment plan options')
    return recommendations
  }
  
  const hospitalPrograms = programs.filter(p => p.type === 'hospital')
  if (hospitalPrograms.length > 0) {
    recommendations.push('Start with hospital-based programs as they often have faster processing')
  }
  
  if (userData.insuranceStatus === 'uninsured') {
    recommendations.push('Consider applying for emergency Medicaid if procedure is urgent')
  }
  
  const highScorePrograms = programs.filter(p => p.eligibilityScore >= 15)
  if (highScorePrograms.length > 0) {
    recommendations.push(`You appear highly eligible for ${highScorePrograms.length} program(s)`)
  }
  
  recommendations.push('Apply to multiple programs to increase chances of approval')
  recommendations.push('Keep copies of all submitted documents')
  
  return recommendations
}
