export const CATEGORIES = {
  roblox: {
    label: 'Roblox',
    slug: 'roblox',
    description: 'Roblox game development, building, scripting, and more',
    icon: '🎮',
    color: 'red',
    currencies: ['Robux', 'USD'],
    jobTypes: [
      'Builder', 'Scripter', 'Animator', 'UI Designer',
      'VFX Artist', '3D Modeler', 'Game Developer', 'Other'
    ]
  },
  blender: {
    label: 'Blender / 3D',
    slug: 'blender',
    description: '3D modeling, animation, rendering, and Blender work',
    icon: '🧊',
    color: 'orange',
    currencies: ['USD'],
    jobTypes: [
      '3D Modeler', 'Animator', 'Rigging Artist', 'Texture Artist',
      'Environment Artist', 'Character Artist', 'Other'
    ]
  },
  coding: {
    label: 'Coding',
    slug: 'coding',
    description: 'Web development, game dev, scripting, and software work',
    icon: '💻',
    color: 'cyan',
    currencies: ['USD'],
    jobTypes: [
      'Web Developer', 'Game Developer', 'Python Developer',
      'JavaScript Developer', 'Lua Developer', 'C++ Developer',
      'Backend Developer', 'Frontend Developer', 'Other'
    ]
  }
}

export const PAYMENT_TYPES = [
  { value: 'Fixed Price', label: 'Fixed Price' },
  { value: 'Negotiable', label: 'Negotiable' },
  { value: 'Per Hour', label: 'Per Hour' },
  { value: 'Per Project', label: 'Per Project' },
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest_pay', label: 'Highest Pay' },
  { value: 'lowest_pay', label: 'Lowest Pay' },
]

export const REPORT_REASONS = [
  'Spam or misleading',
  'Inappropriate content',
  'Scam or fraud',
  'Underage user',
  'Harassment',
  'Other',
]

export const SOCIAL_PLATFORMS = [
  { value: 'discord', label: 'Discord', placeholder: 'Discord username or server link' },
  { value: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
  { value: 'twitter', label: 'X / Twitter', placeholder: 'https://twitter.com/username' },
  { value: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { value: 'portfolio', label: 'Portfolio', placeholder: 'https://yourportfolio.com' },
  { value: 'email', label: 'Email', placeholder: 'your@email.com' },
  { value: 'roblox', label: 'Roblox Profile', placeholder: 'https://roblox.com/users/...' },
  { value: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { value: 'other', label: 'Other', placeholder: 'https://...' },
]

export function getCategoryBadgeClass(category) {
  const map = {
    roblox: 'badge-roblox',
    blender: 'badge-blender',
    coding: 'badge-coding',
  }
  return map[category?.toLowerCase()] || 'badge'
}

export function getStatusBadgeClass(status) {
  const map = {
    active: 'badge-active',
    closed: 'badge-closed',
    filled: 'badge-filled',
  }
  return map[status?.toLowerCase()] || 'badge'
}

export function formatCurrency(amount, currency) {
  if (!amount && amount !== 0) return 'Negotiable'
  if (currency === 'Robux') return `${Number(amount).toLocaleString()} R$`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function timeAgo(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  if (diffMonths < 12) return `${diffMonths}mo ago`
  return `${Math.floor(diffMonths / 12)}y ago`
}
