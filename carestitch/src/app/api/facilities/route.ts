import { NextRequest, NextResponse } from 'next/server'
import { getFacilitiesNearZip } from '@/data/facilities'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const zip = searchParams.get('zip') || '02118' // Default to Boston area
    const radius = parseInt(searchParams.get('radius') || '25') // Default 25 miles

    // Get facilities from hardcoded data
    const facilities = getFacilitiesNearZip(zip, radius)

    // Transform to match expected API format
    const facilitiesWithRates = facilities.map(facility => ({
      id: facility.id,
      name: facility.name,
      address: facility.address,
      lat: facility.lat,
      lng: facility.lng,
      qualityScore: facility.qualityScore,
      readmitRate: facility.readmitRate,
      hcahpsScore: facility.hcahpsScore,
      complicationRate: facility.complicationRate,
      network: facility.network,
      distance: facility.distance,
      networkTags: facility.network ? ["BCBS Network", "Aetna Network"] : [],
      negotiatedRates: [facility.negotiatedRates]
    }))

    return NextResponse.json({
      facilities: facilitiesWithRates,
      userLocation: { lat: 42.3356, lng: -71.0728 },
      searchRadius: radius
    })
  } catch (error) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch facilities' },
      { status: 500 }
    )
  }
}
