import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

export const createPoll     = (data)              => api.post('/polls', data).then(r => r.data)
export const getPoll        = (slug)              => api.get(`/polls/${slug}`).then(r => r.data)
export const getPollVotes   = (slug)              => api.get(`/polls/${slug}/votes`).then(r => r.data)
export const votePoll       = (slug, optionIndex, voterName) => api.post(`/polls/${slug}/vote`, { optionIndex, voterName }).then(r => r.data)
export const getRecentPolls = ()                  => api.get('/polls/recent').then(r => r.data)

// Survey Routes
export const createSurvey     = (data)               => api.post('/surveys', data).then(r => r.data)
export const getSurvey        = (slug)               => api.get(`/surveys/${slug}`).then(r => r.data)
export const getSurveyVotes   = (slug)               => api.get(`/surveys/${slug}/votes`).then(r => r.data)
export const voteSurvey       = (slug, answers, voterName) => api.post(`/surveys/${slug}/vote`, { answers, voterName }).then(r => r.data)
export const getRecentSurveys = ()                   => api.get('/surveys/recent').then(r => r.data)

// Admin Routes
export const adminLogin = async (password) => {
  const res = await api.post(`/admin/login`, { password });
  return res.data;
};

export const getAdminPolls = async (token, page = 1) => {
  const res = await api.get(`/admin/polls?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deletePoll = async (token, slug) => {
  const res = await api.delete(`/admin/polls/${slug}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const closePoll = async (token, slug) => {
  const res = await api.post(`/admin/polls/${slug}/close`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export default api
