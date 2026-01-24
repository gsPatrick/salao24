import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    clientsAPI,
    professionalsAPI,
    servicesAPI,
    appointmentsAPI,
    financeAPI,
    plansAPI,
    tenantsAPI,
    unitsAPI,
    usersAPI,
    superAdminAPI,
    stockAPI,
    crmAPI,
    notificationsAPI,
    paymentsAPI
} from '../lib/api';
import { useAuth } from './AuthContext';

// Types matching API responses
export interface Client {
    id: number;
    name: string;
    socialName?: string;
    photo?: string;
    phone: string;
    email: string;
    cpf?: string;
    birthdate?: string;
    // Mapped fields for frontend compatibility
    lastVisit?: string;
    totalVisits?: number;
    preferences?: string[];
    status?: string;
    howTheyFoundUs?: string;
    registrationDate?: string;
    history?: any[];
    packages?: any[];
    procedurePhotos?: string[];
    documents?: any[];
    address?: any;
    tags?: string[];
    crmColumnId?: string;
    crmData?: any;
    [key: string]: any;
}

export interface CrmSettings {
    columns: any[];
    classifications: any[];
}

export interface Professional {
    id: number;
    name: string;
    photo?: string;
    occupation?: string;
    specialties?: string[];
    phone?: string;
    email?: string;
    unit?: string;
    suspended?: boolean;
    archived?: boolean;
    [key: string]: any;
}

export interface Service {
    id: number;
    name: string;
    description?: string;
    duration: string | number;
    price: string;
    category?: string;
    suspended?: boolean;
    [key: string]: any;
}

export interface Appointment {
    id: number;
    professionalId: number;
    clientId: number;
    date: string;
    time: string;
    service: string;
    status: 'Agendado' | 'Em Espera' | 'Atendido' | 'Falta' | string;
    [key: string]: any;
}

export interface Transaction {
    id: number;
    description: string;
    amount: number;
    date: string;
    type: 'receita' | 'despesa';
    status: 'Pago' | 'Pendente' | 'Vencida';
    [key: string]: any;
}

export interface SystemUser {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'gerente' | 'recepcao' | 'profissional' | 'Administrador' | 'Gerente' | 'Profissional' | 'Concierge';
    avatarUrl?: string;
    suspended?: boolean;
    permissions?: any;
    [key: string]: any;
}

export interface Tenant {
    id: number;
    name: string;
    description?: string;
    logo_url?: string;
    primary_color?: string;
    working_hours?: any;
    checkin_message?: string;
    address?: any;
    phone?: string;
    email?: string;
    cnpj_cpf?: string;
    settings?: {
        bank_info?: any;
        appointment_interval?: number;
        cancel_advance_notice?: number;
        notifications?: {
            whatsapp?: boolean;
            email?: boolean;
        };
        [key: string]: any;
    };
    [key: string]: any;
}

export interface Product {
    id: number;
    name: string;
    category: string;
    purchaseValue: string;
    quantity: number;
    lowStockAlert: number;
    suspended?: boolean;
    isFavorite?: boolean;
    [key: string]: any;
}

export interface Unit {
    id: number;
    name: string;
    phone: string;
    address: {
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
        cep: string;
    };
    suspended?: boolean;
    additionalPhones?: { sector: string; number: string; }[];
    logo?: string | null;
    primaryColor?: string;
    workingHours?: any[];
    checkinMessage?: string;
    [key: string]: any;
}

export interface DataContextType {
    // Data
    clients: Client[];
    professionals: Professional[];
    services: Service[];
    appointments: Appointment[];
    transactions: Transaction[];
    users: SystemUser[];
    tenant: Tenant | null;
    units: Unit[];
    products: Product[];
    crmSettings: CrmSettings | null;

    // Loading states
    loading: {
        clients: boolean;
        professionals: boolean;
        services: boolean;
        appointments: boolean;
        transactions: boolean;
        users: boolean;
        tenant: boolean;
        units: boolean;
        products: boolean;
        crmSettings: boolean;
    };

    // Error states
    errors: {
        clients: string | null;
        professionals: string | null;
        services: string | null;
        appointments: string | null;
        transactions: string | null;
        users: string | null;
        tenant: string | null;
        units: string | null;
        products: string | null;
        crmSettings: string | null;
    };

