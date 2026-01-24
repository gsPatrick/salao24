import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://salao-api.rdwhjt.easypanel.host/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use((response) => {
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
    if (error.response?.status === 401) {
        window.dispatchEvent(new Event('auth:logout'));
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
    me: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    changePassword: async (data: any) => {
        const response = await api.put('/auth/password', data);
        return response.data;
    }
};

export const clientsAPI = {
    getAll: async () => {
        const response = await api.get('/clients');
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
    getRanking: async (params?: { limit?: number }) => {
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
    updateStatus: async (id: number, status: string) => {
        const response = await api.patch(`/appointments/${id}/status`, { status });
        return response.data;
    },
    cancel: async (id: number) => {
        const response = await api.delete(`/appointments/${id}`);
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
};

export const financeAPI = {
    getAll: async () => {
        const response = await api.get('/finance/transactions');
        return response.data;
    },
    getSummary: async (params?: { period?: string, startDate?: string, endDate?: string }) => {
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
    getCurrent: async () => {
        const response = await api.get('/tenants/current');
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/tenants/${id}`, data);
        return response.data;
    },
    uploadLogo: async (id: number, file: File) => {
        const formData = new FormData();
        formData.append('logo', file);
        const response = await api.post(`/tenants/${id}/logo`, formData, {
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
    getChats: async () => {
        const response = await api.get('/ai/chats');
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
    }
};

export default api;
