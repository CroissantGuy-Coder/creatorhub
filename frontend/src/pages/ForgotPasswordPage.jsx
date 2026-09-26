import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [devToken, setDevToken] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      setSent(true)
      if (res.data.reset_token) {
        setDevToken(res.data.reset_token)
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="font-display text-2xl font-bold text-white mb-3">Check your instructions</h1>
          <p className="text-slate-400 text-sm mb-6">
            If that email is registered, password reset instructions have been generated.
          </p>

          {devToken && (
            <div className="card p-4 mb-6 text-left">
              <p className="text-amber-400 text-xs font-semibold mb-2">⚠️ Development Mode — Token shown here (remove in production)</p>
              <Link
                to={`/reset-password?token=${devToken}`}
                className="text-brand-400 text-sm break-all hover:underline"
              >
                Reset Password Link →
              </Link>
            </div>
          )}

          <Link to="/login" className="btn-primary">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Reset your password</h1>
          <p className="text-slate-400 text-sm">Enter your email and we'll send reset instructions</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          <Link to="/login" className="text-brand-400 hover:text-brand-300 transition-colors">← Back to Login</Link>
        </p>
      </div>
    </div>
  )
}