    // Refresh functions
    refreshClients: () => Promise<void>;
    refreshProfessionals: () => Promise<void>;
    refreshServices: () => Promise<void>;
    refreshAppointments: (date?: string) => Promise<void>;
    refreshTransactions: () => Promise<void>;
    refreshUsers: () => Promise<void>;
    refreshTenant: () => Promise<void>;
    refreshUnits: () => Promise<void>;
    refreshProducts: () => Promise<void>;
    refreshCrmSettings: () => Promise<void>;
    refreshAll: () => Promise<void>;

    // CRUD handlers
    saveClient: (client: Partial<Client>) => Promise<Client | null>;
    deleteClient: (id: number) => Promise<boolean>;

    saveProfessional: (professional: Partial<Professional>) => Promise<Professional | null>;
    deleteProfessional: (id: number) => Promise<boolean>;

    saveService: (service: Partial<Service>) => Promise<Service | null>;
    deleteService: (id: number) => Promise<boolean>;
    toggleSuspendService: (id: number) => Promise<Service | null>;
    toggleFavoriteService: (id: number) => Promise<Service | null>;

    saveAppointment: (appointment: Partial<Appointment>) => Promise<Appointment | null>;
    updateAppointmentStatus: (id: number, status: string) => Promise<Appointment | null>;
    cancelAppointment: (id: number) => Promise<boolean>;

    saveTransaction: (transaction: Partial<Transaction>) => Promise<Transaction | null>;
    deleteTransaction: (id: number) => Promise<boolean>;

    saveUser: (user: Partial<SystemUser>) => Promise<SystemUser | null>;
    deleteUser: (id: number) => Promise<boolean>;

    updateTenant: (tenant: Partial<Tenant>) => Promise<Tenant | null>;
    uploadTenantLogo: (file: File) => Promise<string | null>;

    saveUnit: (unit: Partial<Unit>) => Promise<Unit | null>;
    deleteUnit: (id: number) => Promise<boolean>;

    saveProduct: (product: Partial<Product>) => Promise<Product | null>;
    deleteProduct: (id: number) => Promise<boolean>;
    toggleSuspendProduct: (id: number) => Promise<Product | null>;
    updateStockQuantity: (id: number, change: number) => Promise<Product | null>;

    updateCrmSettings: (data: Partial<CrmSettings>) => Promise<CrmSettings | null>;
    updateClientCrm: (clientId: number, data: any) => Promise<Client | null>;

    // Notifications
    notifications: any[];
    refreshNotifications: () => Promise<void>;

    // Unit Selection
    selectedUnitId: number | null;
    setSelectedUnitId: (id: number | null) => void;

