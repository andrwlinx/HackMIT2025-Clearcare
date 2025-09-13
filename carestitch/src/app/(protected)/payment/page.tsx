'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { formatCurrency } from '@/lib/estimate'

const PaymentSimulatorSchema = z.object({
  totalAmount: z.number().min(0).max(100000),
  hsaBalance: z.number().min(0).max(50000).optional(),
  fsaBalance: z.number().min(0).max(10000).optional(),
  creditScore: z.number().min(300).max(850).optional(),
  monthlyIncome: z.number().min(0).max(50000).optional(),
  existingDebt: z.number().min(0).max(100000).optional()
})

type PaymentSimulatorData = z.infer<typeof PaymentSimulatorSchema>

interface PaymentOption {
  id: string
  type: string
  title: string
  description: string
  totalCost: number
  monthlyCost: number
  termMonths: number
  interestRate: number
  savings: number
  breakdown: {
    hsaUsed: number
    fsaUsed: number
    outOfPocket: number
  }
  pros: string[]
  cons: string[]
  recommended: boolean
}

interface PaymentSimulation {
  totalAmount: number
  taxAdvantageAvailable: number
  remainingAmount: number
  affordabilityScore: number
  paymentOptions: PaymentOption[]
  recommendations: string[]
  disclaimer: string
}

