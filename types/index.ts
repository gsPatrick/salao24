export interface Plan {
    name: string;
    price: string;
}

export interface Contract {
    planName: string;
    price: string;
    discountedPrice: string;
    priceAfterYear: string;
    date: string;
    contractText: string;
    signatureImg: string;
    userPhoto: string;
    userName: string;
    userCpf: string;
}

export interface PermissionDetails {
    create: boolean;
    view: boolean;
    delete: boolean;
    export: boolean;
}

export interface User {
    id?: number;
    name: string;
    email: string;
    avatarUrl: string;
    role?: 'admin' | 'gerente' | 'concierge' | 'profissional' | 'Administrador' | 'Gerente' | 'Profissional';
    plan?: 'Individual' | 'Empresa' | 'Vitalício' | 'Empresa Essencial' | 'Empresa Pro' | 'Empresa Premium';
    contracts?: Contract[];
    tenant_id?: number;
    permissions?: { [key: string]: PermissionDetails };
}

export interface Reminder {
    id: number;
    subject: string;
    text: string;
    dateTime: string;
    status: 'pending' | 'completed';
}

export interface ClientDocument {
    name: string;
    signed: boolean;
    content?: string;
    type?: 'Contrato' | 'Termo';
    id?: number;
    signatureImg?: string;
    userPhoto?: string;
}

export interface Client {
    id: number;
    name: string;
    socialName?: string;
    photo: string;
    phone: string;
    email: string;
    cpf: string;
    rg?: string;
    birthdate: string;
    history: {
        id: number;
        name: string;
        date: string;
        time: string;
        professional: string;
        status: 'Atendido' | 'Faltou' | 'Desmarcou' | 'Reagendado' | 'Agendado' | 'a realizar' | 'concluído';
        reviewed?: boolean;
        price: string;
    }[];
    preferences: string[];
    status: string | null;
    lastVisit: string;
    totalVisits: number;
    packages: any[];
    procedurePhotos: string[];
    documents: ClientDocument[];
    relationships?: { type: string; clientId: number; }[];
    reminders?: Reminder[];
    howTheyFoundUs: string;
    indicatedBy?: string;
    registrationDate: string;
    password?: string;
    preferredUnit?: string;
    maritalStatus?: string;
    tags?: string[];
    blocked?: {
        status: boolean;
        reason: string;
    };
    address: {
        cep: string;
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
    };
    servicesOfInterest?: string[];
    crm_stage?: string;
    [key: string]: any;
}

export interface Professional {
    id: number;
    name: string;
    socialName?: string;
    photo: string;
    occupation: string;
    specialties: string[];
    cpf: string;
    birthdate: string;
    maritalStatus?: string;
    pis?: string;
    phone: string;
    email: string;
    address: any;
    unit: string;
    startTime?: string;
    lunchStart?: string;
    lunchEnd?: string;
    endTime?: string;
    allowOvertime?: boolean;
    suspended?: boolean;
    archived?: boolean;
    openSchedule?: boolean;
    documents?: { title: string; fileName: string; fileUrl?: string; }[];
    average_rating?: string;
    review_count?: string;
}

export interface Service {
    id: number;
    name: string;
    description: string;
    duration: string | number;
    price: string;
    category: string;
    unit: string;
    suspended: boolean;
    professional_ids?: number[];
    allowAny?: boolean;
    isFavorite?: boolean;
}

export interface Transaction {
    id: number;
    description: string;
    amount: number;
    date: string;
    type: 'receita' | 'despesa';
    status: 'Pago' | 'Pendente' | 'Vencida';
    billAttachment?: string;
    receiptAttachment?: string;
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

export interface Lead {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    source?: string;
    status: 'novo' | 'em_atendimento' | 'agendado' | 'arquivado';
    notes?: string;
}

export interface DirectMailCampaignData {
    id: number;
    name: string;
    description?: string;
    sendType: 'Email' | 'SMS' | 'WhatsApp';
    status: 'rascunho' | 'agendado' | 'enviado';
    scheduleDate?: string;
    content?: string;
    history?: { date: string; recipients: number }[];
    roi?: {
        totalSent: number;
        openRate: string;
        clicks: number;
        conversions: number;
        revenue: number;
    };
    archived?: boolean;
}

export interface Unit {
    id: number;
    name: string;
    tenant_id?: number;
    is_active?: boolean;
    address?: any;
}
