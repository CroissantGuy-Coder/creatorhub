import React, { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const adId = searchParams.get('adId')
  const token = searchParams.get('token') // PayPal order ID
  const payerId = searchParams.get('PayerID')

  const [status, setStatus] = useState('capturing') // capturing | success | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Missing payment token. Payment may not have completed.')
      return
    }

    // Capture the payment
    api.post('/payments/capture', { paypal_order_id: token })
      .then(res => {
        setResult(res.data)
        setStatus('success')
        toast.success('Payment successful! Your ad is now featured.')
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Payment capture failed. Please contact support.')
        setStatus('error')
      })
  }, [token])

  if (status === 'capturing') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-surface-500 border-t-brand-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-display text-xl font-bold text-white mb-2">Confirming your payment...</h2>
          <p className="text-slate-400 text-sm">Please wait, this only takes a moment.</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">Payment Failed</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/dashboard" className="btn-secondary">Go to Dashboard</Link>
            {adId && (
              <Link to={`/feature/${adId}`} className="btn-primary">Try Again</Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  const featuredUntil = result?.featured_until
    ? new Date(result.featured_until).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : null

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Animated star */}
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-900/40 animate-pulse-slow">
            <span className="text-4xl">⭐</span>
          </div>
        </div>

        <h1 className="font-display text-3xl font-bold text-white mb-3">
          Your ad is now Featured!
        </h1>

        <p className="text-slate-400 mb-2">
          {result?.message || 'Your advertisement has been boosted successfully.'}
        </p>

        {featuredUntil && (
          <div className="card inline-block px-5 py-3 mb-8 border-amber-500/30">
            <p className="text-slate-400 text-sm">Featured until</p>
            <p className="text-amber-400 font-semibold">{featuredUntil}</p>
          </div>
        )}

        {/* What happens next */}
        <div className="card p-5 mb-8 text-left">
          <h3 className="font-semibold text-white mb-3 text-sm">What happens now</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Your ad is pinned at the top of all relevant listings
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              A gold ⭐ Featured badge is shown on your ad card
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Your ad appears in the Featured section on the homepage
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Feature expires automatically after 7 days
            </li>
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          {adId && (
            <Link to={`/advertisements/${adId}`} className="btn-primary px-8">
              View My Ad
            </Link>
          )}
          <Link to="/dashboard" className="btn-secondary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
