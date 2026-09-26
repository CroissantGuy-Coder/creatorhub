import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../utils/api'
import { CATEGORIES } from '../utils/constants'
import AdCard from '../components/AdCard'
import AdCardSkeleton from '../components/AdCardSkeleton'
import EmptyState from '../components/EmptyState'
import SearchBar from '../components/SearchBar'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ category: '', payment_type: '', sort: 'newest' })

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    setError('')

    const params = new URLSearchParams({ q: query, sort: filters.sort })
    if (filters.category) params.set('category', filters.category)
    if (filters.payment_type) params.set('payment_type', filters.payment_type)

    api.get(`/advertisements/search?${params}`)
      .then(res => setResults(res.data.advertisements || []))
      .catch(err => setError(err.response?.data?.error || 'Search failed'))
      .finally(() => setLoading(false))
  }, [query, filters])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white mb-4">Search Results</h1>
        <SearchBar className="max-w-2xl" />
      </div>

      {query ? (
        <>
          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-slate-400 text-sm">Filter:</span>
            <button
              onClick={() => setFilters(f => ({ ...f, category: '' }))}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${!filters.category ? 'border-brand-500/40 bg-brand-600/20 text-brand-300' : 'border-surface-500 text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            {Object.values(CATEGORIES).map(cat => (
              <button
                key={cat.slug}
                onClick={() => setFilters(f => ({ ...f, category: cat.slug }))}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filters.category === cat.slug ? 'border-brand-500/40 bg-brand-600/20 text-brand-300' : 'border-surface-500 text-slate-400 hover:text-white'}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
            <div className="ml-auto">
              <select
                value={filters.sort}
                onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                className="bg-surface-600 border border-surface-400 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="highest_pay">Highest Pay</option>
                <option value="lowest_pay">Lowest Pay</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <AdCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="card p-8 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-slate-400 text-sm mb-5">
                Found <span className="text-white font-medium">{results.length}</span> results for "
                <span className="text-brand-300">{query}</span>"
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {results.map(ad => <AdCard key={ad.id} ad={ad} />)}
              </div>
            </>
          ) : (
            <EmptyState
              icon="🔍"
              title={`No results for "${query}"`}
              description="Try different keywords or browse by category."
              actionLabel="Browse All Jobs"
              actionTo="/browse"
            />
          )}
        </>
      ) : (
        <EmptyState
          icon="💡"
          title="Enter a search term"
          description='Try searching for "Roblox builder", "Lua scripter", or "3D animator"'
          actionLabel="Browse All Jobs"
          actionTo="/browse"
        />
      )}
    </div>
  )
}
