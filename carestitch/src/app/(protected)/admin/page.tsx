'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/estimate'

interface AdminStats {
  totalEstimates: number
  totalUsers: number
  totalFacilities: number
  totalAidPrograms: number
  recentActivity: ActivityItem[]
}

interface ActivityItem {
  id: string
  action: string
  resourceType: string
  userId: string
  timestamp: string
  details: any
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'programs' | 'users' | 'audit'>('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data for demo - in production this would fetch from API
    const mockStats: AdminStats = {
      totalEstimates: 1247,
      totalUsers: 892,
      totalFacilities: 5,
      totalAidPrograms: 12,
      recentActivity: [
        {
          id: '1',
          action: 'estimate_created',
          resourceType: 'estimate',
          userId: 'user_123',
          timestamp: '2024-01-15T10:30:00Z',
          details: { facilityId: 'mgh', amount: 3500 }
        },
        {
          id: '2',
          action: 'aid_program_matched',
          resourceType: 'aid_program',
          userId: 'user_456',
          timestamp: '2024-01-15T09:15:00Z',
          details: { programId: 'mgh_charity', eligibilityScore: 85 }
        },
        {
          id: '3',
          action: 'crowdfund_created',
          resourceType: 'crowdfund_link',
          userId: 'user_789',
          timestamp: '2024-01-15T08:45:00Z',
          details: { targetAmount: 2800, title: 'Help with knee surgery' }
        }
      ]
    }

    setTimeout(() => {
      setStats(mockStats)
      setIsLoading(false)
    }, 1000)
  }, [])

  const mockFacilities = [
    {
      id: 'mgh',
      name: 'Massachusetts General Hospital',
      city: 'Boston',
      state: 'MA',
      qualityRating: 4.8,
      networkStatus: 'In-Network',
      lastRateUpdate: '2024-01-10',
      estimatesCount: 324
    },
    {
      id: 'bwh',
      name: 'Brigham and Women\'s Hospital',
      city: 'Boston',
      state: 'MA',
      qualityRating: 4.7,
      networkStatus: 'In-Network',
      lastRateUpdate: '2024-01-08',
      estimatesCount: 298
    }
  ]

  const mockAidPrograms = [
    {
      id: 'mgh_charity',
      name: 'MGH Charity Care Program',
      type: 'hospital',
      incomePctFPL: 400,
      applicationsCount: 45,
      approvalRate: 78,
      lastUpdated: '2024-01-12'
    },
    {
      id: 'mass_health',
      name: 'MassHealth Emergency Coverage',
      type: 'government',
      incomePctFPL: 138,
      applicationsCount: 89,
      approvalRate: 92,
      lastUpdated: '2024-01-14'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                CareStitch Admin
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
                User Dashboard
              </Link>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                Admin
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage facilities, aid programs, and monitor platform activity
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Estimates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEstimates.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🏥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Facilities</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFacilities}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">🤝</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Aid Programs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAidPrograms}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'facilities', label: 'Facilities' },
                { id: 'programs', label: 'Aid Programs' },
                { id: 'users', label: 'Users' },
                { id: 'audit', label: 'Audit Log' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {stats?.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.action.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            User {activity.userId} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {activity.resourceType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Facilities Tab */}
            {activeTab === 'facilities' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Facility Management</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Import Rates
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Facility
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quality Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Network Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Rate Update
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estimates
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockFacilities.map((facility) => (
                        <tr key={facility.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{facility.name}</div>
                              <div className="text-sm text-gray-500">{facility.city}, {facility.state}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-yellow-400">★</span>
                              <span className="ml-1 text-sm text-gray-900">{facility.qualityRating}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {facility.networkStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {facility.lastRateUpdate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {facility.estimatesCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Update Rates</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Aid Programs Tab */}
            {activeTab === 'programs' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Aid Program Management</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Add Program
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockAidPrograms.map((program) => (
                    <div key={program.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{program.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          program.type === 'hospital' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {program.type}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Income Limit:</span>
                          <span className="font-medium">{program.incomePctFPL}% FPL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Applications:</span>
                          <span className="font-medium">{program.applicationsCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Approval Rate:</span>
                          <span className="font-medium text-green-600">{program.approvalRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="font-medium">{program.lastUpdated}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                        <button className="text-red-600 hover:text-red-800 text-sm">Disable</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-800">
                    <strong>Privacy Notice:</strong> User management features are limited in this demo to protect privacy. 
                    In production, this would include user activity monitoring, role management, and support tools.
                  </p>
                </div>
              </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Log</h3>
                <div className="space-y-3">
                  {stats?.recentActivity.map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.action.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Resource: {activity.resourceType} | User: {activity.userId}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          View Details
                        </button>
                      </div>
                      {activity.details && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                          <pre className="text-gray-600">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
