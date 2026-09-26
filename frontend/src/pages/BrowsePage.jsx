import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { CATEGORIES, SORT_OPTIONS } from '../utils/constants'
import AdCard from '../components/AdCard'
import AdCardSkeleton from '../components/AdCardSkeleton'
import EmptyState from '../components/EmptyState'
import SearchBar from '../components/SearchBar'

export default function BrowsePage() {
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const [filters, setFilters] = useState({
    category: '',
    job_type: '',
    payment_type: '',
    min_payment: '',
    max_payment: '',
    sort: 'newest',
  })

  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    const params = new URLSearchParams({ page, limit: 12, sort: filters.sort })
    if (filters.category) params.set('category', filters.category)
    if (filters.job_type) params.set('job_type', filters.job_type)
    if (filters.payment_type) params.set('payment_type', filters.payment_type)
    if (filters.min_payment) params.set('min_payment', filters.min_payment)
    if (filters.max_payment) params.set('max_payment', filters.max_payment)

    setLoading(true)
    api.get(`/advertisements?${params}`)
      .then(res => {
        setAds(res.data.advertisements || [])
        setTotal(res.data.pagination?.total || 0)
        setPages(res.data.pagination?.pages || 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filters, page])

  const selectedCat = filters.category ? CATEGORIES[filters.category] : null
  const jobTypes = selectedCat ? selectedCat.jobTypes : []

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value, ...(key === 'category' ? { job_type: '' } : {}) }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Browse All Jobs</h1>
        <p className="text-slate-400 mb-5">Explore every advertisement across all categories</p>
        <SearchBar className="max-w-2xl" />
      </div>

      {/* Category quick filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilter('category', '')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
            !filters.category
              ? 'bg-brand-600/30 text-brand-300 border-brand-500/40'
              : 'border-surface-500 text-slate-400 hover:text-white hover:border-surface-400'
          }`}
        >
          All Categories
        </button>
        {Object.values(CATEGORIES).map(cat => (
          <button
            key={cat.slug}
            onClick={() => setFilter('category', cat.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              filters.category === cat.slug
                ? 'bg-brand-600/30 text-brand-300 border-brand-500/40'
                : 'border-surface-500 text-slate-400 hover:text-white hover:border-surface-400'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <div className="card p-5 sticky top-20 space-y-5">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Payment Type</p>
              <select
                value={filters.payment_type}
                onChange={e => setFilter('payment_type', e.target.value)}
                className="input text-sm py-2"
              >
                <option value="">Any</option>
                <option>Fixed Price</option>
                <option>Negotiable</option>
                <option>Per Hour</option>
                <option>Per Project</option>
              </select>
            </div>

            {jobTypes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Job Type</p>
                <div className="space-y-1">
                  <button
                    onClick={() => setFilter('job_type', '')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${!filters.job_type ? 'text-brand-300 bg-brand-600/20' : 'text-slate-400 hover:text-white hover:bg-surface-600'}`}
                  >
                    All
                  </button>
                  {jobTypes.map(jt => (
                    <button
                      key={jt}
                      onClick={() => setFilter('job_type', jt)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${filters.job_type === jt ? 'text-brand-300 bg-brand-600/20' : 'text-slate-400 hover:text-white hover:bg-surface-600'}`}
                    >
                      {jt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Pay Range</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={filters.min_payment}
                  onChange={e => setFilter('min_payment', e.target.value)}
                  className="input text-sm py-2 w-1/2" min="0" />
                <input type="number" placeholder="Max" value={filters.max_payment}
                  onChange={e => setFilter('max_payment', e.target.value)}
                  className="input text-sm py-2 w-1/2" min="0" />
              </div>
            </div>

            {Object.values(filters).some(v => v && v !== 'newest') && (
              <button
                onClick={() => setFilters({ category: '', job_type: '', payment_type: '', min_payment: '', max_payment: '', sort: 'newest' })}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <p className="text-slate-400 text-sm">
              {loading ? 'Loading...' : `${total} advertisement${total !== 1 ? 's' : ''}`}
            </p>
            <select
              value={filters.sort}
              onChange={e => setFilter('sort', e.target.value)}
              className="bg-surface-600 border border-surface-400 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <AdCardSkeleton key={i} />)}
            </div>
          ) : ads.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {ads.map(ad => <AdCard key={ad.id} ad={ad} />)}
              </div>
              {pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
                  <span className="text-slate-400 text-sm">Page {page} of {pages}</span>
                  <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next →</button>
                </div>
              )}
            </>
          ) : (
            <EmptyState icon="🔍" title="No advertisements found" description="Try adjusting your filters or search terms." actionLabel="Post an Ad" actionTo="/post" />
          )}
        </div>
      </div>
    </div>
  )
}
