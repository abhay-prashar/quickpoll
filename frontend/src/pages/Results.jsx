import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getPoll } from '../utils/api'
import LiveBarChart from '../components/LiveBarChart'
import LoadingSpinner, { Skeleton } from '../components/LoadingSpinner'
import QRCodeDisplay from '../components/QRCodeDisplay'

const COLORS = ['#f95b0a','#fb7a33','#fdaa6e','#f97316','#ea580c','#c2410c','#9a3412','#7c2d12','#fb923c','#fed7aa']
const OPTION_EMOJIS = ['🔵','🟠','🟢','🟣','🔴','🟡','⚫','⚪','🟤','🔷']

/* ── Countdown ─────────────────────────────────────────────────────── */
function Countdown({ expiresAt }) {
  const [str, setStr] = useState('')
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt) - Date.now()
      if (diff <= 0) { setStr('Expired'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setStr(d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`)
    }
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id)
  }, [expiresAt])
  return <span>{str}</span>
}

/* ── Winner card ───────────────────────────────────────────────────── */
function WinnerCard({ poll, total }) {
  if (total === 0) return null
  const max = Math.max(...poll.options.map(o => o.votes))
  const winners = poll.options.filter(o => o.votes === max)
  if (winners.length === poll.options.length) return null // tie / all equal
  const winner = winners[0]
  const winnerIdx = poll.options.indexOf(winner)
  const pct = Math.round((winner.votes / total) * 100)
  return (
    <div className="card p-4 border-l-4 animate-slide-up" style={{ borderLeftColor: COLORS[winnerIdx % COLORS.length] }}>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500 mb-1">
        {winners.length > 1 ? '🏆 Leading (tied)' : '🏆 Leading'}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xl">{OPTION_EMOJIS[winnerIdx]}</span>
        <span className="font-bold text-ink-900 dark:text-ink-50 text-base leading-snug">
          {winner.text}
        </span>
        <span className="ml-auto font-mono font-bold text-brand-500 text-lg">{pct}%</span>
      </div>
    </div>
  )
}

/* ── Stats row ─────────────────────────────────────────────────────── */
function StatsGrid({ poll, total }) {
  const max = Math.max(...poll.options.map(o => o.votes))
  return (
    <div className="space-y-2">
      {poll.options.map((opt, i) => {
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0
        const isWinner = opt.votes === max && max > 0
        return (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="flex-1 text-sm text-ink-700 dark:text-ink-300 truncate">
              {opt.text}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-24 h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                />
              </div>
              <span className="font-mono text-xs text-ink-900 dark:text-ink-100 w-8 text-right font-bold">{opt.votes}</span>
              <span className="font-mono text-xs text-ink-400 w-8 text-right">{pct}%</span>
              {isWinner && <span className="text-xs">🏆</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Share bar ─────────────────────────────────────────────────────── */
function ShareBar({ poll }) {
  const [copied, setCopied] = useState(false)
  const slug = poll.slug
  const voteUrl   = `${window.location.origin}/poll/${slug}`
  const resultsUrl = `${window.location.origin}/results/${slug}`

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000)
    } catch { toast.error('Copy failed.') }
  }

  const downloadCSV = () => {
    const header = "Option,Votes\n";
    const rows = poll.options.map(o => `"${o.text.replace(/"/g, '""')}",${o.votes}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + header + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `poll-${slug}-results.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">Share & Export</p>
        <button onClick={downloadCSV} className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1.5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1.5">Voting link</p>
            <div className="flex gap-1.5">
              <code className="flex-1 text-xs bg-ink-100 dark:bg-ink-800 px-2.5 py-2 rounded-lg truncate text-ink-600 dark:text-ink-300">
                {voteUrl}
              </code>
              <button onClick={() => copy(voteUrl)} className="btn-primary px-3 py-2 text-xs shrink-0">
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1.5">Results link</p>
            <div className="flex gap-1.5">
              <code className="flex-1 text-xs bg-ink-100 dark:bg-ink-800 px-2.5 py-2 rounded-lg truncate text-ink-600 dark:text-ink-300">
                {resultsUrl}
              </code>
              <button onClick={() => copy(resultsUrl)} className="btn-primary px-3 py-2 text-xs shrink-0">
                Copy
              </button>
            </div>
          </div>
        </div>
        
        <div className="hidden sm:block">
          <QRCodeDisplay url={voteUrl} />
        </div>
      </div>
    </div>
  )
}

