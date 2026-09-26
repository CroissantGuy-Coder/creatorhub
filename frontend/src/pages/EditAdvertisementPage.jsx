import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { PAYMENT_TYPES, SOCIAL_PLATFORMS, CATEGORIES } from '../utils/constants'
import { useAuth } from '../context/AuthContext'

export default function EditAdvertisementPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [ad, setAd] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', payment_type: 'Fixed Price',
    payment_amount: '', payment_currency: 'USD', tags: '', required_skills: ''
  })
  const [existingImages, setExistingImages] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [contactLinks, setContactLinks] = useState([])

  useEffect(() => {
    api.get(`/advertisements/${id}`)
      .then(res => {
        const a = res.data
        if (a.user_id !== user?.id && user?.role !== 'admin') {
          toast.error('Not authorized')
          navigate('/')
          return
        }
        setAd(a)
        setForm({
          title: a.title,
          description: a.description,
          payment_type: a.payment_type,
          payment_amount: a.payment_amount || '',
          payment_currency: a.payment_currency || 'USD',
          tags: (a.tags || []).join(', '),
          required_skills: (a.required_skills || []).join(', '),
        })
        setExistingImages(a.reference_images || [])
        setContactLinks(a.contact_links || [])
      })
      .catch(() => { toast.error('Advertisement not found'); navigate('/dashboard') })
      .finally(() => setLoading(false))
  }, [id])

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function removeExistingImage(url) {
    setExistingImages(prev => prev.filter(i => i !== url))
    setRemovedImages(prev => [...prev, url])
  }

  function handleNewImages(e) {
    const files = Array.from(e.target.files)
    const total = existingImages.length + newImages.length
    const remaining = 8 - total
    const toAdd = files.slice(0, remaining)
    setNewImages(prev => [...prev, ...toAdd])
    setNewPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
  }

  function removeNewImage(i) {
    URL.revokeObjectURL(newPreviews[i])
    setNewImages(prev => prev.filter((_, idx) => idx !== i))
    setNewPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  function addContactLink() {
    setContactLinks(prev => [...prev, { platform: 'discord', url: '' }])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || form.title.trim().length < 10) {
      toast.error('Title must be at least 10 characters')
      return
    }
    if (!form.description.trim() || form.description.trim().length < 20) {
      toast.error('Description must be at least 20 characters')
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title.trim())
      formData.append('description', form.description.trim())
      formData.append('payment_type', form.payment_type)
      if (form.payment_amount) formData.append('payment_amount', form.payment_amount)
      formData.append('payment_currency', form.payment_currency)

      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      const skills = form.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      formData.append('tags', JSON.stringify(tags))
      formData.append('required_skills', JSON.stringify(skills))
      formData.append('contact_links', JSON.stringify(contactLinks.filter(l => l.url.trim())))
      formData.append('remove_images', JSON.stringify(removedImages))

      newImages.forEach(img => formData.append('images', img))

      await api.put(`/advertisements/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Advertisement updated!')
      navigate(`/advertisements/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  const categoryInfo = ad ? CATEGORIES[ad.category] : null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <Link to={`/advertisements/${id}`} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-4 transition-colors">
          ← Back to Advertisement
        </Link>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Edit Advertisement</h1>
        {categoryInfo && (
          <p className="text-slate-400 text-sm">{categoryInfo.icon} {categoryInfo.label} · {ad.job_type}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6 space-y-5">
          <div>
            <label className="label">Title</label>
            <input value={form.title} onChange={e => setField('title', e.target.value)} className="input" maxLength={120} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              className="input resize-none h-40"
              maxLength={5000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Type</label>
              <select value={form.payment_type} onChange={e => setField('payment_type', e.target.value)} className="input">
                {PAYMENT_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
              </select>
            </div>
            {form.payment_type !== 'Negotiable' && (
              <>
                <div>
                  <label className="label">Amount</label>
                  <input type="number" value={form.payment_amount} onChange={e => setField('payment_amount', e.target.value)} className="input" min="0" />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="label">Tags (comma separated)</label>
            <input value={form.tags} onChange={e => setField('tags', e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">Required Skills (comma separated)</label>
            <input value={form.required_skills} onChange={e => setField('required_skills', e.target.value)} className="input" />
          </div>
        </div>

        {/* Images */}
        <div className="card p-6">
          <label className="label mb-3">Reference Images</label>

          {existingImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {existingImages.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-surface-600">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full text-white text-xs items-center justify-center hidden group-hover:flex"
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {newPreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {newPreviews.map((src, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-surface-600 border-2 border-brand-500/50">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full text-white text-xs items-center justify-center hidden group-hover:flex"
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {existingImages.length + newImages.length < 8 && (
            <label className="flex items-center gap-2 cursor-pointer text-sm text-brand-400 hover:text-brand-300 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add more images
              <input type="file" multiple accept="image/*" onChange={handleNewImages} className="hidden" />
            </label>
          )}
        </div>

        {/* Contact links */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">Contact Links</label>
            <button type="button" onClick={addContactLink} className="btn-secondary text-sm px-3 py-1.5">+ Add</button>
          </div>
          <div className="space-y-2">
            {contactLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <select
                  value={link.platform}
                  onChange={e => setContactLinks(prev => prev.map((l, idx) => idx === i ? { ...l, platform: e.target.value } : l))}
                  className="input text-sm py-2 w-36 flex-shrink-0"
                >
                  {SOCIAL_PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <input
                  value={link.url}
                  onChange={e => setContactLinks(prev => prev.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l))}
                  className="input text-sm py-2 flex-1"
                  placeholder="URL or handle"
                />
                <button type="button" onClick={() => setContactLinks(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Link to={`/advertisements/${id}`} className="btn-secondary flex-1 text-center">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : '✓ Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