    // Utility function to find client by ID
    getClientById: (id: number) => Client | undefined;
    getProfessionalById: (id: number) => Professional | undefined;
    getServiceById: (id: number) => Service | undefined;
    subscribeToPlan: (planId: number, paymentMethod?: string) => Promise<any>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Map API response to frontend format
const mapClientFromAPI = (apiClient: any): Client => ({
    ...apiClient,
    socialName: apiClient.social_name,
    photo: apiClient.photo || apiClient.photo_url || apiClient.avatar_url || 'https://i.pravatar.cc/150?u=default',
    birthdate: apiClient.birth_date || apiClient.birthdate,
    howTheyFoundUs: apiClient.how_found_us || apiClient.how_they_found_us || '',
    // Map snake_case to camelCase
    lastVisit: apiClient.last_visit_at,
    totalVisits: apiClient.total_visits || 0,
    registrationDate: apiClient.created_at,
    history: apiClient.history || [],
    packages: apiClient.packages || [],
    procedurePhotos: apiClient.procedure_photos || [],
    documents: apiClient.documents || [],
    preferences: apiClient.preferences || [],
    tags: apiClient.tags || [],
    crmColumnId: apiClient.crm_column_id,
    crmData: apiClient.crm_data,
});

const mapServiceFromAPI = (apiService: any): Service => ({
    ...apiService,
    suspended: apiService.is_suspended,
    isFavorite: apiService.is_favorite,
});

const mapProfessionalFromAPI = (apiProfessional: any): Professional => ({
    ...apiProfessional,
    socialName: apiProfessional.social_name,
    photo: apiProfessional.photo || apiProfessional.avatar_url || 'https://i.pravatar.cc/150?u=professional',
    maritalStatus: apiProfessional.marital_status,
    startTime: apiProfessional.start_time,
    lunchStart: apiProfessional.lunch_start,
    lunchEnd: apiProfessional.lunch_end,
    endTime: apiProfessional.end_time,
    allowOvertime: apiProfessional.allow_overtime,
    openSchedule: apiProfessional.open_schedule,
    suspended: apiProfessional.is_suspended,
    archived: apiProfessional.is_archived,
    specialties: apiProfessional.specialties || [],
});

const mapAppointmentFromAPI = (apiAppointment: any): Appointment => ({
    ...apiAppointment,
    professionalId: apiAppointment.professional_id,
    clientId: apiAppointment.client_id,
    service: apiAppointment.service?.name || apiAppointment.service_name || 'Serviço',
});

const mapTransactionFromAPI = (apiTransaction: any): Transaction => ({
    ...apiTransaction,
    description: apiTransaction.description,
    amount: parseFloat(apiTransaction.amount),
    type: (apiTransaction.type === 'income' || apiTransaction.type === 'receita') ? 'receita' : 'despesa',
    status: (apiTransaction.status === 'paid' || apiTransaction.status === 'pago') ? 'Pago' : (apiTransaction.status === 'pending' || apiTransaction.status === 'pendente') ? 'Pendente' : 'Vencida',
    billAttachment: apiTransaction.bill_attachment || apiTransaction.billAttachment,
    receiptAttachment: apiTransaction.receipt_attachment || apiTransaction.receiptAttachment,
});

const mapProductFromAPI = (apiProduct: any): Product => ({
    ...apiProduct,
    purchaseValue: apiProduct.purchase_price,
    lowStockAlert: apiProduct.min_stock_level,
    isFavorite: apiProduct.is_favorite,
    suspended: apiProduct.is_suspended,
});

const mapTenantFromAPI = (apiTenant: any): Tenant => ({
    ...apiTenant,
    cnpj_cpf: apiTenant.cnpj_cpf,
    working_hours: apiTenant.working_hours,
    checkin_message: apiTenant.checkin_message,
});

const mapUnitFromAPI = (apiUnit: any): Unit => ({
    ...apiUnit,
    suspended: apiUnit.is_suspended,
    logo: apiUnit.logo_url || apiUnit.logo,
    primaryColor: apiUnit.primary_color || apiUnit.primaryColor,
    workingHours: apiUnit.working_hours || apiUnit.workingHours,
    checkinMessage: apiUnit.checkin_message || apiUnit.checkinMessage,
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // Data state
    const [clients, setClients] = useState<Client[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [units, setUnits] = useState<Unit[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [crmSettings, setCrmSettings] = useState<CrmSettings | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

    // Loading state
    const [loading, setLoading] = useState({
        clients: false,
        professionals: false,
        services: false,
        appointments: false,
        transactions: false,
        users: false,
        tenant: false,
        units: false,
        products: false,
        crmSettings: false,
    });

    // Error state
    const [errors, setErrors] = useState({
        clients: null as string | null,
        professionals: null as string | null,
        services: null as string | null,
        appointments: null as string | null,
        transactions: null as string | null,
        users: null as string | null,
        tenant: null as string | null,
        units: null as string | null,
        products: null as string | null,
        crmSettings: null as string | null,
    });

    // Refresh functions
    const refreshClients = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(prev => ({ ...prev, clients: true }));
        setErrors(prev => ({ ...prev, clients: null }));
        try {
            const response = await clientsAPI.getAll();
            const mapped = (response.data || []).map(mapClientFromAPI);
            setClients(mapped);
        } catch (error: any) {
            console.error('Error fetching clients:', error);
            setErrors(prev => ({ ...prev, clients: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, clients: false }));
        }
    }, [isAuthenticated]);

    const refreshProfessionals = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(prev => ({ ...prev, professionals: true }));
        setErrors(prev => ({ ...prev, professionals: null }));
        try {
            const response = await professionalsAPI.getAll();
            const mapped = (response.data || []).map(mapProfessionalFromAPI);
            setProfessionals(mapped);
        } catch (error: any) {
            console.error('Error fetching professionals:', error);
            setErrors(prev => ({ ...prev, professionals: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, professionals: false }));
        }
    }, [isAuthenticated]);

