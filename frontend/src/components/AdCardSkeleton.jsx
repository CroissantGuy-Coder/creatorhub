import React from 'react'

export default function AdCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-20 shimmer rounded-full" />
        <div className="h-5 w-16 shimmer rounded-full" />
      </div>
      <div className="h-5 w-3/4 shimmer rounded mb-2" />
      <div className="h-4 w-full shimmer rounded mb-1" />
      <div className="h-4 w-2/3 shimmer rounded mb-4" />
      <div className="flex justify-between items-center pt-3 border-t border-surface-600">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full shimmer" />
          <div className="h-4 w-20 shimmer rounded" />
        </div>
        <div className="h-8 w-16 shimmer rounded-lg" />
      </div>
    </div>
  )
}
