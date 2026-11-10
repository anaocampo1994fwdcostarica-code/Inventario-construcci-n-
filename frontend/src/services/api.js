import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method) && typeof document !== 'undefined') {
    const csrf = document.cookie.split('; ').find((item) => item.startsWith('csrf='))?.split('=')[1]
    if (csrf) config.headers['X-CSRF-Token'] = decodeURIComponent(csrf)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || (status ? `La solicitud devolvió ${status}` : 'No se pudo conectar con la API')
    return Promise.reject(Object.assign(new Error(message), { status, original: error }))
  },
)

export const apiClient = {
  get: (path, config) => api.get(path, config).then(({ data }) => data),
  post: (path, body, config) => api.post(path, body, config).then(({ data }) => data),
  put: (path, body, config) => api.put(path, body, config).then(({ data }) => data),
  patch: (path, body, config) => api.patch(path, body, config).then(({ data }) => data),
  delete: (path, config) => api.delete(path, config).then(({ data }) => data),
}

export default api
