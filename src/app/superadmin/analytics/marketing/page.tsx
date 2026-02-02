'use client'

import { useState, useEffect } from 'react'
import { 
  Megaphone, Users, MousePointer, TrendingUp, Target, 
  DollarSign, Clock, ArrowRight, RefreshCw, Calendar,
  ChevronDown, UserPlus, CheckCircle, XCircle, Mail,
  Phone, Globe, Share2, Building2, Zap, BarChart3,
  PieChart, Activity, Award, AlertCircle, ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface LeadStats {
  overview: {
    totalLeads: number
    leadsToday: number
    leadsThisWeek: number
    leadsThisMonth: number
    conversionRate: string
    followUpsToday: number
    overdueFollowUps: number
    unassignedLeads: number
    pipelineValue: number
    avgScore: number
  }
  byStatus: Record<string, number>
  bySource: Record<string, number>
  byPriority: Record<string, number>
  byTeamMember: { id: string; name: string; count: number }[]
  leadsByDay: Record<string, number>
  recentConversions: {
    id: string
    name: string
    company: string | null
    convertedAt: string
    estimatedValue: number | null
  }[]
}

// Source config with colors
const sourceConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  website: { label: 'Website', icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  demo_request: { label: 'Demo Request', icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  referral: { label: 'Referral', icon: Share2, color: 'text-green-600', bgColor: 'bg-green-100' },
  social: { label: 'Social Media', icon: Share2, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  email: { label: 'Email', icon: Mail, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  phone: { label: 'Phone', icon: Phone, color: 'text-teal-600', bgColor: 'bg-teal-100' },
  partner: { label: 'Partner', icon: Building2, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  event: { label: 'Event', icon: Calendar, color: 'text-red-600', bgColor: 'bg-red-100' },
  advertising: { label: 'Advertising', icon: Megaphone, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  organic: { label: 'Organic Search', icon: Globe, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  other: { label: 'Other', icon: Zap, color: 'text-gray-600', bgColor: 'bg-gray-100' }
}

// Status config with colors for funnel
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  new: { label: 'New', color: 'text-blue-700', bgColor: 'bg-blue-500' },
  contacted: { label: 'Contacted', color: 'text-indigo-700', bgColor: 'bg-indigo-500' },
  qualified: { label: 'Qualified', color: 'text-purple-700', bgColor: 'bg-purple-500' },
  demo_scheduled: { label: 'Demo', color: 'text-cyan-700', bgColor: 'bg-cyan-500' },
  negotiating: { label: 'Negotiating', color: 'text-amber-700', bgColor: 'bg-amber-500' },
  won: { label: 'Won', color: 'text-green-700', bgColor: 'bg-green-500' },
  lost: { label: 'Lost', color: 'text-red-700', bgColor: 'bg-red-500' },
  nurturing: { label: 'Nurturing', color: 'text-gray-700', bgColor: 'bg-gray-500' }
}

export default function MarketingAnalyticsPage() {
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/leads/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  // Calculate funnel percentages
  const getFunnelData = () => {
    if (!stats) return []
    
    const stages = ['new', 'contacted', 'qualified', 'demo_scheduled', 'negotiating', 'won']
    const total = Object.values(stats.byStatus).reduce((a, b) => a + b, 0) || 1
    
    return stages.map((stage, index) => {
      const count = stats.byStatus[stage] || 0
      const percentage = ((count / total) * 100).toFixed(1)
      // Calculate width based on position in funnel (decreasing)
      const maxWidth = 100 - (index * 12)
      return {
        stage,
        count,
        percentage,
        maxWidth,
        ...statusConfig[stage]
      }
    })
  }

  // Get top sources
  const getTopSources = () => {
    if (!stats) return []
    
    const total = Object.values(stats.bySource).reduce((a, b) => a + b, 0) || 1
    
    return Object.entries(stats.bySource)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([source, count]) => ({
        source,
        count,
        percentage: ((count / total) * 100).toFixed(1),
        ...(sourceConfig[source] || sourceConfig.other)
      }))
  }

  // Get daily trend data
  const getDailyTrend = () => {
    if (!stats?.leadsByDay) return []
    
    const days = Object.entries(stats.leadsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14) // Last 14 days
    
    const maxCount = Math.max(...days.map(([, count]) => count), 1)
    
    return days.map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
      height: (count / maxCount) * 100
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Megaphone className="w-7 h-7 text-purple-600" />
              Marketing Analytics
            </h1>
            <p className="text-gray-600 mt-1">Lead funnel, sources, and team performance</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  const funnelData = getFunnelData()
  const topSources = getTopSources()
  const dailyTrend = getDailyTrend()
  const totalLeads = stats?.overview.totalLeads || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Megaphone className="w-7 h-7 text-purple-600" />
            Marketing Analytics
          </h1>
          <p className="text-gray-600 mt-1">Lead funnel, sources, and team performance</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/superadmin/leads"
            className="px-4 py-2 text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 flex items-center"
          >
            <Users className="w-4 h-4 mr-2" />
            View All Leads
          </Link>
          <button
            onClick={fetchStats}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-purple-500" />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.overview.totalLeads || 0}</p>
          <p className="text-sm text-gray-500">Total Leads</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <UserPlus className="w-6 h-6 text-blue-500" />
            <span className="text-xs text-green-500">+{stats?.overview.leadsThisWeek || 0}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.overview.leadsThisMonth || 0}</p>
          <p className="text-sm text-gray-500">This Month</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-green-500" />
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.overview.conversionRate || '0%'}</p>
          <p className="text-sm text-gray-500">Conversion Rate</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${(stats?.overview.pipelineValue || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500">Pipeline Value</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-amber-500" />
            <span className="text-xs text-amber-500">{stats?.overview.overdueFollowUps || 0} overdue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.overview.followUpsToday || 0}</p>
          <p className="text-sm text-gray-500">Follow-ups Today</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="text-xs text-red-500">needs attention</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.overview.unassignedLeads || 0}</p>
          <p className="text-sm text-gray-500">Unassigned</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
              Conversion Funnel
            </h3>
            <span className="text-sm text-gray-500">{totalLeads} total leads</span>
          </div>
          
          <div className="space-y-3">
            {funnelData.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                  <span className="text-sm text-gray-500">{stage.count} ({stage.percentage}%)</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div 
                    className={`h-full ${stage.bgColor} transition-all duration-500 rounded-lg flex items-center justify-end pr-3`}
                    style={{ width: `${Math.max(stage.count > 0 ? (stage.count / (funnelData[0]?.count || 1)) * 100 : 0, 5)}%` }}
                  >
                    {stage.count > 0 && (
                      <span className="text-white text-xs font-medium">{stage.count}</span>
                    )}
                  </div>
                </div>
                {index < funnelData.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ChevronDown className="w-4 h-4 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Lost & Nurturing */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-sm font-medium text-red-700">Lost</span>
                </div>
                <span className="text-lg font-bold text-red-700">{stats?.byStatus.lost || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Nurturing</span>
                </div>
                <span className="text-lg font-bold text-gray-700">{stats?.byStatus.nurturing || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-purple-500" />
              Lead Sources
            </h3>
            <span className="text-sm text-gray-500">Where leads come from</span>
          </div>

          {topSources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No lead data yet
            </div>
          ) : (
            <div className="space-y-4">
              {topSources.map((source) => {
                const Icon = source.icon
                return (
                  <div key={source.source} className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg ${source.bgColor} flex items-center justify-center mr-3`}>
                      <Icon className={`w-5 h-5 ${source.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{source.label}</span>
                        <span className="text-sm text-gray-500">{source.count} ({source.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${source.bgColor} rounded-full transition-all duration-500`}
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Team Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-500" />
              Team Performance
            </h3>
            <span className="text-sm text-gray-500">Leads per team member</span>
          </div>

          {!stats?.byTeamMember || stats.byTeamMember.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No team assignments yet
            </div>
          ) : (
            <div className="space-y-4">
              {stats.byTeamMember.map((member, index) => {
                const maxCount = stats.byTeamMember[0]?.count || 1
                const percentage = (member.count / maxCount) * 100
                const colors = ['bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500', 'bg-green-500']
                
                return (
                  <div key={member.id} className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-gray-600">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{member.name}</span>
                        <span className="text-sm font-bold text-gray-900">{member.count} leads</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pipeline Value by Priority */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-purple-500" />
              Leads by Priority
            </h3>
            <span className="text-sm text-gray-500">Distribution</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">Urgent</span>
                <Zap className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-700">{stats?.byPriority.urgent || 0}</p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-700">High</span>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-700">{stats?.byPriority.high || 0}</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Medium</span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-700">{stats?.byPriority.medium || 0}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Low</span>
                <Clock className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-2xl font-bold text-gray-700">{stats?.byPriority.low || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-500" />
            Lead Acquisition Trend
          </h3>
          <span className="text-sm text-gray-500">Last 14 days</span>
        </div>

        {dailyTrend.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No lead data yet
          </div>
        ) : (
          <div className="flex items-end justify-between h-48 gap-2">
            {dailyTrend.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '160px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500"
                    style={{ height: `${Math.max(day.height, 5)}%` }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">{day.date}</p>
                  <p className="text-xs font-medium text-gray-700">{day.count}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Conversions */}
      {stats?.recentConversions && stats.recentConversions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              Recent Conversions
            </h3>
            <Link 
              href="/superadmin/leads?status=won"
              className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
            >
              View all <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {stats.recentConversions.map((lead) => (
              <div key={lead.id} className="p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-green-700 truncate">{lead.name}</span>
                </div>
                {lead.company && (
                  <p className="text-xs text-green-600 truncate mb-1">{lead.company}</p>
                )}
                <p className="text-xs text-green-500">
                  {new Date(lead.convertedAt).toLocaleDateString()}
                </p>
                {lead.estimatedValue && (
                  <p className="text-sm font-bold text-green-700 mt-2">
                    ${lead.estimatedValue.toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* More Marketing Analytics - Coming Soon */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">More Marketing Analytics Coming Soon</h3>
            <p className="text-gray-600 mb-4">
              We&apos;re building additional marketing analytics to help you understand your acquisition channels better.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-lg border border-purple-100">
                <MousePointer className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">UTM Tracking</p>
                <p className="text-xs text-gray-500">Campaign attribution</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-purple-100">
                <Globe className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">Landing Pages</p>
                <p className="text-xs text-gray-500">Page performance</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-purple-100">
                <Clock className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">Lead Velocity</p>
                <p className="text-xs text-gray-500">Time in each stage</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-purple-100">
                <BarChart3 className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">ROI Analysis</p>
                <p className="text-xs text-gray-500">Channel ROI</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
