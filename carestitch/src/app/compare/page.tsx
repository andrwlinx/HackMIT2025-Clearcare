'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import FacilityTable from '@/components/FacilityTable'

interface Facility {
  id: string
  name: string
  address: string
  qualityScore: number
  network: boolean
  distance: number
  negotiatedRates: Array<{
    cashPrice: number
    minAllowed: number
    maxAllowed: number
    payerAllowed: number | null
  }>
}

export default function ComparePage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [zipCode, setZipCode] = useState('02118')

  useEffect(() => {
    fetchFacilities()
  }, [zipCode])

  const fetchFacilities = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/facilities?zip=${zipCode}&radius=25`)
      const result = await response.json()
      
      if (response.ok) {
        setFacilities(result.facilities)
      } else {
        console.error('Failed to fetch facilities:', result.error)
      }
    } catch (error) {
      console.error('Error fetching facilities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacilitySelect = (facilityId: string) => {
    // Redirect to estimate page with pre-selected facility
    window.location.href = `/estimate?facility=${facilityId}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                KneeCost Demo
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                Home
              </Link>
              <Link href="/estimate" className="text-gray-700 hover:text-gray-900">
                Get Estimate
              </Link>
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Compare Knee Arthroscopy Facilities
              </h1>
              <p className="mt-2 text-gray-600">
                Compare costs, quality ratings, and network status across facilities
              </p>
            </div>
            
            {/* ZIP Code Filter */}
            <div className="flex items-center space-x-2">
              <label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                ZIP Code:
              </label>
              <input
                type="text"
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="02118"
                maxLength={5}
              />
              <button
                onClick={fetchFacilities}
                className="px-4 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FacilityTable 
          facilities={facilities} 
          onSelectFacility={handleFacilitySelect}
          isLoading={isLoading}
        />
        
        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            About These Estimates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Cost Ranges</h4>
              <p>
                Estimated costs are calculated based on typical insurance plans with 20% coinsurance 
                and $100 copay. Your actual costs may vary significantly based on your specific plan.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quality Scores</h4>
              <p>
                Quality ratings are based on sample data for demonstration purposes. 
                In a real application, these would come from CMS Hospital Compare or similar sources.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Network Status</h4>
              <p>
                In-network facilities have negotiated rates with your insurance, typically resulting 
                in lower out-of-pocket costs compared to out-of-network providers.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Distance</h4>
              <p>
                Distances are calculated from the center of your ZIP code. 
                Consider travel time and convenience when making your decision.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/estimate"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Get Personalized Estimate
          </Link>
        </div>
      </div>
    </div>
  )
}
