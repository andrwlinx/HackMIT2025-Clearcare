'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { formatCurrency, calculateFPLPercentage } from '@/lib/estimate'

const AidFinderSchema = z.object({
  zip: z.string().min(5).max(5),
  householdIncome: z.number().min(0).max(500000),
  householdSize: z.number().min(1).max(20),
  insuranceStatus: z.enum(['uninsured', 'underinsured', 'insured'])
})

type AidFinderData = z.infer<typeof AidFinderSchema>

interface AidProgram {
  id: string
  name: string
  type: string
  description: string
  applicationUrl?: string
  documentsRequired: string[]
  eligibilityScore: number
  eligibilityStatus: 'eligible' | 'likely' | 'possible' | 'ineligible'
  eligibilityReasons: string[]
  estimatedProcessingTime: string
  nextSteps: string[]
}

interface AidMatchResult {
  fplPercentage: number
  totalPrograms: number
  matchedPrograms: number
  programs: AidProgram[]
  recommendations: string[]
}

export default function AidFinderPage() {
  const [results, setResults] = useState<AidMatchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<AidProgram | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<AidFinderData>({
    resolver: zodResolver(AidFinderSchema),
    defaultValues: {
      zip: '02118',
      householdIncome: 45000,
      householdSize: 2,
      insuranceStatus: 'underinsured'
    }
  })

  const watchedValues = watch()

  const onSubmit = async (data: AidFinderData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/aid/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (response.ok) {
        setResults(result)
      } else {
        console.error('Failed to match aid programs:', result.error)
      }
    } catch (error) {
      console.error('Error matching aid programs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'eligible':
        return 'bg-green-100 text-green-800'
      case 'likely':
        return 'bg-blue-100 text-blue-800'
      case 'possible':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return '🏥'
      case 'government':
        return '🏛️'
      case 'nonprofit':
        return '🤝'
      default:
        return '📋'
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
                CareStitch
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/estimate" className="text-gray-700 hover:text-gray-900">
                Get Estimate
              </Link>
              <Link href="/compare" className="text-gray-700 hover:text-gray-900">
                Compare
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
          <h1 className="text-3xl font-bold text-gray-900">
            Financial Assistance Finder
          </h1>
          <p className="mt-2 text-gray-600">
            Find programs that can help reduce your healthcare costs
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Your Information</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    {...register('zip')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="02118"
                  />
                  {errors.zip && (
                    <p className="mt-1 text-sm text-red-600">{errors.zip.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Household Income
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      {...register('householdIncome', { valueAsNumber: true })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="45000"
                    />
                  </div>
                  {errors.householdIncome && (
                    <p className="mt-1 text-sm text-red-600">{errors.householdIncome.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Household Size
                  </label>
                  <select
                    {...register('householdSize', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {errors.householdSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.householdSize.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Status
                  </label>
                  <select
                    {...register('insuranceStatus')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="uninsured">No Insurance</option>
                    <option value="underinsured">Have Insurance (High Costs)</option>
                    <option value="insured">Have Insurance (Adequate)</option>
                  </select>
                  {errors.insuranceStatus && (
                    <p className="mt-1 text-sm text-red-600">{errors.insuranceStatus.message}</p>
                  )}
                </div>

                {/* Real-time FPL calculation */}
                {watchedValues.householdIncome && watchedValues.householdSize && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Federal Poverty Level:</strong> {' '}
                      {Math.round(calculateFPLPercentage(watchedValues.householdIncome, watchedValues.householdSize))}%
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Many programs serve households up to 200-400% of FPL
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Finding Programs...' : 'Find Assistance Programs'}
                </button>
              </form>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Privacy Notice:</strong> Your information is used only to match assistance programs and is not stored or shared.
                </p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {isLoading && (
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
            )}

            {results && !isLoading && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Search Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.matchedPrograms}</div>
                      <div className="text-sm text-gray-600">Programs Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.fplPercentage}%</div>
                      <div className="text-sm text-gray-600">of Federal Poverty Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {results.programs.filter(p => p.eligibilityStatus === 'eligible').length}
                      </div>
                      <div className="text-sm text-gray-600">Highly Eligible</div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {results.recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-3">💡 Recommendations</h4>
                    <ul className="space-y-2">
                      {results.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-800 flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Programs List */}
                <div className="space-y-4">
                  {results.programs.map((program) => (
                    <div key={program.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{getTypeIcon(program.type)}</span>
                            <h4 className="text-lg font-semibold text-gray-900">{program.name}</h4>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.eligibilityStatus)}`}>
                              {program.eligibilityStatus}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{program.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Eligibility Reasons:</h5>
                              <ul className="space-y-1">
                                {program.eligibilityReasons.map((reason, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Required Documents:</h5>
                              <ul className="space-y-1">
                                {program.documentsRequired.slice(0, 3).map((doc, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start">
                                    <span className="text-blue-500 mr-2">📄</span>
                                    {doc}
                                  </li>
                                ))}
                                {program.documentsRequired.length > 3 && (
                                  <li className="text-sm text-gray-500">
                                    +{program.documentsRequired.length - 3} more documents
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Processing Time:</span> {program.estimatedProcessingTime}
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setSelectedProgram(program)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Details
                          </button>
                          {program.applicationUrl && (
                            <a
                              href={program.applicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                            >
                              Apply Now
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {results.programs.length === 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="text-gray-400 text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
                    <p className="text-gray-600 mb-4">
                      We couldn't find assistance programs matching your criteria, but don't give up!
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>• Contact the facility's financial counselor directly</p>
                      <p>• Ask about payment plans or sliding scale fees</p>
                      <p>• Consider adjusting your household income or size if circumstances have changed</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!results && !isLoading && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-gray-400 text-6xl mb-4">🤝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Find Financial Assistance</h3>
                <p className="text-gray-600">
                  Enter your information to discover programs that can help reduce your healthcare costs.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Program Details Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedProgram.name}</h3>
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Next Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {selectedProgram.nextSteps.map((step, index) => (
                      <li key={index} className="text-sm text-gray-600">{step}</li>
                    ))}
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">All Required Documents:</h4>
                  <ul className="space-y-1">
                    {selectedProgram.documentsRequired.map((doc, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-blue-500 mr-2">📄</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedProgram.applicationUrl && (
                  <a
                    href={selectedProgram.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Start Application
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
