import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams()
  const adId = searchParams.get('adId')

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">↩️</div>
        <h1 className="font-display text-2xl font-bold text-white mb-3">Payment Cancelled</h1>
        <p className="text-slate-400 text-sm mb-8">
          No worries — you haven't been charged. Your advertisement is still active,
          just not featured yet.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/dashboard" className="btn-secondary">
            Go to Dashboard
          </Link>
          {adId && (
            <Link to={`/feature/${adId}`} className="btn-primary">
              ⭐ Try Featuring Again
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
