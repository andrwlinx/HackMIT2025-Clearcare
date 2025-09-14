// This file previously contained fake facility data.
// All facility data now comes from the real Cerebras-powered API endpoints:
// - /api/providers/search for provider search
// - /api/cost/estimate for cost estimates
// - /api/cost/compare for cost comparisons

export interface FacilityData {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  qualityScore: number
  readmitRate: number
  hcahpsScore: number
  complicationRate: number
  network: boolean
  distance: number
  negotiatedRates: {
    cashPrice: number
    minAllowed: number
    maxAllowed: number
    payerAllowed: number | null
  }
}

// This function is deprecated - use apiClient.searchProviders() instead
export function getFacilitiesNearZip(zipCode: string, radiusMiles: number = 25): FacilityData[] {
  console.warn('getFacilitiesNearZip is deprecated. Use apiClient.searchProviders() instead.');
  return [];
}

// This function is deprecated - use real geolocation APIs
export function calculateDistance(facilityLat: number, facilityLng: number, zipCode: string): number {
  console.warn('calculateDistance is deprecated. Distance calculation now handled by the backend API.');
  return 0;
}
