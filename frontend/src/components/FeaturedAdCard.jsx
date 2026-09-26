import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, getCategoryBadgeClass, formatCurrency, timeAgo } from '../utils/constants'

export default function FeaturedAdCard({ ad }) {
  const category = CATEGORIES[ad.category]

  return (
    <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-br from-surface-700 to-surface-800 hover:border-amber-400/60 hover:from-surface-600 hover:to-surface-700 transition-all duration-200 hover:-translate-y-1 group"
      style={{ boxShadow: '0 0 20px rgba(245, 158, 11, 0.08)' }}>

      {/* Gold shimmer top border */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

      {/* Featured badge */}
      <div className="absolute top-3 right-3">
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 backdrop-blur-sm">
          ⭐ Featured
        </span>
      </div>

      <div className="p-5">
        {/* Category + job type */}
        <div className="flex items-center gap-2 mb-3 flex-wrap pr-20">
          <span className={getCategoryBadgeClass(ad.category)}>
            {category?.icon} {category?.label || ad.category}
          </span>
          <span className="badge bg-surface-500 text-slate-300 border border-surface-400 text-xs">
            {ad.job_type}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-white text-base mb-2 leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
          {ad.title}
        </h3>

        {/* Description */}
        {ad.description && (
          <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
            {ad.description}
          </p>
        )}

        {/* Tags */}
        {ad.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {ad.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-amber-500/10 text-amber-400/80 rounded-md text-xs border border-amber-500/20">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-surface-500/60">
          {/* Poster */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center overflow-hidden flex-shrink-0">
              {ad.avatar_url ? (
                <img src={ad.avatar_url} alt={ad.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">
                  {ad.username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <Link
              to={`/profile/${ad.username}`}
              className="text-sm text-slate-400 hover:text-white transition-colors truncate max-w-[90px]"
              onClick={e => e.stopPropagation()}
            >
              {ad.username}
            </Link>
          </div>

          {/* Pay + button */}
          <div className="flex items-center gap-3">
            {ad.payment_amount || ad.payment_type === 'Negotiable' ? (
              <span className="text-amber-400 font-semibold text-sm">
                {ad.payment_type === 'Negotiable'
                  ? 'Negotiable'
                  : formatCurrency(ad.payment_amount, ad.payment_currency)}
              </span>
            ) : null}
            <Link
              to={`/advertisements/${ad.id}`}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)', color: 'white' }}
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
