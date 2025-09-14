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
                CareStitch Demo
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
                Get Your Health Cost Estimate
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
            
            {/* AI-Generated Payment & Aid Options */}
            <div className="mt-8 space-y-6">
              {/* AI Badge */}
              <div className="flex items-center justify-center">
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-purple-700">AI-Powered Recommendations</span>
                  </div>
                </div>
              </div>

              {/* Payment Plan Options */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Personalized Payment Plans
                </h3>
                <p className="text-green-700 text-sm mb-4">
                  {/* AI will analyze your insurance coverage, estimated income, and household size to recommend optimal payment plans */}
                  Based on your insurance and financial profile, here are your best payment options:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Interest-Free Plan */}
                  <div className="bg-white border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-green-900">Interest-Free Plan</h4>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Recommended</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      ${Math.round((estimate?.patientCost.mid || 0) / 12)} per month for 12 months
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1 mb-3">
                      <li>• No interest or fees</li>
                      <li>• Automatic payments available</li>
                      <li>• Early payoff allowed</li>
                    </ul>
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded text-sm hover:bg-green-700 transition-colors">
                      Select This Plan
                    </button>
                  </div>

                  {/* Extended Plan */}
                  <div className="bg-white border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-green-900">Extended Plan</h4>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Lower Payments</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      ${Math.round((estimate?.patientCost.mid || 0) / 24)} per month for 24 months
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1 mb-3">
                      <li>• 3.9% APR</li>
                      <li>• Flexible payment dates</li>
                      <li>• No prepayment penalty</li>
                    </ul>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition-colors">
                      Select This Plan
                    </button>
                  </div>
                </div>
              </div>

              {/* Financial Aid Options */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Financial Assistance Programs
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  {/* AI will match you with relevant aid programs based on your insurance status, income level, and location */}
                  You may qualify for these assistance programs:
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Hospital Charity Care */}
                  <div className="bg-white border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-900">Hospital Financial Aid</h4>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">85% Match</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Potential savings: ${Math.round((estimate?.patientCost.mid || 0) * 0.4)} - ${Math.round((estimate?.patientCost.mid || 0) * 0.7)}
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1 mb-3">
                      <li>• Income-based sliding scale</li>
                      <li>• No application fee</li>
                      <li>• 2-3 week processing time</li>
                    </ul>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition-colors">
                      Apply Now
                    </button>
                  </div>

                  {/* Nonprofit Assistance */}
                  <div className="bg-white border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-900">HealthWell Foundation</h4>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">72% Match</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Potential savings: Up to ${Math.round((estimate?.patientCost.mid || 0) * 0.5)}
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1 mb-3">
                      <li>• Copay and coinsurance assistance</li>
                      <li>• Income up to 500% FPL</li>
                      <li>• Online application</li>
                    </ul>
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded text-sm hover:bg-purple-700 transition-colors">
                      Check Eligibility
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    href="/aid"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View All Financial Aid Options
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* AI Disclaimer */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 text-center">
                  <span className="font-medium">AI-Powered Recommendations:</span> These suggestions are generated using artificial intelligence based on your insurance coverage, estimated financial profile, and historical program eligibility data. Actual eligibility and terms may vary. Please verify all details before making financial commitments.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
