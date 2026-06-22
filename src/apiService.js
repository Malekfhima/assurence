// En dev, les appels vers /api sont relayés vers le serveur PHP via le proxy de package.json.
export const API_BASE_URL = '/api';

const getAuthHeaders = (withJson = false) => {
    const token = localStorage.getItem('auth_token');
    const headers = { 'Accept': 'application/json' };
    if (withJson) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleApiResponse = async (response) => {
    if (response.status === 401) {
        logoutApi();
        window.location.href = '/';
        return null;
    }
    return response.json();
};

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
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    } catch (error) {
        console.error('Erreur API:', error);
        return null;
    }
};

export const postApi = async (endpoint, body) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: JSON.stringify(body)
        });
        return handleApiResponse(response);
    } catch (error) {
        console.error('Erreur API:', error);
        return null;
    }
};

export const putApi = async (endpoint, body) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getAuthHeaders(true),
            body: JSON.stringify(body)
        });
        return handleApiResponse(response);
    } catch (error) {
        console.error('Erreur API:', error);
        return null;
    }
};

export const deleteApi = async (endpoint) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleApiResponse(response);
    } catch (error) {
        console.error('Erreur API:', error);
        return null;
    }
};
