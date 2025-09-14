import { NextRequest, NextResponse } from 'next/server'

// This API route has been deprecated.
// All facility data now comes from the real Cerebras-powered backend server at localhost:3001
// Use the frontend apiClient.searchProviders() method instead, which calls /api/providers/search on the backend server.

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This API route is deprecated. Use the Cerebras-powered backend server at localhost:3001/api/providers/search instead.',
      redirect: 'http://localhost:3001/api/providers/search'
    },
    { status: 410 } // Gone
  )
}
