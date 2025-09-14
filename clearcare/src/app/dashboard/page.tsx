'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Compass } from 'lucide-react'
import { formatCurrency } from '@/lib/estimate'
import Navigation from '@/components/Navigation'

interface SavedEstimate {
  id: string
  facilityId: string
  deductibleMet: boolean
  oopYTD: number
  facilityFee: number
  physicianFee: number
  lowEstimate: number
  midEstimate: number
  highEstimate: number
  createdAt: string
  facility: {
    name: string
    address: string
    network: boolean
  }
}

export default function DashboardPage() {
  const [estimates, setEstimates] = useState<SavedEstimate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would fetch user's saved estimates
    // For demo, we'll show empty state
    setIsLoading(false)
  }, [])

  const mockEstimates: SavedEstimate[] = [
    {
      id: '1',
      facilityId: 'facility-1',
      deductibleMet: false,
      oopYTD: 500,
      facilityFee: 3150,
      physicianFee: 1350,
      lowEstimate: 1020,
      midEstimate: 1200,
      highEstimate: 1380,
      createdAt: '2024-01-15T10:30:00Z',
      facility: {
        name: 'Boston Medical Center',
        address: '1 Boston Medical Center Pl, Boston, MA 02118',
        network: true
      }
    },
    {
      id: '2',
      facilityId: 'facility-2',
      deductibleMet: true,
      oopYTD: 2500,
      facilityFee: 4550,
      physicianFee: 1950,
      lowEstimate: 1105,
      midEstimate: 1300,
      highEstimate: 1495,
      createdAt: '2024-01-10T14:15:00Z',
      facility: {
        name: 'Massachusetts General Hospital',
        address: '55 Fruit St, Boston, MA 02114',
        network: true
      }
    }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Your Cost Estimates
              </h1>
              <p className="mt-2 text-gray-600">
                View and manage your saved knee arthroscopy cost estimates
              </p>
            </div>
            <Link
              href="/estimate"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              New Estimate
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : estimates.length === 0 ? (
          // Demo: Show mock estimates instead of empty state
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Demo Mode:</strong> Showing sample estimates for demonstration purposes.
              </p>
            </div>
            
            {mockEstimates.map((estimate) => (
              <div key={estimate.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {estimate.facility.name}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          estimate.facility.network
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {estimate.facility.network ? 'In-Network' : 'Out-of-Network'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {estimate.facility.address}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Estimated Cost
                        </h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(estimate.midEstimate)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Range: {formatCurrency(estimate.lowEstimate)} - {formatCurrency(estimate.highEstimate)}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Insurance Status
                        </h4>
                        <p className="text-sm">
                          {estimate.deductibleMet ? 'Deductible Met' : 'Deductible Not Met'}
                        </p>
                        <p className="text-xs text-gray-500">
                          YTD Out-of-Pocket: {formatCurrency(estimate.oopYTD)}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Total Procedure Cost
                        </h4>
                        <p className="text-sm">
                          {formatCurrency(estimate.facilityFee + estimate.physicianFee)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Facility: {formatCurrency(estimate.facilityFee)} | 
                          Physician: {formatCurrency(estimate.physicianFee)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 text-right">
                    <p className="text-sm text-gray-500 mb-2">
                      {formatDate(estimate.createdAt)}
                    </p>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Real estimates would be rendered here
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="max-w-sm mx-auto">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No estimates yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first cost estimate.
              </p>
              <div className="mt-6">
                <Link
                  href="/estimate"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Estimate
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Average Estimate
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(1250)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Based on your saved estimates
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Facilities Compared
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {mockEstimates.length}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Different facilities evaluated
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Potential Savings
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              {formatCurrency(180)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              By choosing the lowest cost option
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
