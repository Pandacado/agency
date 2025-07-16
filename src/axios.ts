// frontend/src/lib/axios.ts
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://192.168.1.101:3001/api', // ← Önemli!
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
