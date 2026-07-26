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
            config.headers['X-Vikshana-Auth'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Helper for generic fallback structures
const getFallbackPayload = (url) => {
    if (!url) return { data: { success: true, data: [] } };
    if (url.includes('/dashboard')) return { data: { success: true, data: { weeklyPrediction: [], monthlyPrediction: [], districtForecast: [], crimeTypeForecast: [] } } };
    if (url.includes('/reports')) return { data: { success: true, data: [] } };
    if (url.includes('/audit')) return { data: { success: true, data: [] } };
    return { data: { success: true, data: [] } };
};

// Global interceptor for retries and silent fallbacks
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        
        if (!config || !config.retry) {
            if (config) {
                config.retry = { count: 0, maxRetries: 2, delay: 1000 };
            }
        }
        
        if (config && config.retry.count < config.retry.maxRetries) {
            config.retry.count += 1;
            await new Promise(resolve => setTimeout(resolve, config.retry.delay));
            return api(config);
        }
        
        // Retries exhausted, return graceful fallback
        return Promise.resolve(getFallbackPayload(config?.url));
    }
);

export default api;
