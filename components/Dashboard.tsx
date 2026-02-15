

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Transaction,
    Service,
    Client,
    Professional,
    User,
    PermissionDetails,
    Package,
    SalonPlan
} from '../types';

import { AIAgentPage } from './AIAgentPage';
import CRMPage from './CRMPage';
// FIX: Reverted to default import to resolve module syntax error.
import ClientListPage from './ClientListPage';
import ChatPage from './ChatPage';
import ProfessionalAgendaPage from './ProfessionalAgendaPage';
import GlobalReminders from './GlobalReminders';
import GeneralAgendaPage from './GeneralAgendaPage';
import FinancialDashboardPage from './FinancialDashboardPage';
import ProfessionalsPage from './ProfessionalsPage'; // New import
import TimeClockPage from './TimeClockPage'; // New import
import ServicesPage from './ServicesPage'; // New import
// FIX: Import StockPage to resolve 'Cannot find name' error.
import StockPage from './StockPage';
import AcquisitionChannelsChart from './AcquisitionChannelsChart';
import NewTransactionModal from './NewTransactionModal';
import { SettingsPage } from './SettingsPage'; // New import
import AccountPage from './AccountPage';
import InternalChat from './InternalChat'; // New import
import SupportPage from './SupportPage'; // New import for Support page
import ReportsPage from './ReportsPage'; // New import for Reports page
import { ReferralRanking } from './ReferralRanking'; // New import for Referral Ranking
import { EmailServerSettings } from './EmailServerSettings'; // New import for Email Server Settings
// FIX: Changed to a named import as MarketingCampaigns does not have a default export.
import ComingSoonModal from './ComingSoonModal';
import { MarketingCampaigns } from './MarketingCampaigns';
import { DirectMailCampaign } from './DirectMailCampaign'; // New import for Direct Mail Campaign
import { DashboardPromoCarousel } from './dashboard/DashboardPromoCarousel'; // New Promo Carousel
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { financeAPI, notificationsAPI, chatAPI, promotionsAPI, packagesAPI, marketingAPI, professionalsAPI } from '../lib/api';
import { Schedule } from './ScheduleSettingsModal';
import NewAcquisitionChannelModal from './NewAcquisitionChannelModal';
import ContractPage from './ContractPage';
import ChannelsPage from './ChannelsPage';
import { SuperAdminTenantsPage, SuperAdminBannersPage } from './SuperAdminDashboard';
import YouTubeCommentModeration from './YouTubeCommentModeration';
import TranslationPage from './TranslationPage';
import TestConnection from './TestConnection';

// Card Icons
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m-4 0H8v1m4-1v-1m-4 5v1m-2-4h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" /></svg>;
const CardCalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ClipboardCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const CardUsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" /></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /></svg>;

// Sidebar Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const AIIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ChannelsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V10a2 2 0 012-2h8zM7 8H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h2" /></svg>;
const MarketingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 00-1.564.317z" />
    </svg>
);
const MyAgendaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11a3 3 0 11-6 0 3 3 0 016 0zM12 17a6 6 0 00-4.5 1.9" /></svg>;
const SidebarCalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const SidebarUsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CrmIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ProfessionalsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ServicesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a5 5 0 01-7.071-7.071L12 5z" /></svg>;
const StockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const ContractIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SidebarDollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m-4 0H8v1m4-1v-1m-4 5v1m-2-4h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" /></svg>;
const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.586a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const UnitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3" /></svg>;
const HeadsetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
    </svg>
);
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const QRCodeIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m0 11v1m4-12h1m-1 10h1m-5-5h1m-4 0h1m4 4h1m-4 0h1m1-10V4m0 10V4m0 10v1m0-11V4m0 10V4m0 10v1m0-11V4m0 10V4m0 10v1m0-11V4m0 10V4m0 10v1" /><path d="M5 5h3v3H5V5zm0 7h3v3H5v-3zM12 5h3v3h-3V5zm0 7h3v3h-3v-3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h8v8H3V3zm9 0h8v8h-8V3zM3 12h8v8H3v-8z" /></svg>;


// --- Notification System ---
type NotificationType = 'info' | 'success' | 'warning';
interface Notification {
    id: number;
    message: string;
    type: NotificationType;
    read: boolean;
    timestamp: Date;
    isFadingOut?: boolean;
}

interface Unit {
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
}


interface Appointment {
    id: number;
    professionalId: number;
    clientId: number;
    date: string;
    time: string;
    service: string;
    status: 'Agendado' | 'Em Espera' | 'Atendido';
}

interface Campaign {
    id: number;
    name: string;
    targetAudience: string[];
    messageType: 'texto' | 'imagem' | 'audio' | 'arquivo';
    messageText: string;
    scheduleDate: string;
    scheduleSettings?: Schedule[];
    status: 'Agendada' | 'Em Andamento' | 'Concluída';
    stats: {
        alcance: number;
        conversoes: number;
        receita: number;
    };
    file?: {
        name: string;
        url?: string;
    };
    minDelay?: number;
    maxDelay?: number;
    sendLimit?: number;
    archived?: boolean;
    phoneNumber?: string;
    unitName?: string;
}

interface AcquisitionChannel {
    id: number;
    name: string;
    duration: string;
    clients: number;
    suspended?: boolean;
    archived?: boolean;
    unitName?: string;
}

interface Promotion {
    id: number;
    type?: 'standard' | 'exclusive';
    callToAction: string;    // Chamada
    title: string;          // Título da Promoção
    subtitle?: string;      // Subtítulo da Promoção
    description: string;    // Descrição
    image: string;          // Imagem da Promoção
    mobileImage?: string;   // Banner Mobile
    promotionUrl: string;   // URL da Promoção
    targetArea: 'client' | 'painel'; // Área de Exibição
    actionButton: string;   // Botão: chamada para ação
    duration: number; // em dias
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    imageFile?: File; // campo para upload
    clicks?: number; // contador de cliques

    profileTarget?: string;
    locationCountry?: string;
    locationState?: string;
    locationCity?: string;
    locationNeighborhood?: string;
}

interface MonthlyPackage {
    id: number;
    name: string;
    price: number;
    description?: string;
    duration?: number;
    isActive?: boolean;
    usageType?: string;
    createdAt?: string;
}

interface PackageSubscription {
    id: number;
    clientName: string;
    address: string;
    phone: string;
    email: string;
    responsible: string;
    packageId: number;
    packageName: string;
    packagePrice: number;
    displayDuration: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    imageFile?: File;
    clicks?: number;
    profileTarget?: string;
    locationCountry?: string;
    locationState?: string;
    locationCity?: string;
    locationNeighborhood?: string; // cliques no anúncio
    status?: 'active' | 'expired' | 'archived'; // status detalhado
    archivedAt?: string; // data de arquivamento
    lastModified?: string; // última modificação
    paymentHistory?: PaymentRecord[]; // histórico de pagamentos
    notes?: string; // observações
}

interface PaymentRecord {
    id: number;
    date: string;
    amount: number;
    method: 'credit_card' | 'pix' | 'cash' | 'bank_transfer';
    status: 'paid' | 'pending' | 'overdue';
    description: string;
    installmentNumber?: number; // número da parcela
}

interface ExclusivePromotion {
    id: number;
    title: string;
    subtitle?: string;       // Subtítulo da Promoção Exclusiva
    callToAction: string;   // Chamada
    description: string;
    bannerImage: string;
    mobileImage?: string;   // Suporte mobile
    bannerLink: string;
    actionButton: string;    // Botão: chamada para ação
    startDate: string;      // Data de início
    endDate: string;        // Data de fim
    isActive: boolean;
    createdAt: string;
    bannerFile?: File; // campo para upload do banner
    clicks?: number;
    profileTarget?: string;
    locationCountry?: string;
    locationState?: string;
    locationCity?: string;
    locationNeighborhood?: string; // contador de cliques
}



interface DashboardProps {
    goBack: () => void;
    navigate: (page: string) => void;
    // ..
    currentUser: User | null;
    onActivateAI: (plan: 'Básico' | 'Avançada' | null) => void;
    activeAIAgent: 'Básico' | 'Avançada' | null;
    onLogout: () => void;
    onPayInstallment: (planName: 'Individual' | 'Empresa' | 'Vitalício' | 'Empresa Essencial' | 'Empresa Pro' | 'Empresa Premium') => void;
    // Auth context data for role-based UI
    isSuperAdmin?: boolean;
    planFeatures?: {
        ai_voice_response: boolean;
        priority_support: boolean;
        whatsapp_integration: boolean;
        financial_reports: boolean;
        marketing_campaigns: boolean;
    } | null;
    selectedUnit: string;
    onUnitChange: (unit: string) => void;
    allData: any;
    setAllData: React.Dispatch<React.SetStateAction<any>>;
    users: User[];
    onUsersChange: (users: User[]) => void;
    onSuspendAcquisitionChannel: (channelId: number, channelName: string, isSuspended?: boolean) => void;
    onArchiveAcquisitionChannel: (channelId: number, channelName: string) => void;
    onUnarchiveAcquisitionChannel: (channelId: number, channelName: string) => void;
    onChannelsChange: (updatedItems: any[]) => void;
    onSaveProduct: (product: any) => void;
    onDeleteProduct: (id: number) => void;
    onSuspendProduct: (id: number) => void;
    onUpdateProductQuantity: (productId: number, change: number) => void;
    onProductsChange: (products: any[]) => void;
    onSuspendProfessional: (id: number) => void;
    onArchiveProfessional: (id: number) => void;
    onProfessionalsChange: (professionals: any[]) => void;
    onComingSoon?: (featureName: string) => void;
}

// FIX: Define rolePermissions constant, as it was missing and causing initialization errors.
const rolePermissions: { [key: string]: { [key: string]: PermissionDetails } } = {
    Administrador: { dashboard: { create: true, view: true, delete: true, export: true }, agenda: { create: true, view: true, delete: true, export: true }, minhaAgenda: { create: true, view: true, delete: true, export: true }, clientes: { create: true, view: true, delete: true, export: true }, crm: { create: true, view: true, delete: true, export: true }, contratos: { create: true, view: true, delete: true, export: true }, financeiro: { create: true, view: true, delete: true, export: true }, estoque: { create: true, view: true, delete: true, export: true }, servicos: { create: true, view: true, delete: true, export: true }, profissionais: { create: true, view: true, delete: true, export: true }, configuracoes: { create: true, view: true, delete: true, export: true }, usuarios: { create: true, view: true, delete: true, export: true }, registroPonto: { create: true, view: true, delete: true, export: true }, relatorio: { create: true, view: true, delete: true, export: true }, chat: { create: true, view: true, delete: true, export: true }, clientApp: { view: true, create: false, delete: false, export: false } },
    Gerente: { dashboard: { create: true, view: true, delete: false, export: true }, agenda: { create: true, view: true, delete: true, export: true }, minhaAgenda: { create: true, view: true, delete: true, export: true }, clientes: { create: true, view: true, delete: true, export: true }, crm: { create: true, view: true, delete: false, export: true }, contratos: { create: true, view: true, delete: true, export: true }, financeiro: { create: false, view: true, delete: false, export: true }, estoque: { create: true, view: true, delete: true, export: true }, servicos: { create: true, view: true, delete: true, export: true }, profissionais: { create: true, view: true, delete: true, export: true }, configuracoes: { create: false, view: false, delete: false, export: false }, usuarios: { create: false, view: false, delete: false, export: false }, registroPonto: { create: true, view: true, delete: true, export: true }, relatorio: { create: true, view: true, delete: false, export: true }, chat: { create: true, view: true, delete: true, export: true } },
    Profissional: { dashboard: { create: false, view: false, delete: false, export: false }, agenda: { create: false, view: false, delete: false, export: false }, minhaAgenda: { create: true, view: true, delete: false, export: true }, clientes: { create: true, view: true, delete: false, export: true }, crm: { create: false, view: true, delete: false, export: false }, contratos: { create: false, view: false, delete: false, export: false }, financeiro: { create: false, view: false, delete: false, export: false }, estoque: { create: false, view: false, delete: false, export: false }, servicos: { create: false, view: false, delete: false, export: false }, profissionais: { create: false, view: false, delete: false, export: false }, configuracoes: { create: false, view: false, delete: false, export: false }, usuarios: { create: false, view: false, delete: false, export: false }, registroPonto: { create: true, view: true, delete: false, export: false }, relatorio: { create: false, view: false, delete: false, export: false }, chat: { create: false, view: false, delete: false, export: false } },
    Concierge: { dashboard: { create: false, view: true, delete: false, export: false }, agenda: { create: true, view: true, delete: false, export: true }, minhaAgenda: { create: false, view: false, delete: false, export: false }, clientes: { create: true, view: true, delete: false, export: true }, crm: { create: false, view: true, delete: false, export: false }, contratos: { create: false, view: false, delete: false, export: false }, financeiro: { create: false, view: false, delete: false, export: false }, estoque: { create: false, view: false, delete: false, export: false }, servicos: { create: false, view: false, delete: false, export: false }, profissionais: { create: false, view: false, delete: false, export: false }, configuracoes: { create: false, view: false, delete: false, export: false }, usuarios: { create: false, view: false, delete: false, export: false }, registroPonto: { create: true, view: true, delete: false, export: false }, relatorio: { create: false, view: false, delete: false, export: false }, chat: { create: true, view: true, delete: true, export: true } },
    admin: { dashboard: { create: true, view: true, delete: true, export: true }, agenda: { create: true, view: true, delete: true, export: true }, minhaAgenda: { create: true, view: true, delete: true, export: true }, clientes: { create: true, view: true, delete: true, export: true }, crm: { create: true, view: true, delete: true, export: true }, contratos: { create: true, view: true, delete: true, export: true }, financeiro: { create: true, view: true, delete: true, export: true }, estoque: { create: true, view: true, delete: true, export: true }, servicos: { create: true, view: true, delete: true, export: true }, profissionais: { create: true, view: true, delete: true, export: true }, configuracoes: { create: true, view: true, delete: true, export: true }, usuarios: { create: true, view: true, delete: true, export: true }, registroPonto: { create: true, view: true, delete: true, export: true }, relatorio: { create: true, view: true, delete: true, export: true }, chat: { create: true, view: true, delete: true, export: true }, clientApp: { view: true, create: false, delete: false, export: false } },
};


const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; description?: string; }> = ({ title, value, icon, color, description }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4 transform transition-transform hover:-translate-y-1">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-secondary">{value}</p>
            {description && <p className="text-[10px] text-gray-400 mt-1 leading-tight">{description}</p>}
        </div>
    </div>
);

