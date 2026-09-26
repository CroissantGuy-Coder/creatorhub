import React from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, getCategoryBadgeClass, formatCurrency, timeAgo } from '../utils/constants'

export default function AdCard({ ad }) {
  const category = CATEGORIES[ad.category]

  return (
    <div className="card ad-card-glow flex flex-col p-5 transition-all duration-200 hover:translate-y-[-2px] animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={getCategoryBadgeClass(ad.category)}>
            {category?.icon} {category?.label || ad.category}
          </span>
          <span className="badge bg-surface-500 text-slate-300 border border-surface-400 text-xs">
            {ad.job_type}
          </span>
          {ad.is_featured ? (
            <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ⭐ Featured
            </span>
          ) : null}
        </div>
        <span className="text-xs text-slate-500 whitespace-nowrap flex-shrink-0">
          {timeAgo(ad.created_at)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display font-semibold text-white text-base mb-2 leading-snug line-clamp-2">
        {ad.title}
      </h3>

      {/* Description */}
      {ad.description && (
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
          {ad.description}
        </p>
      )}

      {/* Tags */}
      {ad.tags && ad.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ad.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-surface-600 text-slate-400 rounded-md text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-500 mt-auto">
        {/* Poster */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center overflow-hidden flex-shrink-0">
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
            className="text-sm text-slate-400 hover:text-white transition-colors truncate max-w-[100px]"
            onClick={e => e.stopPropagation()}
          >
            {ad.username}
          </Link>
        </div>

        {/* Payment + Button */}
        <div className="flex items-center gap-3">
          {ad.payment_amount || ad.payment_type === 'Negotiable' ? (
            <div className="text-right">
              <span className="text-brand-400 font-semibold text-sm">
                {ad.payment_type === 'Negotiable'
                  ? 'Negotiable'
                  : formatCurrency(ad.payment_amount, ad.payment_currency)}
              </span>
              {ad.payment_type !== 'Negotiable' && ad.payment_type !== 'Fixed Price' && (
                <span className="text-slate-500 text-xs block">
                  {ad.payment_type === 'Per Hour' ? '/hr' : '/project'}
                </span>
              )}
            </div>
          ) : null}

          <Link
            to={`/advertisements/${ad.id}`}
            className="btn-primary text-xs px-3 py-2"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  )
}
