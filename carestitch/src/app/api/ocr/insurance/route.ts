import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // For demo purposes, return mock OCR results
    // In production, this would integrate with OCR service like AWS Textract or Google Vision
    const mockPlanSnapshot = {
      issuer: "Blue Cross Blue Shield",
      planType: "PPO",
      network: "BCBS Network",
      deductible: 1500,
      oopMax: 6000,
      coinsurance: 0.20,
      copayPcp: 25,
      copaySpecialist: 50,
      copayEr: 250,
      memberNumber: "***-**-1234", // Partially masked for privacy
      groupNumber: "12345",
      effectiveDate: "2024-01-01",
      confidence: 0.85 // OCR confidence score
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    return NextResponse.json({
      success: true,
      planSnapshot: mockPlanSnapshot,
      message: "Insurance card processed successfully. Please verify the extracted information."
    })

  } catch (error) {
    console.error('Error processing insurance card:', error)
    return NextResponse.json(
      { error: 'Failed to process insurance card' },
      { status: 500 }
    )
  }
}
