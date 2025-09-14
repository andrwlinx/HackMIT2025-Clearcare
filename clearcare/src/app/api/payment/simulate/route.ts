import { NextRequest, NextResponse } from 'next/server'

// This API route has been deprecated.
// All payment options now come from the real Cerebras-powered backend server at localhost:3001
// Use the frontend apiClient.getPaymentOptions() method instead, which calls /api/payment/options on the backend server.

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This API route is deprecated. Use the Cerebras-powered backend server at localhost:3001/api/payment/options instead.',
      redirect: 'http://localhost:3001/api/payment/options'
    },
    { status: 410 } // Gone
  )
}
