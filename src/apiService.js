// En dev, les appels vers /api sont relayés vers le serveur PHP via le proxy de package.json.
export const API_BASE_URL = '/api';

export const loginApi = async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (response.ok && data.success) {
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
        }
        if (data.user) {
            localStorage.setItem('auth_user', JSON.stringify(data.user));
        }
        // Marquer la session comme active même sans token
        localStorage.setItem('is_logged_in', 'true');
    }
    return { ok: response.ok, data };
};

export const logoutApi = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('is_logged_in');
};

export const isAuthenticated = () => {
    return localStorage.getItem('is_logged_in') === 'true';
};

export const fetchApi = async (endpoint) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
        'Accept': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });

        if (response.status === 401) {
            logoutApi();
            window.location.href = '/';
            return null;
        }

        return response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        return null;
    }
};
