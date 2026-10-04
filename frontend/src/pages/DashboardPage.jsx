import React, { useState, useEffect, useRef } from 'react'
import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { getCategoryBadgeClass, getStatusBadgeClass, formatCurrency, timeAgo, SOCIAL_PLATFORMS } from '../utils/constants'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'my-ads', label: 'My Advertisements', icon: '📋' },
  { id: 'saved', label: 'Saved', icon: '🔖' },
  { id: 'profile', label: 'Edit Profile', icon: '👤' },
  { id: 'account', label: 'Account Settings', icon: '⚙️' },
]

export default function DashboardPage() {
  const { user, updateUser, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('my-ads')
  const [myAds, setMyAds] = useState([])
  const [savedAds, setSavedAds] = useState([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef()

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
    bio: user?.bio || '',
    skills: (user?.skills || []).join(', '),
    social_links: user?.social_links || [],
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [profileForm, setProfileForm] = useState({
  const [savingProfile, setSavingProfile] = useState(false)

  const [savingPassword, setSavingPassword] = useState(false)
    if (tab === 'my-ads') {
      setLoading(true)
      api.get('/users/dashboard/my-ads')
        .then(res => setMyAds(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
    if (tab === 'saved') {
      setLoading(true)
      api.get('/users/dashboard/saved')
        .then(res => setSavedAds(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [tab])

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await api.post('/users/avatar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      updateUser({ avatar_url: res.data.avatar_url })
      toast.success('Profile picture updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      const skills = profileForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      const res = await api.put('/users/profile/update', {
        bio: profileForm.bio,
        skills,
        social_links: profileForm.social_links.filter(l => l.url?.trim()),
      })
      updateUser(res.data.user)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }
    if (!deletePassword) {
      toast.error('Please enter your password')
      return
    }
    setDeletingAccount(true)
    try {
      await api.delete('/users/account/delete', { data: { password: deletePassword } })
      toast.success('Account permanently deleted')
      logout()
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account')
    } finally {
      setDeletingAccount(false)
    }
  }

  async function handleChangePassword() {    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      await api.put('/users/password/change', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleStatusChange(adId, status) {
    try {
      await api.patch(`/advertisements/${adId}/status`, { status })
      setMyAds(prev => prev.map(a => a.id === adId ? { ...a, status } : a))
      toast.success(`Ad marked as ${status}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleDeleteAd(adId) {
    if (!window.confirm('Are you sure you want to delete this advertisement? This cannot be undone.')) return
    try {
      await api.delete(`/advertisements/${adId}`)
      setMyAds(prev => prev.filter(a => a.id !== adId))
      toast.success('Advertisement deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400">Welcome back, <span className="text-white">{user?.username}</span></p>
        </div>
        <Link to="/post" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Post New Ad
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          {/* Avatar */}
          <div className="card p-4 mb-4 text-center">
            <div className="relative inline-block mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center overflow-hidden mx-auto">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xl font-bold">{user?.username?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-brand-500 transition-colors"
                aria-label="Change avatar"
              >
                ✏️
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <p className="text-white font-semibold text-sm">{user?.username}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>

          <nav className="space-y-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-brand-600/30 text-brand-300 border border-brand-500/30' : 'text-slate-400 hover:text-white hover:bg-surface-600'
                }`}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
            <Link
              to={`/profile/${user?.username}`}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-surface-600 transition-colors"
            >
              <span>🔗</span> View Public Profile
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* My Ads */}
          {tab === 'my-ads' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title">My Advertisements</h2>
                <span className="text-slate-400 text-sm">{myAds.length} total</span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-24 card shimmer" />)}
                </div>
              ) : myAds.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-white font-semibold mb-1">No advertisements yet</p>
                  <p className="text-slate-400 text-sm mb-5">Create your first advertisement to start getting noticed</p>
                  <Link to="/post" className="btn-primary">Post Your First Ad</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myAds.map(ad => (
                    <div key={ad.id} className="card p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={getCategoryBadgeClass(ad.category)}>{ad.category}</span>
                            <span className="text-xs text-slate-500">{ad.job_type}</span>
                            <span className={getStatusBadgeClass(ad.status)}>{ad.status}</span>
                          </div>
                          <h3 className="text-white font-medium truncate">{ad.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span>{timeAgo(ad.created_at)}</span>
                            <span>·</span>
                            <span>{ad.views} views</span>
                            {ad.payment_amount && (
                              <>
                                <span>·</span>
                                <span className="text-brand-400">{formatCurrency(ad.payment_amount, ad.payment_currency)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link to={`/advertisements/${ad.id}`} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-600 transition-colors" title="View">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </Link>
                          <Link to={`/advertisements/${ad.id}/edit`} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-600 transition-colors" title="Edit">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </Link>
                          {/* Feature button */}
                          {ad.is_featured && ad.featured_until && new Date(ad.featured_until) > new Date() ? (
                            <span className="px-2 py-1 rounded-lg text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 font-medium" title="Currently featured">
                              ⭐
                            </span>
                          ) : (
                            <Link to={`/feature/${ad.id}`} className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors" title="Feature this ad for $5">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                            </Link>
                          )}                          {ad.status === 'active' ? (
                            <button onClick={() => handleStatusChange(ad.id, 'filled')} className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors" title="Mark as Filled">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          ) : (
                            <button onClick={() => handleStatusChange(ad.id, 'active')} className="p-2 rounded-lg text-brand-400 hover:bg-brand-500/10 transition-colors" title="Reopen">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                          )}
                          <button onClick={() => handleDeleteAd(ad.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved */}
          {tab === 'saved' && (
            <div>
              <h2 className="section-title mb-5">Saved Advertisements</h2>
              {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 card shimmer" />)}</div>
              ) : savedAds.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-4xl mb-3">🔖</p>
                  <p className="text-white font-semibold mb-1">No saved advertisements</p>
                  <p className="text-slate-400 text-sm mb-5">Save advertisements to find them easily later</p>
                  <Link to="/browse" className="btn-primary">Browse Jobs</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedAds.map(ad => (
                    <Link key={ad.id} to={`/advertisements/${ad.id}`} className="card-hover flex items-center justify-between p-4 gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1"><span className={getCategoryBadgeClass(ad.category)}>{ad.category}</span><span className="text-xs text-slate-500">{ad.job_type}</span></div>
                        <p className="text-white font-medium truncate">{ad.title}</p>
                        <p className="text-xs text-slate-500">{ad.username} · {timeAgo(ad.created_at)}</p>
                      </div>
                      {ad.payment_amount && <span className="text-brand-400 font-semibold text-sm">{formatCurrency(ad.payment_amount, ad.payment_currency)}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Edit Profile */}
          {tab === 'profile' && (
            <div>
              <h2 className="section-title mb-5">Edit Profile</h2>
              <div className="card p-6 space-y-5">
                <div>
                  <label className="label">Bio</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                    className="input resize-none h-24"
                    placeholder="Tell people about yourself, your experience, and what you do..."
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="label">Skills (comma separated)</label>
                  <input
                    value={profileForm.skills}
                    onChange={e => setProfileForm(f => ({ ...f, skills: e.target.value }))}
                    className="input"
                    placeholder="e.g. Lua, Blender, Roblox Studio, React"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Social Links</label>
                    <button
                      onClick={() => setProfileForm(f => ({ ...f, social_links: [...f.social_links, { platform: 'github', url: '' }] }))}
                      className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      + Add Link
                    </button>
                  </div>
                  <div className="space-y-2">
                    {profileForm.social_links.map((link, i) => (
                      <div key={i} className="flex gap-2">
                        <select
                          value={link.platform}
                          onChange={e => setProfileForm(f => ({ ...f, social_links: f.social_links.map((l, idx) => idx === i ? { ...l, platform: e.target.value } : l) }))}
                          className="input text-sm py-2 w-32 flex-shrink-0"
                        >
                          {SOCIAL_PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        <input
                          value={link.url}
                          onChange={e => setProfileForm(f => ({ ...f, social_links: f.social_links.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l) }))}
                          className="input text-sm py-2 flex-1"
                          placeholder="URL or handle"
                        />
                        <button
                          onClick={() => setProfileForm(f => ({ ...f, social_links: f.social_links.filter((_, idx) => idx !== i) }))}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary">
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {/* Account Settings */}
          {tab === 'account' && (
            <div>
              <h2 className="section-title mb-5">Account Settings</h2>
              <div className="card p-6 space-y-5">
                <div className="pb-5 border-b border-surface-500">
                  <p className="text-sm font-medium text-slate-300 mb-1">Username</p>
                  <p className="text-white">{user?.username}</p>
                </div>
                <div className="pb-5 border-b border-surface-500">
                  <p className="text-sm font-medium text-slate-300 mb-1">Email</p>
                  <p className="text-white">{user?.email}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-4">Change Password</h3>
                  <div className="space-y-3">
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                      className="input"
                      placeholder="Current password"
                    />
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                      className="input"
                      placeholder="New password (min 8 chars)"
                    />
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
                      className="input"
                      placeholder="Confirm new password"
                    />
                    <button onClick={handleChangePassword} disabled={savingPassword} className="btn-primary">
                      {savingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-5 border-t border-red-500/20">
                  <h3 className="font-semibold text-red-400 mb-1">Danger Zone</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Permanently delete your account. This removes your profile, all advertisements,
                    saved ads, and every piece of data associated with your account. This cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn-danger text-sm px-5 py-2.5"
                  >
                    🗑️ Delete My Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 border-red-500/30 animate-slide-up">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="font-display font-bold text-white text-xl mb-2">Delete Account</h2>
              <p className="text-slate-400 text-sm">
                This will permanently delete <span className="text-white font-semibold">{user?.username}</span>'s account
                and ALL associated data including ads, saved items, and profile info.
                <span className="text-red-400 font-semibold"> This cannot be undone.</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Enter your password to confirm</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className="input border-red-500/30 focus:ring-red-500"
                  placeholder="Your password"
                />
              </div>

              <div>
                <label className="label">
                  Type <span className="text-red-400 font-mono font-bold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="input border-red-500/30 focus:ring-red-500"
                  placeholder="DELETE"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletePassword('')
                  setDeleteConfirmText('')
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== 'DELETE' || !deletePassword}
                className="btn-danger flex-1 disabled:opacity-40"
              >
                {deletingAccount ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
