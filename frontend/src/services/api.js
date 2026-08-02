import { API_ENDPOINTS } from '../config/apiEndpoints';

// ─── In-memory request cache (for the current page session) ───────────────────
const memCache = new Map();
const MEM_CACHE_TTL = 30_000; // 30 seconds default

/** Cross-tab real-time sync via BroadcastChannel */
let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
        broadcastChannel = new BroadcastChannel('upaw_data_updates');
        broadcastChannel.onmessage = (event) => {
            if (event.data && event.data.type === 'DATA_UPDATED') {
                memCache.clear();
                window.dispatchEvent(new CustomEvent('upaw:data-updated', { detail: event.data }));
            }
        };
    } catch {}
}

/** Silently flush the server-side file cache & notify all open tabs/windows after any write operation */
const invalidateServerCache = () => {
    const base = import.meta.env.VITE_API_BASE || `${window.location.origin}/api`;
    fetch(`${base}/cache/clear`, { method: 'POST' }).catch(() => {});
    
    // Clear in-memory cache immediately
    memCache.clear();

    // Broadcast data update to other open browser tabs
    try {
        if (broadcastChannel) {
            broadcastChannel.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
        }
    } catch {}

    // Dispatch event to current tab
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('upaw:data-updated', { detail: { timestamp: Date.now() } }));
    }
};

/**
 * Cached fetch — only caches GET requests. Returns cached data if fresh.
 */
const cachedFetch = async (url, ttl = MEM_CACHE_TTL) => {
    const now = Date.now();
    const hit = memCache.get(url);
    if (hit && now - hit.ts < ttl) {
        return hit.data;
    }
    const res = await fetch(url);
    const data = await handleResponse(res);
    memCache.set(url, { ts: now, data });
    return data;
};

const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    let payload;
    if (contentType.includes('application/json')) {
        payload = await response.json().catch(() => null);
    } else {
        const text = await response.text().catch(() => null);
        payload = text;
    }

    if (!response.ok) {
        const errorMsg = (payload && (payload.error || payload.message)) || response.statusText || 'API Error';
        throw new Error(errorMsg);
    }

    // Auto-invalidate server cache for 201/204
    if (response.status === 201 || response.status === 204) {
        invalidateServerCache();
    }

    if (payload && typeof payload === 'object') {
        if (Array.isArray(payload)) return payload;
        if (payload.data) return payload.data;
        if (payload.items) return payload.items;
        return payload;
    }

    return payload;
};

