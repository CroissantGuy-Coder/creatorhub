import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import FeaturedAdCard from './FeaturedAdCard'

/**
 * Reusable featured ads section.
 * Props:
 *   category (optional) — filter by category slug e.g. "roblox"
 *   limit    (optional) — max ads to show, default 4
 *   title    (optional) — section heading override
 */
export default function FeaturedAdsSection({ category = '', limit = 4, title = 'Featured Advertisements' }) {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({
      status: 'active',
      sort: 'newest',
      limit,
    })
    // We fetch all and filter is_featured client-side because the API
    // returns is_featured in the payload and avoids a separate endpoint.
    // For large sites you'd add ?featured=1 to the query.
    if (category) params.set('category', category)

    api.get(`/advertisements?${params}`)
      .then(res => {
        const featured = (res.data.advertisements || []).filter(ad => {
          if (!ad.is_featured) return false
          if (ad.featured_until && new Date(ad.featured_until) < new Date()) return false
          return true
        })
        setAds(featured.slice(0, limit))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category, limit])

  // Don't render if nothing to show and not loading
  if (!loading && ads.length === 0) return null

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <h2 className="font-display text-xl font-bold text-white">{title}</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Promoted
          </span>
        </div>
        <Link to="/browse" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1">
          View all
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {loading ? (
        // Skeleton
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-amber-500/20 bg-surface-700 p-5 h-52 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-5 w-16 shimmer rounded-full" />
                <div className="h-5 w-12 shimmer rounded-full" />
              </div>
              <div className="h-4 w-full shimmer rounded mb-2" />
              <div className="h-4 w-3/4 shimmer rounded mb-4" />
              <div className="h-3 w-full shimmer rounded mb-1" />
              <div className="h-3 w-2/3 shimmer rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ads.map(ad => (
            <FeaturedAdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}

      {/* Upsell banner for non-featured users */}
      <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <p className="text-slate-400 text-xs">
          Want your ad here? <span className="text-amber-400 font-medium">Feature it for just $5</span> and get seen by thousands of creators.
        </p>
        <Link
          to="/dashboard"
          className="flex-shrink-0 ml-4 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)', color: '#fde68a' }}
        >
          Feature My Ad →
        </Link>
      </div>
    </section>
  )
}
