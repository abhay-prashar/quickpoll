import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getPoll, votePoll } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import LiveBarChart from '../components/LiveBarChart'

const OPTION_EMOJIS = ['🔵','🟠','🟢','🟣','🔴','🟡','⚫','⚪','🟤','🔷']

function formatExpiry(expiresAt) {
  if (!expiresAt) return null
  const diff = new Date(expiresAt) - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h >= 24) return `${Math.floor(h/24)}d ${h%24}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

export default function Vote() {
  const { slug } = useParams()
  const navigate  = useNavigate()

  const [poll, setPoll]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [voting, setVoting]     = useState(false)
  const [selected, setSelected] = useState(null)
  const [expired, setExpired]   = useState(false)
  const [hovering, setHovering] = useState(null)
  const [voterName, setVoterName] = useState('')

  useEffect(() => {
    if (localStorage.getItem(`voted_${slug}`)) navigate(`/results/${slug}`, { replace: true })
  }, [slug, navigate])

  useEffect(() => {
    getPoll(slug)
      .then(d => { setPoll(d.poll); if (d.poll.isExpired) setExpired(true) })
      .catch(err => {
        if (err.response?.status === 404) { toast.error('Poll not found.'); navigate('/') }
        else toast.error('Failed to load poll.')
      })
      .finally(() => setLoading(false))
  }, [slug, navigate])

  const handleVote = async (idx) => {
    if (selected !== null || voting || expired) return
    if (poll?.requireName && !voterName.trim()) {
      return toast.error("Please enter your name to vote.")
    }
    
    setSelected(idx)
    // small delay so user sees selection before submit
    await new Promise(r => setTimeout(r, 340))
    setVoting(true)
    try {
      await votePoll(slug, idx, voterName)
      localStorage.setItem(`voted_${slug}`, '1')
      toast.success('Vote recorded! 🎉')
      navigate(`/results/${slug}`)
    } catch (err) {
      const status = err.response?.status
      if (status === 409) {
        localStorage.setItem(`voted_${slug}`, '1')
        toast('Already voted — showing results.')
        navigate(`/results/${slug}`)
      } else if (status === 410) {
        setExpired(true); toast.error('Poll has expired.')
      } else {
        toast.error(err.response?.data?.error || 'Vote failed.')
      }
      setSelected(null)
    } finally {
      setVoting(false)
    }
  }

  if (loading) return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
      <LoadingSpinner size={40} />
    </div>
  )
  if (!poll) return null

  const total = poll.options.reduce((s, o) => s + o.votes, 0)
  const expiryLabel = formatExpiry(poll.expiresAt)

  /* ── Expired state ─────────────────────────────────────────────── */
  if (expired) return (
    <div className="min-h-[calc(100vh-56px)] bg-ink-50 dark:bg-ink-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 animate-slide-up space-y-4">
        <div className="card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">⏰</span>
            <h1 className="font-bold text-ink-900 dark:text-ink-50">Poll Ended</h1>
          </div>
          <p className="text-sm text-ink-500 dark:text-ink-400">This poll has expired. Final results below.</p>
        </div>
        <div className="card p-5 sm:p-6">
          <h2 className="font-bold text-lg text-ink-900 dark:text-ink-50 mb-5">{poll.question}</h2>
          <LiveBarChart poll={poll} animKey="expired" />
        </div>
        <Link to="/" className="btn-ghost text-sm">← Create a new poll</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-56px)] bg-ink-50 dark:bg-ink-950">
      {/* Question header */}
      <div className="border-b border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="pill bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400">
              Cast your vote
            </span>
            {expiryLabel && (
              <span className="pill bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                ⏳ {expiryLabel}
              </span>
            )}
            <span className="pill bg-ink-100 dark:bg-ink-800 text-ink-500 font-mono">
              {total} {total === 1 ? 'vote' : 'votes'} so far
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-ink-50 leading-snug">
            {poll.question}
          </h1>
        </div>
      </div>

      {/* Options */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-3 animate-slide-up">
        {poll.requireName && (
          <div className="mb-6">
            <label htmlFor="voter-name" className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-2">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              id="voter-name"
              type="text"
              placeholder="Enter your name to vote"
              value={voterName}
              onChange={e => setVoterName(e.target.value)}
              disabled={voting || selected !== null}
              className="input w-full"
            />
          </div>
        )}

        {poll.options.map((opt, idx) => {
          const isSelected = selected === idx
          const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0

          return (
            <button
              key={idx}
              id={`vote-option-${idx}`}
              onClick={() => handleVote(idx)}
              disabled={voting || selected !== null}
              onMouseEnter={() => setHovering(idx)}
              onMouseLeave={() => setHovering(null)}
              className={`w-full text-left rounded-xl border-2 overflow-hidden relative transition-all duration-200 focus:outline-none ${
                isSelected
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 scale-[1.01]'
                  : hovering === idx
                  ? 'border-ink-300 dark:border-ink-600 bg-white dark:bg-ink-900 shadow-card-hover -translate-y-0.5'
                  : 'border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900'
              } disabled:cursor-not-allowed`}
            >
              {/* Vote bar background */}
              {total > 0 && !isSelected && (
                <div
                  className="absolute inset-y-0 left-0 bg-ink-100 dark:bg-ink-800 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              )}
              {isSelected && (
                <div className="absolute inset-y-0 left-0 bg-brand-100 dark:bg-brand-500/20 w-full animate-fade-in" />
              )}

              {/* Content */}
              <div className="relative flex items-center gap-3 px-4 py-4">
                <span className="text-lg shrink-0">{OPTION_EMOJIS[idx]}</span>
                <span className="flex-1 text-sm font-medium text-ink-800 dark:text-ink-100">
                  {opt.text}
                </span>
                {isSelected && (
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center animate-pop">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                )}
                {total > 0 && selected === null && (
                  <span className="shrink-0 font-mono text-xs text-ink-400">{pct}%</span>
                )}
              </div>
            </button>
          )
        })}

        {(voting || selected !== null) && (
          <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400 py-2 justify-center animate-fade-in">
            <LoadingSpinner size={18} /> Submitting…
          </div>
        )}

        <div className="pt-2 flex items-center justify-between text-xs text-ink-400 dark:text-ink-500">
          <span>Anonymous · one vote per device</span>
          <Link to={`/results/${slug}`} className="hover:text-brand-500 transition-colors font-medium">
            Results only →
          </Link>
        </div>
      </div>
    </div>
  )
}
