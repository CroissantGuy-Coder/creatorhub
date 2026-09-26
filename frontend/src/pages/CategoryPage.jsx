import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { CATEGORIES, SORT_OPTIONS } from '../utils/constants'
import AdCard from '../components/AdCard'
import AdCardSkeleton from '../components/AdCardSkeleton'
import EmptyState from '../components/EmptyState'
import SearchBar from '../components/SearchBar'
import FeaturedAdsSection from '../components/FeaturedAdsSection'

export default function CategoryPage({ category: categorySlug }) {
  const categoryInfo = CATEGORIES[categorySlug]

  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const [filters, setFilters] = useState({
    job_type: '',
    payment_type: '',
    min_payment: '',
    max_payment: '',
    sort: 'newest',
  })

  useEffect(() => {
    setPage(1)
    setAds([])
  }, [categorySlug, filters])

  useEffect(() => {
    const params = new URLSearchParams({ category: categorySlug, page, limit: 12, sort: filters.sort })
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
  }, [categorySlug, filters, page])

  if (!categoryInfo) return <div className="p-8 text-red-400">Unknown category</div>

  const colorMap = {
    roblox: 'text-red-400',
    blender: 'text-orange-400',
    coding: 'text-cyan-400',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{categoryInfo.icon}</span>
          <div>
            <h1 className={`font-display text-3xl font-bold ${colorMap[categorySlug] || 'text-white'}`}>
              {categoryInfo.label}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{categoryInfo.description}</p>
          </div>
        </div>

        <SearchBar className="max-w-2xl" />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-300">{categoryInfo.label}</span>
          {total > 0 && <span className="text-slate-500">· {total} listing{total !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="card p-5 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Filters</h3>
              {(filters.job_type || filters.payment_type || filters.min_payment || filters.max_payment) && (
                <button
                  onClick={() => setFilters(f => ({ ...f, job_type: '', payment_type: '', min_payment: '', max_payment: '' }))}
                  className="text-xs text-brand-400 hover:text-brand-300"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Job type */}
            <div className="mb-5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Job Type</p>
              <div className="space-y-1">
                <button
                  onClick={() => setFilters(f => ({ ...f, job_type: '' }))}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !filters.job_type ? 'bg-brand-600/30 text-brand-300 border border-brand-500/30' : 'text-slate-400 hover:text-white hover:bg-surface-600'
                  }`}
                >
                  All Types
                </button>
                {categoryInfo.jobTypes.map(jt => (
                  <button
                    key={jt}
                    onClick={() => setFilters(f => ({ ...f, job_type: jt }))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.job_type === jt ? 'bg-brand-600/30 text-brand-300 border border-brand-500/30' : 'text-slate-400 hover:text-white hover:bg-surface-600'
                    }`}
                  >
                    {jt}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment type */}
            <div className="mb-5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Payment Type</p>
              <select
                value={filters.payment_type}
                onChange={e => setFilters(f => ({ ...f, payment_type: e.target.value }))}
                className="input text-sm py-2"
              >
                <option value="">Any</option>
                <option>Fixed Price</option>
                <option>Negotiable</option>
                <option>Per Hour</option>
                <option>Per Project</option>
              </select>
            </div>

            {/* Payment range */}
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                Pay Range {categoryInfo.currencies[0] === 'Robux' ? '(R$)' : '(USD)'}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.min_payment}
                  onChange={e => setFilters(f => ({ ...f, min_payment: e.target.value }))}
                  className="input text-sm py-2 w-1/2"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.max_payment}
                  onChange={e => setFilters(f => ({ ...f, max_payment: e.target.value }))}
                  className="input text-sm py-2 w-1/2"
                  min="0"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Featured ads for this category */}
          <FeaturedAdsSection
            category={categorySlug}
            limit={3}
            title={`Featured ${categoryInfo.label} Ads`}
          />

          {/* Sort bar */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-slate-400 text-sm">
              {loading ? 'Loading...' : `${total} advertisement${total !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-sm">Sort:</label>
              <select
                value={filters.sort}
                onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                className="bg-surface-600 border border-surface-400 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
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

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  {[...Array(Math.min(7, pages))].map((_, i) => {
                    const p = i + 1
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === p ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-surface-600'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={categoryInfo.icon}
              title={`No ${categoryInfo.label} jobs posted yet`}
              description="Be the first person to post an advertisement in this category."
              actionLabel={`Post a ${categoryInfo.label} Ad`}
              actionTo="/post"
            />
          )}
        </div>
      </div>
    </div>
  )
}
