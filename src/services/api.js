import axios from 'axios';
import {getSession} from './authStorage';
import {API_URL} from './config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async config => {
  const session = await getSession();
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

export default api;
