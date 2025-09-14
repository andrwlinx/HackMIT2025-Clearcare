'use client'

import { useState } from 'react'
import Link from 'next/link'
import EstimateForm from '@/components/EstimateForm'
import FacilityTable from '@/components/FacilityTable'
import BreakdownCard from '@/components/BreakdownCard'
import Navigation from '@/components/Navigation'
import { useCostEstimate } from '@/hooks/useCostEstimate'
import { useFinancialAid } from '@/hooks/useFinancialAid'
import { apiClient } from '@/lib/api-client'

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

const procedureNames = {
  'knee-arthroscopy': 'Knee Arthroscopy',
  'mri-scan': 'MRI Scan', 
  'colonoscopy': 'Colonoscopy',
  'ct-scan': 'CT Scan',
  'emergency-room-visit': 'Emergency Room Visit'
}

const procedureCPTCodes = {
  'knee-arthroscopy': '29881',
  'mri-scan': '73721',
  'colonoscopy': '45378', 
  'ct-scan': '74150',
  'emergency-room-visit': '99284'
}

const getProcedureName = (procedureCode: string) => {
  return procedureNames[procedureCode as keyof typeof procedureNames] || procedureCode.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getCPTCode = (procedureCode: string) => {
  return procedureCPTCodes[procedureCode as keyof typeof procedureCPTCodes] || '00000'
}

export default function EstimatePage() {
  const [currentStep, setCurrentStep] = useState<Step>('form')
  const [formData, setFormData] = useState<EstimateFormData | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [estimate, setEstimate] = useState<EstimateResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)

  // Hook for integrated features
  const { data: costEstimate} = useCostEstimate()
  const { data: aidEligibility } = useFinancialAid()

  const handleFormSubmit = async (data: EstimateFormData) => {
    setIsLoading(true)
    setFormData(data)

    try {
      const result = await apiClient.searchProviders({
        query: data.surgery || 'knee-arthroscopy',
        zipCode: data.zip,
        radius: 25,
        procedureCode: getCPTCode(data.surgery || 'knee-arthroscopy')
      })
      
      // Transform the provider data to match the expected Facility interface
      const transformedFacilities = result.providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        address: `${provider.address.street}, ${provider.address.city}, ${provider.address.state} ${provider.address.zipCode}`,
        qualityScore: provider.qualityRating || 4.0,
        network: provider.insuranceNetworks.length > 0,
        distance: provider.distance || 0,
        negotiatedRates: [{
          cashPrice: provider.procedurePricing?.grossCharge || 8000,
          minAllowed: provider.procedurePricing?.minNegotiatedRate || 3000,
          maxAllowed: provider.procedurePricing?.maxNegotiatedRate || 7000,
          payerAllowed: provider.procedurePricing?.discountedCashPrice || null
        }]
      }))

      setFacilities(transformedFacilities)
      setCurrentStep('facilities')
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
      // Get cost estimate from Cerebras backend
      const costResult = await apiClient.getCostEstimate({
        procedureCode: getCPTCode(formData.surgery || 'knee-arthroscopy'),
        hospitalId: facilityId,
        insurancePlan: {
          planType: formData.planType || 'ppo',
          deductible: formData.deductible || 1500,
          coinsurance: formData.coinsurance || 0.2,
          copay: 50,
          outOfPocketMax: formData.oopMax || 6000,
          network: 'in-network'
        },
        patientInfo: {
          age: 35, // Default - would come from form
          zipCode: formData.zip,
          comorbidities: []
        }
      })


      // Get financial aid eligibility from Cerebras backend
      const aidResult = await apiClient.getAidEligibility({
        billAmount: costResult.estimate.insuranceCoverage?.estimatedPatientCost || costResult.estimate.totalCost,
        income: 75000,
        householdSize: 2,
        state: 'MA',
        hospitalId: facilityId
      })

      setSelectedFacility(facility)
      setEstimate({
        patientCost: {
          low: (costResult.estimate.insuranceCoverage?.estimatedPatientCost || costResult.estimate.totalCost) * 0.8,
          mid: costResult.estimate.insuranceCoverage?.estimatedPatientCost || costResult.estimate.totalCost,
          high: (costResult.estimate.insuranceCoverage?.estimatedPatientCost || costResult.estimate.totalCost) * 1.2
        },
        breakdown: {
          facilityFee: costResult.estimate.breakdown.facilityFee,
          physicianFee: costResult.estimate.breakdown.physicianFee,
          total: costResult.estimate.totalCost
        },
        assumptions: ['Insurance coverage applied', 'In-network rates used', 'Powered by Cerebras AI']
      })
      setCurrentStep('estimate')
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
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {formData?.surgery ? getProcedureName(formData.surgery) : 'Healthcare Cost'} Estimate
          </h1>
          <p className="mt-2 text-gray-600">
            {formData?.surgery 
              ? `Get transparent pricing for ${getProcedureName(formData.surgery).toLowerCase()} procedures`
              : 'Get transparent pricing for medical procedures'
            }
          </p>
        </div>
      </div>

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
              <span className="ml-2 text-sm font-medium">Complete Analysis</span>
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
                Get Your Complete Healthcare Analysis
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Cost estimates, payment options, financial aid, and AI guidance - all in one place
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
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Complete Healthcare Analysis
              </h1>
              <button
                onClick={handleBack}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Facilities
              </button>
            </div>

            {/* Cost Breakdown */}
            <BreakdownCard 
              estimate={estimate}
              facility={selectedFacility}
              onBack={handleBack}
              procedureCode={formData?.surgery}
              procedureName={getProcedureName(formData?.surgery || 'knee-arthroscopy')}
              cptCode={getCPTCode(formData?.surgery || 'knee-arthroscopy')}
            />

            {/* Payment Options */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">💳 Payment Options</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">Hospital Payment Plan</h4>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Recommended</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div>Monthly Payment: <span className="font-medium text-gray-900">${Math.round(estimate.patientCost.mid / 12)}</span></div>
                    <div>Duration: <span className="font-medium text-gray-900">12 months</span></div>
                    <div>Interest Rate: <span className="font-medium text-gray-900">0%</span></div>
                    <div>Total Cost: <span className="font-medium text-gray-900">${estimate.patientCost.mid.toLocaleString()}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">No Interest</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Direct with Hospital</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Extended Payment Plan</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div>Monthly Payment: <span className="font-medium text-gray-900">${Math.round(estimate.patientCost.mid * 1.059 / 24)}</span></div>
                    <div>Duration: <span className="font-medium text-gray-900">24 months</span></div>
                    <div>Interest Rate: <span className="font-medium text-gray-900">5.9%</span></div>
                    <div>Total Cost: <span className="font-medium text-gray-900">${Math.round(estimate.patientCost.mid * 1.059).toLocaleString()}</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Lower Monthly Payment</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Some Interest</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Aid */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">🤝 Financial Assistance</h3>
              <div className="mb-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-semibold text-green-900">High Likelihood of Assistance (80%)</span>
                </div>
                <p className="text-green-800 text-sm">
                  Based on estimated income and household size, you have good prospects for financial assistance.
                </p>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Hospital Charity Care</h4>
                  <p className="text-sm text-gray-600 mb-3">Free or reduced-cost care for qualifying patients</p>
                  <div className="text-sm text-gray-600 mb-3">
                    <strong>Coverage:</strong> Up to 100% of charges<br/>
                    <strong>Requirements:</strong> Income below 400% FPL, Asset verification
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Apply Now →
                  </button>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Apply to hospital charity care program first</li>
                  <li>• Contact financial counselor within 7 days</li>
                  <li>• Submit applications within 30 days of service</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
