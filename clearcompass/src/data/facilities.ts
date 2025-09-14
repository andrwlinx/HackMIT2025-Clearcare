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

export const FAKE_FACILITIES: FacilityData[] = [
  {
    id: "1",
    name: "Boston Medical Center",
    address: "1 Boston Medical Center Pl, Boston, MA 02118",
    lat: 42.3354,
    lng: -71.0725,
    qualityScore: 4.2,
    readmitRate: 0.08,
    hcahpsScore: 4.1,
    complicationRate: 0.015,
    network: true,
    distance: 2.3,
    negotiatedRates: {
      cashPrice: 8500,
      minAllowed: 3200,
      maxAllowed: 6800,
      payerAllowed: 4500
    }
  },
  {
    id: "2",
    name: "Massachusetts General Hospital",
    address: "55 Fruit St, Boston, MA 02114",
    lat: 42.3634,
    lng: -71.0685,
    qualityScore: 4.8,
    readmitRate: 0.05,
    hcahpsScore: 4.6,
    complicationRate: 0.008,
    network: true,
    distance: 3.1,
    negotiatedRates: {
      cashPrice: 12500,
      minAllowed: 4800,
      maxAllowed: 9200,
      payerAllowed: 6800
    }
  },
  {
    id: "3",
    name: "Brigham and Women's Hospital",
    address: "75 Francis St, Boston, MA 02115",
    lat: 42.3354,
    lng: -71.1067,
    qualityScore: 4.6,
    readmitRate: 0.06,
    hcahpsScore: 4.4,
    complicationRate: 0.010,
    network: true,
    distance: 2.8,
    negotiatedRates: {
      cashPrice: 11200,
      minAllowed: 4200,
      maxAllowed: 8500,
      payerAllowed: 6200
    }
  },
  {
    id: "4",
    name: "Newton-Wellesley Hospital",
    address: "2014 Washington St, Newton, MA 02462",
    lat: 42.3370,
    lng: -71.2092,
    qualityScore: 4.1,
    readmitRate: 0.07,
    hcahpsScore: 4.0,
    complicationRate: 0.020,
    network: true,
    distance: 8.5,
    negotiatedRates: {
      cashPrice: 9200,
      minAllowed: 3600,
      maxAllowed: 7200,
      payerAllowed: 5100
    }
  },
  {
    id: "5",
    name: "Beth Israel Deaconess Medical Center",
    address: "330 Brookline Ave, Boston, MA 02215",
    lat: 42.3354,
    lng: -71.1067,
    qualityScore: 4.3,
    readmitRate: 0.07,
    hcahpsScore: 4.2,
    complicationRate: 0.012,
    network: true,
    distance: 3.7,
    negotiatedRates: {
      cashPrice: 9800,
      minAllowed: 3800,
      maxAllowed: 7800,
      payerAllowed: 5500
    }
  },
  {
    id: "6",
    name: "Tufts Medical Center",
    address: "800 Washington St, Boston, MA 02111",
    lat: 42.3496,
    lng: -71.0635,
    qualityScore: 4.0,
    readmitRate: 0.09,
    hcahpsScore: 3.8,
    complicationRate: 0.018,
    network: false,
    distance: 1.9,
    negotiatedRates: {
      cashPrice: 7800,
      minAllowed: 2900,
      maxAllowed: 6200,
      payerAllowed: null // Out of network
    }
  },
  {
    id: "7",
    name: "South Shore Hospital",
    address: "55 Fogg Rd, Weymouth, MA 02190",
    lat: 42.2287,
    lng: -70.9395,
    qualityScore: 3.9,
    readmitRate: 0.08,
    hcahpsScore: 3.9,
    complicationRate: 0.016,
    network: true,
    distance: 12.4,
    negotiatedRates: {
      cashPrice: 7200,
      minAllowed: 2800,
      maxAllowed: 5800,
      payerAllowed: 4200
    }
  },
  {
    id: "8",
    name: "Cambridge Health Alliance",
    address: "1493 Cambridge St, Cambridge, MA 02139",
    lat: 42.3875,
    lng: -71.1210,
    qualityScore: 3.8,
    readmitRate: 0.10,
    hcahpsScore: 3.7,
    complicationRate: 0.022,
    network: true,
    distance: 4.2,
    negotiatedRates: {
      cashPrice: 6800,
      minAllowed: 2600,
      maxAllowed: 5400,
      payerAllowed: 3900
    }
  }
]

// Helper function to calculate distance from a zip code (simplified for demo)
export function calculateDistance(facilityLat: number, facilityLng: number, zipCode: string): number {
  // Simplified distance calculation based on zip code
  const zipCoords: { [key: string]: { lat: number, lng: number } } = {
    '02118': { lat: 42.3354, lng: -71.0725 }, // Boston Medical Center area
    '02114': { lat: 42.3634, lng: -71.0685 }, // MGH area
    '02115': { lat: 42.3354, lng: -71.1067 }, // Brigham area
    '02139': { lat: 42.3875, lng: -71.1210 }, // Cambridge
    '02215': { lat: 42.3354, lng: -71.1067 }, // Fenway
  }
  
  const userCoords = zipCoords[zipCode] || zipCoords['02118'] // Default to BMC area
  
  // Simple distance calculation (not accurate, just for demo)
  const latDiff = facilityLat - userCoords.lat
  const lngDiff = facilityLng - userCoords.lng
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 69 // Rough miles conversion
  
  return Math.round(distance * 10) / 10
}

// Filter facilities by distance and update distances
export function getFacilitiesNearZip(zipCode: string, radiusMiles: number = 25): FacilityData[] {
  return FAKE_FACILITIES
    .map(facility => ({
      ...facility,
      distance: calculateDistance(facility.lat, facility.lng, zipCode)
    }))
    .filter(facility => facility.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance)
}
