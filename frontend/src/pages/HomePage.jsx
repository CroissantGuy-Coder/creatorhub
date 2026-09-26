import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import AdCard from '../components/AdCard'
import AdCardSkeleton from '../components/AdCardSkeleton'
import SearchBar from '../components/SearchBar'
import EmptyState from '../components/EmptyState'
import FeaturedAdsSection from '../components/FeaturedAdsSection'

const CATEGORIES = [
  {
    slug: 'roblox',
    label: 'Roblox',
    icon: '🎮',
    description: 'Builders, scripters, animators, UI designers and more for Roblox games.',
    color: 'from-red-500/20 to-orange-500/10',
    border: 'border-red-500/30 hover:border-red-400/60',
    tag: 'red',
  },
  {
    slug: 'blender',
    label: 'Blender / 3D',
    icon: '🧊',
    description: '3D modeling, animation, rigging, texturing, and rendering experts.',
    color: 'from-orange-500/20 to-amber-500/10',
    border: 'border-orange-500/30 hover:border-orange-400/60',
    tag: 'orange',
  },
  {
    slug: 'coding',
    label: 'Coding',
    icon: '💻',
    description: 'Web devs, game devs, Lua scripters, Python devs, and more.',
    color: 'from-cyan-500/20 to-blue-500/10',
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    tag: 'cyan',
  },
]

const STATS = [
  { label: 'Active Listings', value: '1,200+', icon: '📋' },
  { label: 'Categories', value: '3', icon: '🗂️' },
  { label: 'Job Types', value: '20+', icon: '🎯' },
  { label: 'Free to Post', value: '100%', icon: '✅' },
]

export default function HomePage() {
  const [recentAds, setRecentAds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/advertisements?limit=8&sort=newest')
      .then(res => setRecentAds(res.data.advertisements || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-pattern">
        <div className="absolute inset-0 bg-gradient-radial from-brand-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-600/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-600/20 border border-brand-500/30 rounded-full text-brand-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
              The Creator Marketplace for Digital Builders
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Hire Creators.<br />
              <span className="gradient-text">Find Opportunities.</span>
            </h1>

            <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              The marketplace built for <span className="text-white">Roblox developers</span>,{' '}
              <span className="text-white">3D artists</span>, and{' '}
              <span className="text-white">programmers</span>. Post work, find jobs, and build your career.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/post" className="btn-primary text-base px-8 py-3.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post an Advertisement
              </Link>
              <Link to="/browse" className="btn-secondary text-base px-8 py-3.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Jobs
              </Link>
            </div>

            {/* Search */}
            <SearchBar className="max-w-2xl mx-auto" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-surface-600 bg-surface-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Browse by Category</h2>
          <p className="text-slate-400">Find exactly the kind of creator or opportunity you're looking for</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              to={`/${cat.slug}`}
              className={`card ${cat.border} bg-gradient-to-br ${cat.color} p-6 transition-all duration-200 hover:-translate-y-1 group`}
            >
              <div className="text-4xl mb-4">{cat.icon}</div>
              <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-brand-300 transition-colors">
                {cat.label}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{cat.description}</p>
              <div className="flex items-center text-brand-400 text-sm font-medium">
                Browse {cat.label}
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Advertisements */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <FeaturedAdsSection limit={4} title="Featured Advertisements" />
      </section>

      {/* Recent Advertisements */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-white mb-1">Recent Advertisements</h2>
            <p className="text-slate-400">The latest opportunities posted by the community</p>
          </div>
          <Link to="/browse" className="btn-ghost text-sm hidden sm:flex">
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <AdCardSkeleton key={i} />)}
          </div>
        ) : recentAds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recentAds.map(ad => <AdCard key={ad.id} ad={ad} />)}
          </div>
        ) : (
          <EmptyState
            icon="📋"
            title="No advertisements yet"
            description="Be the first person to post an advertisement and start connecting with creators."
            actionLabel="Post the First Ad"
            actionTo="/post"
          />
        )}

        <div className="text-center mt-10">
          <Link to="/browse" className="btn-secondary px-8 py-3">
            See All Advertisements
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-800 border-t border-surface-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Join the platform made specifically for digital creators. Post your first ad in minutes — it's completely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5">
              Create Free Account
            </Link>
            <Link to="/browse" className="btn-secondary text-base px-8 py-3.5">
              Browse Jobs First
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