/* ── Main Results ───────────────────────────────────────────────────── */
export default function Results() {
  const { slug }   = useParams()
  const [poll, setPoll]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [animKey, setAnimKey] = useState(0)
  const prevTotalRef          = useRef(0)

  const fetchPoll = useCallback(async () => {
    try {
      const data = await getPoll(slug)
      const newTotal = data.poll.options.reduce((s, o) => s + o.votes, 0)
      if (newTotal !== prevTotalRef.current) {
        setAnimKey(k => k + 1)
        prevTotalRef.current = newTotal
      }
      setPoll(data.poll)
      return true
    } catch (err) {
      if (err.response?.status === 404) toast.error('Poll not found.')
      return false
    } finally { setLoading(false) }
  }, [slug])

  useEffect(() => {
    let isActive = true;
    let delay = 3000;
    
    const pollLoop = async () => {
      if (!isActive) return;
      const success = await fetchPoll();
      if (!isActive) return;
      
      if (success) {
        delay = 3000; // reset on success
      } else {
        delay = Math.min(delay * 1.5, 30000); // exponential backoff up to 30s
      }
      setTimeout(pollLoop, delay);
    };
    
    fetchPoll().then(() => {
      if (isActive) setTimeout(pollLoop, delay);
    });
    
    return () => { isActive = false; };
  }, [fetchPoll])

  if (loading) return (
    <div className="min-h-[calc(100vh-56px)] bg-ink-50 dark:bg-ink-950">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-48 w-full mt-4" />
      </div>
    </div>
  )
  if (!poll) return null

  const total     = poll.options.reduce((s, o) => s + o.votes, 0)
  const isExpired = poll.expiresAt && new Date() > new Date(poll.expiresAt)

  return (
    <div className="min-h-[calc(100vh-56px)] bg-ink-50 dark:bg-ink-950">

      {/* ── Question header ─────────────────────────────────────────── */}
      <div className="border-b border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="pill bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400">Results</span>
            {!isExpired && (
              <span className="pill bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                Live · refreshes every 3s
              </span>
            )}
            {isExpired && (
              <span className="pill bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">⛔ Closed</span>
            )}
            {poll.expiresAt && !isExpired && (
              <span className="pill bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                ⏳ <Countdown expiresAt={poll.expiresAt} />
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-ink-50 leading-snug">
            {poll.question}
          </h1>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4 animate-slide-up">

        {/* Total votes + stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <p className="font-black text-2xl text-ink-900 dark:text-ink-50 tabular-nums">{total}</p>
            <p className="text-xs text-ink-400 mt-0.5">Total Votes</p>
          </div>
          <div className="card p-4 text-center">
            <p className="font-black text-2xl text-ink-900 dark:text-ink-50">{poll.options.length}</p>
            <p className="text-xs text-ink-400 mt-0.5">Options</p>
          </div>
          <div className="card p-4 text-center">
            <p className="font-black text-2xl text-ink-900 dark:text-ink-50">
              {isExpired ? '—' : total > 0 ? `${Math.max(...poll.options.map(o => Math.round((o.votes/total)*100)))}%` : '—'}
            </p>
            <p className="text-xs text-ink-400 mt-0.5">Top Share</p>
          </div>
        </div>

        {/* Winner highlight */}
        <WinnerCard poll={poll} total={total} />

        {/* Chart */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
              Distribution
            </p>
            <p className="font-mono text-xs text-ink-400">#{slug}</p>
          </div>

          {total === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl mb-2">🗳️</p>
              <p className="text-sm text-ink-400 dark:text-ink-500">No votes yet — share the poll!</p>
              <p className="text-xs text-ink-300 dark:text-ink-600 mt-1">Results update every 3 seconds</p>
            </div>
          ) : (
            <>
              <LiveBarChart poll={poll} animKey={animKey} />
              <div className="mt-5 pt-4 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">👥</span> 
                  <span><strong className="text-ink-900 dark:text-ink-50 font-bold">{poll.uniqueVoters || 0}</strong> unique voters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🔥</span> 
                  <span><strong className="text-ink-900 dark:text-ink-50 font-bold">{poll.votesLastHour || 0}</strong> votes past hour</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stats breakdown */}
        {total > 0 && (
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500 mb-4">
              Breakdown
            </p>
            <StatsGrid poll={poll} total={total} />
          </div>
        )}

        {/* Share */}
        <ShareBar poll={poll} />

        {/* Nav */}
        <div className="flex items-center justify-between pt-2 text-xs text-ink-400 dark:text-ink-500">
          {!isExpired && (
            <Link to={`/poll/${slug}`} className="hover:text-brand-500 transition-colors font-medium">← Vote</Link>
          )}
          <Link to="/" className="ml-auto hover:text-brand-500 transition-colors font-medium">
            New poll →
          </Link>
        </div>
      </div>
    </div>
  )
}
