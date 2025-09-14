'use client'

import { formatCurrency } from '@/lib/estimate'

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

interface Facility {
  id: string
  name: string
  address: string
  qualityScore: number
  network: boolean
}

interface BreakdownCardProps {
  estimate: EstimateResult
  facility: Facility
  onBack: () => void
  procedureCode?: string
  procedureName?: string
  cptCode?: string
}

export default function BreakdownCard({ estimate, facility, onBack, procedureCode, procedureName, cptCode }: BreakdownCardProps) {
  const renderStars = (score: number) => {
    const fullStars = Math.floor(score)
    const hasHalfStar = score % 1 >= 0.5
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-sm ${
              i < fullStars
                ? 'text-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-sm text-gray-600">({score})</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Cost Estimate for {procedureName || 'Knee Arthroscopy'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">CPT Code: {cptCode || '29881'}</p>
          </div>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Facilities
          </button>
        </div>
      </div>

      {/* Facility Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{facility.name}</h3>
            <p className="text-sm text-gray-600">{facility.address}</p>
            <div className="mt-2 flex items-center space-x-4">
              {renderStars(facility.qualityScore)}
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  facility.network
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {facility.network ? 'In-Network' : 'Out-of-Network'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Estimate */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Cost */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Your Estimated Cost
            </h4>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(estimate.patientCost.mid)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Range: {formatCurrency(estimate.patientCost.low)} - {formatCurrency(estimate.patientCost.high)}
                </div>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Total Procedure Cost
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Facility Fee</span>
                <span className="text-sm font-medium">
                  {formatCurrency(estimate.breakdown.facilityFee)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Physician Fee</span>
                <span className="text-sm font-medium">
                  {formatCurrency(estimate.breakdown.physicianFee)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">
                  {formatCurrency(estimate.breakdown.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assumptions */}
        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Estimate Assumptions
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="space-y-2">
              {estimate.assumptions.map((assumption, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  {assumption}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This estimate is for educational purposes only and should not be used for financial planning. 
            Actual costs may vary significantly based on your specific insurance plan, medical complexity, and other factors. 
            Please contact your insurance provider and the facility directly for accurate pricing information.
          </p>
        </div>
      </div>
    </div>
  )
}
