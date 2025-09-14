import { NextRequest, NextResponse } from 'next/server'

// This API route has been deprecated.
// All financial aid eligibility now comes from the real Cerebras-powered backend server at localhost:3001
// Use the frontend apiClient.getAidEligibility() method instead, which calls /api/aid/eligibility on the backend server.

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This API route is deprecated. Use the Cerebras-powered backend server at localhost:3001/api/aid/eligibility instead.',
      redirect: 'http://localhost:3001/api/aid/eligibility'
    },
    { status: 410 } // Gone
  )
}
