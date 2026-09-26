import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { getCategoryBadgeClass, getStatusBadgeClass, timeAgo } from '../utils/constants'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'ads', label: 'Advertisements', icon: '📋' },
  { id: 'reports', label: 'Reports', icon: '🚩' },
  { id: 'flagged', label: 'Flagged Links', icon: '🔗' },
  { id: 'payments', label: 'Payments', icon: '💰' },
]

const THREAT_COLORS = {
  MALWARE_OR_SCAM: 'text-red-400 bg-red-500/10 border-red-500/30',
  PHISHING: 'text-red-400 bg-red-500/10 border-red-500/30',
  INAPPROPRIATE_CONTENT: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  SUSPICIOUS_DOMAIN: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  MALWARE: 'text-red-400 bg-red-500/10 border-red-500/30',
  SOCIAL_ENGINEERING: 'text-red-400 bg-red-500/10 border-red-500/30',
  UNWANTED_SOFTWARE: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  POTENTIALLY_HARMFUL_APPLICATION: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [ads, setAds] = useState([])
  const [reports, setReports] = useState([])
  const [flaggedLinks, setFlaggedLinks] = useState([])
  const [payments, setPayments] = useState([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [adSearch, setAdSearch] = useState('')
  const [adStatus, setAdStatus] = useState('')

  useEffect(() => {
    setLoading(true)
    if (tab === 'overview') {
      api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {}).finally(() => setLoading(false))
    } else if (tab === 'users') {
      api.get('/admin/users').then(res => setUsers(res.data.users || [])).catch(() => {}).finally(() => setLoading(false))
    } else if (tab === 'ads') {
      api.get('/admin/advertisements').then(res => setAds(res.data.advertisements || [])).catch(() => {}).finally(() => setLoading(false))
    } else if (tab === 'reports') {
      api.get('/admin/reports?status=pending').then(res => setReports(res.data.reports || [])).catch(() => {}).finally(() => setLoading(false))
    } else if (tab === 'flagged') {
      api.get('/admin/flagged-links').then(res => setFlaggedLinks(res.data.flagged_links || [])).catch(() => {}).finally(() => setLoading(false))
    } else if (tab === 'payments') {
      api.get('/admin/payments').then(res => {
        setPayments(res.data.payments || [])
        setTotalRevenue(res.data.total_revenue || 0)
      }).catch(() => {}).finally(() => setLoading(false))
    }
  }, [tab])

  async function toggleSuspend(userId, suspended) {
    try {
      await api.patch(`/admin/users/${userId}/suspend`, { suspended: !suspended })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: !suspended ? 1 : 0 } : u))
      toast.success(`User ${!suspended ? 'suspended' : 'unsuspended'}`)
    } catch { toast.error('Failed to update user') }
  }

  async function handleAdStatus(adId, status) {
    try {
      await api.patch(`/admin/advertisements/${adId}/status`, { status })
      setAds(prev => prev.map(a => a.id === adId ? { ...a, status } : a))
      toast.success(`Ad marked as ${status}`)
    } catch { toast.error('Failed to update ad') }
  }

  async function handleDeleteAd(adId) {
    if (!window.confirm('Delete this advertisement?')) return
    try {
      await api.delete(`/admin/advertisements/${adId}`)
      setAds(prev => prev.filter(a => a.id !== adId))
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  async function resolveReport(reportId, status) {
    try {
      await api.patch(`/admin/reports/${reportId}/resolve`, { status })
      setReports(prev => prev.filter(r => r.id !== reportId))
      toast.success(`Report ${status}`)
    } catch { toast.error('Failed') }
  }

  async function handleUnfeature(adId) {
    try {
      await api.patch(`/admin/payments/${adId}/unfeature`)
      setPayments(prev => prev.map(p =>
        p.advertisement_id === adId ? { ...p, is_featured: 0, featured_until: null } : p
      ))
      toast.success('Advertisement unfeatured')
    } catch { toast.error('Failed to unfeature') }
  }

  async function reviewFlaggedLink(linkId, action) {    try {
      await api.patch(`/admin/flagged-links/${linkId}/review`, { action })
      setFlaggedLinks(prev => prev.filter(l => l.id !== linkId))
      const msgs = {
        dismissed: 'Link dismissed — no action taken',
        warned_user: 'User warned',
        removed_content: 'Content removed from platform',
        banned_user: 'User account suspended',
      }
      toast.success(msgs[action] || 'Action taken')
    } catch { toast.error('Failed to take action') }
  }

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredAds = ads.filter(a => {
    const matchSearch = !adSearch ||
      a.title.toLowerCase().includes(adSearch.toLowerCase()) ||
      a.username?.toLowerCase().includes(adSearch.toLowerCase())
    const matchStatus = !adStatus || a.status === adStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">🛡️</span>
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">Platform management and moderation</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-surface-600 mb-8 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t.id ? 'border-brand-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="card h-24 shimmer" />)}
            </div>
          ) : stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                {[
                  { label: 'Total Users',      value: stats.stats.total_users,      color: 'text-brand-400'  },
                  { label: 'Total Ads',        value: stats.stats.total_ads,        color: 'text-brand-400'  },
                  { label: 'Active Ads',       value: stats.stats.active_ads,       color: 'text-green-400'  },
                  { label: 'Pending Reports',  value: stats.stats.pending_reports,  color: 'text-amber-400'  },
                  { label: 'Suspended Users',  value: stats.stats.suspended_users,  color: 'text-red-400'    },
                  { label: 'Flagged Links',    value: stats.stats.flagged_links ?? 0, color: 'text-orange-400' },
                ].map(stat => (
                  <div key={stat.label} className="card p-4 text-center">
                    <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-slate-400 text-xs mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-4">Recent Users</h3>
                  <div className="space-y-3">
                    {stats.recent_users.map(u => (
                      <div key={u.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{u.username}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.is_suspended ? <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">Suspended</span> : null}
                          <span className="text-slate-500 text-xs">{timeAgo(u.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-4">Recent Advertisements</h3>
                  <div className="space-y-3">
                    {stats.recent_ads.map(a => (
                      <div key={a.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium truncate max-w-[200px]">{a.title}</p>
                          <p className="text-slate-500 text-xs">by {a.username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={getCategoryBadgeClass(a.category)}>{a.category}</span>
                          <span className="text-slate-500 text-xs">{timeAgo(a.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Users ── */}
      {tab === 'users' && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="input max-w-xs"
              placeholder="Search users..."
            />
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-500">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-600">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No users found</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-surface-700/50">
                    <td className="px-4 py-3">
                      <Link to={`/profile/${u.username}`} className="text-white hover:text-brand-300 font-medium transition-colors">
                        {u.username}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{timeAgo(u.created_at)}</td>
                    <td className="px-4 py-3">
                      {u.is_suspended
                        ? <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">Suspended</span>
                        : <span className="badge badge-active">Active</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleSuspend(u.id, !!u.is_suspended)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          u.is_suspended
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Advertisements ── */}
      {tab === 'ads' && (
        <div>
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <input value={adSearch} onChange={e => setAdSearch(e.target.value)} className="input max-w-xs" placeholder="Search ads..." />
            <select value={adStatus} onChange={e => setAdStatus(e.target.value)} className="input max-w-[150px]">
              <option value="">All Status</option>
              <option value="active">active</option>
              <option value="closed">closed</option>
              <option value="filled">filled</option>
              <option value="removed">removed</option>
            </select>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-500">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Poster</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-600">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : filteredAds.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No advertisements found</td></tr>
                ) : filteredAds.map(a => (
                  <tr key={a.id} className="hover:bg-surface-700/50">
                    <td className="px-4 py-3">
                      <Link to={`/advertisements/${a.id}`} className="text-white hover:text-brand-300 font-medium transition-colors line-clamp-1 max-w-[200px] block">
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={getCategoryBadgeClass(a.category)}>{a.category}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{a.username}</td>
                    <td className="px-4 py-3"><span className={getStatusBadgeClass(a.status)}>{a.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.status !== 'removed' && (
                          <button onClick={() => handleAdStatus(a.id, 'removed')} className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors">
                            Remove
                          </button>
                        )}
                        {a.status === 'removed' && (
                          <button onClick={() => handleAdStatus(a.id, 'active')} className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                            Restore
                          </button>
                        )}
                        <button onClick={() => handleDeleteAd(a.id)} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Reports ── */}
      {tab === 'reports' && (
        <div>
          <h2 className="section-title mb-5">Pending Reports ({reports.length})</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 card shimmer" />)}</div>
          ) : reports.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-white font-semibold">No pending reports</p>
              <p className="text-slate-400 text-sm mt-1">The community is safe!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(r => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={getCategoryBadgeClass(r.category)}>{r.category}</span>
                        <span className="text-sm font-semibold text-amber-400">"{r.reason}"</span>
                      </div>
                      <Link to={`/advertisements/${r.advertisement_id}`} className="text-white hover:text-brand-300 font-medium transition-colors">
                        {r.ad_title}
                      </Link>
                      <p className="text-slate-400 text-sm mt-1">{r.details || 'No additional details'}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        Reported by <span className="text-slate-400">{r.reporter_username}</span> · {timeAgo(r.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => resolveReport(r.id, 'resolved')} className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                        Take Action
                      </button>
                      <button onClick={() => resolveReport(r.id, 'dismissed')} className="text-xs px-3 py-1.5 bg-surface-500 text-slate-400 rounded-lg hover:bg-surface-400 transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Payments ── */}
      {tab === 'payments' && (
        <div>
          {/* Revenue summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="card p-5 text-center border-green-500/20">
              <p className="text-3xl font-display font-bold text-green-400">
                ${totalRevenue.toFixed(2)}
              </p>
              <p className="text-slate-400 text-sm mt-1">Total Revenue</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-3xl font-display font-bold text-brand-400">
                {payments.filter(p => p.status === 'completed').length}
              </p>
              <p className="text-slate-400 text-sm mt-1">Completed Payments</p>
            </div>
            <div className="card p-5 text-center border-amber-500/20">
              <p className="text-3xl font-display font-bold text-amber-400">
                {payments.filter(p => p.is_featured && p.featured_until && new Date(p.featured_until) > new Date()).length}
              </p>
              <p className="text-slate-400 text-sm mt-1">Currently Featured Ads</p>
            </div>
          </div>

          <h2 className="section-title mb-5">Payment History</h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 card shimmer" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">💰</p>
              <p className="text-white font-semibold">No payments yet</p>
              <p className="text-slate-400 text-sm mt-1">Payments will appear here once users start featuring their ads.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-surface-500">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Advertisement</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">User</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Featured Until</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-600">
                  {payments.map(p => {
                    const isActiveFeatured = p.is_featured && p.featured_until && new Date(p.featured_until) > new Date()
                    return (
                      <tr key={p.id} className="hover:bg-surface-700/50">
                        <td className="px-4 py-3">
                          <Link
                            to={`/advertisements/${p.advertisement_id}`}
                            className="text-white hover:text-brand-300 font-medium transition-colors line-clamp-1 max-w-[180px] block"
                          >
                            {p.ad_title}
                          </Link>
                          <span className={`badge text-xs mt-0.5 ${
                            p.category === 'roblox' ? 'badge-roblox' :
                            p.category === 'blender' ? 'badge-blender' : 'badge-coding'
                          }`}>{p.category}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                          <Link to={`/profile/${p.username}`} className="hover:text-white transition-colors">
                            {p.username}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-green-400 font-semibold">
                          ${parseFloat(p.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge text-xs ${
                            p.status === 'completed' ? 'badge-active' :
                            p.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'badge-closed'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-slate-400 text-xs">
                          {p.featured_until
                            ? new Date(p.featured_until).toLocaleDateString()
                            : '—'}
                          {isActiveFeatured && (
                            <span className="ml-2 text-amber-400 font-medium">⭐ Live</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isActiveFeatured && (
                            <button
                              onClick={() => handleUnfeature(p.advertisement_id)}
                              className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              Remove Feature
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Flagged Links ── */}      {tab === 'flagged' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">Flagged Links</h2>
              <p className="text-slate-400 text-sm mt-1">
                URLs automatically detected as unsafe in advertisements and profiles
              </p>
            </div>
            <span className="badge bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm px-3 py-1.5">
              {flaggedLinks.length} unreviewed
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 card shimmer" />)}</div>
          ) : flaggedLinks.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-3">🛡️</p>
              <p className="text-white font-semibold">No flagged links</p>
              <p className="text-slate-400 text-sm mt-1">All links on the platform look clean.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedLinks.map(link => {
                const colorClass = THREAT_COLORS[link.threat_type] || 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                return (
                  <div key={link.id} className="card p-5 border-orange-500/20">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`badge border text-xs ${colorClass}`}>
                            ⚠️ {link.threat_type.replace(/_/g, ' ')}
                          </span>
                          <span className="badge bg-surface-500 text-slate-300 border border-surface-400 text-xs capitalize">
                            {link.source_type}
                          </span>
                        </div>

                        {/* The flagged URL */}
                        <p className="text-white font-mono text-sm break-all mb-1">{link.url}</p>
                        <p className="text-slate-400 text-xs mb-3">{link.threat_detail}</p>

                        {/* Meta */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span>
                            By{' '}
                            <Link to={`/profile/${link.flagged_username}`} className="text-slate-300 hover:text-white transition-colors">
                              {link.flagged_username}
                            </Link>
                          </span>
                          <span>·</span>
                          {link.source_type === 'advertisement' && (
                            <Link to={`/advertisements/${link.source_id}`} className="text-brand-400 hover:text-brand-300 transition-colors">
                              View Ad
                            </Link>
                          )}
                          {link.source_type === 'profile' && (
                            <Link to={`/profile/${link.flagged_username}`} className="text-brand-400 hover:text-brand-300 transition-colors">
                              View Profile
                            </Link>
                          )}
                          <span>·</span>
                          <span>{timeAgo(link.created_at)}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-1.5 min-w-[150px]">
                        <button
                          onClick={() => reviewFlaggedLink(link.id, 'dismissed')}
                          className="text-xs px-3 py-2 bg-surface-500 text-slate-300 rounded-lg hover:bg-surface-400 transition-colors text-left"
                        >
                          ✓ Dismiss (false positive)
                        </button>
                        <button
                          onClick={() => reviewFlaggedLink(link.id, 'warned_user')}
                          className="text-xs px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-left"
                        >
                          ⚠️ Warn User
                        </button>
                        <button
                          onClick={() => reviewFlaggedLink(link.id, 'removed_content')}
                          className="text-xs px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-left"
                        >
                          🗑️ Remove Content
                        </button>
                        <button
                          onClick={() => reviewFlaggedLink(link.id, 'banned_user')}
                          className="text-xs px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-left"
                        >
                          🚫 Ban User
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
