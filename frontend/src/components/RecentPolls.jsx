import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecentPolls } from '../utils/api'
import { PollCardSkeleton } from './LoadingSpinner'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ExpiryLabel({ expiresAt }) {
  if (!expiresAt) return <span className="pill bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">No expiry</span>
  const diff = new Date(expiresAt) - Date.now()
  if (diff <= 0) return <span className="pill bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">Expired</span>
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(hrs / 24)
  const label = days > 0 ? `${days}d left` : `${hrs}h left`
  return <span className="pill bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">⏳ {label}</span>
}

export default function RecentPolls() {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecentPolls()
      .then(d => setPolls(d.polls || []))
      .catch(() => setPolls([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-700 dark:text-ink-300 uppercase tracking-wider">
          Recent Polls
        </h2>
        <span className="text-xs text-ink-400 font-mono">{polls.length} active</span>
      </div>

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <PollCardSkeleton key={i} />)
          : polls.length === 0
          ? (
            <div className="card p-6 text-center">
              <p className="text-2xl mb-1">🗳️</p>
              <p className="text-sm text-ink-500 dark:text-ink-400">No polls yet.<br />Be the first to create one!</p>
            </div>
          )
          : polls.map(poll => (
            <Link
              key={poll.slug}
              to={`/poll/${poll.slug}`}
              className="card card-hover block p-4 group"
            >
              <p className="text-sm font-medium text-ink-800 dark:text-ink-100 leading-snug line-clamp-2 mb-2 group-hover:text-brand-500 transition-colors">
                {poll.question}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="pill bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 font-mono">
                  {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                </span>
                <span className="pill bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400">
                  {poll.options.length} opts
                </span>
                <ExpiryLabel expiresAt={poll.expiresAt} />
                <span className="ml-auto text-xs text-ink-400 dark:text-ink-500">
                  {timeAgo(poll.createdAt)}
                </span>
              </div>
            </Link>
          ))
        }
      </div>
    </div>
  )
}
