import { API_ENDPOINTS } from '../config/apiEndpoints';

const handleResponse = async (response) => {
    // Normalize responses and surface useful error messages
    const contentType = response.headers.get('content-type') || '';
    let payload = null;
    if (contentType.includes('application/json')) {
        payload = await response.json().catch(() => null);
    } else {
        // try text fallback
        const text = await response.text().catch(() => null);
        payload = text;
    }

    if (!response.ok) {
        const errorMsg = (payload && (payload.error || payload.message)) || response.statusText || 'API Error';
        throw new Error(errorMsg);
    }

    // If API wraps results under { data, items, results } return that array/object
    if (payload && typeof payload === 'object') {
        if (Array.isArray(payload)) return payload;
        if (payload.data) return payload.data;
        if (payload.items) return payload.items;
        return payload;
    }

    return payload;
};

export const api = {
    // Auth
    login: async (username, password) => {
        const res = await fetch(API_ENDPOINTS.auth.login, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return handleResponse(res);
    },
    register: async (data) => {
        const res = await fetch(API_ENDPOINTS.auth.register, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    // Users
    getUsers: async () => handleResponse(await fetch(API_ENDPOINTS.users.index)),
    createUser: async (data) => handleResponse(await fetch(API_ENDPOINTS.users.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    updateUser: async (id, data) => handleResponse(await fetch(API_ENDPOINTS.users.update(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    deleteUser: async (id) => handleResponse(await fetch(API_ENDPOINTS.users.delete(id), { method: 'DELETE' })),
    getRoles: async () => handleResponse(await fetch(API_ENDPOINTS.users.roles)),

    // News
    getNews: async (opts = {}) => {
        // opts: { page, limit, search, category }
        const params = new URLSearchParams();
        if (opts.page) params.set('page', opts.page);
        if (opts.limit) params.set('limit', opts.limit);
        if (opts.search) params.set('search', opts.search);
        if (opts.category) params.set('category', opts.category);
        const url = params.toString() ? `${API_ENDPOINTS.news.index}?${params.toString()}` : API_ENDPOINTS.news.index;
        const res = await fetch(url);
        const json = await res.json().catch(() => null);
        if (!res.ok) {
            const err = (json && (json.error || json.message)) || res.statusText || 'API Error';
            throw new Error(err);
        }
        return json;
    },
    getNewsStats: async () => {
        const res = await fetch(`${API_ENDPOINTS.news.index}/stats`);
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || res.statusText || 'API Error');
        return json;
    },
    createNews: async (data) => handleResponse(await fetch(API_ENDPOINTS.news.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    updateNews: async (id, data) => handleResponse(await fetch(API_ENDPOINTS.news.update(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    deleteNews: async (id, opts = {}) => {
        const suffix = opts.editor_username ? `?editor_username=${encodeURIComponent(opts.editor_username)}` : '';
        return handleResponse(await fetch(`${API_ENDPOINTS.news.delete(id)}${suffix}`, { method: 'DELETE' }));
    },
    getComments: async (newsId) => handleResponse(await fetch(API_ENDPOINTS.news.comments(newsId))),
    addComment: async (newsId, data) => handleResponse(await fetch(API_ENDPOINTS.news.comments(newsId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),

    // Documents
    getDocuments: async () => handleResponse(await fetch(API_ENDPOINTS.documents.index)),
    createDocument: async (data) => handleResponse(await fetch(API_ENDPOINTS.documents.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    updateDocument: async (id, data) => handleResponse(await fetch(API_ENDPOINTS.documents.update(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    deleteDocument: async (id) => handleResponse(await fetch(API_ENDPOINTS.documents.delete(id), { method: 'DELETE' })),

    // Map Locations
    getMapLocations: async (opts = {}) => {
        // opts: { all }
        const url = opts.all ? `${API_ENDPOINTS.map.index}?all=true` : API_ENDPOINTS.map.index;
        return handleResponse(await fetch(url));
    },
    createMapLocation: async (data) => handleResponse(await fetch(API_ENDPOINTS.map.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    updateMapLocation: async (id, data) => handleResponse(await fetch(API_ENDPOINTS.map.update(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    deleteMapLocation: async (id) => handleResponse(await fetch(API_ENDPOINTS.map.delete(id), { method: 'DELETE' })),

    // Statistics
    getStatistics: async () => handleResponse(await fetch(API_ENDPOINTS.statistics.index)),
    createStatistic: async (data) => handleResponse(await fetch(API_ENDPOINTS.statistics.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    updateStatistic: async (id, data) => handleResponse(await fetch(API_ENDPOINTS.statistics.update(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    deleteStatistic: async (id) => handleResponse(await fetch(API_ENDPOINTS.statistics.delete(id), { method: 'DELETE' })),

    // Visitors
    getVisitorCount: async () => handleResponse(await fetch(API_ENDPOINTS.visitors.count)),
    getVisitorStats: async () => handleResponse(await fetch(API_ENDPOINTS.visitors.stats)),

    // Notifications
    getNotifications: async (roleId, userId) => {
        let url = API_ENDPOINTS.notifications.index + '?';
        if (roleId) url += `role_id=${roleId}&`;
        if (userId) url += `user_id=${userId}`;
        return handleResponse(await fetch(url));
    },
    markNotificationRead: async (id) => handleResponse(await fetch(API_ENDPOINTS.notifications.markRead(id), { method: 'PUT' })),
    markAllNotificationsRead: async () => handleResponse(await fetch(API_ENDPOINTS.notifications.markAllRead, { method: 'PUT' })),
    clearAllNotifications: async () => handleResponse(await fetch(API_ENDPOINTS.notifications.clearAll, { method: 'DELETE' })),
    getUnreadNotificationCount: async (roleId, userId) => {
        let url = API_ENDPOINTS.notifications.unreadCount + '?';
        if (roleId) url += `role_id=${roleId}&`;
        if (userId) url += `user_id=${userId}`;
        return handleResponse(await fetch(url));
    },

    // Upload
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(API_ENDPOINTS.upload, { method: 'POST', body: formData });
        return handleResponse(res);
    },

    // Decisions
    getDecisions: async () => handleResponse(await fetch(API_ENDPOINTS.decisions.index)),

    // Pages
    getPages: async () => handleResponse(await fetch(API_ENDPOINTS.pages.index)),
    getPageById: async (id) => handleResponse(await fetch(API_ENDPOINTS.pages.byId(id))),
    getPageAbout: async () => handleResponse(await fetch(API_ENDPOINTS.pages.about)),
    getPageContact: async () => handleResponse(await fetch(API_ENDPOINTS.pages.contact)),
    translatePage: async (id) => handleResponse(await fetch(API_ENDPOINTS.pages.translate(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })),
    updatePage: async (id, data) => handleResponse(await fetch(API_ENDPOINTS.pages.byId(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    deletePage: async (id) => handleResponse(await fetch(API_ENDPOINTS.pages.byId(id), { method: 'DELETE' })),
    togglePageVisibility: async (id, isVisible) => handleResponse(await fetch(`${API_ENDPOINTS.pages.byId(id)}/visibility`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_visible: isVisible }) })),

    // Books
    getBooks: async () => handleResponse(await fetch(API_ENDPOINTS.books.index)),

    // Gallery
    getGallery: async () => handleResponse(await fetch(API_ENDPOINTS.gallery.index)),
    getGalleryAll: async () => handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/all`)),
    createGallery: async (formData) => handleResponse(await fetch(API_ENDPOINTS.gallery.index, { method: 'POST', body: formData })),
    updateGallery: async (id, formData) => handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/${id}`, { method: 'PUT', body: formData })),
    toggleGallery: async (id) => handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/${id}/toggle`, { method: 'PATCH' })),
    deleteGallery: async (id) => handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/${id}`, { method: 'DELETE' })),

    // Working papers
    getWorkingPapers: async () => handleResponse(await fetch(API_ENDPOINTS.working_papers.index)),
    createWorkingPaper: async (data) => handleResponse(await fetch(API_ENDPOINTS.working_papers.index, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    updateWorkingPaper: async (id, data) => handleResponse(await fetch(`${API_ENDPOINTS.working_papers.index}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    deleteWorkingPaper: async (id) => handleResponse(await fetch(`${API_ENDPOINTS.working_papers.index}/${id}`, { method: 'DELETE' })),

    // Companies
    getCompanies: async () => handleResponse(await fetch(API_ENDPOINTS.companies.index)),
    getCompaniesSummary: async () => handleResponse(await fetch(API_ENDPOINTS.companies.summary)),
    createCompany: async (formData) => handleResponse(await fetch(API_ENDPOINTS.companies.index, { method: 'POST', body: formData })),
    updateCompanyStatus: async (id, data) => handleResponse(await fetch(`${API_ENDPOINTS.companies.index}/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })),
    deleteCompany: async (id) => handleResponse(await fetch(`${API_ENDPOINTS.companies.index}/${id}`, { method: 'DELETE' })),

    // KML
    getKmlFeatures: async () => handleResponse(await fetch(API_ENDPOINTS.kml.features)),
    uploadKml: async (formData, username) => handleResponse(await fetch(`${API_ENDPOINTS.kml.upload}?editor_username=${encodeURIComponent(username)}`, {
        method: 'POST',
        body: formData,
    })),
    clearKmlFeatures: async () => handleResponse(await fetch(API_ENDPOINTS.kml.clear, { method: 'DELETE' })),
};
