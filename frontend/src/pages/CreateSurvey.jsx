import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createSurvey } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import RecentPolls from '../components/RecentPolls'

const EXPIRY_OPTIONS = [
  { label: '∞  Never expires', value: 'never' },
  { label: '⚡ 1 hour',       value: '1h' },
  { label: '📅 1 day',        value: '1d' },
  { label: '📆 1 week',       value: '1w' },
]

const OPTION_EMOJIS = ['🔵','🟠','🟢','🟣','🔴','🟡','⚫','⚪','🟤','🔷']

export default function CreateSurvey() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState([
    { text: '', options: ['', ''] }
  ])
  const [expiry, setExpiry] = useState('never')
  const [requireName, setRequireName] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedOpt, setFocusedOpt] = useState({ qIdx: null, oIdx: null })

  const addQuestion = () => {
    if (questions.length >= 20) return toast.error('Max 20 questions.')
    setQuestions(p => [...p, { text: '', options: ['', ''] }])
  }

  const removeQuestion = (qIdx) => {
    if (questions.length <= 1) return toast.error('Need at least 1 question.')
    setQuestions(p => p.filter((_, i) => i !== qIdx))
  }

  const updateQuestionText = (qIdx, val) => {
    setQuestions(p => p.map((q, i) => i === qIdx ? { ...q, text: val } : q))
  }

  const addOption = (qIdx) => {
    setQuestions(p => p.map((q, i) => {
      if (i === qIdx) {
        if (q.options.length >= 10) { toast.error('Max 10 options per question.'); return q; }
        return { ...q, options: [...q.options, ''] }
      }
      return q;
    }))
  }

  const removeOption = (qIdx, oIdx) => {
    setQuestions(p => p.map((q, i) => {
      if (i === qIdx) {
        if (q.options.length <= 2) { toast.error('Need at least 2 options.'); return q; }
        return { ...q, options: q.options.filter((_, j) => j !== oIdx) }
      }
      return q;
    }))
  }

  const updateOption = (qIdx, oIdx, val) => {
    setQuestions(p => p.map((q, i) => {
      if (i === qIdx) {
        return { ...q, options: q.options.map((o, j) => j === oIdx ? val : o) }
      }
      return q;
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return toast.error('Survey title is required.')
    
    // validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) return toast.error(`Question ${i+1} needs text.`)
      const validOpts = questions[i].options.map(o => o.trim()).filter(Boolean)
      if (validOpts.length < 2) return toast.error(`Question ${i+1} needs at least 2 options.`)
    }

    setLoading(true)
    try {
      const data = await createSurvey({ title: t, questions, expiry, requireName })
      toast.success('Survey created!')
      navigate(`/survey/${data.survey.slug}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create survey.')
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
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-500 mb-2">New Survey</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-50 leading-tight">
                Create a Multi-Question <br className="hidden sm:block"/> Bundle
              </h1>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400 max-w-sm">
                Chain multiple polls together into a single link. Great for quizzes or feedback forms.
              </p>
              <Link to="/" className="mt-4 inline-flex btn-ghost text-sm">
                ← Back to Single Poll
              </Link>
            </div>
            <div className="hidden sm:block text-5xl select-none">📋</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="card p-5 sm:p-6">
            <label htmlFor="survey-title" className="block text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-3">
              Survey Title
            </label>
            <input
              id="survey-title"
              type="text"
              maxLength={200}
              placeholder="e.g. Employee Satisfaction Survey 2026"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input w-full text-lg font-bold"
            />
          </div>

          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="card p-5 sm:p-6 relative border-l-4 border-l-brand-500">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Question {qIdx + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    disabled={questions.length <= 1}
                    className="text-ink-400 hover:text-red-500 disabled:opacity-0 transition-colors"
                    title="Remove Question"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder={`Question ${qIdx + 1} text`}
                  value={q.text}
                  onChange={e => updateQuestionText(qIdx, e.target.value)}
                  className="input w-full resize-none text-base font-medium mb-4"
                />

                <div className="space-y-2.5">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`flex items-center gap-3 rounded-xl border-2 transition-all duration-150 ${
                        focusedOpt.qIdx === qIdx && focusedOpt.oIdx === oIdx
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/5'
                          : 'border-transparent bg-ink-50 dark:bg-ink-800/60'
                      }`}
                    >
                      <span className="pl-3 text-base select-none">{OPTION_EMOJIS[oIdx % 10]}</span>
                      <input
                        type="text"
                        maxLength={200}
                        placeholder={`Option ${oIdx + 1}`}
                        value={opt}
                        onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                        onFocus={() => setFocusedOpt({ qIdx, oIdx })}
                        onBlur={() => setFocusedOpt({ qIdx: null, oIdx: null })}
                        className="flex-1 bg-transparent py-2.5 pr-2 text-sm text-ink-900 dark:text-ink-100 placeholder-ink-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(qIdx, oIdx)}
                        disabled={q.options.length <= 2}
                        className="pr-3 text-ink-400 hover:text-red-500 disabled:opacity-25 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addOption(qIdx)}
                  disabled={q.options.length >= 10}
                  className="mt-4 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
                >
                  + Add Option
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full card p-4 border-dashed border-2 border-brand-200 dark:border-brand-800 bg-brand-50/30 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400 font-medium hover:bg-brand-50 hover:dark:bg-brand-900/30 transition-colors text-center"
          >
            + Add Another Question
          </button>

          {/* Expiry + submit row */}
          <div className="card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 w-full">
              <label htmlFor="survey-expiry" className="block text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-2">
                Duration
              </label>
              <select
                id="survey-expiry"
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                className="input w-full sm:max-w-[220px]"
              >
                {EXPIRY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 w-full flex items-center justify-start sm:justify-center gap-2 mt-2 sm:mt-0 pt-4 sm:pt-6">
              <input
                id="survey-require-name"
                type="checkbox"
                checked={requireName}
                onChange={e => setRequireName(e.target.checked)}
                className="w-4 h-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="survey-require-name" className="text-sm font-medium text-ink-700 dark:text-ink-300">
                Ask for voter's name
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto px-8 py-3 text-base mt-auto"
            >
              {loading ? <><LoadingSpinner size={18} /> Creating…</> : 'Create Survey →'}
            </button>
          </div>
        </form>

        <aside className="animate-fade-in hidden md:block">
           <div className="card p-5 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
            <h3 className="font-bold mb-2">Pro Tip 💡</h3>
            <p className="text-sm text-brand-50">
              Surveys keep your respondents engaged. Ensure you add enough options for every question to get accurate data.
            </p>
           </div>
        </aside>
      </div>
    </div>
  )
}
