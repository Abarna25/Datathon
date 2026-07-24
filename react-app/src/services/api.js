import axios from 'axios';

// The Catalyst CLI serves backend and proxies it under /server/ automatically
export const API_BASE_URL = '/server/vikshana_function';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 60000 // 60 second timeout — AI responses can take 20–30s
});

// Automatically attach JWT token to all outgoing API requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('vikshana_auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