    const refreshServices = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(prev => ({ ...prev, services: true }));
        setErrors(prev => ({ ...prev, services: null }));
        try {
            const response = await servicesAPI.getAll();
            setServices(response.data || []);
        } catch (error: any) {
            console.error('Error fetching services:', error);
            setErrors(prev => ({ ...prev, services: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, services: false }));
        }
    }, [isAuthenticated]);

    const refreshAppointments = useCallback(async (date?: string) => {
        if (!isAuthenticated) return;
        setLoading(prev => ({ ...prev, appointments: true }));
        setErrors(prev => ({ ...prev, appointments: null }));
        try {
            const filters = date ? { date } : undefined;
            const response = await appointmentsAPI.getAll(filters);
            const mapped = (response.data || []).map(mapAppointmentFromAPI);
            setAppointments(mapped);
        } catch (error: any) {
            console.error('Error fetching appointments:', error);
            setErrors(prev => ({ ...prev, appointments: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, appointments: false }));
        }
    }, [isAuthenticated]);

    const refreshTransactions = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(prev => ({ ...prev, transactions: true }));
        setErrors(prev => ({ ...prev, transactions: null }));
        try {
            const response = await financeAPI.getAll();
            const mapped = (response.data || []).map(mapTransactionFromAPI);
            setTransactions(mapped);
        } catch (error: any) {
            console.error('Error fetching transactions:', error);
            setErrors(prev => ({ ...prev, transactions: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, transactions: false }));
        }
    }, [isAuthenticated]);

    const refreshUsers = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(prev => ({ ...prev, users: true }));
        try {
            const response = await usersAPI.getAll();
            setUsers(response.data || []);
        } catch (error: any) {
            console.error('Error fetching users:', error);
            setErrors(prev => ({ ...prev, users: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, users: false }));
        }
    }, [isAuthenticated]);

    const refreshTenant = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(prev => ({ ...prev, tenant: true }));
        try {
            const response = await tenantsAPI.getCurrent();
            const data = response.data || response;
            setTenant(mapTenantFromAPI(data));
        } catch (error: any) {
            console.error('Error fetching tenant:', error);
            setErrors(prev => ({ ...prev, tenant: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, tenant: false }));
        }
    }, [isAuthenticated]);

    const refreshUnits = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(prev => ({ ...prev, units: true }));
        try {
            const response = await unitsAPI.getAll();
            const mapped = (response.data || []).map(mapUnitFromAPI);
            setUnits(mapped);
        } catch (error: any) {
            console.error('Error fetching units:', error);
            setErrors(prev => ({ ...prev, units: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, units: false }));
        }
    }, [isAuthenticated]);

    const refreshProducts = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(prev => ({ ...prev, products: true }));
        try {
            const response = await stockAPI.getProducts();
            const mapped = (response.data || response || []).map(mapProductFromAPI);
            setProducts(mapped);
        } catch (error: any) {
            console.error('Error fetching products:', error);
            setErrors(prev => ({ ...prev, products: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, products: false }));
        }
    }, [isAuthenticated]);

    const refreshCrmSettings = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(prev => ({ ...prev, crmSettings: true }));
        try {
            const response = await crmAPI.getSettings();
            setCrmSettings(response);
        } catch (error: any) {
            console.error('Error fetching CRM settings:', error);
            setErrors(prev => ({ ...prev, crmSettings: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, crmSettings: false }));
        }
    }, [isAuthenticated]);

    const refreshNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const response = await notificationsAPI.getAll();
            setNotifications(response.data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [isAuthenticated]);

    const refreshAll = useCallback(async () => {
        await Promise.all([
            refreshClients(),
            refreshProfessionals(),
            refreshServices(),
            refreshAppointments(),
            refreshTransactions(),
            refreshUsers(),
            refreshTenant(),
            refreshUnits(),
            refreshProducts(),
            refreshCrmSettings(),
            refreshNotifications(),
        ]);
    }, [refreshClients, refreshProfessionals, refreshServices, refreshAppointments, refreshTransactions, refreshUsers, refreshTenant, refreshUnits, refreshProducts, refreshCrmSettings, refreshNotifications]);

    // Initial data fetch when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            refreshAll();
        }
    }, [isAuthenticated, refreshAll]);

    // CRUD handlers
    const saveClient = async (client: Partial<Client>): Promise<Client | null> => {
        try {
            // Map frontend fields (camelCase) to backend fields (snake_case)
            const apiData = {
                ...client,
                social_name: client.socialName,
                birth_date: client.birthdate,
                photo_url: client.photo,
                how_found_us: client.howTheyFoundUs,
                is_active: client.isActive ?? true,
            };

            let response;
            if (client.id) {
                response = await clientsAPI.update(client.id, apiData);
            } else {
                response = await clientsAPI.create(apiData);
            }
            await refreshClients();
            return mapClientFromAPI(response.data);
        } catch (error) {
            console.error('Error saving client:', error);
            return null;
        }
    };

    const deleteClient = async (id: number): Promise<boolean> => {
        try {
            await clientsAPI.delete(id);
            await refreshClients();
            return true;
        } catch (error) {
            console.error('Error deleting client:', error);
            return false;
        }
    };

    const saveProfessional = async (professional: Partial<Professional>): Promise<Professional | null> => {
        try {
            // Map frontend fields (camelCase) to backend fields (snake_case)
            const apiData = {
                ...professional,
                social_name: professional.socialName,
                marital_status: professional.maritalStatus,
                start_time: professional.startTime,
                lunch_start: professional.lunchStart,
                lunch_end: professional.lunchEnd,
                end_time: professional.endTime,
                allow_overtime: professional.allowOvertime,
                open_schedule: professional.openSchedule,
                is_suspended: professional.suspended,
                is_archived: professional.archived,
            };

            let response;
            if (professional.id) {
                response = await professionalsAPI.update(professional.id, apiData);
            } else {
                response = await professionalsAPI.create(apiData);
            }
            await refreshProfessionals();
            return mapProfessionalFromAPI(response.data);
        } catch (error) {
            console.error('Error saving professional:', error);
            return null;
        }
    };

    const deleteProfessional = async (id: number): Promise<boolean> => {
        try {
            await professionalsAPI.delete(id);
            await refreshProfessionals();
            return true;
        } catch (error) {
            console.error('Error deleting professional:', error);
            return false;
        }
    };

    const saveService = async (service: Partial<Service>): Promise<Service | null> => {
        try {
            // Parse duration to integer if it's a string
            let duration = service.duration;
            if (typeof duration === 'string') {
                duration = parseInt(duration.replace(/\D/g, ''), 10) || 60;
            }

            // Map frontend fields (camelCase) to backend fields (snake_case)
            const apiData = {
                ...service,
                duration,
                is_suspended: service.suspended,
                is_favorite: service.isFavorite,
            };

            let response;
            if (service.id) {
                response = await servicesAPI.update(service.id, apiData);
            } else {
                response = await servicesAPI.create(apiData);
            }
            await refreshServices();
            return mapServiceFromAPI(response.data);
        } catch (error) {
            console.error('Error saving service:', error);
            return null;
        }
    };

    const deleteService = async (id: number): Promise<boolean> => {
        try {
            await servicesAPI.delete(id);
            await refreshServices();
            return true;
        } catch (error) {
            console.error('Error deleting service:', error);
            return false;
        }
    };

    const toggleSuspendService = async (id: number): Promise<Service | null> => {
        try {
            const service = services.find(s => s.id === id);
            if (!service) return null;

            const response = await servicesAPI.update(id, {
                is_suspended: !service.suspended
            });
            await refreshServices();
            return mapServiceFromAPI(response.data);
        } catch (error) {
            console.error('Error toggling service suspension:', error);
            return null;
        }
    };

    const toggleFavoriteService = async (id: number): Promise<Service | null> => {
        try {
            const service = services.find(s => s.id === id);
            if (!service) return null;

            const response = await servicesAPI.update(id, {
                is_favorite: !service.isFavorite
            });
            await refreshServices();
            return mapServiceFromAPI(response.data);
        } catch (error) {
            console.error('Error toggling service favorite:', error);
            return null;
        }
    };

    const saveAppointment = async (appointment: Partial<Appointment>): Promise<Appointment | null> => {
        try {
            // Map frontend fields to API fields
            const apiData = {
                ...appointment,
                professional_id: appointment.professionalId,
                client_id: appointment.clientId,
            };

            let response;
            if (appointment.id) {
                response = await appointmentsAPI.update(appointment.id, apiData);
            } else {
                response = await appointmentsAPI.create(apiData);
            }
            await refreshAppointments();
            return mapAppointmentFromAPI(response.data);
        } catch (error: any) {
            console.error('Error saving appointment:', error);
            // Handle conflict error (409)
            if (error.response?.status === 409) {
                alert('Já existe um agendamento para este profissional neste horário!');
            }
            return null;
        }
    };

    const updateAppointmentStatus = async (id: number, status: string): Promise<Appointment | null> => {
        try {
            const response = await appointmentsAPI.updateStatus(id, status);
            await refreshAppointments();
            return mapAppointmentFromAPI(response.data);
        } catch (error) {
            console.error('Error updating appointment status:', error);
            return null;
        }
    };

    const cancelAppointment = async (id: number): Promise<boolean> => {
        try {
            await appointmentsAPI.cancel(id);
            await refreshAppointments();
            return true;
        } catch (error) {
            console.error('Error canceling appointment:', error);
            return false;
        }
    };

    const saveTransaction = async (transaction: Partial<Transaction>): Promise<Transaction | null> => {
        try {
            // Map frontend fields to API fields
            const apiData = {
                ...transaction,
                type: transaction.type === 'receita' ? 'income' : 'expense',
                status: transaction.status === 'Pago' ? 'paid' : transaction.status === 'Pendente' ? 'pending' : 'overdue',
            };

            let response;
            if (transaction.id) {
                response = await financeAPI.update(transaction.id, apiData);
            } else {
                response = await financeAPI.create(apiData);
            }
            await refreshTransactions();
            return mapTransactionFromAPI(response.data);
        } catch (error) {
            console.error('Error saving transaction:', error);
            return null;
        }
    };

    const deleteTransaction = async (id: number): Promise<boolean> => {
        try {
            await financeAPI.delete(id);
            await refreshTransactions();
            return true;
        } catch (error) {
            console.error('Error deleting transaction:', error);
            return false;
        }
    };

    const saveUser = async (user: Partial<SystemUser>): Promise<SystemUser | null> => {
        try {
            let response;
            if (user.id) {
                response = await usersAPI.update(user.id, user);
            } else {
                response = await usersAPI.create(user);
            }
            await refreshUsers();
            return response.data;
        } catch (error) {
            console.error('Error saving user:', error);
            return null;
        }
    }

    const deleteUser = async (id: number): Promise<boolean> => {
        try {
            await usersAPI.delete(id);
            await refreshUsers();
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }

    const updateTenant = async (data: Partial<Tenant>): Promise<Tenant | null> => {
        if (!tenant?.id) return null;
        try {
            // Map frontend fields back to API fields
            const apiData = {
                ...data,
                cnpj_cpf: data.cnpj_cpf,
                working_hours: data.working_hours,
                checkin_message: data.checkin_message,
                primary_color: data.primary_color,
                logo_url: data.logo_url
            };

            const response = await tenantsAPI.update(tenant.id, apiData);
            const updated = mapTenantFromAPI(response.data || response);
            setTenant(updated);
            return updated;
        } catch (error) {
            console.error('Error updating tenant:', error);
            return null;
        }
    };

    const uploadTenantLogo = async (file: File): Promise<string | null> => {
        if (!tenant?.id) return null;
        try {
            const response = await tenantsAPI.uploadLogo(tenant.id, file);
            // Verify if response.url is correct
            await refreshTenant();
            return response.url;
        } catch (error) {
            console.error('Error uploading logo:', error);
            return null;
        }
    }



    const saveUnit = async (unit: Partial<Unit>): Promise<Unit | null> => {
        try {
            // Map frontend fields (camelCase) to backend fields (snake_case)
            const apiData = {
                ...unit,
                is_suspended: unit.suspended,
                logo_url: unit.logo,
                primary_color: unit.primaryColor,
                working_hours: unit.workingHours,
                checkin_message: unit.checkinMessage,
            };

            let response;
            if (unit.id && unit.id > 0) {
                response = await unitsAPI.update(unit.id, apiData);
            } else {
                response = await unitsAPI.create(apiData);
            }
            await refreshUnits();
            return mapUnitFromAPI(response.data || response);
        } catch (error) {
            console.error('Error saving unit:', error);
            return null;
        }
    }

    const deleteUnit = async (id: number): Promise<boolean> => {
        try {
            await unitsAPI.delete(id);
            await refreshUnits();
            return true;
        } catch (error) {
            console.error('Error deleting unit:', error);
            return false;
        }
    }

    const saveProduct = async (product: Partial<Product>): Promise<Product | null> => {
        try {
            // Map back to API format if needed (e.g. camelCase -> snake_case is handled by mapProductFromAPI but sending?)
            // Usually backend accepts snake_case or we need to map it.
            // My backend model uses underscored: true so it expects snake_case or sequelize might handle if we send standard JSON.
            // Let's manually map for safety.
            const apiData = {
                ...product,
                purchase_price: product.purchaseValue,
                min_stock_level: product.lowStockAlert,
                is_favorite: product.isFavorite,
                is_suspended: product.suspended,
            };

            let response;
            if (product.id) {
                response = await stockAPI.updateProduct(product.id, apiData);
            } else {
                response = await stockAPI.createProduct(apiData);
            }
            await refreshProducts();
            return mapProductFromAPI(response);
        } catch (error) {
            console.error('Error saving product:', error);
            return null;
        }
    };

    const deleteProduct = async (id: number): Promise<boolean> => {
        try {
            await stockAPI.deleteProduct(id);
            await refreshProducts();
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            return false;
        }
    };

    const toggleSuspendProduct = async (id: number): Promise<Product | null> => {
        try {
            const response = await stockAPI.toggleSuspend(id);
            await refreshProducts();
            return mapProductFromAPI(response);
        } catch (error) {
            console.error('Error toggling suspend product:', error);
            return null;
        }
    };

    const updateStockQuantity = async (id: number, change: number): Promise<Product | null> => {
        try {
            const response = await stockAPI.updateQuantity(id, change);
            await refreshProducts();
            return mapProductFromAPI(response);
        } catch (error) {
            console.error('Error updating stock quantity:', error);
            return null;
        }
    };

    const updateCrmSettings = async (data: Partial<CrmSettings>): Promise<CrmSettings | null> => {
        try {
            const response = await crmAPI.updateSettings(data);
            setCrmSettings(response);
            return response;
        } catch (error) {
            console.error('Error updating CRM settings:', error);
            return null;
        }
    };

    const updateClientCrm = async (clientId: number, data: any): Promise<Client | null> => {
        try {
            const response = await crmAPI.updateClientCrm(clientId, data);
            await refreshClients(); // Refresh clients to reflect changes
            return mapClientFromAPI(response);
        } catch (error) {
            console.error('Error updating client CRM:', error);
            return null;
        }
    };

    // Utility functions
    const getClientById = (id: number) => clients.find(c => c.id === id);
    const getProfessionalById = (id: number) => professionals.find(p => p.id === id);
    const getServiceById = (id: number) => services.find(s => s.id === id);

    const subscribeToPlan = async (planId: number, paymentMethod: string = 'UNDEFINED'): Promise<any> => {
        try {
            const response = await paymentsAPI.subscribe(planId, paymentMethod);
            await refreshTenant(); // Update tenant plan and status
            return response;
        } catch (error) {
            console.error('Error subscribing to plan:', error);
            return null;
        }
    };

    return (
        <DataContext.Provider
            value={{
                clients,
                professionals,
                services,
                appointments,
                transactions,
                loading,
                errors,
                refreshClients,
                refreshProfessionals,
                refreshServices,
                refreshAppointments,
                refreshTransactions,
                refreshAll,
                saveClient,
                deleteClient,
                saveProfessional,
                deleteProfessional,
                saveService,
                deleteService,
                toggleSuspendService,
                toggleFavoriteService,
                saveAppointment,
                updateAppointmentStatus,
                cancelAppointment,
                saveTransaction,
                deleteTransaction,
                users,
                tenant,
                refreshUsers,
                refreshTenant,
                saveUser,
                deleteUser,
                updateTenant,
                uploadTenantLogo,
                units,
                refreshUnits,
                saveUnit,
                deleteUnit,
                products,
                refreshProducts,
                saveProduct,
                deleteProduct,
                toggleSuspendProduct,
                updateStockQuantity,
                crmSettings,
                refreshCrmSettings,
                updateCrmSettings,
                updateClientCrm,
                getClientById,
                getProfessionalById,
                getServiceById,
                selectedUnitId,
                setSelectedUnitId,
                subscribeToPlan,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export default DataContext;
