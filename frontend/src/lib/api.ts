export const getApiUrl = (endpoint: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // Ensure we have the /api prefix correctly
    const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${apiBase}${cleanEndpoint}`;
};
