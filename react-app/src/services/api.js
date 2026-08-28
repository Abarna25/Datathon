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

// Simple Request Deduplicator / Cache (10 second TTL)
const pendingRequests = new Map();
const cache = new Map();
const CACHE_TTL = 10000; 

const getCacheKey = (config) => `${config.method}:${config.url}?${new URLSearchParams(config.params || {}).toString()}`;

api.interceptors.request.use((config) => {
    return config;
});

// Since overriding axios adapter in interceptor is tricky, we'll wrap api.get directly.
const originalGet = api.get;
api.get = async (url, config = {}) => {
    const key = `get:${url}?${new URLSearchParams(config.params || {}).toString()}`;
    
    // Check short-term cache
    const cached = cache.get(key);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return Promise.resolve(cached.response);
    }
    
    // Check in-flight
    if (pendingRequests.has(key)) {
        return pendingRequests.get(key);
    }
    
    // Execute and store in-flight
    const promise = originalGet.call(api, url, config)
        .then(response => {
            cache.set(key, { response, timestamp: Date.now() });
            pendingRequests.delete(key);
            return response;
        })
        .catch(error => {
            pendingRequests.delete(key);
            throw error;
        });
        
    pendingRequests.set(key, promise);
    return promise;
};

// Global interceptor for standard response error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const status = error.response ? error.response.status : null;
        
        // Handle 401 Unauthorized: clear expired token so app redirects to login
        if (status === 401) {
            localStorage.removeItem('vikshana_auth_token');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                // Event listener can catch this or redirect
                window.dispatchEvent(new CustomEvent('vikshana_auth_expired'));
            }
        }
        
        // Retry transient network or 503/504 errors on idempotent GET requests only
        if (config && config.method === 'get' && (!status || status === 503 || status === 504)) {
            if (!config.retry) {
                config.retry = { count: 0, maxRetries: 2, delay: 1000 };
            }
            if (config.retry.count < config.retry.maxRetries) {
                config.retry.count += 1;
                await new Promise(resolve => setTimeout(resolve, config.retry.delay));
                return api(config);
            }
        }
        
        // Format readable message for UI components
        if (error.response && error.response.data && error.response.data.error) {
            error.message = error.response.data.error;
        } else if (!error.response) {
            error.message = 'Network connection to VIKSHANA backend unavailable. Please verify server status.';
        }
        
        return Promise.reject(error);
    }
);

export default api;

