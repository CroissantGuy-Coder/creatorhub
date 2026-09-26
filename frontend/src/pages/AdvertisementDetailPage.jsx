import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, getCategoryBadgeClass, getStatusBadgeClass, formatCurrency, timeAgo, REPORT_REASONS } from '../utils/constants'
import toast from 'react-hot-toast'

const PLATFORM_ICONS = {
  discord: '💬', github: '🐙', twitter: '🐦', instagram: '📸',
  portfolio: '🌐', email: '📧', roblox: '🎮', youtube: '▶️', other: '🔗'
}

export default function AdvertisementDetailPage() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [ad, setAd] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [imageIdx, setImageIdx] = useState(0)
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState({ reason: '', details: '' })
  const [reportLoading, setReportLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/advertisements/${id}`)
      .then(res => {
        setAd(res.data)
        setIsSaved(res.data.is_saved || false)
      })
      .catch(err => setError(err.response?.data?.error || 'Advertisement not found'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    if (!isAuthenticated) {
      toast.error('Please log in to save advertisements')
      navigate('/login')
      return
    }
    try {
      const res = await api.post(`/users/save/${id}`)
      setIsSaved(res.data.saved)
      toast.success(res.data.saved ? 'Advertisement saved!' : 'Removed from saved')
    } catch {
      toast.error('Failed to save advertisement')
    }
  }

  async function handleReport() {
    if (!report.reason) {
      toast.error('Please select a reason')
      return
    }
    setReportLoading(true)
    try {
      await api.post(`/advertisements/${id}/report`, report)
      toast.success('Report submitted. Thank you!')
      setShowReport(false)
      setReport({ reason: '', details: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit report')
    } finally {
      setReportLoading(false)
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/advertisements/${id}`)
      toast.success('Advertisement deleted')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete')
    }
  }

  async function handleStatusChange(status) {
    try {
      await api.patch(`/advertisements/${id}/status`, { status })
      setAd(prev => ({ ...prev, status }))
      toast.success(`Marked as ${status}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="card p-8 space-y-4">
          <div className="h-8 w-3/4 shimmer rounded" />
          <div className="h-4 w-1/2 shimmer rounded" />
          <div className="h-32 shimmer rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-white mb-2">Advertisement Not Found</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <Link to="/browse" className="btn-primary">Browse All Jobs</Link>
      </div>
    )
  }

  const category = CATEGORIES[ad.category]
  const isOwner = user?.id === ad.user_id
  const canManage = isOwner || user?.role === 'admin'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link to={`/${ad.category}`} className="hover:text-white transition-colors">
          {category?.label || ad.category}
        </Link>
        <span>/</span>
        <span className="text-slate-300 truncate max-w-xs">{ad.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={getCategoryBadgeClass(ad.category)}>
                  {category?.icon} {category?.label}
                </span>
                <span className="badge bg-surface-500 text-slate-300 border border-surface-400">
                  {ad.job_type}
                </span>
                <span className={getStatusBadgeClass(ad.status)}>
                  {ad.status}
                </span>
                {ad.is_featured ? <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">⭐ Featured</span> : null}
              </div>
              <span className="text-slate-500 text-sm">{timeAgo(ad.created_at)}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
              {ad.title}
            </h1>

            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {ad.views} views
              </span>
              <span>·</span>
              <span>Posted {timeAgo(ad.created_at)}</span>
              {ad.updated_at !== ad.created_at && <span>· Updated {timeAgo(ad.updated_at)}</span>}
            </div>
          </div>

          {/* Images */}
          {ad.reference_images?.length > 0 && (
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Reference Images</h2>
              <div className="rounded-xl overflow-hidden bg-surface-800 mb-3">
                <img
                  src={ad.reference_images[imageIdx]}
                  alt={`Reference ${imageIdx + 1}`}
                  className="w-full object-contain max-h-80"
                  onError={e => e.target.style.display = 'none'}
                />
              </div>
              {ad.reference_images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {ad.reference_images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIdx(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        imageIdx === i ? 'border-brand-500' : 'border-surface-500 hover:border-surface-400'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="card p-6">
            <h2 className="font-semibold text-white mb-4">Description</h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {ad.description}
            </div>
          </div>

          {/* Tags */}
          {ad.tags?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-white mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {ad.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-surface-600 text-slate-300 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Required Skills */}
          {ad.required_skills?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-white mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {ad.required_skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-brand-600/20 text-brand-300 border border-brand-500/30 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Owner controls */}
          {canManage && (
            <div className="card p-5 border-brand-500/20">
              <h2 className="font-semibold text-white mb-3">Manage Advertisement</h2>
              <div className="flex flex-wrap gap-2">
                <Link to={`/advertisements/${id}/edit`} className="btn-secondary text-sm px-4 py-2">
                  ✏️ Edit
                </Link>
                {/* Feature this ad button */}
                {isOwner && (
                  ad.is_featured && ad.featured_until && new Date(ad.featured_until) > new Date() ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 text-sm font-semibold">
                      ⭐ Featured until {new Date(ad.featured_until).toLocaleDateString()}
                    </span>
                  ) : (
                    <Link to={`/feature/${id}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
                      style={{ background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)', color: 'white' }}>
                      ⭐ Feature this Ad — $5
                    </Link>
                  )
                )}
                {ad.status === 'active' && (
                  <>
                    <button onClick={() => handleStatusChange('filled')} className="btn-secondary text-sm px-4 py-2">
                      ✅ Mark as Filled
                    </button>
                    <button onClick={() => handleStatusChange('closed')} className="btn-secondary text-sm px-4 py-2">
                      🔒 Close
                    </button>
                  </>
                )}
                {ad.status !== 'active' && (
                  <button onClick={() => handleStatusChange('active')} className="btn-secondary text-sm px-4 py-2">
                    🔓 Reopen
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-danger text-sm px-4 py-2"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Payment card */}
          <div className="card p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Payment</h2>
            <div className="mb-1">
              <span className="text-3xl font-display font-bold text-brand-400">
                {ad.payment_type === 'Negotiable'
                  ? 'Negotiable'
                  : formatCurrency(ad.payment_amount, ad.payment_currency)}
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              {ad.payment_type}
              {ad.payment_currency && ad.payment_type !== 'Negotiable' ? ` · ${ad.payment_currency}` : ''}
            </p>
          </div>

          {/* Poster card */}
          <div className="card p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Posted By</h2>
            <Link to={`/profile/${ad.username}`} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center overflow-hidden">
                {ad.avatar_url ? (
                  <img src={ad.avatar_url} alt={ad.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{ad.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-white font-semibold group-hover:text-brand-300 transition-colors">{ad.username}</p>
                {ad.bio && <p className="text-slate-400 text-xs line-clamp-1">{ad.bio}</p>}
              </div>
            </Link>
          </div>

          {/* Contact / Social links */}
          {ad.contact_links?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Contact Poster</h2>
              <div className="space-y-2">
                {ad.contact_links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url?.startsWith('http') ? link.url : (link.platform === 'email' ? `mailto:${link.url}` : `https://${link.url}`)}
                    target={link.platform !== 'email' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-600 hover:bg-surface-500 transition-colors text-sm text-slate-300 hover:text-white"
                  >
                    <span>{PLATFORM_ICONS[link.platform] || '🔗'}</span>
                    <span className="capitalize">{link.platform}</span>
                    {link.label && <span className="text-slate-500 text-xs ml-auto">{link.label}</span>}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleSave}
              className={`w-full btn-secondary py-2.5 text-sm ${isSaved ? 'border-brand-500/40 text-brand-300' : ''}`}
            >
              {isSaved ? '🔖 Saved' : '🔖 Save Advertisement'}
            </button>

            <button
              onClick={() => {
                if (!isAuthenticated) { navigate('/login'); return; }
                setShowReport(true)
              }}
              className="w-full btn-ghost text-sm text-red-400 hover:text-red-300"
            >
              🚩 Report Advertisement
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <h2 className="font-display font-bold text-white text-lg mb-1">Report Advertisement</h2>
            <p className="text-slate-400 text-sm mb-5">Help us keep the community safe</p>

            <div className="mb-4">
              <label className="label">Reason</label>
              <select
                value={report.reason}
                onChange={e => setReport(r => ({ ...r, reason: e.target.value }))}
                className="input"
              >
                <option value="">Select a reason...</option>
                {REPORT_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div className="mb-5">
              <label className="label">Additional details (optional)</label>
              <textarea
                value={report.details}
                onChange={e => setReport(r => ({ ...r, details: e.target.value }))}
                className="input resize-none h-24"
                placeholder="Provide any extra context..."
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowReport(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReport} disabled={reportLoading} className="btn-danger flex-1">
                {reportLoading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 animate-slide-up">
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h2 className="font-display font-bold text-white text-lg text-center mb-2">Delete Advertisement?</h2>
            <p className="text-slate-400 text-sm text-center mb-6">
              This action cannot be undone. The advertisement and all associated images will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
