import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getSurvey, getSurveyVotes } from '../utils/api'
import LiveBarChart from '../components/LiveBarChart'
import LoadingSpinner, { Skeleton } from '../components/LoadingSpinner'
import QRCodeDisplay from '../components/QRCodeDisplay'

// Share component for Surveys
function ShareSurveyBar({ survey }) {
  const voteUrl    = `${window.location.origin}/survey/${survey.slug}`
  const resultsUrl = `${window.location.origin}/survey/results/${survey.slug}`

  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Copied to clipboard!')
    } catch { toast.error('Copy failed.') }
  }

  const downloadCSV = async () => {
    try {
      const { votes } = await getSurveyVotes(survey.slug);
      let header = "Voter Name,Time Voted";
      survey.questions.forEach((q, i) => { header += `,Q${i+1}: ${q.text.replace(/"/g, '""')}` });
      header += "\n";
      
      const rows = votes.map(v => {
        let row = `"${(v.voterName || '').replace(/"/g, '""')}",${new Date(v.votedAt).toISOString()}`;
        v.answers.forEach(ans => { row += `,"${ans.option.replace(/"/g, '""')}"` });
        return row;
      }).join("\n");
      
      const csvContent = "data:text/csv;charset=utf-8," + header + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `survey-${survey.slug}-results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="card p-5 mt-6 border-2 border-ink-200 dark:border-ink-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
          Share & Export
        </h3>
        <button onClick={downloadCSV} className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <div>
            <span className="text-xs text-ink-400 mb-1 block">Survey link</span>
            <div className="flex">
              <input readOnly value={voteUrl} className="input rounded-r-none flex-1 text-xs sm:text-sm text-ink-500 bg-ink-50 dark:bg-ink-950 truncate" />
              <button onClick={() => copy(voteUrl)} className="btn-primary rounded-l-none px-4 sm:px-6">Copy</button>
            </div>
          </div>
          <div>
            <span className="text-xs text-ink-400 mb-1 block">Results link</span>
            <div className="flex">
              <input readOnly value={resultsUrl} className="input rounded-r-none flex-1 text-xs sm:text-sm text-ink-500 bg-ink-50 dark:bg-ink-950 truncate" />
              <button onClick={() => copy(resultsUrl)} className="btn-primary rounded-l-none px-4 sm:px-6">Copy</button>
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

export default function SurveyResults() {
  const { slug }   = useParams()
  const [survey, setSurvey]   = useState(null)
  const [voters, setVoters]   = useState([])
  const [loading, setLoading] = useState(true)
  const [animKey, setAnimKey] = useState(0)

  const fetchSurvey = useCallback(async () => {
    try {
      const data = await getSurvey(slug)
      
      setAnimKey(k => k + 1)
      
      if (data.survey.requireName) {
        const votesData = await getSurveyVotes(slug);
        setVoters(votesData.votes);
      }
      
      setSurvey(data.survey)
      return true
    } catch (err) {
      if (err.response?.status === 404) toast.error('Survey not found.')
      else toast.error('Failed to load results.')
      return false
    }
  }, [slug])

  useEffect(() => {
    fetchSurvey().then(success => { if (success) setLoading(false) })
    const interval = setInterval(fetchSurvey, 5000)
    return () => clearInterval(interval)
  }, [fetchSurvey])

  if (loading) return (
    <div className="min-h-[calc(100vh-56px)] max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <Skeleton className="h-10 w-3/4 mb-8" />
      <div className="card p-4 space-y-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-32 w-full" /></div>
      <div className="card p-4 space-y-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-32 w-full" /></div>
    </div>
  )
  if (!survey) return null

  const isExpired = survey.isExpired
  const totalVotesAcrossAll = survey.questions.reduce((sum, q) => sum + q.totalVotes, 0);
  const totalCompletions = survey.questions.length ? Math.floor(totalVotesAcrossAll / survey.questions.length) : 0;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-ink-50 dark:bg-ink-950 pb-20">
      <div className="border-b border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isExpired ? (
                <span className="pill bg-ink-200 dark:bg-ink-800 text-ink-600">Ended</span>
              ) : (
                <span className="pill bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> Live
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-ink-900 dark:text-ink-50 leading-tight">
              {survey.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-slide-up">
        {!isExpired && !localStorage.getItem(`survey_voted_${slug}`) && (
          <div className="card p-4 sm:p-5 bg-brand-50/50 dark:bg-brand-500/5 border-2 border-brand-200 dark:border-brand-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-700 dark:text-brand-400 text-base">Haven't completed this survey yet?</p>
              <p className="text-sm text-brand-600/80 dark:text-brand-400/80 mt-0.5">Take the survey to have your answers recorded.</p>
            </div>
            <Link to={`/survey/${slug}`} className="btn-primary px-6 py-2.5 text-sm whitespace-nowrap w-full sm:w-auto text-center font-bold">
              Take Survey →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4 text-center">
            <span className="block text-xl sm:text-2xl font-bold text-brand-500">{totalCompletions}</span>
            <span className="text-xs text-ink-400 uppercase tracking-wider font-semibold">Completions</span>
          </div>
          <div className="card p-4 text-center hidden sm:block">
            <span className="block text-xl sm:text-2xl font-bold text-ink-800 dark:text-ink-200">{survey.uniqueVoters || 0}</span>
            <span className="text-xs text-ink-400 uppercase tracking-wider font-semibold">Unique IPs</span>
          </div>
          <div className="card p-4 text-center">
            <span className="block text-xl sm:text-2xl font-bold text-ink-800 dark:text-ink-200">+{survey.votesLastHour || 0}</span>
            <span className="text-xs text-ink-400 uppercase tracking-wider font-semibold">Past Hour</span>
          </div>
        </div>

        {survey.questions.map((q, qIdx) => (
          <div key={qIdx} className="card p-5 sm:p-6 mb-6">
            <h2 className="font-bold text-lg text-ink-900 dark:text-ink-50 mb-5">
              <span className="text-brand-500 mr-2">{qIdx + 1}.</span>
              {q.text}
            </h2>
            <LiveBarChart poll={q} animKey={`q-${qIdx}-${animKey}`} />
          </div>
        ))}

        {survey.requireName && totalCompletions > 0 && (
          <div className="card p-5 mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500 mb-4">
              Recent Respondents
            </p>
            <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
              {voters.map((v, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-ink-100 dark:border-ink-800 last:border-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-ink-900 dark:text-ink-100">{v.voterName}</span>
                  </div>
                  <span className="text-xs text-ink-500">{new Date(v.votedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <ShareSurveyBar survey={survey} />

        <div className="flex items-center justify-between pt-4 text-xs text-ink-400 dark:text-ink-500">
          {!isExpired && (
            <Link to={`/survey/${slug}`} className="hover:text-brand-500 transition-colors font-medium">← Take Survey</Link>
          )}
          <Link to="/survey/new" className="ml-auto hover:text-brand-500 transition-colors font-medium">
            New survey →
          </Link>
        </div>
      </div>
    </div>
  )
}