export const api = {
    invalidateCache: invalidateServerCache,

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
    getUsers: async () => {
        const url = `${API_ENDPOINTS.users.index}?_t=${Date.now()}`;
        return handleResponse(await fetch(url));
    },
    createUser: async (data) => {
        const res = await handleResponse(await fetch(API_ENDPOINTS.users.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
        invalidateServerCache();
        return res;
    },
    updateUser: async (id, data) => {
        const res = await handleResponse(await fetch(API_ENDPOINTS.users.update(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
        invalidateServerCache();
        return res;
    },
    deleteUser: async (id) => {
        const res = await handleResponse(await fetch(API_ENDPOINTS.users.delete(id), { method: 'DELETE' }));
        invalidateServerCache();
        return res;
    },
    getRoles: async () => cachedFetch(API_ENDPOINTS.users.roles, 60_000),

    // News — 30s mem cache
    getNews: async (opts = {}) => {
        const params = new URLSearchParams();
        if (opts.page)     params.set('page', opts.page);
        if (opts.limit)    params.set('limit', opts.limit);
        if (opts.search)   params.set('search', opts.search);
        if (opts.category) params.set('category', opts.category);
        const url = params.toString()
            ? `${API_ENDPOINTS.news.index}?${params.toString()}`
            : API_ENDPOINTS.news.index;
        if (!opts.search && !opts.page && !opts.limit && !opts.category) {
            return cachedFetch(url, 30_000);
        }
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
    createNews: async (data) => {
        const res = await handleResponse(await fetch(API_ENDPOINTS.news.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
        invalidateServerCache();
        return res;
    },
    updateNews: async (id, data) => {
        const res = await handleResponse(await fetch(API_ENDPOINTS.news.update(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
        invalidateServerCache();
        return res;
    },
    deleteNews: async (id, opts = {}) => {
        const suffix = opts.editor_username ? `?editor_username=${encodeURIComponent(opts.editor_username)}` : '';
        const res = await handleResponse(await fetch(`${API_ENDPOINTS.news.delete(id)}${suffix}`, { method: 'DELETE' }));
        invalidateServerCache();
        return res;
    },
    getComments: async (newsId) => handleResponse(await fetch(API_ENDPOINTS.news.comments(newsId))),
    addComment: async (newsId, data) => {
        const res = await handleResponse(await fetch(API_ENDPOINTS.news.comments(newsId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
        invalidateServerCache();
        return res;
    },

    // Decisions
    getDecisions: async () => cachedFetch(API_ENDPOINTS.decisions.index, 60_000),

    // Documents
    getDocuments: async () => cachedFetch(API_ENDPOINTS.documents.index, 60_000),
    createDocument: async (data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.documents.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    updateDocument: async (id, data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.documents.update(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    deleteDocument: async (id) => { const res = await handleResponse(await fetch(API_ENDPOINTS.documents.delete(id), { method: 'DELETE' })); invalidateServerCache(); return res; },

    // Map Locations
    getMapLocations: async (opts = {}) => {
        const url = opts.all ? `${API_ENDPOINTS.map.index}?all=true` : API_ENDPOINTS.map.index;
        if (opts.all) return handleResponse(await fetch(url));
        return cachedFetch(url, 60_000);
    },
    createMapLocation: async (data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.map.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    updateMapLocation: async (id, data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.map.update(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    deleteMapLocation: async (id) => { const res = await handleResponse(await fetch(API_ENDPOINTS.map.delete(id), { method: 'DELETE' })); invalidateServerCache(); return res; },

    // Statistics — cached for 5 minutes
    getStatistics: async () => cachedFetch(API_ENDPOINTS.statistics.index, 300_000),
    createStatistic: async (data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.statistics.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    updateStatistic: async (id, data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.statistics.update(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    deleteStatistic: async (id) => { const res = await handleResponse(await fetch(API_ENDPOINTS.statistics.delete(id), { method: 'DELETE' })); invalidateServerCache(); return res; },

    // Visitors
    getVisitorCount: async () => handleResponse(await fetch(API_ENDPOINTS.visitors.count)),
    getVisitorStats: async () => cachedFetch(API_ENDPOINTS.visitors.stats, 60_000),

    // Notifications
    getNotifications: async (roleId, userId) => {
        let url = API_ENDPOINTS.notifications.index + '?';
        if (roleId) url += `role_id=${roleId}&`;
        if (userId) url += `user_id=${userId}`;
        return handleResponse(await fetch(url));
    },
    markNotificationRead: async (id, userId) => {
        const url = userId
            ? `${API_ENDPOINTS.notifications.markRead(id)}?user_id=${userId}`
            : API_ENDPOINTS.notifications.markRead(id);
        return handleResponse(await fetch(url, { method: 'PATCH' }));
    },
    markAllNotificationsRead: async (roleId, userId) => {
        let url = API_ENDPOINTS.notifications.markAllRead + '?';
        if (roleId) url += `role_id=${roleId}&`;
        if (userId) url += `user_id=${userId}`;
        return handleResponse(await fetch(url, { method: 'PATCH' }));
    },
    clearAllNotifications: async (userId) => {
        const url = userId
            ? `${API_ENDPOINTS.notifications.clearAll}?user_id=${userId}`
            : API_ENDPOINTS.notifications.clearAll;
        return handleResponse(await fetch(url, { method: 'DELETE' }));
    },
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

    // Pages — cached for 2 minutes
    getPages: async () => cachedFetch(API_ENDPOINTS.pages.index, 120_000),
    getPageById: async (id) => cachedFetch(API_ENDPOINTS.pages.byId(id), 120_000),
    getPageAbout: async () => cachedFetch(API_ENDPOINTS.pages.about, 120_000),
    getPageContact: async () => cachedFetch(API_ENDPOINTS.pages.contact, 120_000),
    translatePage: async (id) => handleResponse(await fetch(API_ENDPOINTS.pages.translate(id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })),
    createPage: async (data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.pages.index, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    updatePage: async (id, data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.pages.byId(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    deletePage: async (id) => { const res = await handleResponse(await fetch(API_ENDPOINTS.pages.byId(id), { method: 'DELETE' })); invalidateServerCache(); return res; },
    togglePageVisibility: async (id, isVisible) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.pages.byId(id)}/visibility`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_visible: isVisible }) })); invalidateServerCache(); return res; },

    // Books
    getBooks: async () => cachedFetch(API_ENDPOINTS.books.index, 300_000),

    // Gallery
    getGallery: async (page = 1, limit = 10, category = 'الكل') => {
      const catParam = category && category !== 'الكل' ? `&category=${encodeURIComponent(category)}` : '';
      const url = `${API_ENDPOINTS.gallery.index}?page=${page}&limit=${limit}${catParam}`;
      return cachedFetch(url, 30_000);
    },
    getGalleryAll: async () => handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/all`)),
    getGalleryCategories: async () => cachedFetch(`${API_ENDPOINTS.gallery.index}/categories`, 120_000),
    createGallery: async (formData) => { const res = await handleResponse(await fetch(API_ENDPOINTS.gallery.index, { method: 'POST', body: formData })); invalidateServerCache(); return res; },
    updateGallery: async (id, formData) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/${id}`, { method: 'PUT', body: formData })); invalidateServerCache(); return res; },
    toggleGallery: async (id) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/${id}/toggle`, { method: 'PATCH' })); invalidateServerCache(); return res; },
    deleteGallery: async (id) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/${id}`, { method: 'DELETE' })); invalidateServerCache(); return res; },
    bulkDeleteGallery: async (ids) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })); invalidateServerCache(); return res; },
    bulkUpdateGalleryCategory: async (ids, category) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/bulk-update-category`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, category }) })); invalidateServerCache(); return res; },
    bulkUpdateGalleryVisibility: async (ids, is_visible) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.gallery.index}/bulk-update-visibility`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, is_visible }) })); invalidateServerCache(); return res; },

    // Homepage Images — cached 5 minutes
    getHomeImages: async () => cachedFetch(API_ENDPOINTS.homepage_images.index, 300_000),
    createHomeImage: async (formData) => { const res = await handleResponse(await fetch(API_ENDPOINTS.homepage_images.index, { method: 'POST', body: formData })); invalidateServerCache(); return res; },
    deleteHomeImage: async (id) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.homepage_images.index}/${id}`, { method: 'DELETE' })); invalidateServerCache(); return res; },

    // Working papers — cached 2 minutes
    getWorkingPapers: async () => cachedFetch(API_ENDPOINTS.working_papers.index, 120_000),
    createWorkingPaper: async (data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.working_papers.index, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    updateWorkingPaper: async (id, data) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.working_papers.index}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    deleteWorkingPaper: async (id) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.working_papers.index}/${id}`, { method: 'DELETE' })); invalidateServerCache(); return res; },

    // Companies
    getCompanies: async () => handleResponse(await fetch(API_ENDPOINTS.companies.index)),
    getCompaniesSummary: async () => cachedFetch(API_ENDPOINTS.companies.summary, 30_000),
    createCompany: async (formData) => { const res = await handleResponse(await fetch(API_ENDPOINTS.companies.index, { method: 'POST', body: formData })); invalidateServerCache(); return res; },
    updateCompanyStatus: async (id, data) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.companies.index}/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    deleteCompany: async (id) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.companies.index}/${id}`, { method: 'DELETE' })); invalidateServerCache(); return res; },

    // KML
    getKmlFeatures: async () => cachedFetch(API_ENDPOINTS.kml.features, 300_000),
    uploadKml: async (formData, username) => {
        const res = await handleResponse(await fetch(`${API_ENDPOINTS.kml.upload}?editor_username=${encodeURIComponent(username)}`, {
            method: 'POST',
            body: formData,
        }));
        invalidateServerCache();
        return res;
    },
    clearKmlFeatures: async () => { const res = await handleResponse(await fetch(API_ENDPOINTS.kml.clear, { method: 'DELETE' })); invalidateServerCache(); return res; },
    updateKmlFeatureColor: async (id, color) => { const res = await handleResponse(await fetch(API_ENDPOINTS.kml.updateFeatureColor(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color }) })); invalidateServerCache(); return res; },
    updateKmlFolderColor: async (folder, color) => { const res = await handleResponse(await fetch(API_ENDPOINTS.kml.updateFolderColor, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder, color }) })); invalidateServerCache(); return res; },
    deleteKmlFolder: async (folder) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.kml.deleteFolder}?folder=${encodeURIComponent(folder)}`, { method: 'DELETE' })); invalidateServerCache(); return res; },
    deleteKmlFeature: async (id) => { const res = await handleResponse(await fetch(`${API_ENDPOINTS.kml.features}/${id}`, { method: 'DELETE' })); invalidateServerCache(); return res; },
    renameKmlFolder: async (oldFolder, newFolder) => { const res = await handleResponse(await fetch(API_ENDPOINTS.kml.renameFolder, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ old_folder: oldFolder, new_folder: newFolder }) })); invalidateServerCache(); return res; },
    // Complaints
    getComplaints: async () => handleResponse(await fetch(API_ENDPOINTS.complaints.index)),
    createComplaint: async (data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.complaints.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    updateComplaintStatus: async (id, data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.complaints.updateStatus(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    deleteComplaint: async (id) => { const res = await handleResponse(await fetch(API_ENDPOINTS.complaints.delete(id), { method: 'DELETE' })); invalidateServerCache(); return res; },

    // Experts
    getExperts: async () => handleResponse(await fetch(API_ENDPOINTS.experts.index)),
    createExpert: async (data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.experts.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    updateExpertStatus: async (id, data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.experts.updateStatus(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    deleteExpert: async (id) => { const res = await handleResponse(await fetch(API_ENDPOINTS.experts.delete(id), { method: 'DELETE' })); invalidateServerCache(); return res; },

    // Employee Requests
    getEmployeeRequests: async () => handleResponse(await fetch(API_ENDPOINTS.employeeRequests.index)),
    createEmployeeRequest: async (data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.employeeRequests.create, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    updateEmployeeRequestStatus: async (id, data) => { const res = await handleResponse(await fetch(API_ENDPOINTS.employeeRequests.updateStatus(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })); invalidateServerCache(); return res; },
    deleteEmployeeRequest: async (id) => { const res = await handleResponse(await fetch(API_ENDPOINTS.employeeRequests.delete(id), { method: 'DELETE' })); invalidateServerCache(); return res; },

    // Audit Log Trail & IP Blocking
    getUserTrail: async (userId) => handleResponse(await fetch(`/api/audit-logs/user-trail/${userId}`)),
    getBlockedIps: async () => handleResponse(await fetch('/api/blocked-ips')),
    blockIp: async (ip_address, reason, blocked_by) => handleResponse(await fetch('/api/blocked-ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip_address, reason, blocked_by })
    })),
    unblockIp: async (ip_address) => handleResponse(await fetch(`/api/blocked-ips/${encodeURIComponent(ip_address)}`, { method: 'DELETE' })),

    // Directors
    getDirectors: async (role) => {
        const url = role
            ? `${API_ENDPOINTS.directors.index}?role=${role}&_t=${Date.now()}`
            : `${API_ENDPOINTS.directors.index}?_t=${Date.now()}`;
        return handleResponse(await fetch(url));
    },
    createDirector: async (formData) => {
        const res = await handleResponse(await fetch(API_ENDPOINTS.directors.index, { method: 'POST', body: formData }));
        invalidateServerCache();
        return res;
    },
    updateDirector: async (id, formData) => {
        const res = await handleResponse(await fetch(`${API_ENDPOINTS.directors.byId(id)}`, { method: 'POST', body: formData }));
        invalidateServerCache();
        return res;
    },
    deleteDirector: async (id) => {
        const res = await handleResponse(await fetch(API_ENDPOINTS.directors.byId(id), { method: 'DELETE' }));
        invalidateServerCache();
        return res;
    },
};

