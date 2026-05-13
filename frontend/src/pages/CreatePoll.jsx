import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createPoll } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import RecentPolls from '../components/RecentPolls'

const EXPIRY_OPTIONS = [
  { label: '∞  Never expires', value: 'never' },
  { label: '⚡ 1 hour',       value: '1h' },
  { label: '📅 1 day',        value: '1d' },
  { label: '📆 1 week',       value: '1w' },
]

const OPTION_EMOJIS = ['🔵','🟠','🟢','🟣','🔴','🟡','⚫','⚪','🟤','🔷']

export default function CreatePoll() {
  const navigate = useNavigate()
  const [question, setQuestion]   = useState('')
  const [options, setOptions]     = useState(['', ''])
  const [expiry, setExpiry]       = useState('never')
  const [loading, setLoading]     = useState(false)
  const [focusedOpt, setFocusedOpt] = useState(null)

  const addOption = () => {
    if (options.length >= 10) return toast.error('Max 10 options.')
    setOptions(p => [...p, ''])
  }

  const removeOption = (idx) => {
    if (options.length <= 2) return toast.error('Need at least 2 options.')
    setOptions(p => p.filter((_, i) => i !== idx))
  }

  const updateOption = (idx, val) => setOptions(p => p.map((o, i) => i === idx ? val : o))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const q = question.trim()
    if (!q) return toast.error('Question is required.')
    const validOpts = options.map(o => o.trim()).filter(Boolean)
    if (validOpts.length < 2) return toast.error('Fill in at least 2 options.')
    setLoading(true)
    try {
      const data = await createPoll({ question: q, options: validOpts, expiry })
      toast.success('Poll created!')
      navigate(`/poll/${data.poll.slug}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create poll.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-ink-50 dark:bg-ink-950">
      {/* Hero strip */}
      <div className="border-b border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-500 mb-2">New Poll</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-50 leading-tight">
                What do you want<br className="hidden sm:block"/> to know today?
              </h1>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 max-w-sm">
                Create a poll, share the link, and watch votes come in live — no account needed.
              </p>
            </div>
            <div className="hidden sm:block text-5xl select-none">🗳️</div>
          </div>
        </div>
      </div>

      {/* Body: 2-column on md+ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">

        {/* ── Poll Form ─────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Question */}
          <div className="card p-5 sm:p-6">
            <label htmlFor="poll-question" className="block text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-3">
              Question
            </label>
            <textarea
              id="poll-question"
              rows={3}
              maxLength={500}
              placeholder="e.g. What's the best programming language in 2025?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="input resize-none text-base font-medium"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-ink-400">
                {question.length > 0 ? `${question.length} chars` : 'Up to 500 characters'}
              </span>
              {question.length > 400 && (
                <span className="text-xs text-amber-500 font-medium">{500 - question.length} left</span>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                Answer Options
              </label>
              <span className="font-mono text-xs text-ink-400">{options.length}/10</span>
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 rounded-xl border-2 transition-all duration-150 ${
                    focusedOpt === idx
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/5'
                      : 'border-transparent bg-ink-50 dark:bg-ink-800/60'
                  }`}
                >
                  <span className="pl-3 text-base select-none">{OPTION_EMOJIS[idx]}</span>
                  <input
                    id={`poll-option-${idx}`}
                    type="text"
                    maxLength={200}
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={e => updateOption(idx, e.target.value)}
                    onFocus={() => setFocusedOpt(idx)}
                    onBlur={() => setFocusedOpt(null)}
                    className="flex-1 bg-transparent py-3 pr-2 text-sm text-ink-900 dark:text-ink-100 placeholder-ink-400 dark:placeholder-ink-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    disabled={options.length <= 2}
                    aria-label={`Remove option ${idx + 1}`}
                    className="pr-3 text-ink-400 hover:text-red-500 disabled:opacity-25 transition-colors"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOption}
              disabled={options.length >= 10}
              className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add option
            </button>
          </div>

          {/* Expiry + submit row */}
          <div className="card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full">
              <label htmlFor="poll-expiry" className="block text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-2">
                Duration
              </label>
              <select
                id="poll-expiry"
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                className="input w-full sm:max-w-[220px]"
              >
                {EXPIRY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <button
              id="create-poll-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto px-8 py-3 text-base mt-auto"
            >
              {loading ? <><LoadingSpinner size={18} /> Creating…</> : 'Create Poll →'}
            </button>
          </div>
        </form>

        {/* ── Sidebar: Recent Polls ─────────────────────────────────── */}
        <aside className="animate-fade-in">
          <RecentPolls />
        </aside>
      </div>
    </div>
  )
}
