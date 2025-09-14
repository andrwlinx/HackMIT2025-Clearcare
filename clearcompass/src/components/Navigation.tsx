'use client'

import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function Navigation() {
  return (
    <nav className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Compass className="h-8 w-8 text-blue-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                ClearCompass
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/estimate" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Get Estimate
            </Link>
            <Link href="/aid" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Find Aid
            </Link>
            <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
