import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/estimate'
import Link from 'next/link'

interface CrowdfundPageProps {
  params: {
    slug: string
  }
}

// Mock crowdfund data for demo
const MOCK_CROWDFUND_DATA: Record<string, any> = {
  'john-doe-knee-surgery': {
    id: '1',
    slug: 'john-doe-knee-surgery',
    title: 'Help John with Knee Surgery Costs',
    patientName: 'John Doe',
    description: 'I need help covering the costs of my upcoming knee arthroscopy. After insurance, I still face significant out-of-pocket expenses that are putting financial strain on my family. Any support would be greatly appreciated.',
    targetAmount: 4500,
    currentAmount: 1250,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    estimate: {
      patientCostLow: 3800,
      patientCostHigh: 5200,
      facility: {
        name: 'Boston Medical Center',
        city: 'Boston',
        state: 'MA'
      }
    }
  },
  'demo-campaign': {
    id: '2', 
    slug: 'demo-campaign',
    title: 'Medical Expense Support',
    patientName: 'Demo Patient',
    description: 'This is a demonstration crowdfunding campaign showing how patients can raise funds for medical expenses through the CareStitch platform.',
    targetAmount: 3000,
    currentAmount: 750,
    isActive: true,
    createdAt: new Date('2024-01-20'),
    estimate: {
      patientCostLow: 2500,
      patientCostHigh: 3500,
      facility: {
        name: 'Massachusetts General Hospital',
        city: 'Boston',
        state: 'MA'
      }
    }
  }
}

export default async function CrowdfundPage({ params }: CrowdfundPageProps) {
  const crowdfundLink = MOCK_CROWDFUND_DATA[params.slug]

  if (!crowdfundLink) {
    notFound()
  }

  const progressPercentage = Math.min((crowdfundLink.currentAmount / crowdfundLink.targetAmount) * 100, 100)
  const remainingAmount = Math.max(crowdfundLink.targetAmount - crowdfundLink.currentAmount, 0)

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/crowdfund/${params.slug}`)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/crowdfund/${params.slug}`)}&text=${encodeURIComponent(`Help ${crowdfundLink.patientName} with medical expenses`)}`,
    email: `mailto:?subject=${encodeURIComponent(`Help ${crowdfundLink.patientName} with medical expenses`)}&body=${encodeURIComponent(`I'm raising funds for my upcoming knee arthroscopy procedure. Any support would be greatly appreciated: ${process.env.NEXT_PUBLIC_APP_URL}/crowdfund/${params.slug}`)}`
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
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {crowdfundLink.title}
            </h1>
            <p className="text-lg text-gray-600">
              Supporting {crowdfundLink.patientName}'s medical treatment
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(crowdfundLink.currentAmount)} raised
              </span>
              <span className="text-sm text-gray-500">
                {progressPercentage.toFixed(1)}% of goal
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-lg font-semibold text-gray-900">
                Goal: {formatCurrency(crowdfundLink.targetAmount)}
              </span>
              <span className="text-sm text-gray-600">
                {formatCurrency(remainingAmount)} to go
              </span>
            </div>
          </div>

          {/* Donate Button */}
          <div className="text-center mb-6">
            <button
              onClick={() => alert('In a real application, this would integrate with a payment processor like Stripe or PayPal for secure donations.')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Donate Now
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Secure donation processing powered by Stripe
            </p>
          </div>

          {/* Share Buttons */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Help spread the word
            </h3>
            <div className="flex justify-center space-x-4">
              <a
                href={shareUrls.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                📘 Facebook
              </a>
              <a
                href={shareUrls.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600 transition-colors"
              >
                🐦 Twitter
              </a>
              <a
                href={shareUrls.email}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                ✉️ Email
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Campaign Story */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              About This Campaign
            </h2>
            <div className="prose prose-sm text-gray-600">
              <p>{crowdfundLink.description}</p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">Why This Matters</h3>
              <p className="text-sm text-blue-800">
                Healthcare costs can be overwhelming, even with insurance. Your support helps ensure 
                {crowdfundLink.patientName} can focus on recovery rather than financial stress.
              </p>
            </div>
          </div>

          {/* Medical Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Treatment Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Procedure</h3>
                <p className="text-gray-600">Knee Arthroscopy (CPT 29881)</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Facility</h3>
                <p className="text-gray-600">{crowdfundLink.estimate.facility.name}</p>
                <p className="text-sm text-gray-500">
                  {crowdfundLink.estimate.facility.city}, {crowdfundLink.estimate.facility.state}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900">Estimated Cost</h3>
                <p className="text-gray-600">
                  {formatCurrency(crowdfundLink.estimate.patientCostLow)} - {formatCurrency(crowdfundLink.estimate.patientCostHigh)}
                </p>
                <p className="text-sm text-gray-500">
                  After insurance and out-of-pocket expenses
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-900 mb-2">Transparency</h3>
              <p className="text-sm text-green-800">
                All funds raised will go directly toward medical expenses. Any unused funds 
                will be returned to donors or donated to a medical charity.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Donations (Mock) */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Supporters
          </h2>
          
          <div className="space-y-3">
            {/* Mock donations for demo */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Anonymous</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
              <span className="font-semibold text-green-600">$50</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Sarah M.</p>
                <p className="text-sm text-gray-500">1 day ago</p>
              </div>
              <span className="font-semibold text-green-600">$100</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Mike & Lisa</p>
                <p className="text-sm text-gray-500">2 days ago</p>
              </div>
              <span className="font-semibold text-green-600">$75</span>
            </div>
          </div>
          
          <p className="text-center text-gray-500 mt-4">
            {crowdfundLink.currentAmount > 0 ? 'Thank you to all supporters!' : 'Be the first to support this campaign!'}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 p-6 bg-white rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-2">
            Powered by CareStitch Healthcare Transparency Platform
          </p>
          <p className="text-xs text-gray-500">
            This is a demonstration of crowdfunding functionality for medical expenses.
          </p>
        </div>
      </div>
    </div>
  )
}
