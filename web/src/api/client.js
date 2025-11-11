import axios from 'axios'

const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : '/api'

const client = axios.create({
  baseURL: base
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client

