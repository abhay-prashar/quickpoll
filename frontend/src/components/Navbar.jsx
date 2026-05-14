import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ dark, toggleDark }) {
  const loc = useLocation()
  const isHome = loc.pathname === '/'

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 dark:border-ink-800 bg-ink-50/90 dark:bg-ink-950/90 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            P
          </div>
          <span className="font-bold text-base tracking-tight text-ink-900 dark:text-ink-50">
            Poll<span className="text-brand-500">Vault</span>
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 mr-2">
            {loc.pathname !== '/' && (
              <Link to="/" className="btn-ghost text-xs">
                + New Poll
              </Link>
            )}
            {loc.pathname !== '/survey/new' && (
              <Link to="/survey/new" className="btn-ghost text-xs">
                + New Survey
              </Link>
            )}
          </div>

          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-ink-500 dark:text-ink-400 px-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            Live
          </div>

          {/* Dark mode */}
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
