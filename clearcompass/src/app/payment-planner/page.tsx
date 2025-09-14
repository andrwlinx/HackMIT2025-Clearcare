'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calculator, DollarSign, Users, TrendingUp, Bot, AlertCircle } from 'lucide-react';
import { createPaymentPlan, PaymentPlannerInputs, PaymentPlannerResult } from '@/lib/payment-planner';
import Link from 'next/link'
import { FAKE_FACILITIES } from '@/data/facilities';

export default function PaymentPlannerPage() {
  const searchParams = useSearchParams();

  // Get initial values from URL params (from cost estimate)
  const initialHospital = searchParams.get('hospital') || 'Boston Medical Center';
  const initialCost = parseFloat(searchParams.get('cost') || '3200');
  const initialInsurance = searchParams.get('insurance') || 'Blue Cross Blue Shield PPO';

  const [inputs, setInputs] = useState<PaymentPlannerInputs>({
    hospital: initialHospital,
    procedureCost: initialCost,
    insuranceType: initialInsurance,
    annualSalary: 50000,
    familyMembers: 2,
    monthlyExpenses: 2500
  });

  const [result, setResult] = useState<PaymentPlannerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof PaymentPlannerInputs, value: string | number) => {
    setInputs(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (isNaN(Number(value)) ? value : Number(value)) : value
    }));
  };

  const generateAIPlan = async () => {
    setIsLoading(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use AI model to generate personalized payment plans and financial aid options
      const aiGeneratedResult = createPaymentPlan(inputs);
      setResult(aiGeneratedResult);
    } catch (error) {
      console.error('Error generating AI payment plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                ClearCompass Demo
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                Home
              </Link>
              <Link href="/estimate" className="text-gray-700 hover:text-gray-900">
                Get Estimate
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Payment Planner</h1>
              <p className="text-gray-600">AI-powered personalized payment plans and financial assistance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Input Form */}
          <div className="space-y-6">
            {/* Procedure & Hospital Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                Procedure Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Hospital
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={inputs.hospital}
                    onChange={(e) => handleInputChange('hospital', e.target.value)}
                  >
                    {FAKE_FACILITIES.map((facility) => (
                      <option key={facility.id} value={facility.name}>
                        {facility.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Procedure Cost
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={inputs.procedureCost}
                    onChange={(e) => handleInputChange('procedureCost', e.target.value)}
                    min="0"
                    step="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Type
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={inputs.insuranceType}
                    onChange={(e) => handleInputChange('insuranceType', e.target.value)}
                  >
                    <option value="Blue Cross Blue Shield PPO">Blue Cross Blue Shield PPO</option>
                    <option value="Aetna HMO">Aetna HMO</option>
                    <option value="UnitedHealth HDHP">UnitedHealth HDHP</option>
                    <option value="Uninsured">Uninsured</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                Your Financial Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Household Income
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={inputs.annualSalary}
                    onChange={(e) => handleInputChange('annualSalary', e.target.value)}
                    min="0"
                    step="1000"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family Size (including yourself)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={inputs.familyMembers}
                    onChange={(e) => handleInputChange('familyMembers', e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Essential Expenses
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={inputs.monthlyExpenses}
                    onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
                    min="0"
                    step="100"
                    placeholder="2500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Include rent, utilities, food, transportation, etc.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Generate Button */}
            <button
              onClick={generateAIPlan}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  AI is generating your personalized plan...
                </>
              ) : (
                <>
                  <Bot className="h-5 w-5 mr-2" />
                  Generate AI-Powered Payment Plan
                </>
              )}
            </button>
          </div>

          {/* Right Column - AI Generated Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* AI Badge */}
                <div className="flex items-center justify-center">
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">AI-Generated Results</span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">📊 Financial Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Procedure Cost:</span>
                      <span className="ml-2 font-medium text-gray-900">${result.summary.procedureCost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Hospital:</span>
                      <span className="ml-2 font-medium text-gray-900">{result.summary.hospital}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Annual Income:</span>
                      <span className="ml-2 font-medium text-gray-900">${result.summary.annualIncome.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Family Size:</span>
                      <span className="ml-2 font-medium text-gray-900">{result.summary.familySize}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Income Level:</span>
                      <span className="ml-2 font-medium text-gray-900">{result.summary.fplPercentage}% of FPL</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Disposable Income:</span>
                      <span className="ml-2 font-medium text-gray-900">${result.summary.monthlyDisposableIncome.toLocaleString()}/mo</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">🎯 AI Recommendation:</h4>
                    <div className="text-blue-800 whitespace-pre-line">{result.recommendation}</div>
                  </div>
                </div>

                {/* AI Generated Payment Plans */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">💳 AI-Generated Payment Plans</h3>
                  <div className="space-y-4">
                    {result.paymentPlans.map((plan, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg text-gray-900">{plan.name}</h4>
                          <span className="text-2xl font-bold text-blue-600">
                            ${plan.monthlyPayment.toLocaleString()}/mo
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                          <div>Duration: {plan.totalMonths} months</div>
                          <div>Total Cost: ${plan.totalCost.toLocaleString()}</div>
                          <div>Interest Rate: {(plan.interestRate * 100).toFixed(1)}%</div>
                          <div>Provider: {plan.provider}</div>
                        </div>
                        <p className="text-sm text-gray-700 italic">{plan.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Generated Financial Aid */}
                {result.aidPrograms.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">🤝 AI-Matched Financial Assistance</h3>
                    <div className="space-y-4">
                      {result.aidPrograms.map((program, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{program.name}</h4>
                              <span className="text-sm text-gray-600 capitalize">({program.type})</span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                ${program.estimatedSavings.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-600">potential savings</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Coverage:</strong> {program.coverage}
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Requirements:</strong> {program.requirements.join(', ')}
                          </div>
                          <div className="text-sm">
                            <strong>Apply:</strong>{' '}
                            {program.applicationUrl.startsWith('http') ? (
                              <a href={program.applicationUrl} target="_blank" rel="noopener noreferrer"
                                className="text-blue-600 hover:underline">
                                {program.applicationUrl}
                              </a>
                            ) : (
                              <span className="text-gray-700">{program.applicationUrl}</span>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${program.priority === 'High'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {program.priority} Priority
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">AI-Generated Results Disclaimer</p>
                      <p>These payment plans and financial assistance options were generated using AI based on your financial profile. Actual eligibility, terms, and savings may vary. Please verify all details with providers before making financial commitments.</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for AI Analysis</h3>
                <p className="text-gray-600">Fill in your financial information and click "Generate AI-Powered Payment Plan" to get personalized recommendations powered by artificial intelligence.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
