export const getApiUrl = (endpoint: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // Ensure we have the /api prefix correctly
    const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${apiBase}${cleanEndpoint}`;
};

// Helper to get auth token
const getToken = () => {
    return localStorage.getItem('token') || '';
};

// Interview Analytics API Functions

export const analyzeInterview = async (sessionId: string) => {
    const response = await fetch(getApiUrl(`/interview/${sessionId}/analyze`), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to analyze interview');
    }

    return response.json();
};

export const getInterviewAnalytics = async (sessionId: string) => {
    const response = await fetch(getApiUrl(`/interview/${sessionId}/analytics`), {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch analytics');
    }

    return response.json();
};

export const getInterviewReplay = async (sessionId: string) => {
    const response = await fetch(getApiUrl(`/interview/${sessionId}/replay`), {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch replay data');
    }

    return response.json();
};

export const getQuestionAnalytics = async (sessionId: string, questionNumber: number) => {
    const response = await fetch(getApiUrl(`/interview/${sessionId}/question/${questionNumber}`), {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch question analytics');
    }

    return response.json();
};

export const getImprovements = async (sessionId: string) => {
    const response = await fetch(getApiUrl(`/interview/${sessionId}/improvements`), {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch improvements');
    }

    return response.json();
};
