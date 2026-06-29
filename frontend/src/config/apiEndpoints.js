export const BASE_URL = import.meta.env.VITE_API_BASE || `${window.location.origin}/api`;
export const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || `${window.location.origin}/uploads`;

export const API_ENDPOINTS = {
    auth: {
        login: `${BASE_URL}/login`,
        register: `${BASE_URL}/register`,
    },
    users: {
        index: `${BASE_URL}/users`,
        create: `${BASE_URL}/users`,
        update: (id) => `${BASE_URL}/users/${id}`,
        delete: (id) => `${BASE_URL}/users/${id}`,
        roles: `${BASE_URL}/roles`,
    },
    news: {
        index: `${BASE_URL}/news`,
        create: `${BASE_URL}/news`,
        update: (id) => `${BASE_URL}/news/${id}`,
        delete: (id) => `${BASE_URL}/news/${id}`,
        comments: (id) => `${BASE_URL}/news/${id}/comments`,
    },
    documents: {
        index: `${BASE_URL}/documents`,
        create: `${BASE_URL}/documents`,
        update: (id) => `${BASE_URL}/documents/${id}`,
        delete: (id) => `${BASE_URL}/documents/${id}`,
    },
    map: {
        index: `${BASE_URL}/map_locations`,
        create: `${BASE_URL}/map_locations`,
        update: (id) => `${BASE_URL}/map_locations/${id}`,
        delete: (id) => `${BASE_URL}/map_locations/${id}`,
    },
    statistics: {
        index: `${BASE_URL}/statistics`,
        create: `${BASE_URL}/statistics`,
        update: (id) => `${BASE_URL}/statistics/${id}`,
        delete: (id) => `${BASE_URL}/statistics/${id}`,
    },
    visitors: {
        count: `${BASE_URL}/visitors/count`,
        stats: `${BASE_URL}/visitors/stats`,
    },
    notifications: {
        index: `${BASE_URL}/notifications`,
        markRead: (id) => `${BASE_URL}/notifications/${id}/read`,
        markAllRead: `${BASE_URL}/notifications/read-all`,
        clearAll: `${BASE_URL}/notifications/clear-all`,
        unreadCount: `${BASE_URL}/notifications/unread-count`,
    },
    upload: `${BASE_URL}/upload`,
    decisions: {
        index: `${BASE_URL}/decisions`,
    },
    pages: {
        index: `${BASE_URL}/pages`,
        byId: (id) => `${BASE_URL}/pages/${id}`,
        about: `${BASE_URL}/pages/about`,
        contact: `${BASE_URL}/pages/contact`,
        translate: (id) => `${BASE_URL}/pages/${id}/translate`,
    },
    books: {
        index: `${BASE_URL}/books`,
    },
    gallery: {
        index: `${BASE_URL}/gallery`,
    },
    working_papers: {
        index: `${BASE_URL}/working-papers`,
    },
    companies: {
        index: `${BASE_URL}/companies`,
        summary: `${BASE_URL}/companies/stats/summary`,
    },
    kml: {
        features: `${BASE_URL}/kml/features`,
        upload: `${BASE_URL}/kml/upload`,
        clear: `${BASE_URL}/kml/features/clear`,
    },
    translateAll: `${BASE_URL}/translate-all`,
};
