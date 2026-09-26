import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({ placeholder = 'Search for Roblox builders, Lua scripters, 3D artists...', className = '' }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (q.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <svg
          className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input pl-12 pr-32 py-4 text-base"
          aria-label="Search advertisements"
        />
        <button
          type="submit"
          className="absolute right-2 btn-primary px-5 py-2 text-sm"
        >
          Search
        </button>
      </div>
    </form>
  )
}
