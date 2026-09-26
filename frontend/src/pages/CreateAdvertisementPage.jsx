import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { CATEGORIES, PAYMENT_TYPES, SOCIAL_PLATFORMS } from '../utils/constants'

const DEFAULT_FORM = {
  title: '',
  category: '',
  job_type: '',
  description: '',
  payment_type: 'Fixed Price',
  payment_amount: '',
  payment_currency: 'USD',
  tags: '',
  required_skills: '',
}

export default function CreateAdvertisementPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [images, setImages] = useState([]) // File objects
  const [imagePreviews, setImagePreviews] = useState([])
  const [contactLinks, setContactLinks] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1) // 1: details, 2: payment+media, 3: contact

  const selectedCategory = form.category ? CATEGORIES[form.category] : null

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  function handleCategoryChange(cat) {
    setForm(f => ({
      ...f,
      category: cat,
      job_type: '',
      payment_currency: CATEGORIES[cat]?.currencies[0] || 'USD'
    }))
    if (errors.category) setErrors(e => ({ ...e, category: undefined }))
  }

  function handleImages(e) {
    const files = Array.from(e.target.files)
    const remaining = 8 - images.length
    if (files.length > remaining) {
      toast.error(`You can upload a maximum of 8 images`)
      return
    }
    const newPreviews = files.map(f => URL.createObjectURL(f))
    setImages(prev => [...prev, ...files])
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  function removeImage(index) {
    URL.revokeObjectURL(imagePreviews[index])
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  function addContactLink() {
    setContactLinks(prev => [...prev, { platform: 'discord', url: '', label: '' }])
  }

  function updateContactLink(index, field, value) {
    setContactLinks(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  function removeContactLink(index) {
    setContactLinks(prev => prev.filter((_, i) => i !== index))
  }

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    else if (form.title.trim().length < 10) errs.title = 'Title must be at least 10 characters'
    if (!form.category) errs.category = 'Category is required'
    if (!form.job_type) errs.job_type = 'Job type is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    else if (form.description.trim().length < 20) errs.description = 'Description must be at least 20 characters'
    if (!form.payment_type) errs.payment_type = 'Payment type is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setStep(1)
      toast.error('Please fix the errors below')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title.trim())
      formData.append('category', form.category)
      formData.append('job_type', form.job_type)
      formData.append('description', form.description.trim())
      formData.append('payment_type', form.payment_type)
      if (form.payment_amount) formData.append('payment_amount', form.payment_amount)
      formData.append('payment_currency', form.payment_currency)

      // Tags and skills
      const tagsArr = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      const skillsArr = form.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      formData.append('tags', JSON.stringify(tagsArr))
      formData.append('required_skills', JSON.stringify(skillsArr))

      // Contact links
      const validLinks = contactLinks.filter(l => l.url.trim())
      formData.append('contact_links', JSON.stringify(validLinks))

      // Images
      images.forEach(img => formData.append('images', img))

      const res = await api.post('/advertisements', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Advertisement published successfully!')
      navigate(`/advertisements/${res.data.advertisement.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish advertisement')
    } finally {
      setLoading(false)
    }
  }

  const stepTitles = ['Ad Details', 'Payment & Media', 'Contact Info']

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Post an Advertisement</h1>
        <p className="text-slate-400">Share what you need and connect with skilled creators</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {stepTitles.map((title, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => setStep(i + 1)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                step === i + 1 ? 'text-white' : step > i + 1 ? 'text-brand-400' : 'text-slate-500'
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === i + 1 ? 'bg-brand-600 text-white' : step > i + 1 ? 'bg-brand-600/40 text-brand-300' : 'bg-surface-600 text-slate-500'
              }`}>
                {step > i + 1 ? '✓' : i + 1}
              </span>
              <span className="hidden sm:block">{title}</span>
            </button>
            {i < stepTitles.length - 1 && (
              <div className={`flex-1 h-0.5 rounded ${step > i + 1 ? 'bg-brand-600' : 'bg-surface-500'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Details */}
        {step === 1 && (
          <div className="card p-6 space-y-5 animate-fade-in">
            <div>
              <label className="label">
                Advertisement Title <span className="text-red-400">*</span>
              </label>
              <input
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder="e.g. Looking for a Roblox Builder for my Horror Game"
                maxLength={120}
              />
              <div className="flex justify-between mt-1">
                {errors.title ? <p className="text-red-400 text-xs">{errors.title}</p> : <span />}
                <span className="text-slate-500 text-xs">{form.title.length}/120</span>
              </div>
            </div>

            <div>
              <label className="label">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.values(CATEGORIES).map(cat => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      form.category === cat.slug
                        ? 'border-brand-500 bg-brand-600/20 text-white'
                        : 'border-surface-500 text-slate-400 hover:border-surface-400 hover:text-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="text-xs font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
              {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
            </div>

            {selectedCategory && (
              <div>
                <label className="label">
                  Job Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.job_type}
                  onChange={e => setField('job_type', e.target.value)}
                  className={`input ${errors.job_type ? 'border-red-500' : ''}`}
                >
                  <option value="">Select job type...</option>
                  {selectedCategory.jobTypes.map(jt => (
                    <option key={jt} value={jt}>{jt}</option>
                  ))}
                </select>
                {errors.job_type && <p className="text-red-400 text-xs mt-1">{errors.job_type}</p>}
              </div>
            )}

            <div>
              <label className="label">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                className={`input resize-none h-40 ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describe exactly what you're looking for. Be as detailed as possible — project scope, style references, timeline, etc."
                maxLength={5000}
              />
              <div className="flex justify-between mt-1">
                {errors.description ? <p className="text-red-400 text-xs">{errors.description}</p> : <span />}
                <span className="text-slate-500 text-xs">{form.description.length}/5000</span>
              </div>
            </div>

            <div>
              <label className="label">Tags (comma separated)</label>
              <input
                value={form.tags}
                onChange={e => setField('tags', e.target.value)}
                className="input"
                placeholder="e.g. horror, building, detailed, UGC"
              />
              <p className="text-slate-500 text-xs mt-1">Help others find your ad with relevant tags</p>
            </div>

            <div>
              <label className="label">Required Skills (comma separated)</label>
              <input
                value={form.required_skills}
                onChange={e => setField('required_skills', e.target.value)}
                className="input"
                placeholder="e.g. Blender, Roblox Studio, Lua"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const errs = {}
                  if (!form.title.trim() || form.title.trim().length < 10) errs.title = 'Title must be at least 10 characters'
                  if (!form.category) errs.category = 'Category is required'
                  if (!form.job_type) errs.job_type = 'Job type is required'
                  if (!form.description.trim() || form.description.trim().length < 20) errs.description = 'Description must be at least 20 characters'
                  if (Object.keys(errs).length > 0) { setErrors(errs); return }
                  setStep(2)
                }}
                className="btn-primary"
              >
                Next: Payment & Media →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment & Images */}
        {step === 2 && (
          <div className="card p-6 space-y-5 animate-fade-in">
            <div>
              <label className="label">Payment Type <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_TYPES.map(pt => (
                  <button
                    key={pt.value}
                    type="button"
                    onClick={() => setField('payment_type', pt.value)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      form.payment_type === pt.value
                        ? 'border-brand-500 bg-brand-600/20 text-white'
                        : 'border-surface-500 text-slate-400 hover:border-surface-400'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {form.payment_type !== 'Negotiable' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount</label>
                  <input
                    type="number"
                    value={form.payment_amount}
                    onChange={e => setField('payment_amount', e.target.value)}
                    className="input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select
                    value={form.payment_currency}
                    onChange={e => setField('payment_currency', e.target.value)}
                    className="input"
                  >
                    {(selectedCategory?.currencies || ['USD']).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="label">Reference Images (optional, max 8)</label>
              <div
                className="border-2 border-dashed border-surface-400 rounded-xl p-6 text-center hover:border-brand-500/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('imgInput').click()}
              >
                <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400 text-sm">Click to upload images</p>
                <p className="text-slate-500 text-xs mt-1">PNG, JPG, GIF up to 5MB each</p>
                <input
                  id="imgInput"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImages}
                  className="hidden"
                />
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-surface-600">
                      <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">← Back</button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary">Next: Contact Info →</button>
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <div className="card p-6 space-y-5 animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="label mb-0">Contact & Social Links</label>
                  <p className="text-slate-500 text-xs mt-0.5">Where can applicants reach you?</p>
                </div>
                <button
                  type="button"
                  onClick={addContactLink}
                  className="btn-secondary text-sm px-3 py-1.5"
                  disabled={contactLinks.length >= 6}
                >
                  + Add Link
                </button>
              </div>

              {contactLinks.length === 0 && (
                <div className="border border-dashed border-surface-400 rounded-xl p-6 text-center">
                  <p className="text-slate-500 text-sm">No contact links added yet</p>
                  <button type="button" onClick={addContactLink} className="btn-ghost text-sm mt-2">
                    + Add your first contact link
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {contactLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <select
                      value={link.platform}
                      onChange={e => updateContactLink(i, 'platform', e.target.value)}
                      className="input text-sm py-2 w-36 flex-shrink-0"
                    >
                      {SOCIAL_PLATFORMS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <input
                      value={link.url}
                      onChange={e => updateContactLink(i, 'url', e.target.value)}
                      className="input text-sm py-2 flex-1"
                      placeholder={SOCIAL_PLATFORMS.find(p => p.value === link.platform)?.placeholder || 'URL or handle'}
                    />
                    <button
                      type="button"
                      onClick={() => removeContactLink(i)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors mt-0.5"
                      aria-label="Remove link"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary preview */}
            <div className="bg-surface-800 rounded-xl p-4 border border-surface-500">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Summary</h3>
              <p className="text-white font-medium truncate">{form.title || '—'}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-slate-400">{selectedCategory?.label || '—'}</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400">{form.job_type || '—'}</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400">
                  {form.payment_type === 'Negotiable' ? 'Negotiable' : form.payment_amount ? `${form.payment_amount} ${form.payment_currency}` : 'No amount set'}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">← Back</button>
              <button type="submit" disabled={loading} className="btn-primary px-8">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Publishing...
                  </span>
                ) : '🚀 Publish Advertisement'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
