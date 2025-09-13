'use client'

import { useState } from 'react'
import Link from 'next/link'
import EstimateForm from '@/components/EstimateForm'
import FacilityTable from '@/components/FacilityTable'
import BreakdownCard from '@/components/BreakdownCard'

interface EstimateFormData {
  surgery: string
  zip: string
  deductibleMet: boolean
  outOfPocketSpent: number
  planType?: string
  deductible?: number
  oopMax?: number
  coinsurance?: number
}

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

interface EstimateResult {
  patientCost: {
    low: number
    mid: number
    high: number
  }
  breakdown: {
    facilityFee: number
    physicianFee: number
    total: number
  }
  assumptions: string[]
}

type Step = 'form' | 'facilities' | 'estimate'

export default function EstimatePage() {
  const [currentStep, setCurrentStep] = useState<Step>('form')
  const [formData, setFormData] = useState<EstimateFormData | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [estimate, setEstimate] = useState<EstimateResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFormSubmit = async (data: EstimateFormData) => {
    setIsLoading(true)
    setFormData(data)

    try {
      const response = await fetch(`/api/facilities?zip=${data.zip}&radius=25`)
      const result = await response.json()
      
      if (response.ok) {
        setFacilities(result.facilities)
        setCurrentStep('facilities')
      } else {
        console.error('Failed to fetch facilities:', result.error)
      }
    } catch (error) {
      console.error('Error fetching facilities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacilitySelect = async (facilityId: string) => {
    if (!formData) return

    setIsLoading(true)
    const facility = facilities.find(f => f.id === facilityId)
    if (!facility) return

    try {
      const response = await fetch('/api/estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facilityId,
          deductibleMet: formData.deductibleMet,
          outOfPocketSpent: formData.outOfPocketSpent,
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        setSelectedFacility(facility)
        setEstimate(result.estimate)
        setCurrentStep('estimate')
      } else {
        console.error('Failed to create estimate:', result.error)
      }
    } catch (error) {
      console.error('Error creating estimate:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep === 'estimate') {
      setCurrentStep('facilities')
      setSelectedFacility(null)
      setEstimate(null)
    } else if (currentStep === 'facilities') {
      setCurrentStep('form')
      setFacilities([])
      setFormData(null)
    }
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
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${currentStep === 'form' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Insurance Info</span>
            </div>
            
            <div className="flex-1 h-px bg-gray-200 max-w-20"></div>
            
            <div className={`flex items-center ${currentStep === 'facilities' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'facilities' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Choose Facility</span>
            </div>
            
            <div className="flex-1 h-px bg-gray-200 max-w-20"></div>
            
            <div className={`flex items-center ${currentStep === 'estimate' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'estimate' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Get Estimate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'form' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Get Your Knee Arthroscopy Cost Estimate
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Start by entering your insurance information
              </p>
            </div>
            <EstimateForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
        )}

        {currentStep === 'facilities' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Available Facilities
                </h1>
                <p className="text-gray-600">
                  Found {facilities.length} facilities near {formData?.zip}
                </p>
              </div>
              <button
                onClick={handleBack}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Insurance Info
              </button>
            </div>
            <FacilityTable 
              facilities={facilities} 
              onSelectFacility={handleFacilitySelect}
              isLoading={isLoading}
            />
          </div>
        )}

        {currentStep === 'estimate' && selectedFacility && estimate && (
          <div>
            <BreakdownCard 
              estimate={estimate}
              facility={selectedFacility}
              onBack={handleBack}
            />
          </div>
        )}
      </div>
    </div>
  )
}
