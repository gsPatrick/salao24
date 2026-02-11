import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://salao-api.rdwhjt.easypanel.host/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token and unit context
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    const unitId = localStorage.getItem('salao_unit_id');
    if (unitId) {
        config.headers['x-unit-id'] = unitId;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// --- Helper to normalize time strings (remove seconds) globally ---
const normalizeTimeStrings = (data: any): any => {
    if (data === null || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(normalizeTimeStrings);

    const newData: any = {};
    for (const key in data) {
        let value = data[key];
        // Match HH:MM:SS format
        if (typeof value === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(value)) {
            value = value.substring(0, 5);
        } else if (value !== null && typeof value === 'object') {
            value = normalizeTimeStrings(value);
        }
        newData[key] = value;
    }
    return newData;
};

// Response interceptor
api.interceptors.response.use((response) => {
    if (response.data && response.data.success !== false) {
        response.data = normalizeTimeStrings(response.data);
    }
    return response;
}, (error) => {
    // Handle 402 Payment Required (subscription blocked)
    if (error.response?.status === 402) {
        console.warn('[API] Subscription blocked:', error.response.data);
        window.dispatchEvent(new CustomEvent('subscription:blocked', {
            detail: error.response.data
        }));
    }
    // Handle 401 Unauthorized (token expired)
    // Only logout if the 401 is from an auth-related endpoint or token validation
    // Don't logout for resource access denials (e.g., client trying to access admin endpoints)
    if (error.response?.status === 401) {
        const url = error.config?.url || '';
        const isAuthEndpoint = url.includes('/auth/') || url.includes('/auth/me');
        if (isAuthEndpoint) {
            window.dispatchEvent(new Event('auth:logout'));
        } else {
            console.warn('[API] 401 on non-auth endpoint, skipping logout:', url);
        }
    }
    return Promise.reject(error);
});

export const authAPI = {
    login: async (credentials: { email: string; password: string }) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    register: async (data: any) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },
    clientRegisterByCpf: async (data: { cpf: string; loginEmail: string; password: string }) => {
        const response = await api.post('/auth/client-register', data);
        return response.data;
    },
    checkCpf: async (cpf: string) => {
        const response = await api.get(`/auth/check-cpf/${cpf}`);
        return response.data;
    },
    me: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    changePassword: async (data: any) => {
        const response = await api.put('/auth/password', data);
        return response.data;
    }
};

export const uploadAPI = {
    upload: async (file: File, type: string = 'general') => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/upload?type=${type}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

export const clientsAPI = {
    getAll: async () => {
        const response = await api.get('/clients');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/clients/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/clients', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/clients/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/clients/${id}`);
        return response.data;
    },
};

export const professionalsAPI = {
    getAll: async () => {
        const response = await api.get('/professionals');
        return response.data;
    },
    list: async () => {
        const response = await api.get('/professionals');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/professionals', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/professionals/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/professionals/${id}`);
        return response.data;
    },
    purge: async (id: number) => {
        const response = await api.delete(`/professionals/${id}/purge`);
        return response.data;
    },
    toggleSuspend: async (id: number) => {
        const response = await api.patch(`/professionals/${id}/suspend`);
        return response.data;
    },
    toggleArchive: async (id: number) => {
        const response = await api.patch(`/professionals/${id}/archive`);
        return response.data;
    },
    getRanking: async (params?: { limit?: number, unit?: string }) => {
        const response = await api.get('/professionals/ranking', { params });
        return response.data;
    },
    submitReview: async (data: { professionalId: number, clientId: number, rating: number, comment: string }) => {
        const response = await api.post('/professionals/reviews', data);
        return response.data;
    },
    getFeedbacks: async (params?: { professionalId?: number }) => {
        const response = await api.get('/professionals/reviews', { params });
        return response.data;
    },
};

export const servicesAPI = {
    getAll: async () => {
        const response = await api.get('/services');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/services', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/services/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/services/${id}`);
        return response.data;
    },
    toggleSuspend: async (id: number) => {
        const response = await api.patch(`/services/${id}/suspend`);
        return response.data;
    },
    toggleFavorite: async (id: number) => {
        const response = await api.patch(`/services/${id}/favorite`);
        return response.data;
    },
};

export const appointmentsAPI = {
    getAll: async (params?: any) => {
        const response = await api.get('/appointments', { params });
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/appointments', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/appointments/${id}`, data);
        return response.data;
    },
    updateStatus: async (id: number, status: string, sessionsConsumed?: number) => {
        const response = await api.patch(`/appointments/${id}/status`, { status, sessionsConsumed });
        return response.data;
    },
    cancel: async (id: number, reason?: string) => {
        const response = await api.patch(`/appointments/${id}/cancel`, { reason });
        return response.data;
    },
    refund: async (id: number, reason: string) => {
        const response = await api.patch(`/appointments/${id}/refund`, { reason });
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/appointments/${id}`);
        return response.data;
    },
    getAvailability: async (params: { date: string, professionalId: number, serviceId?: number }) => {
        const response = await api.get('/appointments/availability', { params });
        return response.data;
    },
    getBlocks: async (params?: any) => {
        const response = await api.get('/appointments/blocks/all', { params });
        return response.data;
    },
    createBlock: async (data: any) => {
        const response = await api.post('/appointments/blocks', data);
        return response.data;
    },
    deleteBlock: async (id: number) => {
        const response = await api.delete(`/appointments/blocks/${id}`);
        return response.data;
    },
};

export const financeAPI = {
    getAll: async () => {
        const response = await api.get('/finance/transactions');
        return response.data;
    },
    getSummary: async (params?: { period?: string, startDate?: string, endDate?: string, unit?: string }) => {
        const response = await api.get('/finance/summary', { params });
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/finance/transactions', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/finance/transactions/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/finance/transactions/${id}`);
        return response.data;
    },
};

export const stockAPI = {
    getProducts: async (params?: any) => {
        const response = await api.get('/stock/products', { params });
        return response.data;
    },
    createProduct: async (data: any) => {
        const response = await api.post('/stock/products', data);
        return response.data;
    },
    updateProduct: async (id: number, data: any) => {
        const response = await api.put(`/stock/products/${id}`, data);
        return response.data;
    },
    deleteProduct: async (id: number) => {
        const response = await api.delete(`/stock/products/${id}`);
        return response.data;
    },
    adjust: async (data: { productId: number; type: 'in' | 'out' | 'adjustment'; quantity: number; reason?: string }) => {
        const response = await api.post('/stock/adjust', data);
        return response.data;
    },
    // Aliases for frontend compatibility
    toggleSuspend: async (id: number) => {
        const response = await api.patch(`/stock/products/${id}/suspend`);
        return response.data;
    },
    updateQuantity: async (id: number, change: number) => {
        const response = await api.patch(`/stock/products/${id}/quantity`, { change });
        return response.data;
    },
    toggleFavorite: async (id: number) => {
        const response = await api.patch(`/stock/products/${id}/favorite`);
        return response.data;
    },
    deleteCategory: async (category: string) => {
        const response = await api.delete(`/stock/categories/${category}`);
        return response.data;
    },
};

export const crmAPI = {
    getSettings: async () => {
        const response = await api.get('/crm/settings');
        return response.data;
    },
    updateSettings: async (data: any) => {
        const response = await api.put('/crm/settings', data);
        return response.data;
    },
    listLeads: async (params?: { status?: string }) => {
        const response = await api.get('/crm/leads', { params });
        return response.data;
    },
    createLead: async (data: any) => {
        const response = await api.post('/crm/leads', data);
        return response.data;
    },
    updateLeadStatus: async (leadId: number, status: string) => {
        const response = await api.patch(`/crm/leads/${leadId}/status`, { status });
        return response.data;
    },
    // Backward compatibility for contexts/DataContext.tsx
    updateClientCrm: async (clientId: number, data: any) => {
        const response = await api.patch(`/crm/clients/${clientId}`, data);
        return response.data;
    }
};

export const usersAPI = {
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/users', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
};

export const tenantsAPI = {
    list: async (params?: any) => {
        const response = await api.get('/tenants', { params });
        return response.data;
    },
    getFilterOptions: async () => {
        const response = await api.get('/tenants/filter-options');
        return response.data;
    },
    getCurrent: async () => {
        const response = await api.get('/tenants/current');
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/tenants/${id}`, data);
        return response.data;
    },
    updateSettings: async (data: any) => {
        const response = await api.put('/tenants/settings', data);
        return response.data;
    },
    uploadLogo: async (id: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/upload?type=tenant`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
};

export const paymentsAPI = {
    subscribe: async (planId: number, paymentMethod: string = 'UNDEFINED') => {
        const response = await api.post('/payments/subscribe', { planId, paymentMethod });
        return response.data;
    },
    getInvoices: async () => {
        const response = await api.get('/payments/invoices');
        return response.data;
    },
    cancelSubscription: async () => {
        const response = await api.post('/payments/cancel');
        return response.data;
    },
};

export const unitsAPI = {
    getAll: async () => {
        const response = await api.get('/units');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/units', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/units/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/units/${id}`);
        return response.data;
    },
    uploadLogo: async (id: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file); // Generic upload expects 'file'
        const response = await api.post(`/upload?type=unit`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
};

export const plansAPI = {
    getAll: async () => {
        const response = await api.get('/plans');
        return response.data;
    }
};

export const superAdminAPI = {
    getDashboard: async () => {
        const response = await api.get('/super-admin/dashboard');
        return response.data;
    },
    getBanners: async () => {
        const response = await api.get('/super-admin/banners');
        return response.data;
    },
    createBanner: async (data: any) => {
        const response = await api.post('/super-admin/banners', data);
        return response.data;
    },
    updateBanner: async (id: number, data: any) => {
        const response = await api.put(`/super-admin/banners/${id}`, data);
        return response.data;
    },
    deleteBanner: async (id: number) => {
        const response = await api.delete(`/super-admin/banners/${id}`);
        return response.data;
    }
};


export const timeClockAPI = {
    getHistory: async (params?: { professionalId?: string }) => {
        const response = await api.get('/time-clock/history', { params });
        return response.data;
    },
    punch: async (data: { professionalId?: number; type?: string; time?: string; photo?: string; location?: any }) => {
        const response = await api.post('/time-clock/punch', data);
        return response.data;
    },
    justify: async (data: { recordId: number; type: string; reason: string; attachment?: string }) => {
        const response = await api.post('/time-clock/justify', data);
        return response.data;
    },
    justifyAbsence: async (data: any) => {
        const response = await api.post('/time-clock/justify/absence', data);
        return response.data;
    },
    justifyOvertime: async (data: any) => {
        const response = await api.post('/time-clock/justify/overtime', data);
        return response.data;
    },
    approve: async (id: number, data: any) => {
        const response = await api.patch(`/time-clock/approve/${id}`, data);
        return response.data;
    },
};

export const chatAPI = {
    getContacts: async () => {
        const response = await api.get('/chat/contacts');
        return response.data;
    },
    getMessages: async (contactId: number) => {
        const response = await api.get(`/chat/messages/${contactId}`);
        return response.data;
    },
    markAsRead: async (contactId: number) => {
        const response = await api.post('/chat/read', { contactId });
        return response.data;
    },
    sendMessage: async (receiverId: number, text: string) => {
        const response = await api.post('/chat/messages', { receiverId, text });
        return response.data;
    }
};

export const reportsAPI = {
    getFinancial: async (params?: { startDate?: string, endDate?: string }) => {
        const response = await api.get('/reports/financial', { params });
        return response.data;
    },
    getOperational: async (params?: { startDate?: string, endDate?: string }) => {
        const response = await api.get('/reports/operational', { params });
        return response.data;
    },
    getSales: async (params?: { startDate?: string, endDate?: string }) => {
        const response = await api.get('/reports/sales', { params });
        return response.data;
    }
};

export const marketingAPI = {
    // Campaigns
    listCampaigns: async () => {
        const response = await api.get('/marketing/campaigns');
        return response.data;
    },
    createCampaign: async (data: any) => {
        const response = await api.post('/marketing/campaigns', data);
        return response.data;
    },
    updateCampaign: async (id: number, data: any) => {
        const response = await api.put(`/marketing/campaigns/${id}`, data);
        return response.data;
    },
    deleteCampaign: async (id: number) => {
        await api.delete(`/marketing/campaigns/${id}`);
    },

    // Channels
    listChannels: async () => {
        const response = await api.get('/marketing/channels');
        return response.data;
    },
    createChannel: async (data: any) => {
        const response = await api.post('/marketing/channels', data);
        return response.data;
    },
    updateChannel: async (id: number, data: any) => {
        const response = await api.put(`/marketing/channels/${id}`, data);
        return response.data;
    },

    // Direct Mail Campaigns
    listDirectMail: async () => {
        const response = await api.get('/marketing/direct-mail');
        return response.data;
    },
    createDirectMail: async (data: any) => {
        const response = await api.post('/marketing/direct-mail', data);
        return response.data;
    },
    updateDirectMail: async (id: number, data: any) => {
        const response = await api.put(`/marketing/direct-mail/${id}`, data);
        return response.data;
    },
    deleteDirectMail: async (id: number) => {
        await api.delete(`/marketing/direct-mail/${id}`);
    },

    // SMTP and Audience
    getAudienceCount: async (audience: string) => {
        const response = await api.get('/marketing/audience-count', { params: { audience } });
        return response.data;
    },
    testSMTP: async (smtpSettings: any) => {
        const response = await api.post('/marketing/test-smtp', smtpSettings);
        return response.data;
    },
    getWhatsAppStatus: async () => {
        const response = await api.get('/marketing/whatsapp/status');
        return response.data;
    }
};

export const aiAPI = {
    getConfig: async () => {
        const response = await api.get('/ai/config');
        return response.data;
    },
    updateConfig: async (data: any) => {
        const response = await api.put('/ai/config', data);
        return response.data;
    },
    getChats: async (unitId?: string | number) => {
        const response = await api.get('/ai/chats', { params: { unitId } });
        return response.data;
    },
    toggleChatStatus: async (chatId: number, status: 'active' | 'manual') => {
        const response = await api.patch(`/ai/chats/${chatId}/status`, { status });
        return response.data;
    },
    improveText: async (text: string) => {
        const response = await api.post('/ai/improve-text', { text });
        return response.data;
    },
    sendMessage: async (chatId: number, text: string) => {
        const response = await api.post(`/ai/chats/${chatId}/message`, { text });
        return response.data;
    },
    testChat: async (message: string | Blob, history: any[]) => {
        const formData = new FormData();
        if (message instanceof Blob) {
            formData.append('audio', message, 'audio.webm');
        } else {
            formData.append('message', message);
        }
        formData.append('history', JSON.stringify(history));

        const response = await api.post('/ai/chat/test', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    uploadVoice: async (audioBlob: Blob) => {
        const formData = new FormData();
        formData.append('voice', audioBlob, 'voice_sample.webm');
        const response = await api.post('/ai/upload-voice', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    uploadTrainingFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/ai/upload-training-file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export const notificationsAPI = {
    getAll: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },
    markAsRead: async (id: number) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    }
};

export const promotionsAPI = {
    list: async () => {
        const response = await api.get('/promotions');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/promotions', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/promotions/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/promotions/${id}`);
        return response.data;
    },
    toggle: async (id: number) => {
        const response = await api.patch(`/promotions/${id}/toggle`);
        return response.data;
    }
};

export const packagesAPI = {
    // Packages
    list: async () => {
        const response = await api.get('/packages');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/packages', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/packages/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/packages/${id}`);
        return response.data;
    },
    toggle: async (id: number) => {
        const response = await api.patch(`/packages/${id}/toggle`);
        return response.data;
    },
    toggleFavorite: async (id: number) => {
        const response = await api.patch(`/packages/${id}/favorite`);
        return response.data;
    },

    // Subscriptions
    listSubscriptions: async () => {
        const response = await api.get('/packages/subscriptions');
        return response.data;
    },
    createSubscription: async (data: any) => {
        const response = await api.post('/packages/subscriptions', data);
        return response.data;
    },
    updateSubscription: async (id: number, data: any) => {
        const response = await api.put(`/packages/subscriptions/${id}`, data);
        return response.data;
    },
    deleteSubscription: async (id: number) => {
        const response = await api.delete(`/packages/subscriptions/${id}`);
        return response.data;
    },
    archiveSubscription: async (id: number) => {
        const response = await api.patch(`/packages/subscriptions/${id}/archive`);
        return response.data;
    },
};

export const contractsAPI = {
    list: async () => {
        const response = await api.get('/contracts/templates');
        return response.data;
    },
    create: async (data: { title: string; type: 'Contrato' | 'Termo'; content: string }) => {
        const response = await api.post('/contracts/templates', data);
        return response.data;
    },
    update: async (id: number, data: { title: string; content: string }) => {
        const response = await api.put(`/contracts/templates/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/contracts/templates/${id}`);
        return response.data;
    }
};

export const salonPlansAPI = {
    list: async () => {
        const response = await api.get('/salon-plans');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/salon-plans', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/salon-plans/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/salon-plans/${id}`);
        return response.data;
    },
    toggleSuspend: async (id: number) => {
        const response = await api.patch(`/salon-plans/${id}/suspend`);
        return response.data;
    },
    toggleFavorite: async (id: number) => {
        const response = await api.patch(`/salon-plans/${id}/favorite`);
        return response.data;
    },
};

export const supportAPI = {
    createTicket: async (data: { subject: string; department: string; priority: string; message: string }) => {
        const response = await api.post('/support', data);
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('/support/history');
        return response.data;
    }
};

export const trainingAPI = {
    getAll: async () => {
        const response = await api.get('/super-admin/training-videos');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/super-admin/training-videos', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/super-admin/training-videos/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`/super-admin/training-videos/${id}`);
        return response.data;
    },
    reorder: async (orders: { id: number; order: number }[]) => {
        const response = await api.patch('/super-admin/training-videos/reorder', { orders });
        return response.data;
    }
};

export const auditLogsAPI = {
    getLogs: async (params?: { limit?: number; offset?: number }) => {
        const response = await api.get('/audit-logs', { params });
        return response.data;
    }
};

export default api;