const PerformanceChart: React.FC<{ data: any, labels: string[], period: 'hoje' | 'semana' | 'mes' | 'anual' }> = ({ data, labels, period }) => {
    if (!data || labels.length === 0) return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-secondary mb-4">Desempenho Geral</h2>
            <div className="h-80 bg-light p-4 rounded-lg flex items-center justify-center text-gray-500">
                Nenhum dado disponível para o período selecionado.
            </div>
        </div>
    );

    const clientMetricName = period === 'hoje' ? 'Clientes Hoje' : 'Novos Clientes';

    const metrics = [
        { key: 'faturamento', name: 'Faturamento', color: 'bg-green-500' },
        { key: 'atendimentos', name: 'Atendimentos', color: 'bg-blue-500' },
        { key: 'agendamentos', name: 'Agendamentos', color: 'bg-indigo-500' },
        { key: 'ticketMedio', name: 'Ticket Médio', color: 'bg-yellow-500' },
        { key: 'clientes', name: clientMetricName, color: 'bg-purple-500' },
    ];

    // Calculate max per metric for individual normalization
    const metricMaxes: { [key: string]: number } = {};
    metrics.forEach(m => {
        metricMaxes[m.key] = Math.max(...(data[m.key] || [0]), 1);
    });

    // Calculate height for each bar: normalize within its own metric group
    const getBarHeight = (metricKey: string, index: number) => {
        const value = data[metricKey]?.[index] || 0;
        const max = metricMaxes[metricKey];
        if (value === 0) return '0%';
        // Minimum 10% height for visibility, max 100%
        const percentage = Math.max((value / max) * 100, 10);
        return `${percentage}%`;
    };

    const formatValue = (metricKey: string, value: number) => {
        if (metricKey === 'faturamento' || metricKey === 'ticketMedio') {
            return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        return value.toString();
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-secondary mb-4">
                Desempenho Geral
            </h2>
            <div className="h-80 bg-light p-4 rounded-lg flex items-end justify-around gap-4">
                {labels.map((label, index) => (
                    <div key={label} className="flex-1 flex flex-col items-center h-full">
                        <div className="w-full h-full flex items-end justify-center gap-1">
                            {metrics.map(metric => (
                                <div
                                    key={metric.key}
                                    className={`w-2 rounded-t-md transition-all duration-300 hover:opacity-80 ${metric.color}`}
                                    style={{ height: getBarHeight(metric.key, index) }}
                                    title={`${metric.name}: ${formatValue(metric.key, data[metric.key]?.[index] || 0)}`}
                                ></div>
                            ))}
                        </div>
                        <span className="text-xs font-semibold text-gray-500 mt-2">{label}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center flex-wrap mt-4 gap-x-4 gap-y-2">
                {metrics.map(metric => (
                    <div key={metric.key} className="flex items-center text-sm text-gray-600">
                        <span className={`w-3 h-3 rounded-full mr-2 ${metric.color}`}></span>
                        <span>{metric.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// DashboardPromoCarousel removed (imported from component)

// --- Promoções Component ---

const ServicesChart: React.FC<{ data: any; topServices?: any[] }> = ({ data, topServices }) => {
    if (!data || !data.datasets || !topServices) return null;

    const colors = ['#10b981', '#34d399', '#6ee7b7'];
    const serviceNames = topServices.map(s => s.name);

    const chartDatasets = data.datasets.filter((d: any) => serviceNames.includes(d.service));

    const maxDataValue = Math.max(...chartDatasets.flatMap((d: any) => d.data), 1);

    return (
        <div className="mt-6">
            <div className="h-64 bg-light p-4 rounded-lg flex items-end justify-around gap-4 transition-all duration-500">
                {data.labels.map((label: string, index: number) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full h-full flex items-end justify-center gap-1">
                            {chartDatasets.map((dataset: any, dIndex: number) => (
                                <div
                                    key={dIndex}
                                    className={`w-1/3 rounded-t-md transition-all duration-300 ${colors[dIndex % colors.length]}`}
                                    style={{ height: `${(dataset.data[index] / maxDataValue) * 100}%` }}
                                    title={`${dataset.service}: ${dataset.data[index]}`}
                                ></div>
                            ))}
                        </div>
                        <span className="text-xs text-gray-500 mt-2">{label}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center mt-4 space-x-4">
                {chartDatasets.map((dataset: any, index: number) => (
                    <div key={index} className="flex items-center text-sm">
                        <span className={`w-3 h-3 rounded-full mr-2 ${colors[index % colors.length]}`}></span>
                        <span>{dataset.service}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex">
        {[...Array(5)].map((_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const PlaceholderComponent: React.FC<{ title: string; onBack?: () => void; }> = ({ title, onBack }) => (
    <div className="container mx-auto px-6 py-8">
        {onBack && (
            <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Voltar ao Dashboard
            </button>
        )}
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <h1 className="text-3xl font-bold text-secondary">{title}</h1>
            <p className="mt-4 text-gray-600">Funcionalidade em desenvolvimento. O conteúdo para {title} estará disponível em breve.</p>
        </div>
    </div>
);




const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + (Math.floor(interval) > 1 ? " anos atrás" : " ano atrás");
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + (Math.floor(interval) > 1 ? " meses atrás" : " mês atrás");
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + "d atrás";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + "h atrás";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " min atrás";
    }
    return "agora mesmo";
};

// --- Promoções Component ---
interface PromotionsPageProps {
    promotions: Promotion[];
    onSavePromotion: (promotion: Promotion) => void;
    onDeletePromotion: (id: number) => void;
    onTogglePromotion: (id: number) => void;
    onOpenPromoModal: (promotion?: Promotion) => void;
    isPromoModalOpen: boolean;
    onClosePromoModal: () => void;
    editingPromotion: Promotion | null;
}

const PromotionsPage: React.FC<PromotionsPageProps> = ({
    promotions,
    onSavePromotion,
    onDeletePromotion,
    onTogglePromotion,
    onOpenPromoModal,
    isPromoModalOpen,
    onClosePromoModal,
    editingPromotion
}) => {
    const { t } = useLanguage();
    const [view, setView] = useState<'active' | 'archived'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
    const [mobileImagePreviewUrl, setMobileImagePreviewUrl] = useState<string | null>(null);
    const [viewPhoto, setViewPhoto] = useState<string | null>(null);


    const videoRef = useRef<HTMLVideoElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const activePromotions = promotions.filter(p => p.isActive);
    const archivedPromotions = promotions.filter(p => !p.isActive);
    const promotionsInView = view === 'active' ? activePromotions : archivedPromotions;

    const filteredPromotions = promotionsInView.filter(promotion =>
        promotion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        promotion.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (promotion.salonName && promotion.salonName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (promotion.targetArea && promotion.targetArea.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        if (!isPromoModalOpen) {
            setImageFile(null);
            setImagePreviewUrl(null);
            setMobileImageFile(null);
            setMobileImagePreviewUrl(null);
        }
    }, [isPromoModalOpen]);


    const handleFileSelect = (selectedFile: File | null) => {
        setImageFile(selectedFile);
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreviewUrl(event.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setImagePreviewUrl(null);
        }
    };

    const handleMobileFileSelect = (selectedFile: File | null) => {
        setMobileImageFile(selectedFile);
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setMobileImagePreviewUrl(event.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setMobileImagePreviewUrl(null);
        }
    };


    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-secondary">Promoções</h2>
                    <p className="text-sm text-gray-500">Crie e gerencie suas promoções para clientes e painel</p>
                </div>
                <button
                    onClick={() => onOpenPromoModal()}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg inline-flex items-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                >
                    + Nova Promoção
                </button>
            </div>

            <div className="my-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por nome ou descrição..."
                    className="w-full p-2 pl-4 border border-gray-300 rounded-lg shadow-sm"
                />
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    <button
                        onClick={() => setView('active')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${view === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Ativas ({activePromotions.length})
                    </button>
                    <button
                        onClick={() => setView('archived')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${view === 'archived' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Arquivadas ({archivedPromotions.length})
                    </button>
                </nav>
            </div>

            {filteredPromotions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {filteredPromotions.map((promotion) => (
                        <div key={promotion.id} className="bg-white p-5 rounded-xl shadow-lg border border-transparent hover:border-primary transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${promotion.targetArea === 'client'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-purple-100 text-purple-700'
                                    }`}>
                                    {promotion.targetArea === 'client' ? 'Área Cliente' : 'Painel'}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onOpenPromoModal(promotion)}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => onDeletePromotion(promotion.id)}
                                        className="text-sm font-semibold text-red-600 hover:text-red-800"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>

                            <img
                                src={promotion.image}
                                alt={promotion.title}
                                className="w-full h-32 object-cover rounded-lg mb-3"
                            />

                            <h3 className="font-bold text-lg text-secondary mb-2">{promotion.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{promotion.description}</p>

                            <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                <span>📅 {new Date(promotion.startDate).toLocaleDateString('pt-BR')} - {new Date(promotion.endDate).toLocaleDateString('pt-BR')}</span>
                                <span>⏱️ {promotion.duration} dias</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium px-2 py-1 rounded ${promotion.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {promotion.isActive ? 'Ativa' : 'Inativa'}
                                </span>
                                <button
                                    onClick={() => onTogglePromotion(promotion.id)}
                                    className={`text-xs font-medium px-3 py-1 rounded transition-colors ${promotion.isActive
                                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                >
                                    {promotion.isActive ? 'Pausar' : 'Ativar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-light rounded-lg mt-6">
                    <p className="text-gray-500">
                        {searchQuery ? 'Nenhuma promoção encontrada para esta busca.' : 'Nenhuma promoção encontrada.'}
                    </p>
                </div>
            )}

            {/* Modal de Promoções */}
            {isPromoModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
                                </h2>
                                <button
                                    onClick={onClosePromoModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);

                                // Gerar URL temporária para imagem (em produção, usar upload real)
                                let imageUrl = editingPromotion?.image || '';
                                if (imageFile) {
                                    // Criar URL temporária base64 (em produção, integrar com serviço de upload)
                                    imageUrl = `data:image/jpeg;base64,${imagePreviewUrl?.split(',')[1] || ''}`;
                                } else if (formData.get('imageUrl')) {
                                    imageUrl = formData.get('imageUrl') as string;
                                }

                                let mobileImageUrl = editingPromotion?.mobileImage || '';
                                if (mobileImageFile) {
                                    mobileImageUrl = `data:image/jpeg;base64,${mobileImagePreviewUrl?.split(',')[1] || ''}`;
                                }

                                const promotion: Promotion = {
                                    id: editingPromotion?.id || Date.now(),
                                    callToAction: formData.get('callToAction') as string,
                                    title: formData.get('title') as string,
                                    description: formData.get('description') as string,
                                    image: imageUrl,
                                    mobileImage: mobileImageUrl,
                                    promotionUrl: formData.get('promotionUrl') as string || '',
                                    targetArea: formData.get('targetArea') as 'client' | 'painel',
                                    profileTarget: formData.get('profileTarget') as string,
                                    locationCountry: formData.get('locationCountry') as string,
                                    locationState: formData.get('locationState') as string,
                                    locationCity: formData.get('locationCity') as string,
                                    locationNeighborhood: formData.get('locationNeighborhood') as string,
                                    actionButton: formData.get('actionButton') as string,
                                    duration: editingPromotion?.duration || 7, // valor padrão
                                    startDate: formData.get('startDate') as string,
                                    endDate: formData.get('endDate') as string,
                                    isActive: editingPromotion?.isActive ?? true,
                                    createdAt: editingPromotion?.createdAt || new Date().toISOString()
                                };
                                onSavePromotion(promotion);

                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chamada</label>
                                    <input
                                        name="callToAction"
                                        type="text"
                                        required
                                        defaultValue={editingPromotion?.callToAction || ''}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                        placeholder="Ex: Oferta Limitada!"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Título da Promoção</label>
                                    <input
                                        name="title"
                                        type="text"
                                        required
                                        defaultValue={editingPromotion?.title || ''}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                        placeholder="Ex: 20% OFF em Cortes Masculinos"
                                    />
                                </div>

                                {/* Subtitle removed as requested */}


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Botão: chamada para ação</label>
                                    <input
                                        name="actionButton"
                                        type="text"
                                        required
                                        defaultValue={editingPromotion?.actionButton || ''}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                        placeholder="Ex: Comprar Agora, Saiba Mais"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Exibição</label>
                                    <select
                                        name="profileTarget"
                                        defaultValue={editingPromotion?.profileTarget || ''}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">Todos os segmentos</option>
                                        <option value="salao_beleza">Salão de Beleza</option>
                                        <option value="bem_estar">Bem-estar e estética</option>
                                        <option value="estudio_beleza">Estúdio de beleza</option>
                                        <option value="podologia">Podologia</option>
                                        <option value="barbearia">Barbearia</option>
                                        <option value="esmaltaria">Esmaltaria</option>
                                        <option value="outros">Outros segmentos</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={3}
                                        defaultValue={editingPromotion?.description || ''}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                        placeholder="Descreva os detalhes da promoção..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Área de Exibição</label>
                                    <select
                                        name="targetArea"
                                        required
                                        defaultValue={editingPromotion?.targetArea || 'painel'}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                    >
                                        <option value="painel">Painel de Controle</option>
                                        <option value="client">Área do Cliente</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Local de Exibição</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">País</label>
                                            <select name="locationCountry" className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" defaultValue={editingPromotion?.locationCountry || ''}>
                                                <option value="">Todos</option>
                                                <option value="BR">Brasil</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Estado</label>
                                            <input
                                                name="locationState"
                                                type="text"
                                                placeholder="Ex: SP"
                                                defaultValue={editingPromotion?.locationState || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                                            <input
                                                name="locationCity"
                                                type="text"
                                                placeholder="Ex: São Paulo"
                                                defaultValue={editingPromotion?.locationCity || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Bairro</label>
                                            <input
                                                name="locationNeighborhood"
                                                type="text"
                                                placeholder="Ex: Jardins"
                                                defaultValue={editingPromotion?.locationNeighborhood || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Banner Desktop</label>
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${imageFile ? 'border-primary bg-primary/10' : 'border-gray-300'
                                                }`}
                                        >
                                            {imagePreviewUrl || editingPromotion?.image ? (
                                                <div className="text-center relative">
                                                    <img
                                                        src={imagePreviewUrl || editingPromotion?.image}
                                                        alt="Preview"
                                                        className="mx-auto max-h-40 rounded-md shadow-md"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleFileSelect(null); }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold"
                                                    >
                                                        ×
                                                    </button>
                                                    <p className="text-xs text-gray-600 mt-2 truncate max-w-xs">{imageFile?.name || 'Imagem atual'}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1 text-center">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4M8 32l9.172-9.172a4 4 0 015.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <div className="flex text-sm text-gray-600">
                                                        <p className="pl-1">Desktop</p>
                                                    </div>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                onChange={e => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                                                accept="image/*"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Banner Mobile</label>
                                        <div
                                            onClick={() => {
                                                const mobileInput = document.createElement('input');
                                                mobileInput.type = 'file';
                                                mobileInput.accept = 'image/*';
                                                mobileInput.onchange = (e) => {
                                                    const file = (e.target as HTMLInputElement).files?.[0];
                                                    if (file) handleMobileFileSelect(file);
                                                };
                                                mobileInput.click();
                                            }}
                                            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${mobileImageFile ? 'border-primary bg-primary/10' : 'border-gray-300'
                                                }`}
                                        >
                                            {mobileImagePreviewUrl || editingPromotion?.mobileImage ? (
                                                <div className="text-center relative">
                                                    <img
                                                        src={mobileImagePreviewUrl || editingPromotion?.mobileImage}
                                                        alt="Mobile Preview"
                                                        className="mx-auto max-h-40 rounded-md shadow-md"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleMobileFileSelect(null); }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-1 text-center">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    <p className="text-sm text-gray-600">Mobile</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link da Campanha</label>
                                    <input
                                        name="promotionUrl"
                                        type="url"
                                        defaultValue={editingPromotion?.promotionUrl || ''}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                        placeholder="https://exemplo.com/promocao"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data da Promoção. início e fim</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                                            <input
                                                name="startDate"
                                                type="date"
                                                required
                                                defaultValue={editingPromotion?.startDate || new Date().toISOString().split('T')[0]}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                                            <input
                                                name="endDate"
                                                type="date"
                                                required
                                                defaultValue={editingPromotion?.endDate || new Date().toISOString().split('T')[0]}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={onClosePromoModal}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                                    >
                                        {editingPromotion ? 'Salvar Alterações' : 'Criar Promoção'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Exclusive Promotions Component ---
const ExclusivePromotionsPage: React.FC<{
    exclusivePromotions: ExclusivePromotion[];
    onSaveExclusive: (exclusive: ExclusivePromotion) => void;
    onDeleteExclusive: (id: number) => void;
    onToggleExclusive: (id: number) => void;
    onOpenExclusiveModal: (exclusive?: ExclusivePromotion) => void;
    isExclusiveModalOpen: boolean;
    onCloseExclusiveModal: () => void;
    editingExclusive: ExclusivePromotion | null;
    onExclusiveClick: (promotionId: number, bannerLink?: string) => void;
}> = ({
    exclusivePromotions,
    onSaveExclusive,
    onDeleteExclusive,
    onToggleExclusive,
    onOpenExclusiveModal,
    isExclusiveModalOpen,
    onCloseExclusiveModal,
    editingExclusive,
    onExclusiveClick
}) => {
        const [bannerFile, setBannerFile] = useState<File | null>(null);
        const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
        const [mobileBannerFile, setMobileBannerFile] = useState<File | null>(null);
        const [mobileBannerPreviewUrl, setMobileBannerPreviewUrl] = useState<string | null>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);


        const handleBannerSelect = (selectedFile: File | null) => {
            setBannerFile(selectedFile);
            if (selectedFile) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setBannerPreviewUrl(event.target?.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setBannerPreviewUrl(null);
            }
        };

        const handleMobileBannerSelect = (selectedFile: File | null) => {
            setMobileBannerFile(selectedFile);
            if (selectedFile) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setMobileBannerPreviewUrl(event.target?.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setMobileBannerPreviewUrl(null);
            }
        };


        useEffect(() => {
            if (!isExclusiveModalOpen) {
                setBannerFile(null);
                setBannerPreviewUrl(null);
                setMobileBannerFile(null);
                setMobileBannerPreviewUrl(null);
            }
        }, [isExclusiveModalOpen]);


        return (
            <div className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-secondary">Promoções</h2>
                        <p className="text-sm text-gray-500">Gerencie promoções para seus clientes</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => onOpenExclusiveModal()}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-lg inline-flex items-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                        >
                            + Nova Exclusiva
                        </button>
                    </div>
                </div>

                {/* Campo de Filtro */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Filtrar por nome ou descrição..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Abas de Status */}
                <div className="flex gap-6 mb-6 border-b border-gray-200">
                    <button className="pb-3 px-1 border-b-2 border-primary text-primary font-medium">
                        Ativas (0)
                    </button>
                    <button className="pb-3 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium">
                        Arquivadas (0)
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {exclusivePromotions.map((exclusive) => (
                        <div key={exclusive.id} className="bg-white p-5 rounded-xl shadow-lg border border-transparent hover:border-primary transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                        Exclusiva
                                    </span>
                                    <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 mt-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {exclusive.clicks || 0} cliques
                                    </div>
                                </div>
                                <div className="flex gap-2 transition-opacity">
                                    <button
                                        onClick={() => onOpenExclusiveModal(exclusive)}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => onDeleteExclusive(exclusive.id)}
                                        className="text-sm font-semibold text-red-600 hover:text-red-800"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>

                            <img
                                src={exclusive.bannerImage}
                                alt={exclusive.title}
                                className="w-full h-40 object-cover rounded-lg mb-3"
                            />

                            <h3 className="font-bold text-lg text-secondary mb-2">{exclusive.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{exclusive.description}</p>

                            <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                <span>📅 {new Date(exclusive.startDate).toLocaleDateString('pt-BR')} até {new Date(exclusive.endDate).toLocaleDateString('pt-BR')}</span>
                                <button
                                    onClick={() => onExclusiveClick(exclusive.id, exclusive.bannerLink)}
                                    className="text-primary hover:text-primary/80 font-medium underline"
                                >
                                    Ver Promoção →
                                </button>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium px-2 py-1 rounded ${exclusive.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {exclusive.isActive ? 'Ativa' : 'Inativa'}
                                </span>
                                <button
                                    onClick={() => onToggleExclusive(exclusive.id)}
                                    className={`text-xs font-medium px-3 py-1 rounded transition-colors ${exclusive.isActive
                                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                >
                                    {exclusive.isActive ? 'Pausar' : 'Ativar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal */}
                {isExclusiveModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        {editingExclusive ? 'Editar Promoção Exclusiva' : 'Nova Exclusiva'}
                                    </h2>
                                    <button onClick={onCloseExclusiveModal} className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);

                                    let bannerImageUrl = editingExclusive?.bannerImage || '';
                                    if (bannerFile) {
                                        bannerImageUrl = `data:image/jpeg;base64,${bannerPreviewUrl?.split(',')[1] || ''}`;
                                    } else if (formData.get('bannerImage')) {
                                        bannerImageUrl = formData.get('bannerImage') as string;
                                    }

                                    let mobileBannerUrl = editingExclusive?.mobileImage || '';
                                    if (mobileBannerFile) {
                                        mobileBannerUrl = `data:image/jpeg;base64,${mobileBannerPreviewUrl?.split(',')[1] || ''}`;
                                    } else if (formData.get('mobileBannerUrl')) {
                                        mobileBannerUrl = formData.get('mobileBannerUrl') as string;
                                    }

                                    const exclusive: ExclusivePromotion = {
                                        id: editingExclusive?.id || Date.now(),
                                        title: formData.get('title') as string,
                                        callToAction: formData.get('callToAction') as string,
                                        description: formData.get('description') as string,
                                        bannerImage: bannerImageUrl,
                                        mobileImage: mobileBannerUrl,
                                        bannerLink: formData.get('bannerLink') as string,
                                        profileTarget: formData.get('profileTarget') as string,
                                        locationCountry: formData.get('locationCountry') as string,
                                        locationState: formData.get('locationState') as string,
                                        locationCity: formData.get('locationCity') as string,
                                        locationNeighborhood: formData.get('locationNeighborhood') as string,
                                        actionButton: formData.get('actionButton') as string,
                                        startDate: formData.get('startDate') as string,
                                        endDate: formData.get('endDate') as string,
                                        isActive: editingExclusive?.isActive ?? true,
                                        createdAt: editingExclusive?.createdAt || new Date().toISOString()
                                    };

                                    onSaveExclusive(exclusive);
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chamada</label>
                                        <input
                                            name="callToAction"
                                            type="text"
                                            required
                                            defaultValue={editingExclusive?.callToAction || ''}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                            placeholder="Texto de chamada para a promoção"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Título da Promoção Exclusiva</label>
                                        <input
                                            name="title"
                                            type="text"
                                            required
                                            defaultValue={editingExclusive?.title || ''}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                            placeholder="Título da promoção exclusiva"
                                        />
                                    </div>

                                    {/* Subtitle removed as requested */}


                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                        <textarea
                                            name="description"
                                            required
                                            rows={3}
                                            defaultValue={editingExclusive?.description || ''}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                            placeholder="Descreva os detalhes da promoção exclusiva..."
                                        />
                                    </div>



                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Botão: chamada para ação</label>
                                        <input
                                            name="actionButton"
                                            type="text"
                                            required
                                            defaultValue={editingExclusive?.actionButton || ''}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                            placeholder="Texto do botão de chamada para ação"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Exibição</label>
                                        <select
                                            name="profileTarget"
                                            defaultValue={editingExclusive?.profileTarget || ''}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Todos os segmentos</option>
                                            <option value="salao_beleza">Salão de Beleza</option>
                                            <option value="bem_estar">Bem-estar e estética</option>
                                            <option value="estudio_beleza">Estúdio de beleza</option>
                                            <option value="podologia">Podologia</option>
                                            <option value="barbearia">Barbearia</option>
                                            <option value="esmaltaria">Esmaltaria</option>
                                            <option value="outros">Outros segmentos</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Local de Exibição</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">País</label>
                                                <select name="locationCountry" className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" defaultValue={editingExclusive?.locationCountry || ''}>
                                                    <option value="">Todos</option>
                                                    <option value="BR">Brasil</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Estado</label>
                                                <input
                                                    name="locationState"
                                                    type="text"
                                                    placeholder="Ex: SP"
                                                    defaultValue={editingExclusive?.locationState || ''}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                                                <input
                                                    name="locationCity"
                                                    type="text"
                                                    placeholder="Ex: São Paulo"
                                                    defaultValue={editingExclusive?.locationCity || ''}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Bairro</label>
                                                <input
                                                    name="locationNeighborhood"
                                                    type="text"
                                                    placeholder="Ex: Jardins"
                                                    defaultValue={editingExclusive?.locationNeighborhood || ''}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Desktop</label>
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${bannerFile ? 'border-primary bg-primary/10' : 'border-gray-300'
                                                    }`}
                                            >
                                                {bannerPreviewUrl || editingExclusive?.bannerImage ? (
                                                    <div className="text-center relative">
                                                        <img
                                                            src={bannerPreviewUrl || editingExclusive?.bannerImage}
                                                            alt="Preview"
                                                            className="mx-auto max-h-40 rounded-md shadow-md"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setBannerFile(null); }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1 text-center">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4M8 32l9.172-9.172a4 4 0 015.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        <p className="text-sm text-gray-600">Desktop</p>
                                                    </div>
                                                )}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    className="hidden"
                                                    onChange={e => handleBannerSelect(e.target.files ? e.target.files[0] : null)}
                                                    accept="image/*"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Mobile</label>
                                            <div
                                                onClick={() => {
                                                    const mobileInput = document.createElement('input');
                                                    mobileInput.type = 'file';
                                                    mobileInput.accept = 'image/*';
                                                    mobileInput.onchange = (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0];
                                                        if (file) handleMobileBannerSelect(file);
                                                    };
                                                    mobileInput.click();
                                                }}
                                                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${mobileBannerFile ? 'border-primary bg-primary/10' : 'border-gray-300'
                                                    }`}
                                            >
                                                {mobileBannerPreviewUrl || editingExclusive?.mobileImage ? (
                                                    <div className="text-center relative">
                                                        <img
                                                            src={mobileBannerPreviewUrl || editingExclusive?.mobileImage}
                                                            alt="Mobile Preview"
                                                            className="mx-auto max-h-40 rounded-md shadow-md"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setMobileBannerFile(null); }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1 text-center">
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                        <p className="text-sm text-gray-600">Mobile</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>


                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Link da Campanha</label>
                                        <input
                                            name="bannerLink"
                                            type="url"
                                            required
                                            defaultValue={editingExclusive?.bannerLink || ''}
                                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                            placeholder="https://exemplo.com/promocao"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Data da Promoção Exclusiva. início e fim</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Data de Início</label>
                                                <input
                                                    name="startDate"
                                                    type="date"
                                                    required
                                                    defaultValue={editingExclusive?.startDate || new Date().toISOString().split('T')[0]}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Data de Fim</label>
                                                <input
                                                    name="endDate"
                                                    type="date"
                                                    required
                                                    defaultValue={editingExclusive?.endDate || new Date().toISOString().split('T')[0]}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={onCloseExclusiveModal}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                                        >
                                            {editingExclusive ? 'Salvar Alterações' : 'Criar Promoção Exclusiva'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

// --- Monthly Packages Component ---
const MonthlyPackagesPage: React.FC<{
    monthlyPackages: MonthlyPackage[];
    packageSubscriptions: PackageSubscription[];
    onSavePackage: (pkg: MonthlyPackage) => void;
    onDeletePackage: (id: number) => void;
    onTogglePackage: (id: number) => void;
    onOpenPackageModal: () => void;
    isPackageModalOpen: boolean;
    onClosePackageModal: () => void;
    editingPackage: MonthlyPackage | null;
    onSaveSubscription: (subscription: PackageSubscription) => void;
    onDeleteSubscription: (id: number) => void;
    onOpenSubscriptionModal: () => void;
    isSubscriptionModalOpen: boolean;
    onCloseSubscriptionModal: () => void;
    editingSubscription: PackageSubscription | null;
    // Props para promoções
    promotions: Promotion[];
    onSavePromotion: (promotion: Promotion) => void;
    onDeletePromotion: (id: number) => void;
    onTogglePromotion: (id: number) => void;
    onOpenPromoModal: (promotion?: Promotion) => void;
    isPromoModalOpen: boolean;
    onClosePromoModal: () => void;
    editingPromotion: Promotion | null;
    onPromotionClick: (promotionId: number, promotionUrl?: string) => void;
    // Props avançadas de assinaturas
    onViewSubscription: (subscription: PackageSubscription) => void;
    onArchiveSubscription: (id: number) => void;
    onUnarchiveSubscription: (id: number) => void;
    onAddPayment: (subscriptionId: number, payment: Omit<PaymentRecord, 'id'>) => void;
    onEditSubscriptionNotes: (id: number, notes: string) => void;
    onDownloadSubscriptionReport: (subscription: PackageSubscription) => void;
}> = ({
    monthlyPackages,
    packageSubscriptions,
    onSavePackage,
    onDeletePackage,
    onTogglePackage,
    onOpenPackageModal,
    isPackageModalOpen,
    onClosePackageModal,
    editingPackage,
    onSaveSubscription,
    onDeleteSubscription,
    onOpenSubscriptionModal,
    isSubscriptionModalOpen,
    onCloseSubscriptionModal,
    editingSubscription,
    // Props para promoções
    promotions,
    onSavePromotion,
    onDeletePromotion,
    onTogglePromotion,
    onOpenPromoModal,
    isPromoModalOpen,
    onClosePromoModal,
    editingPromotion,
    onPromotionClick,
    // Props avançadas de assinaturas
    onViewSubscription,
    onArchiveSubscription,
    onUnarchiveSubscription,
    onAddPayment,
    onEditSubscriptionNotes,
    onDownloadSubscriptionReport
}) => {
        const { t } = useLanguage();
        const [view, setView] = useState<'packages' | 'subscriptions' | 'promotions'>('packages');
        const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'archived'>('all');
        const [promoAreaFilter, setPromoAreaFilter] = useState<'all' | 'client' | 'painel'>('all');
        const [promoSearchTerm, setPromoSearchTerm] = useState('');
        const [promoCategoryFilter, setPromoCategoryFilter] = useState('all');

        const [imageFile, setImageFile] = useState<File | null>(null);
        const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
        const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
        const [mobileImagePreviewUrl, setMobileImagePreviewUrl] = useState<string | null>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);


        const handleFileSelect = (selectedFile: File | null) => {
            setImageFile(selectedFile);
            if (selectedFile) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setImagePreviewUrl(event.target?.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setImagePreviewUrl(null);
            }
        };

        const handleMobileFileSelect = (selectedFile: File | null) => {
            setMobileImageFile(selectedFile);
            if (selectedFile) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setMobileImagePreviewUrl(event.target?.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setMobileImagePreviewUrl(null);
            }
        };


        const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
        const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const files = e.dataTransfer.files;
            if (files && files.length > 0) handleFileSelect(files[0]);
        };

        useEffect(() => {
            if (!isPromoModalOpen) {
                setImageFile(null);
                setImagePreviewUrl(null);
                setMobileImageFile(null);
                setMobileImagePreviewUrl(null);
            }
        }, [isPromoModalOpen]);


        const activePackages = monthlyPackages.filter(p => p.isActive);
        const activeSubscriptions = packageSubscriptions.filter(s => s.isActive);
        const activePromotions = promotions.filter(p => p.isActive);
        const filteredPromotions = promotions.filter(p => {
            const matchesArea = promoAreaFilter === 'all' || p.targetArea === promoAreaFilter;
            const matchesSearch = !promoSearchTerm ||
                p.title.toLowerCase().includes(promoSearchTerm.toLowerCase()) ||
                (p.subtitle && p.subtitle.toLowerCase().includes(promoSearchTerm.toLowerCase())) ||
                (p.description && p.description.toLowerCase().includes(promoSearchTerm.toLowerCase()));
            const matchesCategory = promoCategoryFilter === 'all' || p.profileTarget === promoCategoryFilter;
            return matchesArea && matchesSearch && matchesCategory;
        });


        // Verificar assinaturas próximas ao vencimento (7 dias)
        const expiringSoonSubscriptions = packageSubscriptions.filter(subscription => {
            const endDate = new Date(subscription.endDate);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && subscription.isActive;
        });

        // Verificar assinaturas expiradas
        const expiredSubscriptions = packageSubscriptions.filter(subscription => {
            const endDate = new Date(subscription.endDate);
            const today = new Date();
            return endDate < today && subscription.isActive;
        });

        // Aplicar filtro às assinaturas
        const filteredSubscriptions = packageSubscriptions.filter(subscription => {
            const today = new Date();
            const endDate = new Date(subscription.endDate);
            const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            switch (subscriptionFilter) {
                case 'active':
                    return subscription.isActive && daysUntilExpiry > 7 && subscription.status !== 'archived';
                case 'expiring':
                    return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && subscription.isActive && subscription.status !== 'archived';
                case 'expired':
                    return endDate < today && subscription.isActive && subscription.status !== 'archived';
                case 'archived':
                    return subscription.status === 'archived';
                default:
                    return true; // 'all'
            }
        });

        return (
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-secondary">Pacote, assinatura e promoção</h2>
                        <p className="text-sm text-gray-500">Gerencie pacotes, assinaturas de clientes e promoções</p>
                        {expiringSoonSubscriptions.length > 0 && (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span className="text-sm font-medium text-amber-800">
                                        {expiringSoonSubscriptions.length} assinatura{expiringSoonSubscriptions.length > 1 ? 's' : ''} próximo{expiringSoonSubscriptions.length > 1 ? 'as' : 'a'} ao vencimento
                                    </span>
                                </div>
                                <div className="mt-2 text-xs text-amber-700">
                                    {expiringSoonSubscriptions.slice(0, 2).map(sub => {
                                        const daysLeft = Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <div key={sub.id} className="flex justify-between items-center py-1">
                                                <span>{sub.clientName}</span>
                                                <span className="font-medium">{daysLeft} dia{daysLeft > 1 ? 's' : ''}</span>
                                            </div>
                                        );
                                    })}
                                    {expiringSoonSubscriptions.length > 2 && (
                                        <div className="text-center mt-1 text-amber-600">
                                            +{expiringSoonSubscriptions.length - 2} outra{expiringSoonSubscriptions.length - 2 > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => onOpenPackageModal()}
                            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg inline-flex items-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                        >
                            + Novo Pacote
                        </button>
                        <button
                            onClick={() => onOpenSubscriptionModal()}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg inline-flex items-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                        >
                            + Nova Assinatura
                        </button>
                        <button
                            onClick={() => onOpenPromoModal()}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-lg inline-flex items-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                        >
                            + Nova Promoção
                        </button>
                    </div>
                </div>

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setView('packages')}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${view === 'packages' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Pacotes ({activePackages.length})
                        </button>
                        <button
                            onClick={() => setView('subscriptions')}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm relative ${view === 'subscriptions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Assinaturas ({activeSubscriptions.length})
                            {expiringSoonSubscriptions.length > 0 && (
                                <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                    {expiringSoonSubscriptions.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setView('promotions')}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${view === 'promotions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Promoções ({activePromotions.length})
                        </button>
                    </nav>
                </div>

                {view === 'packages' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {monthlyPackages.map((pkg) => (
                            <div key={pkg.id} className="bg-white p-5 rounded-xl shadow-lg border border-transparent hover:border-primary transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${pkg.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {pkg.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                    <div className="flex gap-2 transition-opacity">
                                        <button
                                            onClick={() => onOpenPackageModal(pkg)}
                                            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => onDeletePackage(pkg.id)}
                                            className="text-sm font-semibold text-red-600 hover:text-red-800"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-2">{pkg.name}</h3>
                                <p className="text-2xl font-bold text-primary mb-2">R$ {pkg.price.toFixed(2)}</p>
                                <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                                <p className="text-xs text-gray-500">Duração: {pkg.duration} meses</p>

                                <div className="flex justify-between items-center mt-4">
                                    <button
                                        onClick={() => onTogglePackage(pkg.id)}
                                        className={`text-xs font-medium px-3 py-1 rounded transition-colors ${pkg.isActive
                                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
                                    >
                                        {pkg.isActive ? 'Pausar' : 'Ativar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'subscriptions' && (
                    <div className="space-y-4 mt-6">
                        {/* Filtro de Assinaturas */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <h3 className="text-sm font-medium text-gray-700">Filtrar assinaturas:</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSubscriptionFilter('all')}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${subscriptionFilter === 'all'
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Todas ({packageSubscriptions.length})
                                    </button>
                                    <button
                                        onClick={() => setSubscriptionFilter('active')}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${subscriptionFilter === 'active'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Ativas ({activeSubscriptions.filter(s => {
                                            const daysLeft = Math.ceil((new Date(s.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                            return daysLeft > 7;
                                        }).length})
                                    </button>
                                    <button
                                        onClick={() => setSubscriptionFilter('expiring')}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${subscriptionFilter === 'expiring'
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Próximas ao vencimento ({expiringSoonSubscriptions.length})
                                    </button>
                                    <button
                                        onClick={() => setSubscriptionFilter('expired')}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${subscriptionFilter === 'expired'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Expiradas ({expiredSubscriptions.length})
                                    </button>
                                    <button
                                        onClick={() => setSubscriptionFilter('archived')}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${subscriptionFilter === 'archived'
                                            ? 'bg-gray-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Arquivadas ({packageSubscriptions.filter(s => s.status === 'archived').length})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {filteredSubscriptions.map((subscription) => {
                            const isExpiringSoon = expiringSoonSubscriptions.some(exp => exp.id === subscription.id);
                            const daysLeft = Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                            return (
                                <div key={subscription.id} className={`bg-white p-5 rounded-xl shadow-lg border transition-all duration-300 ${isExpiringSoon
                                    ? 'border-amber-300 hover:border-amber-400 bg-amber-50'
                                    : 'border-transparent hover:border-primary'
                                    }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">{subscription.clientName}</h3>
                                            <p className="text-sm text-gray-600">Responsável: {subscription.responsible}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${subscription.status === 'archived'
                                                    ? 'bg-gray-100 text-gray-700'
                                                    : subscription.status === 'expired'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {subscription.status === 'archived' ? 'Arquivada' :
                                                        subscription.status === 'expired' ? 'Expirada' : 'Ativa'}
                                                </span>
                                                {subscription.clicks !== undefined && (
                                                    <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        {subscription.clicks} cliques
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {isExpiringSoon && (
                                                <div className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                    {daysLeft} dia{daysLeft > 1 ? 's' : ''} restante{daysLeft > 1 ? 's' : ''}
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => onViewSubscription(subscription)}
                                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                                                >
                                                    Visualizar
                                                </button>
                                                <button
                                                    onClick={() => onOpenSubscriptionModal(subscription)}
                                                    className="text-sm font-semibold text-green-600 hover:text-green-800"
                                                >
                                                    Editar
                                                </button>
                                                {subscription.status !== 'archived' ? (
                                                    <button
                                                        onClick={() => onArchiveSubscription(subscription.id)}
                                                        className="text-sm font-semibold text-orange-600 hover:text-orange-800"
                                                    >
                                                        Arquivar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onUnarchiveSubscription(subscription.id)}
                                                        className="text-sm font-semibold text-green-600 hover:text-green-800"
                                                    >
                                                        Desarquivar
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onDownloadSubscriptionReport(subscription)}
                                                    className="text-sm font-semibold text-purple-600 hover:text-purple-800"
                                                >
                                                    Baixar
                                                </button>
                                                <button
                                                    onClick={() => onDeleteSubscription(subscription.id)}
                                                    className="text-sm font-semibold text-red-600 hover:text-red-800"
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Endereço:</p>
                                            <p className="font-medium">{subscription.address}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Telefone:</p>
                                            <p className="font-medium">{subscription.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Email:</p>
                                            <p className="font-medium">{subscription.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Pacote:</p>
                                            <p className="font-medium text-primary">{subscription.packageName} - R$ {subscription.packagePrice.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                                        <span>📅 {new Date(subscription.startDate).toLocaleDateString('pt-BR')} - {new Date(subscription.endDate).toLocaleDateString('pt-BR')}</span>
                                        <span>⏱️ {subscription.displayDuration} dias de exibição</span>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredSubscriptions.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {subscriptionFilter === 'all' && 'Nenhuma assinatura encontrada'}
                                    {subscriptionFilter === 'active' && 'Nenhuma assinatura ativa encontrada'}
                                    {subscriptionFilter === 'expiring' && 'Nenhuma assinatura próxima ao vencimento'}
                                    {subscriptionFilter === 'expired' && 'Nenhuma assinatura expirada encontrada'}
                                    {subscriptionFilter === 'archived' && 'Nenhuma assinatura arquivada encontrada'}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {subscriptionFilter === 'all' && 'Não há assinaturas cadastradas'}
                                    {subscriptionFilter === 'active' && 'Não há assinaturas ativas no momento'}
                                    {subscriptionFilter === 'expiring' && 'Não há assinaturas próximas ao vencimento'}
                                    {subscriptionFilter === 'expired' && 'Não há assinaturas expiradas'}
                                    {subscriptionFilter === 'archived' && 'Não há assinaturas arquivadas'}
                                </p>
                                <button
                                    onClick={() => onOpenSubscriptionModal()}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg inline-flex items-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                                >
                                    + Nova Assinatura
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {view === 'promotions' && (
                    <div className="space-y-4 mt-6">
                        {/* Filtros de Busca e Área */}
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar por título, descrição ou salão..."
                                        value={promoSearchTerm}
                                        onChange={(e) => setPromoSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    />
                                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <div className="w-full md:w-64">
                                    <select
                                        value={promoCategoryFilter}
                                        onChange={(e) => setPromoCategoryFilter(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary transition-all"
                                    >
                                        <option value="all">Todas as Categorias</option>
                                        <option value="salao_beleza">Salão de Beleza</option>
                                        <option value="bem_estar">Bem-estar e estética</option>
                                        <option value="estudio_beleza">Estúdio de beleza</option>
                                        <option value="podologia">Podologia</option>
                                        <option value="barbearia">Barbearia</option>
                                        <option value="esmaltaria">Esmaltaria</option>
                                        <option value="outros">Outros segmentos</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-gray-100">
                                <h3 className="text-sm font-medium text-gray-700">Filtrar por Área de Exibição:</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setPromoAreaFilter('all')}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${promoAreaFilter === 'all'
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Todas ({promotions.length})
                                    </button>
                                    <button
                                        onClick={() => setPromoAreaFilter('painel')}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${promoAreaFilter === 'painel'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Painel de Controle ({promotions.filter(p => p.targetArea === 'painel').length})
                                    </button>
                                    <button
                                        onClick={() => setPromoAreaFilter('client')}
                                        className={`px-3 py-1 text-sm rounded-full transition-colors ${promoAreaFilter === 'client'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Área do Cliente ({promotions.filter(p => p.targetArea === 'client').length})
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPromotions.map((promotion) => (
                                <div key={promotion.id} className="bg-white rounded-2xl shadow-lg border border-transparent hover:border-primary transition-all duration-300 overflow-hidden group flex flex-col">
                                    <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                        <img
                                            src={promotion.image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop"}
                                            alt={promotion.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${promotion.targetArea === 'painel' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white shadow-md'}`}>
                                                {promotion.targetArea === 'painel' ? 'Painel' : 'Cliente'}
                                            </span>
                                        </div>
                                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                                            <div className="bg-white/90 backdrop-blur-sm text-blue-800 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                {promotion.clicks || 0}
                                            </div>
                                            <div className={`w-3 h-3 rounded-full self-end shadow-sm ${promotion.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="mb-3 flex-1">
                                            <h3 className="text-lg font-bold text-gray-800 line-clamp-1 group-hover:text-primary transition-colors">{promotion.title}</h3>
                                            <p className="text-xs text-primary font-semibold mb-1 uppercase tracking-tight">{promotion.callToAction}</p>
                                            <p className="text-sm text-gray-600 line-clamp-2 h-10">{promotion.description}</p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => onOpenPromoModal(promotion)}
                                                    className="col-span-1 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex justify-center items-center"
                                                    title="Editar"
                                                >
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.586a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => onTogglePromotion(promotion.id)}
                                                    className={`col-span-1 py-2 text-xs font-bold border rounded-lg transition-colors flex justify-center items-center ${promotion.isActive ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700' : 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700'}`}
                                                    title={promotion.isActive ? 'Pausar' : 'Ativar'}
                                                >
                                                    {promotion.isActive ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => onDeletePromotion(promotion.id)}
                                                    className="col-span-1 py-2 text-xs font-bold border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex justify-center items-center"
                                                    title="Excluir"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => onPromotionClick(promotion.id, promotion.promotionUrl)}
                                                className="w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                            >
                                                {promotion.actionButton || 'Ver Oferta'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>


                        {filteredPromotions.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m-4 0H8v1m4-1v-1m-4 5v1m-2-4h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma promoção encontrada</h3>
                                <p className="text-gray-500 mb-4">Crie sua primeira promoção para começar</p>
                                <button
                                    onClick={() => onOpenPromoModal()}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-lg inline-flex items-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                                >
                                    + Nova Promoção
                                </button>
                            </div>
                        )}
                    </div>
                )
                }

                {/* Package Modal */}
                {
                    isPackageModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl max-w-md w-full">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {editingPackage ? 'Editar Pacote' : 'Novo Pacote'}
                                        </h2>
                                        <button onClick={onClosePackageModal} className="text-gray-400 hover:text-gray-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);

                                        const pkg: any = {
                                            name: formData.get('name') as string,
                                            price: parseFloat(formData.get('price') as string),
                                            description: formData.get('description') as string,
                                            duration: parseInt(formData.get('duration') as string),
                                            usageType: editingPackage?.usageType || 'Promoção',
                                            isActive: editingPackage?.isActive ?? true,
                                            createdAt: editingPackage?.createdAt || new Date().toISOString()
                                        };
                                        if (editingPackage) pkg.id = editingPackage.id;
                                        onSavePackage(pkg);
                                    }} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Pacote</label>
                                            <input
                                                name="name"
                                                type="text"
                                                required
                                                defaultValue={editingPackage?.name || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                placeholder="Ex: Pacote Premium"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                                            <input
                                                name="price"
                                                type="number"
                                                step="0.01"
                                                required
                                                defaultValue={editingPackage?.price || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                placeholder="Ex: 199.90"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                            <textarea
                                                name="description"
                                                required
                                                rows={3}
                                                defaultValue={editingPackage?.description || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                placeholder="Descreva o pacote..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Duração (meses)</label>
                                            <input
                                                name="duration"
                                                type="number"
                                                required
                                                min="1"
                                                defaultValue={editingPackage?.duration || 1}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                placeholder="Ex: 1"
                                            />
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={onClosePackageModal}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                                            >
                                                {editingPackage ? 'Salvar Alterações' : 'Criar Pacote'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Subscription Modal */}
                {
                    isSubscriptionModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {editingSubscription ? 'Editar Assinatura' : 'Nova Assinatura'}
                                        </h2>
                                        <button onClick={onCloseSubscriptionModal} className="text-gray-400 hover:text-gray-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);

                                        const subscription: any = {
                                            clientName: formData.get('clientName') as string,
                                            address: formData.get('address') as string,
                                            phone: formData.get('phone') as string,
                                            email: formData.get('email') as string,
                                            responsible: formData.get('responsible') as string,
                                            packageId: parseInt(formData.get('packageId') as string) || 0,
                                            packageName: formData.get('packageName') as string || '',
                                            packagePrice: parseFloat(formData.get('packagePrice') as string) || 0,
                                            displayDuration: parseInt(formData.get('displayDuration') as string) || 30,
                                            startDate: formData.get('startDate') as string,
                                            endDate: formData.get('endDate') as string,
                                            isActive: editingSubscription?.isActive ?? true,
                                            createdAt: editingSubscription?.createdAt || new Date().toISOString()
                                        };
                                        if (editingSubscription) subscription.id = editingSubscription.id;
                                        onSaveSubscription(subscription);
                                    }} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                                                <input
                                                    name="clientName"
                                                    type="text"
                                                    required
                                                    defaultValue={editingSubscription?.clientName || ''}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                    placeholder="Nome completo"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                                                <input
                                                    name="responsible"
                                                    type="text"
                                                    required
                                                    defaultValue={editingSubscription?.responsible || ''}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                    placeholder="Nome do responsável"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                            <input
                                                name="address"
                                                type="text"
                                                required
                                                defaultValue={editingSubscription?.address || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                placeholder="Endereço completo"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                                <input
                                                    name="phone"
                                                    type="tel"
                                                    required
                                                    defaultValue={editingSubscription?.phone || ''}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                    placeholder="(00) 00000-0000"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                <input
                                                    name="email"
                                                    type="email"
                                                    required
                                                    defaultValue={editingSubscription?.email || ''}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                    placeholder="email@exemplo.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Pacote</label>
                                                <select
                                                    name="packageId"
                                                    required
                                                    defaultValue={editingSubscription?.packageId || ''}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                    onChange={(e) => {
                                                        const pkg = monthlyPackages.find(p => p.id === parseInt(e.target.value));
                                                        if (pkg && e.target.form) {
                                                            const nameInput = e.target.form.querySelector('input[name="packageName"]');
                                                            const priceInput = e.target.form.querySelector('input[name="packagePrice"]');
                                                            if (nameInput) nameInput.value = pkg.name;
                                                            if (priceInput) priceInput.value = pkg.price.toString();
                                                        }
                                                    }}
                                                >
                                                    <option value="">Selecione um pacote</option>
                                                    {monthlyPackages.filter(p => p.isActive).map(pkg => (
                                                        <option key={pkg.id} value={pkg.id}>
                                                            {pkg.name} - R$ {pkg.price.toFixed(2)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Exibição (dias)</label>
                                                <input
                                                    name="displayDuration"
                                                    type="number"
                                                    required
                                                    min="1"
                                                    defaultValue={editingSubscription?.displayDuration || 30}
                                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                    placeholder="Ex: 30"
                                                />
                                            </div>
                                        </div>

                                        <div className="hidden">
                                            <input name="packageName" defaultValue={editingSubscription?.packageName || ''} />
                                            <input name="packagePrice" defaultValue={editingSubscription?.packagePrice || ''} />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Período da Assinatura</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Data de Início</label>
                                                    <input
                                                        name="startDate"
                                                        type="date"
                                                        required
                                                        defaultValue={editingSubscription?.startDate || new Date().toISOString().split('T')[0]}
                                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Data de Fim</label>
                                                    <input
                                                        name="endDate"
                                                        type="date"
                                                        required
                                                        defaultValue={editingSubscription?.endDate || new Date().toISOString().split('T')[0]}
                                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={onCloseSubscriptionModal}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                            >
                                                {editingSubscription ? 'Salvar Alterações' : 'Criar Assinatura'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Promoção Modal */}
                {
                    isPromoModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
                                        </h2>
                                        <button onClick={onClosePromoModal} className="text-gray-400 hover:text-gray-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);

                                        let imageUrl = editingPromotion?.image || '';
                                        if (imageFile) {
                                            imageUrl = `data:image/jpeg;base64,${imagePreviewUrl?.split(',')[1] || ''}`;
                                        } else if (formData.get('imageUrl')) {
                                            imageUrl = formData.get('imageUrl') as string;
                                        }

                                        let mobileImageUrl = editingPromotion?.mobileImage || '';
                                        if (mobileImageFile) {
                                            mobileImageUrl = `data:image/jpeg;base64,${mobileImagePreviewUrl?.split(',')[1] || ''}`;
                                        } else if (formData.get('mobileImageUrl')) {
                                            mobileImageUrl = formData.get('mobileImageUrl') as string;
                                        }


                                        const promotion: any = {
                                            callToAction: formData.get('callToAction') as string,
                                            title: formData.get('title') as string,
                                            description: formData.get('description') as string,

                                            image: imageUrl || editingPromotion?.image || '',
                                            mobileImage: mobileImageUrl || editingPromotion?.mobileImage || '',

                                            promotionUrl: formData.get('promotionUrl') as string || '',
                                            targetArea: formData.get('targetArea') as 'client' | 'painel',
                                            profileTarget: formData.get('profileTarget') as string,
                                            locationCountry: formData.get('locationCountry') as string,
                                            locationState: formData.get('locationState') as string,
                                            locationCity: formData.get('locationCity') as string,
                                            locationNeighborhood: formData.get('locationNeighborhood') as string,
                                            actionButton: formData.get('actionButton') as string,
                                            duration: editingPromotion?.duration || 7,
                                            startDate: formData.get('startDate') as string,
                                            endDate: formData.get('endDate') as string,
                                            isActive: editingPromotion?.isActive ?? true,
                                            createdAt: editingPromotion?.createdAt || new Date().toISOString(),
                                            clicks: editingPromotion?.clicks || 0
                                        };
                                        if (editingPromotion) promotion.id = editingPromotion.id;
                                        onSavePromotion(promotion);
                                    }} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Chamada (Opcional)</label>
                                            <input
                                                name="callToAction"
                                                type="text"

                                                defaultValue={editingPromotion?.callToAction || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                placeholder="Ex: Oferta Limitada!"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Título de Promoção Exclusivo</label>
                                            <input
                                                name="title"
                                                type="text"
                                                required
                                                defaultValue={editingPromotion?.title || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                placeholder="Ex: 20% OFF em Cortes Masculinos"
                                            />
                                        </div>


                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                            <textarea
                                                name="description"
                                                required
                                                rows={3}
                                                defaultValue={editingPromotion?.description || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                placeholder="Descreva os detalhes da promoção..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Link da Campanha</label>
                                            <input
                                                name="promotionUrl"
                                                type="url"
                                                defaultValue={editingPromotion?.promotionUrl || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                placeholder="https://exemplo.com/promocao"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Área de Exibição</label>
                                            <select
                                                name="targetArea"
                                                required
                                                defaultValue={editingPromotion?.targetArea || 'painel'}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                            >
                                                <option value="painel">Painel de Controle</option>
                                                <option value="client">Área do Cliente</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Exibição</label>
                                            <select
                                                name="profileTarget"
                                                defaultValue={editingPromotion?.profileTarget || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                            >
                                                <option value="">Todos os segmentos</option>
                                                <option value="salao_beleza">Salão de Beleza</option>
                                                <option value="bem_estar">Bem-estar e estética</option>
                                                <option value="estudio_beleza">Estúdio de beleza</option>
                                                <option value="podologia">Podologia</option>
                                                <option value="barbearia">Barbearia</option>
                                                <option value="esmaltaria">Esmaltaria</option>
                                                <option value="outros">Outros segmentos</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Local de Exibição</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">País</label>
                                                    <select name="locationCountry" className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" defaultValue={editingPromotion?.locationCountry || ''}>
                                                        <option value="">Todos</option>
                                                        <option value="BR">Brasil</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Estado</label>
                                                    <input
                                                        name="locationState"
                                                        type="text"
                                                        placeholder="Ex: SP"
                                                        defaultValue={editingPromotion?.locationState || ''}
                                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                                                    <input
                                                        name="locationCity"
                                                        type="text"
                                                        placeholder="Ex: São Paulo"
                                                        defaultValue={editingPromotion?.locationCity || ''}
                                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Bairro</label>
                                                    <input
                                                        name="locationNeighborhood"
                                                        type="text"
                                                        placeholder="Ex: Jardins"
                                                        defaultValue={editingPromotion?.locationNeighborhood || ''}
                                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Principal</label>
                                                <div
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${imageFile ? 'border-primary bg-primary/10' : 'border-gray-300'
                                                        }`}
                                                >
                                                    {imagePreviewUrl || editingPromotion?.image ? (
                                                        <div className="text-center relative">
                                                            <img
                                                                src={imagePreviewUrl || editingPromotion?.image}
                                                                alt="Preview"
                                                                className="mx-auto max-h-40 rounded-md shadow-md"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleFileSelect(null); }}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1 text-center">
                                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4M8 32l9.172-9.172a4 4 0 015.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            <div className="flex text-sm text-gray-600">
                                                                <p className="pl-1">Clique para imagem desktop</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        className="hidden"
                                                        onChange={e => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                                                        accept="image/*"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Mobile</label>
                                                <div
                                                    onClick={() => {
                                                        const mobileInput = document.createElement('input');
                                                        mobileInput.type = 'file';
                                                        mobileInput.accept = 'image/*';
                                                        mobileInput.onchange = (e) => {
                                                            const file = (e.target as HTMLInputElement).files?.[0];
                                                            if (file) handleMobileFileSelect(file);
                                                        };
                                                        mobileInput.click();
                                                    }}
                                                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${mobileImageFile ? 'border-primary bg-primary/10' : 'border-gray-300'
                                                        }`}
                                                >
                                                    {mobileImagePreviewUrl || editingPromotion?.mobileImage ? (
                                                        <div className="text-center relative">
                                                            <img
                                                                src={mobileImagePreviewUrl || editingPromotion?.mobileImage}
                                                                alt="Mobile Preview"
                                                                className="mx-auto max-h-40 rounded-md shadow-md"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); handleMobileFileSelect(null); }}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1 text-center">
                                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                            <div className="flex text-sm text-gray-600">
                                                                <p className="pl-1">Clique para imagem mobile</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>


                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Botão: chamada para ação</label>
                                            <input
                                                name="actionButton"
                                                type="text"
                                                required
                                                defaultValue={editingPromotion?.actionButton || ''}
                                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                placeholder="Ex: Comprar Agora, Saiba Mais"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Data da Promoção. início e fim</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                                                    <input
                                                        name="startDate"
                                                        type="date"
                                                        required
                                                        defaultValue={editingPromotion?.startDate || new Date().toISOString().split('T')[0]}
                                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                                                    <input
                                                        name="endDate"
                                                        type="date"
                                                        required
                                                        defaultValue={editingPromotion?.endDate || new Date().toISOString().split('T')[0]}
                                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={onClosePromoModal}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                            >
                                                {editingPromotion ? 'Salvar Alterações' : 'Criar Promoção'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    };

const DashboardSkeleton: React.FC = () => (
    <div className="container mx-auto px-6 py-8 animate-fade-in">
        {/* Skeleton for Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-lg mb-8 animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" style={{ backgroundSize: '200% 100%' }}>
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-300 rounded w-full"></div>
        </div>

        {/* Skeleton for Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4 animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" style={{ backgroundSize: '200% 100%' }}>
                    <div className="rounded-full bg-gray-300 h-14 w-14"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-400 rounded w-1/2"></div>
                    </div>
                </div>
            ))}
        </div>

        {/* Skeleton for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg h-96 animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" style={{ backgroundSize: '200% 100%' }}>
                <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
                <div className="h-64 bg-gray-300 rounded"></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg h-96 animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" style={{ backgroundSize: '200% 100%' }}>
                <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
                <div className="h-64 bg-gray-300 rounded"></div>
            </div>
        </div>

        {/* Skeleton for Table */}
        <div className="bg-white p-6 rounded-2xl shadow-lg animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" style={{ backgroundSize: '200% 100%' }}>
            <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
                <div className="h-8 bg-gray-300 rounded"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
            </div>
        </div>
    </div>
);


// FIX: Changed to a named export to resolve a module resolution error.
export const Dashboard: React.FC<DashboardProps> = ({
    goBack, navigate, currentUser, onActivateAI, activeAIAgent, onLogout, onPayInstallment,
    selectedUnit, onUnitChange, allData, setAllData, users, onUsersChange, onSuspendAcquisitionChannel,
    onArchiveAcquisitionChannel, onUnarchiveAcquisitionChannel, onChannelsChange,
    onSaveProduct, onDeleteProduct, onSuspendProduct, onUpdateProductQuantity, onProductsChange,
    onSuspendProfessional, onArchiveProfessional, onProfessionalsChange,
    isSuperAdmin, planFeatures, onComingSoon = () => { }
}) => {
    const { language, setLanguage, t } = useLanguage();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const initialView = useMemo(() => {
        if (isSuperAdmin) return 'Super Admin: Salões';
        if (currentUser?.role === 'profissional' || currentUser?.role === 'Profissional') return 'Minha Agenda';
        return 'Visão Geral';
    }, [isSuperAdmin, currentUser?.role]);

    const [activeView, setActiveView] = useState(initialView);
    const [chatClientTarget, setChatClientTarget] = useState<number | null>(null);
    const [derivedPeriod, setDerivedPeriod] = useState<'hoje' | 'semana' | 'mes' | 'anual'>('mes');
    const [topSellersTab, setTopSellersTab] = useState('services');
    const [dashboardTab, setDashboardTab] = useState<'overview' | 'clients' | 'sales'>('overview');
    const [marketingTab, setMarketingTab] = useState('campanhas');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const {
        notifications: contextNotifications,
        refreshNotifications,
        transactions,
        appointments,
        clients,
        professionals,
        services,
        products,
        units,
        saveService,
        deleteService,
        toggleSuspendService,
        toggleFavoriteService,
        saveClient,
        deleteClient,
        selectedUnitId,
        packages,
        salonPlans,
        savePackage,
        deletePackage,
        toggleSuspendPackage,
        toggleFavoritePackage,
        saveSalonPlan,
        deleteSalonPlan,
        toggleSuspendSalonPlan,
        toggleFavoriteSalonPlan,
        refreshPackages,
        refreshSalonPlans,
    } = useData();
    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const notificationPanelRef = useRef<HTMLDivElement>(null);
    const [isNewChannelModalOpen, setIsNewChannelModalOpen] = useState(false);
    const [channelToEdit, setChannelToEdit] = useState<AcquisitionChannel | null>(null);
    const [channelView, setChannelView] = useState<'active' | 'archived'>('active');

    const isIndividualPlan = currentUser?.plan === 'Individual' && !isSuperAdmin;

    const [unreadMessages, setUnreadMessages] = useState<{ [key: number]: number }>({});
    const audioContextRef = useRef<AudioContext | null>(null);
    const isChatOpenRef = useRef(isChatOpen);

    const [isSwitchingUnit, setIsSwitchingUnit] = useState(false);
    const [isUnitLimitModalOpen, setIsUnitLimitModalOpen] = useState(false);
    const [isUnitSelectionModalOpen, setIsUnitSelectionModalOpen] = useState(false);
    const [animateContent, setAnimateContent] = useState(false);
    const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

    // Handler for showing Coming Soon modal from child components
    const handleShowComingSoon = (featureName: string) => {
        setComingSoonFeature(featureName);
    };

    // --- Promotions & Packages State ---
    const { promotions, savePromotion, deletePromotion, togglePromotion, refreshPromotions } = useData();
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

    const [packageSubscriptions, setPackageSubscriptions] = useState<PackageSubscription[]>([]);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);
    const [editingSubscription, setEditingSubscription] = useState<PackageSubscription | null>(null);

    // --- Marketing State ---
    const [marketingCampaigns, setMarketingCampaigns] = useState<Campaign[]>([]);
    const [acquisitionChannels, setAcquisitionChannels] = useState<AcquisitionChannel[]>([]);

    // Initial Data Load - reloads when unit changes
    useEffect(() => {
        // Immediately clear data when unit changes to prevent showing stale data
        const loadDashboardData = async () => {
            try {
                const [subs, campaigns, channels, directMail] = await Promise.all([
                    packagesAPI.listSubscriptions(),
                    marketingAPI.listCampaigns(),
                    marketingAPI.listChannels(),
                    marketingAPI.listDirectMail()
                ]);
                refreshPackages();
                refreshSalonPlans();
                setPackageSubscriptions(subs);
                setMarketingCampaigns(campaigns);
                setAcquisitionChannels(channels);
                // Update allData to include directMailCampaigns for the current unit
                setAllData((prev: any) => ({
                    ...prev,
                    [selectedUnit]: {
                        ...prev[selectedUnit],
                        directMailCampaigns: directMail.map((c: any) => ({
                            ...c,
                            roi: c.roi || { totalSent: 0, openRate: '0%', clicks: 0, conversions: 0, revenue: 0 },
                            history: c.history || []
                        }))
                    }
                }));
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            }
        };
        loadDashboardData();
    }, [selectedUnit]);

    // --- Promotion Handlers ---
    const handleSavePromotion = async (promotion: Promotion) => {
        try {
            await savePromotion(promotion);
            setIsPromoModalOpen(false);
            setEditingPromotion(null);
        } catch (error) {
            console.error("Error saving promotion:", error);
            alert("Erro ao salvar promoção.");
        }
    };

    const handleDeletePromotion = async (id: number) => {
        if (window.confirm(t('confirmAction'))) {
            try {
                await deletePromotion(id);
            } catch (error) {
                console.error("Error deleting promotion:", error);
                alert("Erro ao excluir promoção.");
            }
        }
    };

    const handleTogglePromotion = async (id: number) => {
        try {
            await togglePromotion(id);
        } catch (error) {
            console.error("Error toggling promotion:", error);
            alert("Erro ao atualizar promoção.");
        }
    };
    const handleOpenPromoModal = (promotion?: Promotion) => {
        setEditingPromotion(promotion || null);
        setIsPromoModalOpen(true);
    };

    const handleClosePromoModal = () => {
        setIsPromoModalOpen(false);
        setEditingPromotion(null);
    };

    const handlePromotionClick = (promotionId: number, promotionUrl?: string) => {
        console.log(`Promotion clicked: ${promotionId}`);
        if (promotionUrl) window.open(promotionUrl, '_blank');
    };

    // --- Package Handlers ---
    const handleSaveMonthlyPackage = async (pkg: Package) => {
        const success = await savePackage(pkg);
        if (success) {
            setIsPackageModalOpen(false);
            setEditingPackage(null);
        } else {
            alert("Erro ao salvar pacote.");
        }
    };

    const handleDeleteMonthlyPackage = async (id: number) => {
        if (window.confirm(t('confirmAction'))) {
            const success = await deletePackage(id);
            if (!success) {
                alert("Erro ao excluir pacote.");
            }
        }
    };

    const handleToggleMonthlyPackage = async (id: number) => {
        const success = await toggleSuspendPackage(id);
        if (!success) {
            alert("Erro ao alternar status do pacote.");
        }
    };

    const handleOpenPackageModal = (pkg?: Package) => {
        setEditingPackage(pkg || null);
        setIsPackageModalOpen(true);
    };

    const handleClosePackageModal = () => setIsPackageModalOpen(false);


    // --- Subscription Handlers ---
    const handleSavePackageSubscription = async (subscription: PackageSubscription) => {
        try {
            let savedSub;
            if (editingSubscription) {
                if (!subscription.id) {
                    console.error("Missing subscription ID for update");
                    return;
                }
                savedSub = await packagesAPI.updateSubscription(subscription.id, subscription);
                setPackageSubscriptions(prev => prev.map(s => s.id == savedSub.id ? savedSub : s));
            } else {
                savedSub = await packagesAPI.createSubscription(subscription);
                setPackageSubscriptions(prev => [savedSub, ...prev]);
            }
            setIsSubscriptionModalOpen(false);
            setEditingSubscription(null);
        } catch (error) {
            console.error("Error saving subscription:", error);
            alert("Erro ao salvar assinatura.");
        }
    };

    const handleDeletePackageSubscription = async (id: number) => {
        if (window.confirm(t('confirmAction'))) {
            try {
                await packagesAPI.deleteSubscription(id);
                setPackageSubscriptions(prev => prev.filter(s => s.id !== id));
            } catch (error) {
                console.error("Error deleting subscription:", error);
                alert("Erro ao excluir assinatura.");
            }
        }
    };

    const handleArchiveSubscription = async (id: number) => {
        try {
            const res = await packagesAPI.archiveSubscription(id);
            setPackageSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: res.status as 'active' | 'archived' } : s));
        } catch (error) {
            console.error("Error archiving subscription:", error);
        }
    };

    const handleUnarchiveSubscription = handleArchiveSubscription;
    const handleAddPayment = () => { };
    const handleEditSubscriptionNotes = () => { };
    const handleDownloadSubscriptionReport = () => { };
    const handleViewSubscription = (sub: PackageSubscription) => {
        setEditingSubscription(sub);
        setIsSubscriptionModalOpen(true);
    };

    const handleOpenSubscriptionModal = (sub?: PackageSubscription) => {
        setEditingSubscription(sub || null);
        setIsSubscriptionModalOpen(true);
    };
    const handleCloseSubscriptionModal = () => setIsSubscriptionModalOpen(false);


    // --- Exclusive Promotions (Mock for now) ---
    // --- Exclusive Promotions ---
    // Derived state for exclusive promotions
    const exclusivePromotions = promotions.filter(p => p.type === 'exclusive').map(p => ({ ...p, isActive: p.isActive ?? true })); // Ensure compatibility
    const [isExclusiveModalOpen, setIsExclusiveModalOpen] = useState(false);
    const [editingExclusive, setEditingExclusive] = useState<Promotion | null>(null); // Type is Promotion

    const handleSaveExclusive = async (exclusive: Promotion) => {
        try {
            const dataToSave = { ...exclusive, type: 'exclusive' as const };
            await savePromotion(dataToSave);
            setIsExclusiveModalOpen(false);
            setEditingExclusive(null);
        } catch (error) {
            console.error("Error saving exclusive promotion:", error);
            alert("Erro ao salvar promoção exclusiva.");
        }
    };
    const handleDeleteExclusive = async (id: number) => {
        if (window.confirm(t('confirmAction'))) {
            try {
                await deletePromotion(id);
            } catch (error) {
                console.error("Error deleting exclusive promotion:", error);
                alert("Erro ao excluir promoção exclusiva.");
            }
        }
    };

    const handleToggleExclusive = async (id: number) => {
        try {
            await togglePromotion(id);
        } catch (error) {
            console.error("Error toggling exclusive promotion:", error);
            alert("Erro ao atualizar promoção exclusiva.");
        }
    };

    const handleOpenExclusiveModal = (ex?: Promotion) => {
        setEditingExclusive(ex || null);
        setIsExclusiveModalOpen(true);
    };

    const handleCloseExclusiveModal = () => {
        setIsExclusiveModalOpen(false);
        setEditingExclusive(null);
    };

    const handleExclusivePromotionClick = (promotionId: number, bannerLink?: string) => {
        console.log(`Exclusive Promotion clicked: ${promotionId}`);
        if (bannerLink) window.open(bannerLink, '_blank');
    };

    // --- Chat Unread Messaging Integration ---
    useEffect(() => {
        const fetchChatUnread = async () => {
            if (!currentUser) return;

            try {
                // Fetch Chat Contacts to calculate unread
                const contacts = await chatAPI.getContacts();
                if (Array.isArray(contacts)) {
                    const unreadMap: { [key: number]: number } = {};
                    contacts.forEach((c: any) => {
                        if (c.unreadCount > 0 && c.id) {
                            unreadMap[c.id] = c.unreadCount;
                        }
                    });
                    setUnreadMessages(unreadMap);
                }
            } catch (error) {
                console.error('Error fetching chat contacts:', error);
            }
        };

        fetchChatUnread();
    }, [currentUser]);

    const dashboardData = {
    };

    // Destructure already done above

    // --- UNIT DATA ---
    const currentUnitData = useMemo(() => {
        // Filter helper based on unit name comparison
        const filterByUnit = (list: any[]) => {
            if (!selectedUnit || selectedUnit === 'Todas as Unidades' || selectedUnit === 'Matriz') {
                // If no unit or common names, we might want to show all or filter by a default
                // But usually selectedUnit is the actual unit name. 
                // If the list items have a 'unit' property that matches.
                return list;
            }
            return list.filter(item =>
                item.unit === selectedUnit ||
                item.preferredUnit === selectedUnit ||
                item.preferred_unit === selectedUnit ||
                item.unitName === selectedUnit
            );
        };

        return {
            clients: filterByUnit(clients),
            professionals: filterByUnit(professionals),
            services: services, // Services are typically global for the salon
            packages: packages,
            plans: salonPlans,
            products: filterByUnit(products),
            transactions: filterByUnit(transactions),
            appointments: filterByUnit(appointments),
            marketingCampaigns: [], // Not currently in useData but can be added if needed
            directMailCampaigns: [],
            acquisitionChannels: [],
        };
    }, [clients, professionals, transactions, appointments, services, packages, salonPlans, products, selectedUnit]);

    const availableUnits = useMemo(() => units.map(u => u.name), [units]);
    const unitPhone = useMemo(() => {
        const unit = units.find(u => u.name === selectedUnit);
        if (!unit) return undefined;
        return Array.isArray(unit.phone) ? unit.phone[0] : unit.phone;
    }, [units, selectedUnit]);

    const createDataHandler = (dataType: keyof typeof currentUnitData) => (newItem: any) => {
        setAllData((prevData: any) => {
            const fallbackUnitData = {
                clients: [],
                professionals: [],
                services: [],
                packages: [],
                plans: [],
                products: [],
                transactions: [],
                appointments: [],
                marketingCampaigns: [],
                directMailCampaigns: [],
                acquisitionChannels: [],
            } as typeof currentUnitData;

            const unitData = (prevData && prevData[selectedUnit]) || fallbackUnitData;
            const rawItems = (unitData as any)[dataType];
            const items: any[] = Array.isArray(rawItems) ? rawItems : [];

            const itemWithId = { ...newItem };

            let updatedData: any[];
            if (itemWithId.id && items.some((item: any) => item.id === itemWithId.id)) { // Update
                updatedData = items.map((item: any) => (item.id === itemWithId.id ? itemWithId : item));
            } else { // Create
                const newId = items.length > 0 ? Math.max(0, ...items.map((item: any) => item.id || 0)) + 1 : 1;
                itemWithId.id = newId;
                updatedData = [itemWithId, ...items];
            }

            return {
                ...prevData,
                [selectedUnit]: {
                    ...fallbackUnitData,
                    ...unitData,
                    [dataType]: updatedData,
                },
            };
        });
    };

    const createGenericHandler = (dataType: keyof typeof currentUnitData) => (updatedItems: any[]) => {
        setAllData((prevData: any) => ({
            ...prevData,
            [selectedUnit]: {
                ...prevData[selectedUnit],
                [dataType]: updatedItems,
            }
        }));
    };

    const handleBlockClientDashboard = async (clientId: number, reason: string) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            await saveClient({ ...client, blocked: { status: true, reason } });
        }
    };

    const handleUnblockClientDashboard = async (clientId: number) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            await saveClient({ ...client, blocked: { status: false, reason: '' } });
        }
    };

    const handleSaveClientDashboard = async (clientData: any) => {
        return await saveClient(clientData);
    };

    const handleDeleteClientDashboard = async (clientId: number) => {
        await deleteClient(clientId);
    };
    const handleSaveProfessional = createDataHandler('professionals');
    const handleSaveService = createDataHandler('services');
    const handleSavePackage = createDataHandler('packages');
    const handleSavePlan = createDataHandler('plans');
    const handleSaveTransaction = createDataHandler('transactions');

    const handleClientsChange = createGenericHandler('clients');
    const handleProfessionalsChange = createGenericHandler('professionals');
    const handleServicesChange = createGenericHandler('services');
    const handlePackagesChange = createGenericHandler('packages');
    const handlePlansChange = createGenericHandler('plans');
    const handleTransactionsChange = createGenericHandler('transactions');
    const handleCampaignsChange = createGenericHandler('marketingCampaigns');
    const handleDirectMailChange = createGenericHandler('directMailCampaigns');
    const handlePromotionsChange = createGenericHandler('promotions');

    const handleToggleFavorite = (itemType: 'service' | 'package' | 'plan', itemId: number) => {
        const updater = (items: any[]) => items.map(item => item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item);
        if (itemType === 'service') handleServicesChange(updater(currentUnitData.services));
        if (itemType === 'package') handlePackagesChange(updater(currentUnitData.packages));
        if (itemType === 'plan') handlePlansChange(updater(currentUnitData.plans));
    };

    const handleToggleFavoriteProduct = (productId: number) => {
        onProductsChange(
            currentUnitData.products.map((p: any) =>
                p.id === productId ? { ...p, isFavorite: !p.isFavorite } : p
            )
        );
    };

    // Old handlers removed to avoid duplication with API implementations below

    const handleOpenEditChannelModal = (channel: AcquisitionChannel) => {
        setChannelToEdit(channel);
        setIsNewChannelModalOpen(true);
    };

    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
    }, [isChatOpen]);

    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    const playNotificationSound = () => {
        if (!audioContextRef.current) return;
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.3);
        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.3);
    };

    const handleClearUnread = (userId: number) => {
        setUnreadMessages(prev => {
            const newUnread = { ...prev };
            if (newUnread[userId]) {
                delete newUnread[userId];
            }
            return newUnread;
        });
    };

    const handleOpenChatForClient = (clientId: number) => {
        setChatClientTarget(clientId);
        setActiveView('Chat');
    };

    const totalUnread = Object.values(unreadMessages).reduce<number>((sum, count) => sum + Number(count), 0);

    // --- Marketing Handlers (API) ---
    const handleAddMarketingCampaign = async (data: any) => {
        try {
            const newCampaign = await marketingAPI.createCampaign({ ...data, unitName: selectedUnit });
            setMarketingCampaigns(prev => [newCampaign, ...prev]);
        } catch (error) {
            console.error("Error creating campaign:", error);
            alert("Erro ao criar campanha.");
        }
    };

    const handleUpdateMarketingCampaign = async (updatedCampaignData: any) => {
        try {
            const updated = await marketingAPI.updateCampaign(updatedCampaignData.id, updatedCampaignData);
            setMarketingCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
        } catch (error) {
            console.error("Error updating campaign:", error);
            alert("Erro ao atualizar campanha.");
        }
    };

    const handleArchiveCampaign = async (campaignId: number) => {
        try {
            const campaign = marketingCampaigns.find(c => c.id === campaignId);
            if (campaign) {
                const updated = await marketingAPI.updateCampaign(campaignId, { ...campaign, archived: true });
                setMarketingCampaigns(prev => prev.map(c => c.id === campaignId ? updated : c));
            }
        } catch (error) {
            console.error("Error archiving campaign:", error);
        }
    };

    const handleUnarchiveCampaign = async (campaignId: number) => {
        try {
            const campaign = marketingCampaigns.find(c => c.id === campaignId);
            if (campaign) {
                const updated = await marketingAPI.updateCampaign(campaignId, { ...campaign, archived: false });
                setMarketingCampaigns(prev => prev.map(c => c.id === campaignId ? updated : c));
            }
        } catch (error) {
            console.error("Error unarchiving campaign:", error);
        }
    };

    const handleDuplicateCampaign = async (campaignId: number) => {
        try {
            const campaignToDuplicate = marketingCampaigns.find((c: Campaign) => c.id === campaignId);
            if (campaignToDuplicate) {
                const { id, ...rest } = campaignToDuplicate;
                const newCampaignData = {
                    ...rest,
                    name: `${campaignToDuplicate.name} (Cópia)`,
                    status: 'Agendada',
                    stats: { alcance: 0, conversoes: 0, receita: 0 },
                    unitName: selectedUnit
                };
                const newCampaign = await marketingAPI.createCampaign(newCampaignData);
                setMarketingCampaigns(prev => [newCampaign, ...prev]);
            }
        } catch (error) {
            console.error("Error duplicating campaign:", error);
        }
    };

    // --- Direct Mail Handlers (API) ---
    const handleAddDirectMailCampaign = async (data: any) => {
        try {
            const newCampaign = await marketingAPI.createDirectMail({ ...data, unitName: selectedUnit });
            // Update allData or separate state if needed
            setAllData(prev => ({
                ...prev,
                [selectedUnit]: {
                    ...prev[selectedUnit],
                    directMailCampaigns: [newCampaign, ...(prev[selectedUnit].directMailCampaigns || [])]
                }
            }));
        } catch (error) {
            console.error("Error creating direct mail campaign:", error);
            alert("Erro ao criar campanha de mala direta.");
        }
    };
    const handleUpdateDirectMailCampaign = async (data: any) => {
        try {
            const updated = await marketingAPI.updateDirectMail(data.id, data);
            setAllData(prev => ({
                ...prev,
                [selectedUnit]: {
                    ...prev[selectedUnit],
                    directMailCampaigns: (prev[selectedUnit].directMailCampaigns || []).map(c => c.id === updated.id ? updated : c)
                }
            }));
        } catch (error) {
            console.error("Error updating direct mail campaign:", error);
            alert("Erro ao atualizar campanha de mala direta.");
        }
    };
    const handleDeleteDirectMailCampaign = async (id: number) => {
        try {
            await marketingAPI.deleteDirectMail(id);
            setAllData(prev => ({
                ...prev,
                [selectedUnit]: {
                    ...prev[selectedUnit],
                    directMailCampaigns: (prev[selectedUnit].directMailCampaigns || []).filter(c => c.id !== id)
                }
            }));
        } catch (error) {
            console.error("Error deleting direct mail campaign:", error);
        }
    };
    const handleArchiveDirectMailCampaign = async (id: number) => {
        try {
            const campaign = currentUnitData.directMailCampaigns?.find(c => c.id === id);
            if (campaign) {
                const updated = await marketingAPI.updateDirectMail(id, { ...campaign, archived: true });
                setAllData(prev => ({
                    ...prev,
                    [selectedUnit]: {
                        ...prev[selectedUnit],
                        directMailCampaigns: (prev[selectedUnit].directMailCampaigns || []).map(c => c.id === id ? updated : c)
                    }
                }));
            }
        } catch (error) {
            console.error("Error archiving direct mail campaign:", error);
        }
    };
    const handleUnarchiveDirectMailCampaign = async (id: number) => {
        try {
            const campaign = currentUnitData.directMailCampaigns?.find(c => c.id === id);
            if (campaign) {
                const updated = await marketingAPI.updateDirectMail(id, { ...campaign, archived: false });
                setAllData(prev => ({
                    ...prev,
                    [selectedUnit]: {
                        ...prev[selectedUnit],
                        directMailCampaigns: (prev[selectedUnit].directMailCampaigns || []).map(c => c.id === id ? updated : c)
                    }
                }));
            }
        } catch (error) {
            console.error("Error unarchiving direct mail campaign:", error);
        }
    };
    const handleSendDirectMailCampaign = async (id: number) => {
        try {
            const campaign = currentUnitData.directMailCampaigns?.find(c => c.id === id);
            if (campaign) {
                const updated = await marketingAPI.updateDirectMail(id, { ...campaign, status: 'agendado' });
                setAllData(prev => ({
                    ...prev,
                    [selectedUnit]: {
                        ...prev[selectedUnit],
                        directMailCampaigns: (prev[selectedUnit].directMailCampaigns || []).map(c => c.id === id ? updated : c)
                    }
                }));
                alert("Campanha agendada para disparo!");
            }
        } catch (error) {
            console.error("Error sending direct mail campaign:", error);
            alert("Erro ao enviar campanha.");
        }
    };


    // -- Acquisition Channels Handlers (API) --
    const handleSaveAcquisitionChannel = async (data: { name: string; duration: string }) => {
        try {
            if (channelToEdit) {
                const updated = await marketingAPI.updateChannel(channelToEdit.id, data);
                setAcquisitionChannels(prev => prev.map(c => c.id === updated.id ? updated : c));
            } else {
                const newChannel = await marketingAPI.createChannel({ ...data, unitName: selectedUnit });
                setAcquisitionChannels(prev => [newChannel, ...prev]);
            }
            setIsNewChannelModalOpen(false);
            setChannelToEdit(null);
        } catch (error) {
            console.error("Error saving channel:", error);
            alert("Erro ao salvar canal de aquisição.");
        }
    };

    const handleSuspendAcquisitionChannel = async (channelId: number, channelName: string, isSuspended?: boolean) => {
        try {
            const channel = acquisitionChannels.find(c => c.id === channelId);
            if (channel) {
                const updated = await marketingAPI.updateChannel(channelId, { ...channel, suspended: !isSuspended });
                setAcquisitionChannels(prev => prev.map(c => c.id === channelId ? updated : c));
            }
        } catch (error) {
            console.error("Error toggling channel suspension:", error);
        }
    };

    // Using unarchive/archive handlers directly in JSX or mapping them here if needed.
    // Dashboard.tsx previously had onArchiveAcquisitionChannel prop passed to MarketingCampaigns
    const handleArchiveAcquisitionChannel = async (channelId: number) => {
        try {
            const channel = acquisitionChannels.find(c => c.id === channelId);
            if (channel) {
                const updated = await marketingAPI.updateChannel(channelId, { ...channel, archived: true });
                setAcquisitionChannels(prev => prev.map(c => c.id === channelId ? updated : c));
            }
        } catch (error) {
            console.error("Error archiving channel:", error);
        }
    };

    const handleUnarchiveAcquisitionChannel = async (channelId: number) => {
        try {
            const channel = acquisitionChannels.find(c => c.id === channelId);
            if (channel) {
                const updated = await marketingAPI.updateChannel(channelId, { ...channel, archived: false });
                setAcquisitionChannels(prev => prev.map(c => c.id === channelId ? updated : c));
            }
        } catch (error) {
            console.error("Error unarchiving channel:", error);
        }
    };

    const notifications = useMemo(() => {
        return (contextNotifications || []).map((n: any) => ({
            id: n.id,
            message: n.message,
            type: (n.type as NotificationType) || 'info',
            read: n.is_read,
            timestamp: new Date(n.created_at || n.timestamp),
        }));
    }, [contextNotifications]);

    const dismissNotification = async (id: number) => {
        try {
            await notificationsAPI.markAsRead(id);
            await refreshNotifications();
        } catch (error) {
            console.error("Error dismissing notification:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unread = contextNotifications.filter((n: any) => !n.is_read);
            await Promise.all(unread.map((n: any) => notificationsAPI.markAsRead(n.id)));
            await refreshNotifications();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const handleClearNotifications = () => {
        // Since we don't have a "delete all" API yet, we just show a message or do nothing
        // Or we could mark all as read
        markAllAsRead();
    };



    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
                setIsNotificationPanelOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notificationPanelRef]);

    const toastNotifications = notifications.filter(n => !n.read);
    const unreadCount = notifications.filter(n => !n.read).length;

    const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [endDate, setEndDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

    const [selectedProfessional, setSelectedProfessional] = useState('Todos');
    const [data, setData] = useState(dashboardData[selectedUnit]?.['Todos'] || {});

    const handleDeleteService = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
            await deleteService(id);
        }
    };
    const handleSuspendService = async (id: number) => {
        await toggleSuspendService(id);
    };
    const handleDeletePackage = (id: number) => handlePackagesChange((currentUnitData?.packages || []).filter((p: any) => p.id !== id));
    const handleSuspendPackage = (id: number) => handlePackagesChange((currentUnitData?.packages || []).map((p: any) => p.id === id ? { ...p, suspended: !p.suspended } : p));
    const handleDeletePlan = (id: number) => handlePlansChange((currentUnitData?.plans || []).filter((p: any) => p.id !== id));
    const handleSuspendPlan = (id: number) => handlePlansChange((currentUnitData?.plans || []).map((p: any) => p.id === id ? { ...p, suspended: !p.suspended } : p));

    const [serviceCategories, setServiceCategories] = useState<string[]>([]);
    useEffect(() => {
        const uniqueCategories = [...new Set((currentUnitData?.services || []).map((s: Service) => s.category))];
        setServiceCategories(uniqueCategories.sort());
    }, [currentUnitData?.services]);

    const handleAddServiceCategory = (newCategory: string) => {
        const trimmedCategory = newCategory.trim();
        if (trimmedCategory && !serviceCategories.includes(trimmedCategory)) {
            setServiceCategories(prev => [...prev, trimmedCategory].sort());
        }
    };
    const handleUpdateServiceCategory = (oldCategory: string, newCategory: string) => {
        const trimmedNewCategory = newCategory.trim();
        if (!trimmedNewCategory || oldCategory === trimmedNewCategory) return;
        if (serviceCategories.some(cat => cat.toLowerCase() === trimmedNewCategory.toLowerCase())) {
            alert(`A categoria "${trimmedNewCategory}" já existe.`);
            return;
        }
        setServiceCategories(prev => prev.map(cat => cat === oldCategory ? trimmedNewCategory : cat).sort());
        handleServicesChange(currentUnitData.services.map((service: Service) => service.category === oldCategory ? { ...service, category: trimmedNewCategory } : service));
    };
    const handleDeleteServiceCategory = (categoryToDelete: string) => {
        const isCategoryInUse = currentUnitData.services.some((service: Service) => service.category === categoryToDelete);
        if (isCategoryInUse) {
            alert(`A categoria "${categoryToDelete}" está sendo usada por um ou mais serviços e não pode ser excluída.`);
            return;
        }
        if (window.confirm(`Tem certeza que deseja excluir a categoria "${categoryToDelete}"? Esta ação não pode ser desfeita.`)) {
            setServiceCategories(prev => prev.filter(cat => cat !== categoryToDelete));
        }
    };

    const handleUpdateTransaction = (updatedTransaction: Transaction) => handleTransactionsChange(currentUnitData.transactions.map((t: Transaction) => t.id === updatedTransaction.id ? updatedTransaction : t));

    const handleUnitsChange = (unitName: string) => {
        onUnitChange(unitName);
    };

    const handleUnitSelect = (unitName: string) => {
        if (unitName === selectedUnit) {
            setIsUnitSelectionModalOpen(false);
            return;
        }

        setIsUnitSelectionModalOpen(false);
        setIsSwitchingUnit(true);
        setAnimateContent(false);

        setTimeout(() => {
            onUnitChange(unitName);
        }, 300);

        const fetchTime = 1200 + Math.random() * 800;

        setTimeout(() => {
            setIsSwitchingUnit(false);
            setAnimateContent(true);
        }, fetchTime);
    };

    const handleUnitSwitchAnimation = () => {
        if (availableUnits.length <= 1) {
            setIsUnitLimitModalOpen(true);
            return;
        }

        if (isIndividualPlan) return;

        setIsUnitSelectionModalOpen(true);
    };

    // Reset the animation trigger after animations have played
    useEffect(() => {
        if (animateContent) {
            const timer = setTimeout(() => setAnimateContent(false), 1500); // Should be longer than the longest animation delay
            return () => clearTimeout(timer);
        }
    }, [animateContent]);


    const handleBackToDashboard = () => {
        setChatClientTarget(null);
        setActiveView('Visão Geral');
    };

    useEffect(() => {
        if (mainContentRef.current) {
            mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeView]);

    const handleSidebarClick = (view: string) => {
        if (view === 'clientApp') {
            navigate('clientApp');
            return;
        }
        if (view === 'Agendamento') {
            // navigate('scheduling'); // Removed from sidebar
        } else {
            if (view === activeView && mainContentRef.current) {
                mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setActiveView(view);
            }
        }
        setIsSidebarOpen(false);
    };

    // Date Filter Component and helpers
    const setDateRange = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
    };
    const setToday = () => {
        const now = new Date();
        setDateRange(new Date(now.setHours(0, 0, 0, 0)), new Date(now.setHours(23, 59, 59, 999)));
    };
    const setThisWeek = () => {
        const now = new Date();
        const first = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
        const firstDay = new Date(now.setDate(first));
        firstDay.setHours(0, 0, 0, 0);
        const lastDay = new Date(firstDay);
        lastDay.setDate(lastDay.getDate() + 6);
        lastDay.setHours(23, 59, 59, 999);
        setDateRange(firstDay, lastDay);
    };
    const setThisMonth = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        lastDay.setHours(23, 59, 59, 999);
        setDateRange(firstDay, lastDay);
    };
    const setThisYear = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31);
        lastDay.setHours(23, 59, 59, 999);
        setDateRange(firstDay, lastDay);
    };

    useEffect(() => {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            setDerivedPeriod('hoje');
        } else if (diffDays <= 7) {
            setDerivedPeriod('semana');
        } else if (diffDays <= 31) {
            setDerivedPeriod('mes');
        } else {
            setDerivedPeriod('anual');
        }
    }, [startDate, endDate]);

    useEffect(() => {
        setData(dashboardData[selectedUnit]?.[selectedProfessional] || {});
    }, [selectedUnit, selectedProfessional]);

    const DateFilterComponent = () => (
        <div className="bg-white p-4 rounded-2xl shadow-lg mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <label htmlFor="start-date" className="text-sm font-medium text-gray-700">{t('from')}:</label>
                    <input id="start-date" type="date" value={startDate.toISOString().split('T')[0]} onChange={(e) => setStartDate(new Date(e.target.value + 'T00:00:00'))} className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm" />
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="end-date" className="text-sm font-medium text-gray-700">{t('to')}:</label>
                    <input id="end-date" type="date" value={endDate.toISOString().split('T')[0]} onChange={(e) => setEndDate(new Date(e.target.value + 'T23:59:59'))} className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm" />
                </div>
            </div>
            <div className="flex items-center bg-light p-1 rounded-full overflow-x-auto">
                <button onClick={setToday} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${derivedPeriod === 'hoje' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('today')}</button>
                <button onClick={setThisWeek} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${derivedPeriod === 'semana' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('week')}</button>
                <button onClick={setThisMonth} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${derivedPeriod === 'mes' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('month')}</button>
                <button onClick={setThisYear} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${derivedPeriod === 'anual' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('year')}</button>
            </div>
        </div>
    );

    const FeedbackCard = () => {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg h-full">
                <h2 className="text-xl font-bold text-secondary mb-4 flex items-center">
                    <span className="text-2xl mr-2">🌟</span>
                    Feedback do Mês
                </h2>
                <p className="text-center text-gray-500 pt-8">Dados de feedback indisponíveis.</p>
            </div>
        );
    };

    const DashboardOverviewContent = () => {
        const { transactions, appointments, clients, professionals } = currentUnitData;
        const { promotions, notifications: contextNotifications, refreshNotifications } = useData();
        const periodKey = derivedPeriod === 'mes' ? 'mensal' : derivedPeriod;
        const [summary, setSummary] = useState<any>(null);
        const [loadingSummary, setLoadingSummary] = useState(false);
        const [rankings, setRankings] = useState<any[]>([]);
        const [loadingRankings, setLoadingRankings] = useState(false);

        useEffect(() => {
            const fetchRankings = async () => {
                setLoadingRankings(true);
                try {
                    const response = await professionalsAPI.getRanking({ limit: 5, unit: selectedUnit });
                    if (response.success) {
                        setRankings(response.data);
                    }
                } catch (error) {
                    console.error('Error fetching rankings:', error);
                } finally {
                    setLoadingRankings(false);
                }
            };
            fetchRankings();
        }, [selectedUnit]);

        useEffect(() => {
            const fetchSummary = async () => {
                setLoadingSummary(true);
                try {
                    const response = await financeAPI.getSummary({ period: derivedPeriod, unit: selectedUnit });
                    if (response.success) {
                        setSummary(response.data);
                    }
                } catch (error) {
                    console.error('Error fetching finance summary:', error);
                } finally {
                    setLoadingSummary(false);
                }
            };
            fetchSummary();
        }, [derivedPeriod, selectedUnit, transactions]);

        // Use summary if available, otherwise fallback to local calculation
        const kpisForPeriod = useMemo(() => {
            if (summary) {
                return {
                    faturamento: (summary.receitas || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    atendimentos: (summary.atendimentos || 0).toString(),
                    agendamentos: (summary.agendamentos || 0).toString(),
                    ticketMedio: (summary.ticket_medio || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    clientesHoje: (summary.clients_new || 0).toString()
                };
            }

            // Fallback to local calculation (the existing logic)
            const calculateKPIs = () => {
                const now = new Date();
                let start = new Date();
                let end = new Date();

                if (derivedPeriod === 'hoje') {
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                } else if (derivedPeriod === 'semana') {
                    const day = now.getDay();
                    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                    start = new Date(now.setDate(diff));
                    start.setHours(0, 0, 0, 0);
                    end = new Date(now.setDate(start.getDate() + 6));
                    end.setHours(23, 59, 59, 999);
                } else if (derivedPeriod === 'mes') {
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                } else {
                    start = new Date(now.getFullYear(), 0, 1);
                    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                }

                const periodTransactions = transactions.filter(t => {
                    const d = new Date(t.date);
                    return d >= start && d <= end && t.type === 'receita';
                });

                const periodAppointments = appointments.filter(a => {
                    const d = new Date(a.date);
                    return d >= start && d <= end;
                });

                const newClients = clients.filter(c => {
                    if (!c.registrationDate && !c.createdAt) return false;
                    const d = new Date(c.registrationDate || c.createdAt);
                    return d >= start && d <= end;
                });

                const faturamento = periodTransactions.reduce((acc, t) => acc + Number(t.amount), 0);
                const atendimentos = periodAppointments.filter(a => a.status === 'Atendido' || a.status === 'Completed').length;
                const agendamentos = periodAppointments.length;
                const ticketMedio = atendimentos > 0 ? faturamento / atendimentos : 0;

                return {
                    faturamento: faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    atendimentos: atendimentos.toString(),
                    agendamentos: agendamentos.toString(),
                    ticketMedio: ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    clientesHoje: newClients.length.toString()
                };
            };
            return calculateKPIs();
        }, [summary, transactions, appointments, clients, derivedPeriod]);

        const calculateChartData = () => {
            if (summary && summary.chartData && summary.chartLabels && summary.chartLabels.length > 0) {
                // Transform dataset array back to object format expected by PerformanceChart
                const dataObj: any = {
                    faturamento: [],
                    atendimentos: [],
                    agendamentos: [],
                    ticketMedio: [],
                    clientes: []
                };

                summary.chartData.forEach((ds: any) => {
                    if (ds.label === 'Faturamento') dataObj.faturamento = ds.data;
                    if (ds.label === 'Atendimentos') dataObj.atendimentos = ds.data;
                    if (ds.label === 'Agendamentos') dataObj.agendamentos = ds.data;
                    if (ds.label === 'Ticket Médio') dataObj.ticketMedio = ds.data;
                    if (ds.label === 'Novos Clientes' || ds.label === 'Clientes Hoje') dataObj.clientes = ds.data;
                });

                return {
                    labels: summary.chartLabels,
                    chartData: dataObj
                };
            }

            // LOCAL FALLBACK: Calculate from local appointments/transactions if API summary is missing
            const generateLocalChartData = () => {
                const today = new Date();
                const labels: string[] = [];
                const dataObj: any = {
                    faturamento: [],
                    atendimentos: [],
                    agendamentos: [],
                    ticketMedio: [],
                    clientes: []
                };

                if (derivedPeriod === 'hoje') {
                    // Hourly breakdown for today (8:00 to 20:00)
                    for (let hour = 8; hour <= 20; hour += 2) {
                        labels.push(`${hour}:00`);
                        const hourAppointments = appointments.filter(a => {
                            const apptDate = new Date(a.date);
                            const apptHour = parseInt(a.time?.split(':')[0] || '0');
                            return apptDate.toDateString() === today.toDateString() && apptHour >= hour && apptHour < hour + 2;
                        });
                        const hourTransactions = transactions.filter(t => {
                            const tDate = new Date(t.date);
                            return tDate.toDateString() === today.toDateString() && tDate.getHours() >= hour && tDate.getHours() < hour + 2;
                        });
                        const fat = hourTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
                        const completionStatuses = ['atendido', 'concluido', 'concluído', 'finalizado', 'pago'];
                        const atend = hourAppointments.filter(a => completionStatuses.includes((a.status || '').toLowerCase())).length;
                        dataObj.faturamento.push(fat);
                        dataObj.atendimentos.push(atend);
                        dataObj.agendamentos.push(hourAppointments.length);
                        dataObj.ticketMedio.push(atend > 0 ? fat / atend : 0);
                        dataObj.clientes.push(0);
                    }
                } else if (derivedPeriod === 'semana') {
                    // Daily breakdown for last 7 days
                    const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date(today);
                        d.setDate(d.getDate() - i);
                        labels.push(dayLabels[d.getDay()]);
                        const dayAppointments = appointments.filter(a => new Date(a.date).toDateString() === d.toDateString());
                        const dayTransactions = transactions.filter(t => new Date(t.date).toDateString() === d.toDateString());
                        const fat = dayTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
                        const completionStatuses = ['atendido', 'concluido', 'concluído', 'finalizado', 'pago'];
                        const atend = dayAppointments.filter(a => completionStatuses.includes((a.status || '').toLowerCase())).length;
                        dataObj.faturamento.push(fat);
                        dataObj.atendimentos.push(atend);
                        dataObj.agendamentos.push(dayAppointments.length);
                        dataObj.ticketMedio.push(atend > 0 ? fat / atend : 0);
                        dataObj.clientes.push(0);
                    }
                } else {
                    // Fallback: show simple metrics for "mes" or "anual"
                    labels.push('Período');
                    const fat = transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
                    const completionStatuses = ['atendido', 'concluido', 'concluído', 'finalizado', 'pago'];
                    const atend = appointments.filter(a => completionStatuses.includes((a.status || '').toLowerCase())).length;
                    dataObj.faturamento.push(fat);
                    dataObj.atendimentos.push(atend);
                    dataObj.agendamentos.push(appointments.length);
                    dataObj.ticketMedio.push(atend > 0 ? fat / atend : 0);
                    dataObj.clientes.push(clients.length);
                }

                return { labels, chartData: dataObj };
            };

            return generateLocalChartData();
        };

        const chartResult = calculateChartData();
        const chartData = chartResult.chartData;
        const chartLabels = chartResult.labels;

        return (
            <div className="container mx-auto px-6 py-8">
                <div className={animateContent ? 'animate-fade-slide-up' : 'opacity-100'}>
                    <DateFilterComponent />
                </div>
                {/* Stat Cards (alinhados ao período selecionado: Hoje/Semana/Mês/Anual) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className={animateContent ? 'animate-fade-slide-up-1' : 'opacity-100'}>
                        <StatCard title={t('dashboardRevenue')} value={kpisForPeriod.faturamento} icon={<DollarIcon />} color="bg-green-100 text-green-600" description="Total de faturamento financeiro (receitas) no período." />
                    </div>
                    <div className={animateContent ? 'animate-fade-slide-up-2' : 'opacity-100'}>
                        <StatCard title={t('dashboardAppointments')} value={kpisForPeriod.atendimentos} icon={<ClipboardCheckIcon />} color="bg-blue-100 text-blue-600" />
                    </div>
                    <div className={animateContent ? 'animate-fade-slide-up-3' : 'opacity-100'}>
                        <StatCard title={t('dashboardNewBookings')} value={kpisForPeriod.agendamentos} icon={<CardCalendarIcon />} color="bg-indigo-100 text-indigo-600" />
                    </div>
                    <div className={animateContent ? 'animate-fade-slide-up-4' : 'opacity-100'}>
                        <StatCard title={t('dashboardAvgTicket')} value={kpisForPeriod.ticketMedio} icon={<TicketIcon />} color="bg-yellow-100 text-yellow-600" />
                    </div>
                    <div className={animateContent ? 'animate-fade-slide-up-5' : 'opacity-100'}>
                        <StatCard title={t('dashboardNewClients')} value={kpisForPeriod.clientesHoje} icon={<CardUsersIcon />} color="bg-purple-100 text-purple-600" description="Novos clientes cadastrados através dos canais de captação." />
                    </div>
                </div>

                {/* Charts and Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className={`lg:col-span-2 ${animateContent ? 'animate-fade-slide-up-3' : 'opacity-100'}`}>
                        <PerformanceChart data={chartData} labels={chartLabels} period={derivedPeriod} />
                    </div>

                    <div className={animateContent ? 'animate-fade-slide-up-4' : 'opacity-100'}>
                        <DashboardPromoCarousel promotions={promotions.filter(p => p.type !== 'exclusive')} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className={animateContent ? 'animate-fade-slide-up-5' : 'opacity-100'}>
                        <AcquisitionChannelsChart clients={currentUnitData.clients || []} startDate={startDate} endDate={endDate} />
                    </div>
                    <div className={animateContent ? 'animate-fade-slide-up-5' : 'opacity-100'}>
                        <ReferralRanking clients={currentUnitData.clients || []} professionals={professionals || []} />
                    </div>
                </div>

                {/* Ranking de Avaliação de Profissionais (mensal, com destaque anual) */}
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg animate-fade-in">
                    <h2 className="text-xl font-bold text-secondary mb-1">Ranking Mensal de Avaliação de Profissionais</h2>
                    <p className="text-xs text-gray-400 mb-1">Atualizado com base nas avaliações recebidas no mês atual.</p>
                    <p className="text-sm text-gray-500 mb-4">Os 3 primeiros colocados recebem medalhas 🥇🥈🥉 e o profissional com melhor desempenho no ano é marcado com o selo "Melhor do ano".</p>
                    <ol className="space-y-4">
                        {loadingRankings ? (
                            <div className="text-center py-4">Carregando ranking...</div>
                        ) : rankings.length > 0 ? rankings.map((rank: any, index: number) => {
                            const prof = rank.professional;
                            const rating = parseFloat(rank.average_rating) || 0;
                            const reviews = rank.review_count;

                            const medals = ['🥇', '🥈', '🥉'];

                            return (
                                <li key={prof.id} className="bg-light p-3 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center justify-center w-8 text-lg font-bold text-gray-500">
                                            {index < 3 ? (
                                                <span className="text-2xl">{medals[index]}</span>
                                            ) : (
                                                <span>{index + 1}.</span>
                                            )}
                                        </div>
                                        {prof.photo && !prof.photo.includes('pravatar') ? (
                                            <img src={prof.photo} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-800">{prof.name}</p>
                                                {index === 0 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/40">
                                                        🏆 Melhor do ano
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-primary font-semibold flex items-center gap-2 mt-1">
                                                <StarRating rating={rating} />
                                                <span>{rating.toFixed(1)} · {reviews} avaliações</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{prof.occupation}</p>
                                        </div>
                                    </div>
                                </li>
                            );
                        }) : (
                            <p className="text-center text-gray-500 py-4">Nenhuma avaliação registrada ainda.</p>
                        )}
                    </ol>
                </div>
            </div>
        );
    };


    const renderContent = () => {
        const professionalForTimeClock = currentUnitData.professionals?.find((p: Professional) => p.email === currentUser?.email);

        switch (activeView) {
            case 'Visão Geral': return <AccountPage
                currentUser={currentUser!}
                navigate={navigate}
                isIndividualPlan={isIndividualPlan}
                selectedUnit={selectedUnit}
                onUnitChange={onUnitChange}
                units={units.map(u => ({ id: u.id, name: u.name }))}
                promotions={promotions.filter(p => p.type === 'exclusive')}
                onOpenPromoModal={handleOpenPromoModal}
                unitData={currentUnitData}
            />;
            case 'Super Admin: Salões': return <SuperAdminTenantsPage />;
            case 'Super Admin: Banners': return <SuperAdminBannersPage />;
            case 'Super Admin: YouTube': return (
                <div className="container mx-auto px-6 py-8">
                    <h2 className="text-2xl font-bold text-secondary mb-6">Moderação YouTube (GOD MODE)</h2>
                    <YouTubeCommentModeration
                        channelId=""
                        apiKey=""
                        isEnabled={true}
                    />
                </div>
            );
            case 'Super Admin: Tradução': return <TranslationPage onBack={handleBackToDashboard} />;
            case 'Super Admin: Diagnósticos': return <TestConnection />;
            case 'Super Admin: E-mail': return <EmailServerSettings />;
            case 'Painel de Controle': return <DashboardOverviewContent />;
            case 'Agente IA': return <AIAgentPage currentUser={currentUser} onActivateAI={onActivateAI} activeAIAgent={activeAIAgent} onBack={handleBackToDashboard} isIndividualPlan={isIndividualPlan} navigate={navigate} onComingSoon={onComingSoon} />;
            case 'Canais': return <ChannelsPage onBack={handleBackToDashboard} isIndividualPlan={isIndividualPlan} navigate={navigate} onComingSoon={onComingSoon} />;
            case 'Chat': return <ChatPage onBack={handleBackToDashboard} targetClientId={chatClientTarget} onClearTarget={() => setChatClientTarget(null)} onComingSoon={onComingSoon} />;
            case 'Promoção': return <MonthlyPackagesPage
                monthlyPackages={packages.filter(p => p.usageType === 'Promoção')}
                packageSubscriptions={packageSubscriptions}
                onSavePackage={handleSaveMonthlyPackage}
                onDeletePackage={handleDeleteMonthlyPackage}
                onTogglePackage={handleToggleMonthlyPackage}
                onOpenPackageModal={handleOpenPackageModal}
                isPackageModalOpen={isPackageModalOpen}
                onClosePackageModal={handleClosePackageModal}
                editingPackage={editingPackage}
                onSaveSubscription={handleSavePackageSubscription}
                onDeleteSubscription={handleDeletePackageSubscription}
                onOpenSubscriptionModal={handleOpenSubscriptionModal}
                isSubscriptionModalOpen={isSubscriptionModalOpen}
                onCloseSubscriptionModal={handleCloseSubscriptionModal}
                editingSubscription={editingSubscription}
                // Props avançadas de assinaturas
                onViewSubscription={handleViewSubscription}
                onArchiveSubscription={handleArchiveSubscription}
                onUnarchiveSubscription={handleUnarchiveSubscription}
                onAddPayment={handleAddPayment}
                onEditSubscriptionNotes={handleEditSubscriptionNotes}
                onDownloadSubscriptionReport={handleDownloadSubscriptionReport}
                // Props para promoções
                promotions={promotions.filter(p => p.type !== 'exclusive')}
                onSavePromotion={handleSavePromotion}
                onDeletePromotion={handleDeletePromotion}
                onTogglePromotion={handleTogglePromotion}
                onOpenPromoModal={handleOpenPromoModal}
                isPromoModalOpen={isPromoModalOpen}
                onClosePromoModal={handleClosePromoModal}
                editingPromotion={editingPromotion}
                onPromotionClick={handlePromotionClick}
            />;
            case 'Promoção Exclusiva': return <ExclusivePromotionsPage
                exclusivePromotions={exclusivePromotions}
                onSaveExclusive={handleSaveExclusive}
                onDeleteExclusive={handleDeleteExclusive}
                onToggleExclusive={handleToggleExclusive}
                onOpenExclusiveModal={handleOpenExclusiveModal}
                isExclusiveModalOpen={isExclusiveModalOpen}
                onCloseExclusiveModal={handleCloseExclusiveModal}
                editingExclusive={editingExclusive}
                onExclusiveClick={handleExclusivePromotionClick}
            />;
            case 'Marketing': return <MarketingCampaigns
                onAddCampaign={handleAddMarketingCampaign}
                onUpdateCampaign={handleUpdateMarketingCampaign}
                onArchiveCampaign={handleArchiveCampaign}
                onUnarchiveCampaign={handleUnarchiveCampaign}
                onDuplicateCampaign={handleDuplicateCampaign}
                campaigns={marketingCampaigns}
                onAddDirectMailCampaign={handleAddDirectMailCampaign}
                onUpdateDirectMailCampaign={handleUpdateDirectMailCampaign}
                onDeleteDirectMailCampaign={handleDeleteDirectMailCampaign}
                onArchiveDirectMailCampaign={handleArchiveDirectMailCampaign}
                onUnarchiveDirectMailCampaign={handleUnarchiveDirectMailCampaign}
                onSendDirectMailCampaign={handleSendDirectMailCampaign}
                directMailCampaigns={currentUnitData.directMailCampaigns || []}
                clients={clients || []}
                appointments={appointments || []}
                isIndividualPlan={isIndividualPlan}
                selectedUnitId={selectedUnitId}
                unitName={selectedUnit}
                unitPhone={unitPhone}
                acquisitionChannels={acquisitionChannels}
                onSaveAcquisitionChannel={handleSaveAcquisitionChannel}
                onSuspendAcquisitionChannel={handleSuspendAcquisitionChannel}
                onArchiveAcquisitionChannel={handleArchiveAcquisitionChannel}
                onUnarchiveAcquisitionChannel={handleUnarchiveAcquisitionChannel}
                onOpenEditChannelModal={handleOpenEditChannelModal}
                isNewChannelModalOpen={isNewChannelModalOpen}
                onCloseNewChannelModal={() => setIsNewChannelModalOpen(false)}
                channelToEdit={channelToEdit}
                navigate={navigate}
                onComingSoon={handleShowComingSoon}
            />;
            case 'Minha Agenda': return currentUser && ['admin', 'gerente', 'concierge', 'Administrador', 'Gerente', 'Concierge'].includes(currentUser.role || '') ? <GeneralAgendaPage onBack={handleBackToDashboard} currentUser={currentUser} isIndividualPlan={isIndividualPlan} professionals={currentUnitData.professionals || []} onComingSoon={onComingSoon} /> : <ProfessionalAgendaPage currentUser={currentUser} onBack={handleBackToDashboard} navigate={navigate} onComingSoon={onComingSoon} />;
            case 'Clientes': return <ClientListPage onBack={handleBackToDashboard} navigate={navigate} clients={clients || []} onAddNewClient={handleSaveClientDashboard} acquisitionChannels={currentUnitData.acquisitionChannels || []} onOpenChat={handleOpenChatForClient} onDeleteClient={handleDeleteClientDashboard} onBlockClient={handleBlockClientDashboard} onUnblockClient={handleUnblockClientDashboard} isIndividualPlan={isIndividualPlan} onComingSoon={onComingSoon} />;
            case 'CRM': return <CRMPage onBack={handleBackToDashboard} currentUser={currentUser} clients={currentUnitData.clients || []} appointments={currentUnitData.appointments || []} navigate={navigate} onOpenChat={handleOpenChatForClient} onComingSoon={onComingSoon} />;
            case 'Profissionais': return <ProfessionalsPage onBack={handleBackToDashboard} isIndividualPlan={isIndividualPlan} />;
            case 'Registro de Ponto': return <TimeClockPage currentUser={currentUser} onBack={handleBackToDashboard} professional={professionalForTimeClock} isIndividualPlan={isIndividualPlan} onComingSoon={onComingSoon} />;
            case 'Serviços': return <ServicesPage onBack={handleBackToDashboard} />;
            case 'Estoque': return <StockPage onBack={handleBackToDashboard} />;
            case 'Contratos': return <ContractPage onBack={handleBackToDashboard} currentUser={currentUser} onComingSoon={onComingSoon} />;
            case 'Financeiro': return <FinancialDashboardPage onBack={handleBackToDashboard} clients={currentUnitData.clients || []} transactions={currentUnitData.transactions || []} onSaveTransaction={handleSaveTransaction} onUpdateTransaction={handleUpdateTransaction} onComingSoon={onComingSoon} unitName={selectedUnit} />;
            case 'Relatórios': return <ReportsPage onBack={handleBackToDashboard} isIndividualPlan={isIndividualPlan} onComingSoon={onComingSoon} />;
            case 'Suporte': return <SupportPage onBack={handleBackToDashboard} currentUser={currentUser!} onComingSoon={onComingSoon} />;
            case 'Configurações': return <SettingsPage
                onBack={handleBackToDashboard}
                units={Object.keys(allData).map((name, id) => ({ id, name, ...allData[name].unitDetails }))}
                selectedUnit={selectedUnit}
                onUnitsChange={handleUnitsChange}
                isIndividualPlan={isIndividualPlan}
                onPayInstallment={onPayInstallment}
                currentUser={currentUser}
                onLogout={onLogout}
                navigate={navigate}
                users={users}
                onUsersChange={onUsersChange}
                onComingSoon={onComingSoon}
            />;
            // onUsersChange needs real implementation
            default: return <PlaceholderComponent title={activeView} onBack={handleBackToDashboard} />;
        }
    };

    const roleMap: { [key: string]: string } = { admin: 'Administrador', gerente: 'Gerente', concierge: 'Concierge', profissional: 'Profissional', Administrador: 'Administrador', Gerente: 'Gerente', Profissional: 'Profissional' };
    const roleDisplayName = currentUser?.role ? roleMap[currentUser.role] : '';
    const currentUserWithId = currentUser
        ? (users.find(u => u.email === currentUser.email) || { id: -1, ...currentUser })
        : null;
    const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    const WarningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    const notificationIcons: { [key in NotificationType]: React.ReactNode } = { info: <InfoIcon />, success: <SuccessIcon />, warning: <WarningIcon /> };
    const notificationTextColors: { [key in NotificationType]: string } = { info: 'text-blue-500', success: 'text-green-500', warning: 'text-yellow-500' };


    const sidebarItems = [
        { name: t('overview'), icon: <HomeIcon />, key: 'Visão Geral', internalKey: 'dashboard' },
        { name: t('dashboard'), icon: <DashboardIcon />, key: 'Painel de Controle', internalKey: 'dashboard' },
        { name: t('marketing'), icon: <MarketingIcon />, key: 'Marketing', internalKey: 'marketing' },
        { name: t('aiAgent'), icon: <AIIcon />, key: 'Agente IA', internalKey: 'aiAgent' },
        { name: t('channels'), icon: <ChannelsIcon />, key: 'Canais', internalKey: 'channels' },
        { name: t('chat'), icon: <ChatIcon />, key: 'Chat', internalKey: 'chat' },
        { name: t('myAgenda'), icon: <MyAgendaIcon />, key: 'Minha Agenda', internalKey: 'minhaAgenda' },
        { name: t('clients'), icon: <SidebarUsersIcon />, key: 'Clientes', internalKey: 'clientes' },
        { name: t('crm'), icon: <CrmIcon />, key: 'CRM', internalKey: 'crm' },
        { name: t('professionals'), icon: <ProfessionalsIcon />, key: 'Profissionais', internalKey: 'profissionais' },
        { name: t('timeClock'), icon: <ClockIcon />, key: 'Registro de Ponto', internalKey: 'registroPonto' },
        { name: t('services'), icon: <ServicesIcon />, key: 'Serviços', internalKey: 'servicos' },
        { name: t('stock'), icon: <StockIcon />, key: 'Estoque', internalKey: 'estoque' },
        { name: t('contracts'), icon: <ContractIcon />, key: 'Contratos', internalKey: 'contratos' },
        { name: t('financial'), icon: <SidebarDollarIcon />, key: 'Financeiro', internalKey: 'financeiro' },
        { name: t('reports'), icon: <ReportsIcon />, key: 'Relatórios', internalKey: 'relatorio' },
        { name: t('support'), icon: <HeadsetIcon />, key: 'Suporte', internalKey: 'suporte' },
        { name: t('settings'), icon: <SettingsIcon />, key: 'Configurações', internalKey: 'configuracoes' },
    ];

    const superAdminItems = [
        { name: 'Gestão de Salões', icon: <UnitIcon />, key: 'Super Admin: Salões', internalKey: 'tenants' },

        { name: 'Promoção', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, key: 'Promoção', internalKey: 'promotions' },
        { name: 'Promoção Exclusiva', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>, key: 'Promoção Exclusiva', internalKey: 'exclusivePromotions' },
    ];

    const filteredSidebarItems = isSuperAdmin ? [...superAdminItems, ...sidebarItems] : sidebarItems.filter(item => {
        const userRole = currentUser?.role || 'Profissional';
        const rolePerms = rolePermissions[userRole] || rolePermissions['Profissional'];
        const itemKey = item.internalKey as keyof typeof rolePerms;

        // Special mapping for keys that might differ
        if (item.key === 'Visão Geral' || item.key === 'Painel de Controle') return rolePerms.dashboard?.view;
        if (item.key === 'Promoção' || item.key === 'Promoção Exclusiva') return userRole === 'admin' || userRole === 'Administrador';


        // Strict restriction for Profissional
        if (userRole === 'profissional' || userRole === 'Profissional') {
            return ['minhaAgenda', 'registroPonto', 'suporte'].includes(item.internalKey);
        }

        return rolePerms[itemKey]?.view !== false;
    });

    return (
        <div className="min-h-screen bg-light flex">
            <aside className={`w-64 bg-secondary text-white p-4 flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="mb-8 px-4 flex justify-between items-center">
                    {currentUser?.tenant?.logo_url ? (
                        <img src={currentUser.tenant.logo_url} alt={currentUser.tenant.name || 'Logo'} className="h-10 mx-auto object-contain" />
                    ) : (
                        <a href="#" onClick={(e) => { e.preventDefault(); goBack(); }} className="text-center block text-3xl font-extrabold text-white no-underline break-words px-2">{currentUser?.tenant?.name || 'Salão24h'}</a>
                    )}
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-300 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <nav className="flex-grow overflow-y-auto">
                    <ul>{filteredSidebarItems.map((item, index) => (<li key={index}><a href="#" onClick={(e) => { e.preventDefault(); handleSidebarClick(item.key); }} className={`flex items-center py-3 px-4 my-1 rounded-lg transition-colors duration-200 ${activeView === item.key ? 'bg-primary text-white font-bold' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>{item.icon}<span className="ml-3">{item.name}</span></a></li>))}</ul>
                </nav>
                <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="px-4 mb-2">
                        <p className="text-xs text-gray-400">{t('activeUnit')}</p>
                        <p className="font-bold text-white">{selectedUnit}</p>
                    </div>
                    {!isIndividualPlan && (
                        <button onClick={handleUnitSwitchAnimation} disabled={isSwitchingUnit} className="flex items-center py-3 px-4 rounded-lg hover:bg-white/10 transition-colors w-full text-gray-300 disabled:cursor-not-allowed">
                            <UnitIcon />
                            <span className="ml-3">{t('changeUnit')}</span>
                        </button>
                    )}
                    <button onClick={onLogout} className="flex items-center py-3 px-4 rounded-lg hover:bg-white/10 transition-colors w-full text-gray-300">
                        <LogoutIcon />
                        <span className="ml-3">{t('logout')}</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <div aria-live="assertive" className="fixed inset-0 flex items-start px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50 mt-16">
                    <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                        {toastNotifications.slice(0, 3).map((notification) => (<div key={notification.id} className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${notification.isFadingOut ? 'animate-fade-out' : 'animate-fade-in'}`}><div className="p-4"><div className="flex items-start"><div className={`flex-shrink-0 ${notificationTextColors[notification.type]}`}>{notificationIcons[notification.type]}</div><div className="ml-3 w-0 flex-1 pt-0.5"><p className="text-sm font-medium text-gray-900">{notification.message}</p></div><div className="ml-4 flex-shrink-0 flex"><button onClick={() => dismissNotification(notification.id)} className="inline-flex text-gray-400 hover:text-gray-500"><span className="sr-only">Fechar</span><svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button></div></div></div></div>))}
                    </div>
                </div>

                <header className={`flex-shrink-0 bg-white shadow-md z-10`}>
                    <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                        <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 md:hidden"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                        <div className="hidden md:block"><h1 className="text-xl font-bold text-secondary">{sidebarItems.find(item => item.key === activeView)?.name || activeView}</h1></div>
                        <div className="flex items-center space-x-5">
                            <div className="relative group">
                                <button onClick={() => handleSidebarClick('Visão Geral')} className="text-gray-500 hover:text-primary"><HomeIcon /></button>
                                <div className="absolute top-full mt-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10" style={{ transform: 'translateX(-50%) translateY(0.5rem)' }}>{t('overview')}<div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-b-gray-800"></div></div>
                            </div>

                            <GlobalReminders />

                            <div className="relative group" ref={notificationPanelRef}>
                                <button onClick={() => setIsNotificationPanelOpen(prev => !prev)} className="text-gray-500 hover:text-primary relative"><BellIcon />{unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span></span>}</button>
                                <div className="absolute top-full mt-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10" style={{ transform: 'translateX(-50%) translateY(0.5rem)' }}>{t('notifications')}<div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-b-gray-800"></div></div>

                                {isNotificationPanelOpen && (<div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20 animate-fade-in-down"><div className="p-3 flex justify-between items-center border-b"><h3 className="font-bold text-gray-700">{t('notifications')}</h3><button onClick={markAllAsRead} className="text-xs text-primary hover:underline font-semibold">{t('markAllAsRead')}</button></div><div className="max-h-80 overflow-y-auto">{notifications.length > 0 ? notifications.map(n => (<div key={n.id} className={`p-3 border-b flex items-start gap-3 transition-colors ${!n.read ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-100`}><div className={`flex-shrink-0 mt-1 ${notificationTextColors[n.type]}`}>{notificationIcons[n.type]}</div><div><p className="text-sm text-gray-800">{n.message}</p><p className="text-xs text-gray-400">{formatRelativeTime(n.timestamp)}</p></div></div>)) : <p className="text-center text-gray-500 py-6">{t('noNotifications')}.</p>}</div><div className="p-2 bg-gray-50 text-center"><button onClick={handleClearNotifications} className="text-xs text-red-500 hover:underline font-semibold">{t('clearHistory')}</button></div></div>)}
                            </div>
                            <div className="relative group">
                                <button onClick={() => setIsChatOpen(prev => !prev)} className="text-gray-500 hover:text-primary relative"><ChatIcon />{totalUnread > 0 && (<span className="absolute -top-1 -right-2 flex h-5 w-5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-primary text-white text-xs items-center justify-center">{totalUnread}</span></span>)}</button>
                                <div className="absolute top-full mt-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10" style={{ transform: 'translateX(-50%) translateY(0.5rem)' }}>{t('chat')}<div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-b-gray-800"></div></div>
                            </div>
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <img src={currentUser?.avatarUrl} alt={currentUser ? t('avatarAlt', { name: currentUser.name }) : t('userAvatar')} className="w-10 h-10 rounded-full border border-gray-200" />
                                    <div className="hidden sm:block text-left">
                                        <p className="font-bold text-secondary text-sm leading-tight">{currentUser?.name}</p>
                                        <p className="text-xs text-gray-500 leading-tight">{roleDisplayName}</p>
                                    </div>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fade-in-down py-2">
                                        <div className="px-4 py-2 border-b border-gray-50 mb-2">
                                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('activePlan') || 'Plano Ativo'}</p>
                                            <p className="text-sm font-bold text-primary">
                                                {isIndividualPlan ? 'Plano Individual' : (currentUser?.plan === 'Vitalício' ? 'Plano Vitalício' : 'Plano Empresa')}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <button
                                                onClick={() => { handleSidebarClick('Configurações'); setIsUserMenuOpen(false); }}
                                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors gap-3"
                                            >
                                                <SettingsIcon />
                                                <span>{t('settings')}</span>
                                            </button>

                                            <div className="border-t border-gray-50 my-1"></div>

                                            <button
                                                onClick={onLogout}
                                                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors gap-3"
                                            >
                                                <LogoutIcon />
                                                <span>{t('logout')}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main ref={mainContentRef} className={`flex-1 overflow-y-auto`}>
                    {isSwitchingUnit ? <DashboardSkeleton /> : renderContent()}
                </main>

                {/* Coming Soon Overlays */}

                {/* Generic Coming Soon Modal for child components */}
                <ComingSoonModal
                    isOpen={!!comingSoonFeature}
                    onClose={() => setComingSoonFeature(null)}
                    title={comingSoonFeature || 'Em Breve'}
                    description={`A funcionalidade "${comingSoonFeature}" está em desenvolvimento e será liberada em breve. Fique atento às próximas atualizações!`}
                />

                {isChatOpen && currentUserWithId && <InternalChat onClose={() => setIsChatOpen(false)} users={users} currentUser={currentUserWithId} unreadMessages={unreadMessages} onClearUnread={handleClearUnread} />}

                {/* Unit Selection Modal */}
                {isUnitSelectionModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-secondary">Trocar Unidade</h3>
                                    <p className="text-gray-500 text-sm mt-1">Selecione a unidade que deseja acessar hoje</p>
                                </div>
                                <button
                                    onClick={() => setIsUnitSelectionModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-4 max-h-[60vh] overflow-y-auto">
                                <div className="grid gap-3">
                                    {availableUnits.map(unitName => {
                                        const unit = allData[unitName]?.unitDetails;
                                        const isActive = unitName === selectedUnit;

                                        return (
                                            <button
                                                key={unitName}
                                                onClick={() => handleUnitSelect(unitName)}
                                                className={`flex items-center p-4 rounded-2xl transition-all border-2 text-left group
                                                    ${isActive
                                                        ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                                                        : 'border-gray-50 hover:border-primary/30 hover:bg-gray-50'}`}
                                            >
                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 mr-4 flex-shrink-0 border border-gray-100">
                                                    {unit?.logo_url ? (
                                                        <img src={unit.logo_url} alt={unitName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                                                            {unitName.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-grow">
                                                    <h4 className={`font-bold text-lg ${isActive ? 'text-primary' : 'text-secondary'}`}>
                                                        {unitName}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                                        {unit?.address?.street
                                                            ? `${unit.address.street}${unit.address.number ? `, ${unit.address.number}` : ''}`
                                                            : 'Sem endereço cadastrado'}
                                                    </p>
                                                </div>
                                                {isActive ? (
                                                    <div className="bg-primary text-white p-1 rounded-full">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                ) : (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-sm text-gray-400">Total: {availableUnits.length} {availableUnits.length === 1 ? 'unidade' : 'unidades'}</span>
                                <button
                                    onClick={() => {
                                        setIsUnitSelectionModalOpen(false);
                                        handleSidebarClick('Configurações');
                                    }}
                                    className="text-sm font-bold text-primary hover:underline flex items-center gap-2"
                                >
                                    <UnitIcon />
                                    Gerenciar Unidades
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Unit Limit Modal */}
                {isUnitLimitModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Nova Unidade?</h3>
                            <p className="text-gray-600 mb-6">
                                Você possui apenas uma unidade cadastrada. Deseja criar uma nova unidade agora?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsUnitLimitModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Não
                                </button>
                                <button
                                    onClick={() => {
                                        setIsUnitLimitModalOpen(false);
                                        handleSidebarClick('Configurações');
                                    }}
                                    className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    Sim, criar unidade
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}