import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <Compass className="h-8 w-8 text-blue-400" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  ClearCompass
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/estimate" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Get Estimate
              </Link>
              <Link href="/aid" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Find Aid
              </Link>
              <Link href="/payment-planner" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Payment Planner
              </Link>
              <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Check your healthcare costs
            <span className="text-blue-600"> before you decide</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed">
            Get transparent cost estimates for healthcare operations at different facilities near you. 
            Compare prices, quality ratings, and find financial assistance programs.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/estimate"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">🩺</span>
              Get My Estimate
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">🏥</span>
              Compare Facilities
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Platform Features</h2>
            <p className="mt-4 text-4xl font-bold text-gray-900 leading-tight">
              Everything you need for informed healthcare decisions
            </p>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform helps you navigate healthcare costs with confidence and transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                💰
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cost Transparency</h3>
              <p className="text-gray-600">
                Detailed cost breakdowns including facility fees, anesthesia, medications, and rehabilitation with confidence scoring.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                🏥
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Ratings</h3>
              <p className="text-gray-600">
                Compare facilities based on patient outcomes, safety scores, satisfaction ratings, and network status.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                🤝
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Financial Assistance</h3>
              <p className="text-gray-600">
                Find and apply for charity care programs, payment plans, and other financial aid options with eligibility matching.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                💳
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Options</h3>
              <p className="text-gray-600">
                Explore payment plans, HSA/FSA optimization, and crowdfunding options to make healthcare affordable.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your personalized cost estimate in just 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Enter Your Info</h3>
              <p className="text-gray-600 text-lg">
                Upload your insurance card or enter your plan details manually. We'll extract the key information you need.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Compare Facilities</h3>
              <p className="text-gray-600 text-lg">
                See cost estimates, quality ratings, and network status for facilities in your area. Filter by distance and preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Get Your Plan</h3>
              <p className="text-gray-600 text-lg">
                Receive detailed cost breakdown, find financial assistance, explore payment options, and make an informed decision.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 m-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">!</span>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Demo Application</h3>
            <p className="text-yellow-700 leading-relaxed">
              This is a comprehensive demonstration of a healthcare cost transparency platform focused on knee arthroscopy procedures. 
              All data is simulated for educational purposes. In a real implementation, this would integrate with actual healthcare 
              pricing databases, insurance networks, and financial assistance programs while maintaining strict HIPAA compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
