'use client'

import { useState, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useForm, FieldErrors, UseFormRegister, UseFormHandleSubmit, UseFormSetValue, UseFormWatch } from 'react-hook-form'

const InsuranceFormSchema = z.object({
  surgery: z.string().min(1, 'Please select a surgery'),
  zip: z.string().min(5).max(5),
  deductibleMet: z.boolean(),
  outOfPocketSpent: z.number().min(0).max(50000),
  planType: z.enum(['ppo', 'hmo', 'epo', 'pos', 'hdhp', 'unknown']).optional(),
  deductible: z.number().min(0).max(20000).optional(),
  oopMax: z.number().min(0).max(50000).optional(),
  coinsurance: z.number().min(0).max(1).optional()
})

type InsuranceFormData = z.infer<typeof InsuranceFormSchema>

interface EstimateFormProps {
  onSubmit: (data: InsuranceFormData) => void
  isLoading?: boolean
}

interface PlanSnapshot {
  issuer: string
  planType: string
  network: string
  deductible: number
  oopMax: number
  coinsurance: number
  copayPcp: number
  copaySpecialist: number
  copayEr: number
  memberNumber: string
  groupNumber: string
  effectiveDate: string
  confidence: number
}

export default function EstimateForm({ onSubmit, isLoading = false }: EstimateFormProps) {
  const [useOCR, setUseOCR] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [planSnapshot, setPlanSnapshot] = useState<PlanSnapshot | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<InsuranceFormData>({
    resolver: zodResolver(InsuranceFormSchema),
    defaultValues: {
      surgery: '',
      zip: '02118',
      deductibleMet: false,
      outOfPocketSpent: 0,
      planType: 'unknown'
    }
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setOcrLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/ocr/insurance', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (response.ok && result.success) {
        setPlanSnapshot(result.planSnapshot)
        
        // Auto-fill form with OCR results
        setValue('deductible', result.planSnapshot.deductible)
        setValue('oopMax', result.planSnapshot.oopMax)
        setValue('coinsurance', result.planSnapshot.coinsurance)
        setValue('planType', result.planSnapshot.planType.toLowerCase() as any)
      } else {
        alert('Failed to process insurance card. Please enter information manually.')
      }
    } catch (error) {
      console.error('OCR error:', error)
      alert('Error processing insurance card. Please try again.')
    } finally {
      setOcrLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Insurance Information</h2>
      
      {/* OCR Toggle */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-blue-900">Upload Insurance Card</h3>
          <button
            type="button"
            onClick={() => setUseOCR(!useOCR)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {useOCR ? 'Enter manually instead' : 'Upload card instead'}
          </button>
        </div>
        
        {useOCR && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-blue-700">
              Upload a photo of your insurance card front. We'll extract your plan details automatically.
            </p>
            
            {ocrLoading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-600">Processing insurance card...</span>
              </div>
            )}
            
            {planSnapshot && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-medium text-green-900 mb-2">✓ Card Processed Successfully</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Issuer:</strong> {planSnapshot.issuer}</p>
                  <p><strong>Plan Type:</strong> {planSnapshot.planType}</p>
                  <p><strong>Deductible:</strong> ${planSnapshot.deductible.toLocaleString()}</p>
                  <p><strong>Out-of-Pocket Max:</strong> ${planSnapshot.oopMax.toLocaleString()}</p>
                  <p><strong>Coinsurance:</strong> {(planSnapshot.coinsurance * 100)}%</p>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Confidence: {(planSnapshot.confidence * 100).toFixed(0)}% - Please verify the information below
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Surgery Type
          </label>
          <select
            {...register('surgery')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">Select a surgery...</option>
            <option value="knee-arthroscopy">Knee Arthroscopy</option>
          </select>
          {errors.surgery && (
            <p className="mt-1 text-sm text-red-600">{errors.surgery.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code
          </label>
          <input
            type="text"
            {...register('zip')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="02118"
          />
          {errors.zip && (
            <p className="mt-1 text-sm text-red-600">{errors.zip.message}</p>
          )}
        </div>

        {/* Plan Details (shown if OCR used or manual entry) */}
        {(planSnapshot || !useOCR) && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Type
              </label>
              <select
                {...register('planType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="unknown">Unknown/Not Sure</option>
                <option value="ppo">PPO (Preferred Provider Organization)</option>
                <option value="hmo">HMO (Health Maintenance Organization)</option>
                <option value="epo">EPO (Exclusive Provider Organization)</option>
                <option value="pos">POS (Point of Service)</option>
                <option value="hdhp">HDHP (High Deductible Health Plan)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Deductible
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    {...register('deductible', { valueAsNumber: true })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="1500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Out-of-Pocket Maximum
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    {...register('oopMax', { valueAsNumber: true })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="6000"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coinsurance (Your Share After Deductible)
              </label>
              <select
                {...register('coinsurance', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value={0.1}>10%</option>
                <option value={0.15}>15%</option>
                <option value={0.2}>20%</option>
                <option value={0.25}>25%</option>
                <option value={0.3}>30%</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('deductibleMet')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">I have met my deductible this year</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount Already Spent Toward Out-of-Pocket Maximum
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              {...register('outOfPocketSpent', { valueAsNumber: true })}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="0"
            />
          </div>
          {errors.outOfPocketSpent && (
            <p className="mt-1 text-sm text-red-600">{errors.outOfPocketSpent.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || ocrLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Finding Facilities...' : 'Find Facilities'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Demo Notice:</strong> This is a demonstration using sample data for knee arthroscopy cost estimation in the Boston area. OCR processing is simulated.
        </p>
      </div>
    </div>
  )
}
