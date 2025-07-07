// frontend/src/lib/axios.ts
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3001/api', // Tüm istekler buradan başlayacak
});

export default instance;
