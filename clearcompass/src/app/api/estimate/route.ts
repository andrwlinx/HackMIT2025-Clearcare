import { NextRequest, NextResponse } from 'next/server'

// This API route has been deprecated.
// All cost estimates now come from the real Cerebras-powered backend server at localhost:3001
// Use the frontend apiClient.getCostEstimate() method instead, which calls /api/cost/estimate on the backend server.

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This API route is deprecated. Use the Cerebras-powered backend server at localhost:3001/api/cost/estimate instead.',
      redirect: 'http://localhost:3001/api/cost/estimate'
    },
    { status: 410 } // Gone
  )
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This API route is deprecated. Use the Cerebras-powered backend server at localhost:3001/api/cost/estimate instead.',
      redirect: 'http://localhost:3001/api/cost/estimate'
    },
    { status: 410 } // Gone
  )
}
