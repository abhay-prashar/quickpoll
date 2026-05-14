import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { adminLogin, getAdminPolls, deletePoll, closePoll } from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { Link } from 'react-router-dom'

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('pv_admin_token') || null)
  const [password, setPassword] = useState('')
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (token) {
      loadPolls()
    }
  }, [token, page])

  const loadPolls = async () => {
    setLoading(true)
    try {
      const data = await getAdminPolls(token, page)
      setPolls(data.polls)
      setTotalPages(data.pagination.pages)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout()
        toast.error('Session expired')
      } else {
        toast.error('Failed to load polls')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await adminLogin(password)
      setToken(data.token)
      localStorage.setItem('pv_admin_token', data.token)
      toast.success('Logged in successfully')
    } catch (err) {
      toast.error('Invalid password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('pv_admin_token')
  }

  const handleDelete = async (slug) => {
    if (!window.confirm('Are you sure you want to permanently delete this poll?')) return
    try {
      await deletePoll(token, slug)
      toast.success('Poll deleted')
      loadPolls()
    } catch (err) {
      toast.error('Failed to delete poll')
    }
  }

  const handleClose = async (slug) => {
    if (!window.confirm('Are you sure you want to force-close this poll?')) return
    try {
      await closePoll(token, slug)
      toast.success('Poll closed')
      loadPolls()
    } catch (err) {
      toast.error('Failed to close poll')
    }
  }

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-ink-50 dark:bg-ink-950 flex flex-col items-center justify-center p-4">
        <div className="card w-full max-w-sm p-6 sm:p-8 animate-slide-up">
          <div className="text-center mb-6">
            <span className="text-4xl">🔐</span>
            <h1 className="text-xl font-bold mt-3 text-ink-900 dark:text-ink-50">Admin Access</h1>
            <p className="text-sm text-ink-500 mt-1">Enter password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input w-full"
              required
            />
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <LoadingSpinner size={18} /> : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-ink-50 dark:bg-ink-950 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Admin Dashboard</h1>
            <p className="text-sm text-ink-500">Manage all polls on the platform</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost text-sm py-2">
            Logout
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ink-100/50 dark:bg-ink-900/50 text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                  <th className="p-4 pl-6 font-medium">Question</th>
                  <th className="p-4 font-medium">Votes</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 pr-6 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800 text-sm">
                {loading && polls.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center">
                      <div className="flex justify-center"><LoadingSpinner size={24} /></div>
                    </td>
                  </tr>
                ) : polls.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-ink-500">No polls found.</td>
                  </tr>
                ) : (
                  polls.map((poll) => {
                    const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date()
                    return (
                      <tr key={poll._id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/20 transition-colors">
                        <td className="p-4 pl-6 font-medium text-ink-900 dark:text-ink-100 max-w-xs truncate">
                          <Link to={`/results/${poll.slug}`} className="hover:text-brand-500">
                            {poll.question}
                          </Link>
                        </td>
                        <td className="p-4 text-ink-600 dark:text-ink-300 font-mono">
                          {poll.totalVotes}
                        </td>
                        <td className="p-4">
                          <span className={`pill text-[10px] py-0.5 px-2 ${isExpired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {isExpired ? 'Closed' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-ink-500 text-xs">
                          {new Date(poll.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 pr-6 flex justify-end gap-2">
                          {!isExpired && (
                            <button 
                              onClick={() => handleClose(poll.slug)}
                              className="px-2.5 py-1.5 text-xs font-medium text-amber-600 bg-amber-100 rounded hover:bg-amber-200 transition-colors"
                            >
                              Close
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(poll.slug)}
                            className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="p-4 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between text-sm">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="btn-ghost py-1 px-3"
              >
                Previous
              </button>
              <span className="text-ink-500 font-medium">Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="btn-ghost py-1 px-3"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
