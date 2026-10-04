import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-surface-800 border-t border-surface-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-display font-bold text-lg text-white">
                Creator<span className="text-brand-400">Hub</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              The marketplace for Roblox developers, 3D artists, and programmers. 
              Find talented creators or post your work opportunities.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Categories</h3>
            <ul className="space-y-2">
              {[
                { to: '/roblox', label: '🎮 Roblox' },
                { to: '/blender', label: '🧊 Blender / 3D' },
                { to: '/coding', label: '💻 Coding' },
                { to: '/browse', label: 'Browse All' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Platform</h3>
            <ul className="space-y-2">
              {[
                { to: '/post', label: 'Post Advertisement' },
                { to: '/register', label: 'Create Account' },
                { to: '/login', label: 'Sign In' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-600 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} CreatorHub. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Terms & Conditions
            </Link>
            <span className="text-slate-700">·</span>
            <p className="text-slate-600 text-xs">
              Built for creators, by creators.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
