import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, formatCurrency, timeAgo } from '../utils/constants'
import toast from 'react-hot-toast'

const FEATURE_PRICE = 5.00
const FEATURE_DAYS = 7

export default function FeatureAdPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [ad, setAd] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/advertisements/${id}`)
      .then(res => {
        const a = res.data
        if (a.user_id !== user?.id) {
          toast.error('You can only feature your own advertisements')
          navigate('/dashboard')
          return
        }
        setAd(a)
      })
      .catch(() => {
        setError('Advertisement not found')
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleFeature() {
    setPaying(true)
    try {
      const res = await api.post(`/payments/feature/${id}`)
      // Redirect to PayPal approval page
      window.location.href = res.data.approval_url
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to start payment'
      toast.error(msg)
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    )
  }

  const category = CATEGORIES[ad?.category]
  const isAlreadyFeatured = ad?.is_featured && ad?.featured_until && new Date(ad.featured_until) > new Date()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4 shadow-lg shadow-amber-900/30">
          <span className="text-3xl">⭐</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Feature Your Advertisement</h1>
        <p className="text-slate-400">
          Get your ad seen by more people — featured ads appear at the top of every listing.
        </p>
      </div>

      {/* Ad preview card */}
      <div className="card p-5 mb-6 border-surface-400">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Advertisement</p>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`badge ${
                ad.category === 'roblox' ? 'badge-roblox' :
                ad.category === 'blender' ? 'badge-blender' : 'badge-coding'
              }`}>
                {category?.icon} {category?.label}
              </span>
              <span className="badge bg-surface-500 text-slate-300 border border-surface-400 text-xs">
                {ad.job_type}
              </span>
            </div>
            <h3 className="font-semibold text-white truncate">{ad.title}</h3>
            <p className="text-slate-500 text-xs mt-0.5">Posted {timeAgo(ad.created_at)}</p>
          </div>
          {ad.payment_amount && (
            <span className="text-brand-400 font-semibold text-sm flex-shrink-0">
              {formatCurrency(ad.payment_amount, ad.payment_currency)}
            </span>
          )}
        </div>
      </div>

      {/* Already featured */}
      {isAlreadyFeatured ? (
        <div className="card p-6 border-amber-500/30 bg-amber-500/5 text-center">
          <p className="text-2xl mb-2">⭐</p>
          <p className="text-white font-semibold mb-1">This ad is already featured!</p>
          <p className="text-slate-400 text-sm">
            Featured until {new Date(ad.featured_until).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
          <Link to={`/advertisements/${id}`} className="btn-secondary mt-4 inline-flex">
            View Advertisement
          </Link>
        </div>
      ) : (
        <>
          {/* What you get */}
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-white mb-4">What you get</h2>
            <ul className="space-y-3">
              {[
                { icon: '🔝', text: `Your ad pinned at the top of listings for ${FEATURE_DAYS} days` },
                { icon: '⭐', text: 'Gold "Featured" badge on your advertisement card' },
                { icon: '👀', text: 'Appears in the dedicated Featured Ads section on the homepage' },
                { icon: '📂', text: 'Prioritized in Roblox, Blender/3D, and Coding category pages' },
                { icon: '🔍', text: 'Higher visibility in search results' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <span className="text-slate-300 text-sm">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="card p-6 mb-6 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-300 font-medium">Featured for {FEATURE_DAYS} days</span>
              <span className="text-3xl font-display font-bold text-white">${FEATURE_PRICE.toFixed(2)}</span>
            </div>
            <p className="text-slate-500 text-xs">One-time payment · No subscription · Secure via PayPal</p>
          </div>

          {/* PayPal button */}
          <button
            onClick={handleFeature}
            disabled={paying}
            className="w-full py-4 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{
              background: paying ? '#555' : 'linear-gradient(135deg, #003087 0%, #009cde 100%)',
              color: 'white',
              boxShadow: paying ? 'none' : '0 4px 24px rgba(0, 48, 135, 0.4)'
            }}
          >
            {paying ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to PayPal...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.828l-1.37 8.668h3.905l.957-6.07h2.352c4.233 0 7.105-2.121 8.016-6.365.486-2.27-.09-3.583-1.466-4.028z"/>
                </svg>
                Pay ${FEATURE_PRICE.toFixed(2)} with PayPal
              </>
            )}
          </button>

          <p className="text-center text-slate-500 text-xs mt-3">
            You will be redirected to PayPal to complete your payment securely.
            After payment you'll be returned here automatically.
          </p>

          <div className="flex justify-center mt-4">
            <Link to={`/advertisements/${id}`} className="btn-ghost text-sm text-slate-400">
              ← Cancel, go back to ad
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
