import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import CreatePoll from './pages/CreatePoll'
import Vote from './pages/Vote'
import Results from './pages/Results'
import Admin from './pages/Admin'
import CreateSurvey from './pages/CreateSurvey'
import SurveyVote from './pages/SurveyVote'
import SurveyResults from './pages/SurveyResults'

export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('pv_dark')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('pv_dark', dark)
  }, [dark])

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 transition-colors duration-200">
      <Navbar dark={dark} toggleDark={() => setDark(d => !d)} />

      <Routes>
        <Route path="/"                     element={<CreatePoll />} />
        <Route path="/poll/:slug"           element={<Vote />} />
        <Route path="/results/:slug"        element={<Results />} />
        
        <Route path="/survey/new"           element={<CreateSurvey />} />
        <Route path="/survey/:slug"         element={<SurveyVote />} />
        <Route path="/survey/results/:slug" element={<SurveyResults />} />
        
        <Route path="/admin"                element={<Admin />} />
      </Routes>

      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            background: dark ? '#252422' : '#ffffff',
            color: dark ? '#f7f6f3' : '#131210',
            border: `1px solid ${dark ? '#3d3b39' : '#eeecea'}`,
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
          success: {
            iconTheme: { primary: '#f95b0a', secondary: '#fff' },
          },
        }}
      />
    </div>
  )
}