export default function PaymentOptionsPage() {
  const [simulation, setSimulation] = useState<PaymentSimulation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<PaymentSimulatorData>({
    resolver: zodResolver(PaymentSimulatorSchema),
    defaultValues: {
      totalAmount: 3500,
      hsaBalance: 2000,
      fsaBalance: 500,
      creditScore: 720,
      monthlyIncome: 5000,
      existingDebt: 1200
    }
  })

  const watchedValues = watch()

  const onSubmit = async (data: PaymentSimulatorData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payment/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (response.ok) {
        setSimulation(result)
      } else {
        console.error('Failed to simulate payment options:', result.error)
      }
    } catch (error) {
      console.error('Error simulating payment options:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'immediate':
        return '💳'
      case 'hybrid':
        return '🔄'
      case 'payment_plan':
        return '📅'
      case 'credit':
        return '💰'
      default:
        return '💵'
    }
  }

  const getAffordabilityColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAffordabilityLabel = (score: number) => {
    if (score >= 70) return 'Good'
    if (score >= 40) return 'Moderate'
    return 'Challenging'
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
              <Link href="/aid" className="text-gray-700 hover:text-gray-900">
                Find Aid
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
            Payment Options Simulator
          </h1>
          <p className="mt-2 text-gray-600">
            Explore different ways to pay for your knee arthroscopy procedure
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Your Financial Profile</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount to Pay
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      {...register('totalAmount', { valueAsNumber: true })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="3500"
                    />
                  </div>
                  {errors.totalAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.totalAmount.message}</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Tax-Advantaged Accounts</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        HSA Balance
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          {...register('hsaBalance', { valueAsNumber: true })}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="2000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        FSA Balance
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          {...register('fsaBalance', { valueAsNumber: true })}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Optional Information</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Helps us provide more personalized recommendations
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Credit Score
                      </label>
                      <input
                        type="number"
                        {...register('creditScore', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="720"
                        min="300"
                        max="850"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Income
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          {...register('monthlyIncome', { valueAsNumber: true })}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="5000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Existing Monthly Debt
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          {...register('existingDebt', { valueAsNumber: true })}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time tax advantage calculation */}
                {(watchedValues.hsaBalance || watchedValues.fsaBalance) && watchedValues.totalAmount && (
                  <div className="p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Tax Advantage Available:</strong> {' '}
                      {formatCurrency((watchedValues.hsaBalance || 0) + (watchedValues.fsaBalance || 0))}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Estimated tax savings: {formatCurrency(((watchedValues.hsaBalance || 0) + (watchedValues.fsaBalance || 0)) * 0.22)}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Calculating Options...' : 'Calculate Payment Options'}
                </button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Privacy Notice:</strong> Your financial information is used only for calculations and is not stored.
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
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-24 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {simulation && !isLoading && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{formatCurrency(simulation.totalAmount)}</div>
                      <div className="text-sm text-gray-600">Total Amount</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(simulation.taxAdvantageAvailable)}</div>
                      <div className="text-sm text-gray-600">Tax Advantage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(simulation.remainingAmount)}</div>
                      <div className="text-sm text-gray-600">Remaining</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getAffordabilityColor(simulation.affordabilityScore)}`}>
                        {simulation.affordabilityScore}/100
                      </div>
                      <div className="text-sm text-gray-600">
                        Affordability: {getAffordabilityLabel(simulation.affordabilityScore)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {simulation.recommendations.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-3">💡 Recommendations</h4>
                    <ul className="space-y-2">
                      {simulation.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-800 flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Payment Options */}
                <div className="space-y-4">
                  {simulation.paymentOptions.map((option) => (
                    <div key={option.id} className={`bg-white rounded-lg shadow-md p-6 ${option.recommended ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-2xl">{getTypeIcon(option.type)}</span>
                            <h4 className="text-lg font-semibold text-gray-900">{option.title}</h4>
                            {option.recommended && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{option.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Cost Breakdown:</h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Cost:</span>
                                  <span className="font-medium">{formatCurrency(option.totalCost)}</span>
                                </div>
                                {option.monthlyCost > 0 && (
                                  <div className="flex justify-between">
                                    <span>Monthly Payment:</span>
                                    <span className="font-medium">{formatCurrency(option.monthlyCost)}</span>
                                  </div>
                                )}
                                {option.termMonths > 0 && (
                                  <div className="flex justify-between">
                                    <span>Term:</span>
                                    <span>{option.termMonths} months</span>
                                  </div>
                                )}
                                {option.interestRate > 0 && (
                                  <div className="flex justify-between">
                                    <span>Interest Rate:</span>
                                    <span>{(option.interestRate * 100).toFixed(2)}%</span>
                                  </div>
                                )}
                                {option.savings > 0 && (
                                  <div className="flex justify-between text-green-600">
                                    <span>Tax Savings:</span>
                                    <span className="font-medium">{formatCurrency(option.savings)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Payment Sources:</h5>
                              <div className="space-y-1 text-sm">
                                {option.breakdown.hsaUsed > 0 && (
                                  <div className="flex justify-between">
                                    <span>HSA:</span>
                                    <span>{formatCurrency(option.breakdown.hsaUsed)}</span>
                                  </div>
                                )}
                                {option.breakdown.fsaUsed > 0 && (
                                  <div className="flex justify-between">
                                    <span>FSA:</span>
                                    <span>{formatCurrency(option.breakdown.fsaUsed)}</span>
                                  </div>
                                )}
                                {option.breakdown.outOfPocket > 0 && (
                                  <div className="flex justify-between">
                                    <span>Out of Pocket:</span>
                                    <span>{formatCurrency(option.breakdown.outOfPocket)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-green-700 mb-2">Pros:</h5>
                              <ul className="space-y-1">
                                {option.pros.map((pro, index) => (
                                  <li key={index} className="text-sm text-green-600 flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    {pro}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-red-700 mb-2">Cons:</h5>
                              <ul className="space-y-1">
                                {option.cons.map((con, index) => (
                                  <li key={index} className="text-sm text-red-600 flex items-start">
                                    <span className="text-red-500 mr-2">•</span>
                                    {con}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          {option.monthlyCost > 0 ? (
                            <span><strong>{formatCurrency(option.monthlyCost)}/month</strong> for {option.termMonths} months</span>
                          ) : (
                            <span><strong>One-time payment</strong> of {formatCurrency(option.totalCost)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedOption(option)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                          Select Option
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Disclaimer:</strong> {simulation.disclaimer}
                  </p>
                </div>
              </div>
            )}

            {!simulation && !isLoading && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-gray-400 text-6xl mb-4">💳</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Options Calculator</h3>
                <p className="text-gray-600">
                  Enter your financial information to see personalized payment options for your procedure.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Option Selection Modal */}
      {selectedOption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Confirm Payment Option</h3>
                <button
                  onClick={() => setSelectedOption(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">{selectedOption.title}</h4>
                  <p className="text-gray-600 text-sm mb-3">{selectedOption.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Cost:</span>
                      <div className="font-semibold">{formatCurrency(selectedOption.totalCost)}</div>
                    </div>
                    {selectedOption.monthlyCost > 0 && (
                      <div>
                        <span className="text-gray-600">Monthly Payment:</span>
                        <div className="font-semibold">{formatCurrency(selectedOption.monthlyCost)}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    <strong>Next Steps:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Contact your healthcare provider's billing department</li>
                    <li>Discuss this payment option and confirm availability</li>
                    <li>Complete any required applications or credit checks</li>
                    <li>Set up automatic payments if choosing a payment plan</li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedOption(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back to Options
                </button>
                <button
                  onClick={() => {
                    // In a real app, this would save the selection or redirect to payment setup
                    alert('Payment option saved! Contact your provider to set up this payment plan.')
                    setSelectedOption(null)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
