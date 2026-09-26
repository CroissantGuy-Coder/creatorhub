import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import { getCategoryBadgeClass, getStatusBadgeClass, formatCurrency, timeAgo } from '../utils/constants'

const PLATFORM_ICONS = {
  discord: '💬', github: '🐙', twitter: '🐦', instagram: '📸',
  portfolio: '🌐', email: '📧', roblox: '🎮', youtube: '▶️', other: '🔗'
}

export default function UserProfilePage() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('active')

  useEffect(() => {
    setLoading(true)
    api.get(`/users/${username}`)
      .then(res => setProfile(res.data))
      .catch(err => setError(err.response?.data?.error || 'User not found'))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full shimmer" />
          <div className="space-y-2">
            <div className="h-6 w-40 shimmer rounded" />
            <div className="h-4 w-60 shimmer rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-xl font-bold text-white mb-2">User Not Found</h2>
        <p className="text-slate-400">{error}</p>
      </div>
    )
  }

  const activeAds = profile.advertisements.filter(a => a.status === 'active')
  const closedAds = profile.advertisements.filter(a => a.status !== 'active')
  const displayAds = tab === 'active' ? activeAds : closedAds

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile header */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-2xl font-bold">{profile.username?.[0]?.toUpperCase()}</span>
            )}
          </div>

          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-white mb-1">{profile.username}</h1>
            {profile.bio && <p className="text-slate-300 text-sm mb-3 leading-relaxed">{profile.bio}</p>}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
              <span>{profile.advertisements.length} advertisement{profile.advertisements.length !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span>Member since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
            </div>

            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-brand-600/20 text-brand-300 border border-brand-500/30 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Social links */}
          {profile.social_links?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.social_links.map((link, i) => (
                <a
                  key={i}
                  href={link.url?.startsWith('http') ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.platform}
                  className="w-9 h-9 rounded-lg bg-surface-600 hover:bg-surface-500 flex items-center justify-center transition-colors text-lg"
                >
                  {PLATFORM_ICONS[link.platform] || '🔗'}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advertisements */}
      <div>
        <div className="flex items-center gap-1 mb-5 border-b border-surface-600 pb-1">
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === 'active' ? 'text-white border-b-2 border-brand-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({activeAds.length})
          </button>
          <button
            onClick={() => setTab('closed')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === 'closed' ? 'text-white border-b-2 border-brand-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            Previous ({closedAds.length})
          </button>
        </div>

        {displayAds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No {tab} advertisements</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAds.map(ad => (
              <Link
                key={ad.id}
                to={`/advertisements/${ad.id}`}
                className="card-hover flex items-center justify-between p-4 gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={getCategoryBadgeClass(ad.category)}>{ad.category}</span>
                    <span className="text-xs text-slate-500">{ad.job_type}</span>
                    <span className={getStatusBadgeClass(ad.status)}>{ad.status}</span>
                  </div>
                  <p className="text-white font-medium truncate">{ad.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{timeAgo(ad.created_at)}</p>
                </div>
                {ad.payment_amount && (
                  <div className="text-brand-400 font-semibold text-sm flex-shrink-0">
                    {formatCurrency(ad.payment_amount, ad.payment_currency)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
