import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

export const createPoll   = (data)              => api.post('/polls', data).then(r => r.data)
export const getPoll      = (slug)              => api.get(`/polls/${slug}`).then(r => r.data)
export const votePoll     = (slug, optionIndex) => api.post(`/polls/${slug}/vote`, { optionIndex }).then(r => r.data)
export const getRecentPolls = ()               => api.get('/polls/recent').then(r => r.data)

export default api
