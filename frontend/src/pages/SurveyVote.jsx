import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getSurvey, voteSurvey } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

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

export default function SurveyVote() {
  const { slug } = useParams()
  const navigate  = useNavigate()

  const [survey, setSurvey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [expired, setExpired] = useState(false)
  const [voterName, setVoterName] = useState('')
  
  // answers maps questionIndex -> optionIndex
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    if (localStorage.getItem(`survey_voted_${slug}`)) navigate(`/survey/results/${slug}`, { replace: true })
  }, [slug, navigate])

  useEffect(() => {
    getSurvey(slug)
      .then(d => {
        setSurvey(d.survey)
        if (d.survey.isExpired) setExpired(true)
        // Initialize answers array with nulls
        setAnswers(new Array(d.survey.questions.length).fill(null))
      })
      .catch(err => {
        if (err.response?.status === 404) { toast.error('Survey not found.'); navigate('/') }
        else toast.error('Failed to load survey.')
      })
      .finally(() => setLoading(false))
  }, [slug, navigate])

  const selectOption = (qIdx, oIdx) => {
    if (voting || expired) return
    setAnswers(prev => {
      const copy = [...prev]
      copy[qIdx] = oIdx
      return copy
    })
  }

  const handleVote = async () => {
    if (voting || expired) return
    if (survey?.requireName && !voterName.trim()) {
      return toast.error("Please enter your name to vote.")
    }
    
    // Check if all questions are answered
    const unansweredIndex = answers.findIndex(a => a === null)
    if (unansweredIndex !== -1) {
      return toast.error(`Please answer Question ${unansweredIndex + 1} before submitting.`)
    }

    setVoting(true)
    try {
      await voteSurvey(slug, answers, voterName)
      localStorage.setItem(`survey_voted_${slug}`, '1')
      toast.success('Survey submitted! 🎉')
      navigate(`/survey/results/${slug}`)
    } catch (err) {
      const status = err.response?.status
      if (status === 409) {
        localStorage.setItem(`survey_voted_${slug}`, '1')
        toast('Already voted — showing results.')
        navigate(`/survey/results/${slug}`)
      } else if (status === 410) {
        setExpired(true); toast.error('Survey has expired.')
      } else {
        toast.error(err.response?.data?.error || 'Vote failed.')
      }
    } finally {
      setVoting(false)
    }
  }

  if (loading) return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center">
      <LoadingSpinner size={40} />
    </div>
  )
  if (!survey) return null

  const expiryLabel = formatExpiry(survey.expiresAt)

  /* ── Expired state ─────────────────────────────────────────────── */
  if (expired) return (
    <div className="min-h-[calc(100vh-56px)] bg-ink-50 dark:bg-ink-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 animate-slide-up space-y-4">
        <div className="card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">⏰</span>
            <h1 className="font-bold text-ink-900 dark:text-ink-50">Survey Ended</h1>
          </div>
          <p className="text-sm text-ink-500 dark:text-ink-400">This survey has expired.</p>
        </div>
        <Link to={`/survey/results/${slug}`} className="btn-primary w-full text-center py-3 block">View Final Results</Link>
        <div className="text-center mt-4">
          <Link to="/" className="btn-ghost text-sm">← Create a new survey</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-56px)] bg-ink-50 dark:bg-ink-950 pb-20">
      {/* Header */}
      <div className="border-b border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="pill bg-brand-100 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400">
              Survey
            </span>
            {expiryLabel && (
              <span className="pill bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                ⏳ {expiryLabel}
              </span>
            )}
            <span className="pill bg-ink-100 dark:bg-ink-800 text-ink-500 font-mono">
              {survey.questions.length} Questions
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink-900 dark:text-ink-50 leading-snug">
            {survey.title}
          </h1>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-slide-up">
        {survey.requireName && (
          <div className="card p-6 border-2 border-brand-200 dark:border-brand-800">
            <label htmlFor="voter-name" className="block text-sm font-semibold text-ink-700 dark:text-ink-300 mb-2">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              id="voter-name"
              type="text"
              placeholder="Enter your name to start"
              value={voterName}
              onChange={e => setVoterName(e.target.value)}
              disabled={voting}
              className="input w-full bg-white dark:bg-ink-900"
            />
          </div>
        )}

        {survey.questions.map((q, qIdx) => (
          <div key={qIdx} className="card p-6 space-y-4">
            <h2 className="font-bold text-lg text-ink-900 dark:text-ink-50">
              <span className="text-brand-500 mr-2">{qIdx + 1}.</span>
              {q.text}
            </h2>
            <div className="space-y-3">
              {q.options.map((opt, oIdx) => {
                const isSelected = answers[qIdx] === oIdx

                return (
                  <button
                    key={oIdx}
                    onClick={() => selectOption(qIdx, oIdx)}
                    disabled={voting}
                    className={`w-full text-left rounded-xl border-2 overflow-hidden relative transition-all duration-200 focus:outline-none ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 scale-[1.01]'
                        : 'border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 hover:border-ink-300 hover:shadow-sm hover:-translate-y-0.5'
                    } disabled:cursor-not-allowed`}
                  >
                    {isSelected && (
                      <div className="absolute inset-y-0 left-0 bg-brand-100 dark:bg-brand-500/20 w-full animate-fade-in" />
                    )}

                    <div className="relative flex items-center gap-3 px-4 py-4">
                      <span className="text-lg shrink-0">{OPTION_EMOJIS[oIdx % 10]}</span>
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
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleVote}
            disabled={voting}
            className="btn-primary w-full sm:w-auto px-10 py-3 text-lg font-bold"
          >
            {voting ? <><LoadingSpinner size={20} /> Submitting…</> : 'Submit Survey'}
          </button>
          
          <div className="flex flex-col items-center sm:items-end text-xs text-ink-400 dark:text-ink-500">
            <span>Anonymous · one vote per device</span>
            <Link to={`/survey/results/${slug}`} className="hover:text-brand-500 transition-colors font-medium mt-1">
              Results only →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
