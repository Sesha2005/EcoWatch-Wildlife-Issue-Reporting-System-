// api.js - Centralized fetching and auth logic
const BASE_URL = 'http://localhost:8080';

const api = {
    BASE_URL, // Expose so other scripts can reference api.BASE_URL for raw fetch calls
    // Utility for making authenticated or unauthenticated requests
    async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (token) {
            headers['Authorization'] = `Bearer ${token}`; // Assuming JWT structure
        }

        if (userId) {
            headers['userId'] = userId; // Consistent identification across sessions
        }

        const config = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                // Return an object that our front-end knows how to handle as an error
                return { success: false, message: data.message || 'An error occurred' };
            }

            return { success: true, data };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'Could not connect to the server.' };
        }
    },

    // Auth specific methods
    auth: {
        async login(email, password) {
            const res = await api.request('/auth/login', 'POST', { email, password });
            if (res.success) {
                // Store auth details
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', res.data.role);
                if (res.data.userId) {
                    localStorage.setItem('userId', res.data.userId);
                }
            }
            return res;
        },

        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('userId');
            window.location.href = '../index.html'; // Redirect to home
        },

        getRole() {
            return localStorage.getItem('role');
        },

        getUserId() {
            return localStorage.getItem('userId');
        },

        isAuthenticated() {
            return !!localStorage.getItem('token');
        }
    }
};
