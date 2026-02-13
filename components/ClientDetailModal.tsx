import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { clientsAPI, appointmentsAPI, packagesAPI, salonPlansAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useData, Client as DataContextClient, mapClientFromAPI } from '../contexts/DataContext';
import ReminderModal from './ReminderModal';
import SignatureModal from './SignatureModal';
import ScheduleInternalModal from './ScheduleInternalModal';

// ... existing icons ...
const CheckCircleIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

declare var jspdf: any;

declare var jspdf: any;

// --- Interfaces ---
interface ClientHistory {
    id: number;
    name: string;
    date: string;
    time: string;
    professional: string;
    type?: string;
    sessionInfo?: string | null;
    package_id?: number | null;
    salon_plan_id?: number | null;
    cancellation_reason?: string | null;
    canceled_at?: string | null;
    consumed_sessions?: number;
    total_sessions?: number;
    professionalId?: number; // From API map
    service_id?: number; // From API map
    professional_name?: string;
    service_name?: string;
    price?: string; // Ensure price is available for refund logic
    status?: string; // Ensure status is available for refund logic
}

interface ClientPackage {
    id: number;
    name: string;
    total_sessions: number;
    used_sessions: number;
    sessions?: number | string;
    type: 'package' | 'plan';
    package_id?: number;
    plan_id?: number;
    status: 'active' | 'expired' | 'archived';
}

interface ClientDocument {
    id?: number;
    name: string;
    signed: boolean;
    content?: string;
    type?: 'Contrato' | 'Termo';
    signatureImg?: string;
    userPhoto?: string;
}

interface Reminder {
    id: number;
    subject: string;
    text: string;
    date: string; // Unified field
    dateTime: string; // Keep for legacy/UI compatibility
    status: 'pending' | 'completed';
    completed: boolean; // Unified field
    unitId?: number;
}

type Client = DataContextClient & {
    history: ClientHistory[];
    documents: ClientDocument[];
    packages: ClientPackage[];
    reminders?: Reminder[];
    totalSpent?: string | number;
    averageTicket?: string | number;
    mostFrequentService?: string;
};

interface ClientDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    navigate: (page: string, params?: any) => void;
    onEdit?: (client: Client) => void;
    onSave?: (client: Client) => void;
    existingClients: Client[];
    onDelete?: (clientId: number) => void;
    onBlock?: (clientId: number, reason: string) => void;
    onUnblock?: (clientId: number) => void;
    onDeleteAppointment?: (appointmentId: number) => void;
    onRefresh?: () => void; // Added for refreshing client data after internal schedule
}

// --- Icons ---
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IdCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a1 1 0 100-2 1 1 0 000 2z" /></svg>;
const CakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V8a1 1 0 011-1h12a1 1 0 011 1v7.546zM12 12.5a.5.5 0 110-1 .5.5 0 010 1zM3 21h18v-1a1 1 0 00-1-1H4a1 1 0 00-1 1v1z" /></svg>;
const QuestionMarkCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
const BuildingStorefrontIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const PhotoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>;
const ContractIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const VisitsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm0 14h.01M7 17h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2zm10-14h.01M17 3h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2V5a2 2 0 012-2zm0 14h.01M17 17h5a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-5a2 2 0 012-2z" /></svg>;
const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>;
const StarIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const PackageIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5 9a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-8a1 1 0 11-2 0 1 1 0 012 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;


const ViewIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V8m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5 5" /></svg>;
const DownloadIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const TrashIcon = ({ className = "h-5 w-5" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const HeaderStat: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="flex items-center text-sm text-gray-400">
        <span className="mr-2">{icon}</span>
        <div>
            <p className="font-semibold text-white leading-tight">{value}</p>
            <p className="text-xs leading-tight">{label}</p>
        </div>
    </div>
);

const InfoSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="py-6 border-b border-gray-200 last:border-b-0">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        {children}
    </div>
);

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string | React.ReactNode; }> = ({ icon, label, value }) => {
    if (!value || value === 'Não informado' || (typeof value === 'string' && value.trim() === '')) return null;
    return (
        <div className="flex items-start gap-3">
            <span className="mt-1 text-gray-400 flex-shrink-0">{icon}</span>
            <div>
                <p className="text-xs font-semibold text-gray-500">{label}</p>
                <p className="text-sm text-gray-800 break-words max-w-[200px]">{value}</p>
            </div>
        </div>
    );
};

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ isOpen, onClose, client, navigate, onEdit, onSave, existingClients, onDelete, onBlock, onUnblock, onRefresh }) => {
    const { t } = useLanguage();
    const { saveClient, salonPlans, packages, professionals, selectedUnitId } = useData();
    const [isExiting, setIsExiting] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [activeSubTab, setActiveSubTab] = useState('servicos');
    const { user } = useAuth();
    const isAdmin = ['admin', 'gerente', 'Administrador', 'Gerente'].includes(user?.role || '');

    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [appointmentToRefund, setAppointmentToRefund] = useState<number | null>(null);

    const [localClient, setLocalClient] = useState<Client | null>(client);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(isOpen && !!client);

    // State for confirmation modal
    const [isConfirmingAction, setIsConfirmingAction] = useState<'block' | 'unblock' | 'delete' | null>(null);
    const [blockReason, setBlockReason] = useState('');
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    // State for reminders
    const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
    const [dismissedReminders, setDismissedReminders] = useState<number[]>([]);

    // State for signature
    const [signatureModal, setSignatureModal] = useState({ isOpen: false, item: null as any });
    const [internalScheduleModal, setInternalScheduleModal] = useState<{
        isOpen: boolean;
        historyItem: ClientHistory | null;
    }>({
        isOpen: false,
        historyItem: null,
    });
    const [documentToSign, setDocumentToSign] = useState<ClientDocument | null>(null);
    const [viewingSignedDoc, setViewingSignedDoc] = useState<ClientDocument | null>(null);
    const [concludingId, setConcludingId] = useState<number | null>(null);
    const [concludeQty, setConcludeQty] = useState(1);

    // Fetch full client details when modal opens
    const clientId = client?.id;
    useEffect(() => {
        if (isOpen && clientId) {
            let canceled = false;

            // Re-sync with props if clientId changed or localClient is missing
            if (!localClient || localClient.id !== clientId) {
                setLocalClient(client);
                setIsLoadingDetails(true);
            }

            const fetchDetails = async () => {
                // We only setIsLoadingDetails(true) if we don't have enough data
                // In this case, we always want the "full" data from getById
                try {
                    const response = await clientsAPI.getById(clientId);
                    if (!canceled) {
                        const clientData = response.data || response;
                        const fullClient = mapClientFromAPI(clientData);
                        setLocalClient(fullClient);
                    }
                } catch (error) {
                    console.error("Error fetching client details:", error);
                } finally {
                    if (!canceled) setIsLoadingDetails(false);
                }
            };

            fetchDetails();
            return () => { canceled = true; };
        } else if (!isOpen) {
            // Reset loading state when closed
            setIsLoadingDetails(false);
        }
    }, [clientId, isOpen]);

    // Controla lembretes enquanto o modal está aberto
    useEffect(() => {
        if (!isOpen || !localClient?.reminders) return;

        const upcomingReminder = localClient.reminders
            .filter(r => (r.status === 'pending' || !r.completed) && !dismissedReminders.includes(r.id))
            .sort((a, b) => new Date(a.date || a.dateTime).getTime() - new Date(b.date || b.dateTime).getTime())[0];

        setActiveReminder(upcomingReminder || null);
    }, [isOpen, localClient, dismissedReminders]);

    // Reseta lembretes quando o modal é fechado
    useEffect(() => {
        if (!isOpen) {
            setActiveReminder(null);
            setDismissedReminders([]);
            setIsLoadingDetails(false);
        }
    }, [isOpen]);

    const handleDismissTemporarily = () => {
        if (!activeReminder) return;
        setDismissedReminders(prev => [...prev, activeReminder.id]);
        setActiveReminder(null);
    };

    // Handlers for subscription management
    const refetchClient = async () => {
        if (!clientId) return;
        try {
            const response = await clientsAPI.getById(clientId);
            const clientData = response.data || response;
            const fullClient = mapClientFromAPI(clientData);
            setLocalClient(fullClient);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error("Error refreshing client:", error);
        }
    };

    const handleArchiveSubscription = async (id: number, type: 'package' | 'plan') => {
        if (!window.confirm('Deseja marcar este contrato como Concluído/Cancelado?')) return;
        try {
            if (type === 'package') {
                await packagesAPI.archiveSubscription(id);
            } else {
                await salonPlansAPI.archiveSubscription(id);
            }
            await refetchClient();
        } catch (error) {
            alert('Erro ao atualizar status do contrato.');
            console.error(error);
        }
    };

    const handleDeleteSubscription = async (id: number, type: 'package' | 'plan') => {
        if (!window.confirm('Tem certeza que deseja excluir este contrato? Esta ação é irreversível e removerá o histórico associado se não houver vínculos.')) return;
        try {
            if (type === 'package') {
                await packagesAPI.deleteSubscription(id);
            } else {
                await salonPlansAPI.deleteSubscription(id);
            }
            await refetchClient();
        } catch (error) {
            alert('Erro ao excluir contrato.');
            console.error(error);
        }
    };

    const handleMarkAsComplete = () => {
        if (!activeReminder || !localClient) return;

        const updatedClient = {
            ...localClient,
            reminders: localClient.reminders?.map(r =>
                r.id === activeReminder.id ? { ...r, status: 'completed' as const, completed: true } : r
            )
        };

        setLocalClient(updatedClient);

        if (onSave) onSave(updatedClient);

        // Also dismiss it from the current session's view
        handleDismissTemporarily();
    };


    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleSaveReminder = (reminder: { subject: string; text: string; dateTime: string }) => {
        if (!localClient) return;

        const newReminder: Reminder = {
            id: Date.now(),
            status: 'pending',
            completed: false,
            date: reminder.dateTime, // Ensure both are present
            unitId: selectedUnitId || undefined,
            ...reminder,
        };

        const updatedClient = {
            ...localClient,
            reminders: [...(localClient.reminders || []), newReminder],
        };

        setLocalClient(updatedClient);
        if (onSave) onSave(updatedClient);

        setNotification(t('reminderSavedSuccess'));
    };

    const financialSummary = useMemo(() => {
        if (!localClient) return { totalSpent: 0, averageTicket: 0, mostFrequentService: t('noServicesYet') };

        // Prioritize backend calculated values if they exist
        if (localClient.totalSpent !== undefined && localClient.totalSpent > 0) {
            return {
                totalSpent: parseFloat(localClient.totalSpent),
                averageTicket: parseFloat(localClient.averageTicket) || 0,
                mostFrequentService: localClient.mostFrequentService || t('noServicesYet')
            };
        }

        const completedServices = localClient.history.filter(
            h => ['atendido', 'concluido', 'concluído'].includes((h.status || '').toLowerCase())
        );

        if (completedServices.length === 0) {
            return { totalSpent: 0, averageTicket: 0, mostFrequentService: t('noServicesYet') };
        }

        const totalSpent = completedServices.reduce((sum, historyItem) => {
            const priceStr = String(historyItem.price || '0').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            const price = parseFloat(priceStr) || 0;
            return sum + price;
        }, 0);

        const averageTicket = totalSpent / completedServices.length;

        const serviceCounts = completedServices.reduce((acc, item) => {
            acc[item.name] = (acc[item.name] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const mostFrequentService = Object.keys(serviceCounts).reduce((a, b) => serviceCounts[a] > serviceCounts[b] ? a : b, t('noServicesYet'));

        return { totalSpent, averageTicket, mostFrequentService };
    }, [localClient, t]);

    const handlePrint = () => {
        if (!localClient) return;
        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF();
            const margin = 15;
            let y = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const usableWidth = pageWidth - margin * 2;

            // Function to check for page break
            const checkPageBreak = (heightNeeded: number) => {
                if (y + heightNeeded > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    y = margin;
                }
            };

            // Title
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(`Perfil do Cliente: ${localClient.legalName || localClient.name}`, margin, y);
            y += 20;

            // --- Personal & Contact Info ---
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Dados Pessoais e Contato', margin, y);
            y += 10;
            (doc as any).autoTable({
                startY: y,
                theme: 'grid',
                headStyles: { fillColor: [240, 240, 240], textColor: 20 },
                body: [
                    ['Nome Completo', localClient.legalName || localClient.name],
                    ['Nome Social', localClient.socialName || 'N/A'],
                    ['E-mail', localClient.email],
                    ['Telefone', localClient.phone],
                    ['CPF', localClient.cpf],
                    ['Data de Nascimento', localClient.birthdate ? localClient.birthdate.split('T')[0].split('-').reverse().join('/') : 'N/A'],
                ],
                styles: { fontSize: 10 },
            });
            y = (doc as any).autoTable.previous.finalY + 10;

            // --- Address ---
            checkPageBreak(40);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(t('address'), margin, y);
            y += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const fullAddress = localClient.address ? `${localClient.address.street}, ${localClient.address.number}${localClient.address.complement ? ` (${localClient.address.complement})` : ''} \n${localClient.address.neighborhood} - ${localClient.address.city}/${localClient.address.state}\nCEP: ${localClient.address.cep}` : 'Endereço não fornecido';
            const addressLines = doc.splitTextToSize(fullAddress, usableWidth);
            doc.text(addressLines, margin, y);
            y += (addressLines.length * 5) + 10;

            // --- Relationships ---
            if (localClient.relationships && localClient.relationships.length > 0) {
                checkPageBreak(50);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(t('relationshipSectionTitle'), margin, y);
                y += 10;
                const relationshipBody = localClient.relationships.map(rel => {
                    const relatedClient = existingClients.find(c => c.id === rel.clientId);
                    return [rel.type, relatedClient ? relatedClient.name : 'Cliente não encontrado'];
                });
                (doc as any).autoTable({
                    startY: y,
                    head: [[t('relationshipType'), t('relationshipPerson')]],
                    body: relationshipBody,
                    theme: 'striped',
                    headStyles: { fillColor: [240, 240, 240], textColor: 20 },
                    styles: { fontSize: 10 },
                });
                y = (doc as any).autoTable.previous.finalY + 15;
            }

            // --- Financial Summary ---
            checkPageBreak(60);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(t('financialSummary'), margin, y);
            y += 10;
            (doc as any).autoTable({
                startY: y,
                theme: 'grid',
                headStyles: { fillColor: [240, 240, 240], textColor: 20 },
                body: [
                    [t('totalSpent'), financialSummary.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                    [t('averageTicket'), financialSummary.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                    [t('mostFrequentService'), financialSummary.mostFrequentService],
                ],
                styles: { fontSize: 10 },
            });
            y = (doc as any).autoTable.previous.finalY + 15;

            // --- Observations ---
            if (localClient.preferences && localClient.preferences.length > 0) {
                checkPageBreak(30 + localClient.preferences.length * 5);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(t('observationsAndPreferences'), margin, y);
                y += 10;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                localClient.preferences.forEach(pref => {
                    const prefLines = doc.splitTextToSize(`• ${pref}`, usableWidth);
                    checkPageBreak(prefLines.length * 5);
                    doc.text(prefLines, margin, y);
                    y += (prefLines.length * 5) + 2;
                });
                y += 10;
            }

            // --- Service History ---
            if (localClient.history && localClient.history.length > 0) {
                checkPageBreak(50);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(t('serviceHistory'), margin, y);
                y += 10;
                (doc as any).autoTable({
                    startY: y,
                    head: [[t('date'), 'Serviço', 'Profissional', 'Status', 'Valor']],
                    body: localClient.history.map(h => [
                        new Date(h.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                        h.name,
                        h.professional,
                        h.status,
                        `R$ ${h.price}`
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [16, 185, 129] },
                });
                y = (doc as any).autoTable.previous.finalY + 15;
            }

            // --- Scheduling History ---
            if (localClient.history && localClient.history.length > 0) {
                checkPageBreak(50);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(t('schedulingHistory'), margin, y);
                y += 10;
                (doc as any).autoTable({
                    startY: y,
                    head: [[t('date'), 'Hora', 'Serviço', 'Profissional', 'Status']],
                    body: localClient.history.map(h => [
                        new Date(h.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
                        h.time,
                        h.name,
                        h.professional,
                        h.status
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [16, 185, 129] },
                });
                y = (doc as any).autoTable.previous.finalY + 15;
            }

            // --- Contracts ---
            if (localClient.documents && localClient.documents.length > 0) {
                checkPageBreak(50);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(t('contracts'), margin, y);
                y += 10;
                (doc as any).autoTable({
                    startY: y,
                    head: [['Documento', 'Tipo', 'Status']],
                    body: localClient.documents.map(d => [
                        d.name,
                        d.type || 'N/A',
                        d.signed ? 'Assinado' : 'Pendente'
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [16, 185, 129] },
                });
                y = (doc as any).autoTable.previous.finalY + 15;
            }

            // Save the PDF
            doc.save(`perfil_${(localClient.name || '').replace(/ /g, '_')}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Não foi possível gerar o PDF. A biblioteca jspdf pode não estar carregada corretamente.");
        }
    };

    const getClientStatus = (birthdate: string, lastVisit: string, totalVisits: number) => {
        const today = new Date();
        // Parse birthdate using string splitting to avoid timezone issues
        let isBirthdayMonth = false;
        if (birthdate) {
            const datePart = birthdate.split('T')[0];
            const [, month] = datePart.split('-').map(Number);
            isBirthdayMonth = today.getMonth() === (month - 1); // JS months are 0-indexed
        }
        const lastVisitDate = lastVisit ? new Date(lastVisit + 'T00:00:00') : new Date(0);

        const daysSinceLastVisit = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));

        let classification: 'Nova' | 'Recorrente' | 'VIP' | 'Inativa' = 'Nova';
        if (daysSinceLastVisit > 60) {
            classification = 'Inativa';
        } else if (totalVisits > 5) {
            classification = 'VIP';
        } else if (totalVisits > 1) {
            classification = 'Recorrente';
        }
        return { isBirthdayMonth, classification };
    };

    const { classification } = useMemo(() => {
        if (!localClient) return { isBirthdayMonth: false, classification: '' };
        return getClientStatus(localClient.birthdate, localClient.lastVisit, localClient.totalVisits);
    }, [localClient]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            setIsExiting(false);
            setActiveTab('info');
        }, 300);
    };

    const handleConfirmAction = () => {
        if (!localClient) return;

        if (isConfirmingAction === 'delete' && onDelete) {
            onDelete(localClient.id);
            handleClose();
        } else if (isConfirmingAction === 'block' && onBlock) {
            if (blockReason.trim()) {
                onBlock(localClient.id, blockReason);
                setLocalClient(prev => prev ? { ...prev, blocked: { status: true, reason: blockReason } } : null);
            }
        } else if (isConfirmingAction === 'unblock' && onUnblock) {
            onUnblock(localClient.id);
            const updatedClient = { ...localClient, blocked: { status: false, reason: '' } };
            setLocalClient(updatedClient);
            if (onSave) {
                onSave(updatedClient);
            }
        }

        setIsConfirmingAction(null);
        setBlockReason('');
    };

    const handleCancelAction = () => {
        setIsConfirmingAction(null);
        setBlockReason('');
    };

    const handleUpdateServiceStatus = async (serviceId: number, sessionsConsumed: number = 1) => {
        if (!localClient) return;

        try {
            const response = await appointmentsAPI.updateStatus(serviceId, 'concluido', sessionsConsumed);
            if (response.success || response.id) {
                // Check if it was kept as agendado (partial conclusion)
                const returnedStatus = response.data?.status || response.status;
                if (returnedStatus === 'agendado') {
                    setNotification(`${sessionsConsumed} sessão(ões) registrada(s) com sucesso! O agendamento continua ativo para as sessões restantes.`);
                } else {
                    setNotification('Atendimento concluído com sucesso! Todas as sessões foram realizadas.');
                }
                // Refresh client data to get updated statistics
                const updatedClientData = await clientsAPI.getById(localClient.id);
                const mappedClient = mapClientFromAPI(updatedClientData.data || updatedClientData);
                setLocalClient(mappedClient);
                if (onSave) onSave(mappedClient);
            }
        } catch (error) {
            console.error('Error updating appointment status:', error);
            setNotification('Erro ao concluir atendimento');
        }
    };

    const handleDeleteAppointment = async (appointmentId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        if (!window.confirm(t('confirmDeleteAppointment') || 'Tem certeza que deseja excluir este agendamento?')) return;

        try {
            const response = await appointmentsAPI.delete(appointmentId);
            if (response.success || response.deleted) {
                // Update local state by removing the appointment
                if (localClient) {
                    const updatedHistory = localClient.history.filter(h => h.id !== appointmentId);
                    setLocalClient({
                        ...localClient,
                        history: updatedHistory
                    });
                    setNotification('Agendamento excluído com sucesso');
                }
            } else {
                alert('Erro ao excluir agendamento');
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            alert('Erro ao excluir agendamento');
        }
    };

    const handleDownloadDocument = (doc: any) => {
        if (!localClient) return;
        if (doc.content && doc.content.startsWith('data:application/pdf;base64,')) {
            const link = document.createElement('a');
            link.href = doc.content;
            link.download = doc.fileName || `${(doc.name || '').replace(/ /g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        try {
            const { jsPDF } = jspdf;
            const pdf = new jsPDF();
            pdf.text(`Documento: ${doc.name}`, 10, 10);
            pdf.text(`Cliente: ${localClient.name}`, 10, 20);
            pdf.text(`CPF: ${localClient.cpf}`, 10, 30);
            pdf.text(`Status: ${doc.signed ? 'Assinado' : 'Pendente'}`, 10, 40);
            if (doc.content) {
                const splitText = pdf.splitTextToSize(doc.content, 180);
                pdf.text(splitText, 10, 50);
            }
            const filename = `${(doc.name || '').replace(/ /g, '_')}_${(localClient.name || '').replace(/ /g, '_')}.pdf`;
            pdf.save(filename);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
        }
    };

    const handleViewDocument = (doc: any) => {
        if (!localClient) return;
        if (doc.content && doc.content.startsWith('data:application/pdf;base64,')) {
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`<iframe width='100%' height='100%' src='${doc.content}'></iframe>`);
            } else {
                alert('Erro ao abrir nova janela. Verifique as configurações de bloqueador de pop-ups.');
            }
            return;
        }
        try {
            const { jsPDF } = jspdf;
            const pdf = new jsPDF();
            pdf.text(`Documento: ${doc.name}`, 10, 10);
            pdf.text(`Cliente: ${localClient.name}`, 10, 20);
            if (doc.content) {
                const splitText = pdf.splitTextToSize(doc.content, 180);
                pdf.text(splitText, 10, 30);
            }
            pdf.output('dataurlnewwindow');
        } catch (error) {
            console.error("Failed to generate PDF for viewing:", error);
        }
    };

    const handleDownloadPhoto = (photoUrl: string, index: number) => {
        const link = document.createElement('a');
        link.href = photoUrl;
        link.download = `procedimento_${localClient?.name.replace(/\s+/g, '_')}_${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeletePhoto = (indexToDelete: number) => {
        if (!localClient) return;
        const updatedPhotos = localClient.procedurePhotos.filter((_, index) => index !== indexToDelete);
        const updatedClient = {
            ...localClient,
            procedurePhotos: updatedPhotos,
        };
        setLocalClient(updatedClient);
        if (onSave) {
            onSave(updatedClient);
        }
    };

    const handleRemoveMainPhoto = () => {
        if (window.confirm('Tem certeza que deseja remover a foto de perfil? Uma foto padrão será usada.')) {
            if (!localClient) return;
            const updatedClient = {
                ...localClient,
                photo: '',
            };
            setLocalClient(updatedClient);
            if (onSave) {
                onSave(updatedClient);
            }
        }
    };

    const handleOpenSignatureModal = (doc: ClientDocument) => {
        setDocumentToSign(doc);
        setSignatureModal({ isOpen: true, item: doc });
    };

    const handleSaveSignature = (signatureData: { photo: string; signature: string }) => {
        if (!localClient || !documentToSign) return;

        const updatedDocuments = localClient.documents.map(doc =>
            doc.id === documentToSign.id
                ? { ...doc, signed: true, signatureImg: signatureData.signature, userPhoto: signatureData.photo }
                : doc
        );

        const updatedClient = {
            ...localClient,
            documents: updatedDocuments
        };

        setLocalClient(updatedClient);

        if (onSave) {
            onSave(updatedClient);
        }

        setSignatureModal({ isOpen: false, item: null });
        setDocumentToSign(null);
    };

    const handleOpenRefundModal = (appointmentId: number) => {
        setAppointmentToRefund(appointmentId);
        setIsRefundModalOpen(true);
    };

    const handleConfirmRefund = async () => {
        if (!appointmentToRefund || !refundReason.trim() || !localClient) return;

        try {
            const response = await appointmentsAPI.refund(appointmentToRefund, refundReason);
            if (response.success) {
                setNotification('Atendimento estornado com sucesso!');
                fetchClientData();
            } else {
                setNotification('Erro ao estornar atendimento.');
            }
        } catch (error) {
            console.error('Error refunding appointment:', error);
            setNotification('Erro ao estornar atendimento.');
        } finally {
            setIsRefundModalOpen(false);
            setRefundReason('');
            setAppointmentToRefund(null);
        }
    };

    const fetchClientData = async () => {
        if (!localClient?.id) return;
        try {
            const response = await clientsAPI.getById(localClient.id);
            if (response.success) {
                const mappedClient = mapClientFromAPI(response.data || response);
                setLocalClient(mappedClient);
                if (onSave) onSave(mappedClient);
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Error fetching client data:', error);
        }
    };

    const handleReassign = (item: ClientHistory) => {
        // Placeholder for reassign logic, e.g., open a modal to reassign a photo
        console.log("Reassigning photo for item:", item);
        setNotification("Funcionalidade 'Treinar Foto' em desenvolvimento.");
    };

    const renderConfirmationModal = () => {
        if (!isConfirmingAction || !localClient) return null;

        let title = '';
        let message: React.ReactNode = '';
        let confirmButtonClass = 'bg-red-600 hover:bg-red-700';
        let confirmText = t('confirm');
        let modalBgClass = 'bg-white';
        let titleClass = 'text-secondary';
        let messageClass = 'text-gray-600';

        switch (isConfirmingAction) {
            case 'delete':
                title = t('confirmDeleteClientTitle');
                message = <p>{t('confirmDeleteClientMessage', { name: localClient.name })}</p>;
                confirmText = t('delete');
                break;
            case 'block':
                title = t('blockClientTitle');
                modalBgClass = 'bg-gray-800'; // Dark background
                titleClass = 'text-white';
                messageClass = 'text-gray-300';
                message = (
                    <>
                        <p>Por favor, informe o motivo para bloquear <strong>{localClient.name}</strong>:</p>
                        <textarea
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            className="w-full p-2 border bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md mt-2 text-sm"
                            rows={3}
                            placeholder="Ex: Inadimplência, comportamento inadequado..."
                            autoFocus
                        />
                    </>
                );
                confirmButtonClass = 'bg-yellow-600 hover:bg-yellow-700';
                confirmText = "Bloquear";
                break;
            case 'unblock':
                title = t('unblockClientTitle');
                message = <p>{t('confirmUnblockClientMessage', { name: localClient.name })}</p>;
                confirmButtonClass = 'bg-green-600 hover:bg-green-700';
                confirmText = "Desbloquear";
                break;
        }

        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60 animate-fade-in">
                <div className={`${modalBgClass} p-6 rounded-lg shadow-xl text-center animate-bounce-in max-w-sm w-full`}>
                    <h3 className={`text-lg font-bold ${titleClass}`}>{title}</h3>
                    <div className={`text-sm my-4 text-left ${messageClass}`}>{message}</div>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handleCancelAction}
                            className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleConfirmAction}
                            disabled={isConfirmingAction === 'block' && !blockReason.trim()}
                            className={`py-2 px-6 border border-transparent rounded-md text-sm font-medium text-white ${confirmButtonClass} disabled:bg-gray-400`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen && !isExiting) return null;
    if (!localClient) return null;

    const isBlocked = localClient.blocked?.status === true;
    const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';

    const howTheyFoundUsValue = localClient.howTheyFoundUs + (localClient.howTheyFoundUs === 'Indicação' && localClient.indicatedBy ? ` (${localClient.indicatedBy})` : '');
    const clientSince = localClient.createdAt || localClient.registrationDate
        ? new Date(localClient.createdAt || localClient.registrationDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : 'Pendente';

    const lastVisitDateFormatted = localClient.lastVisit
        ? new Date(localClient.lastVisit).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : 'N/A';
    const fullAddress = localClient.address ? `${localClient.address.street || ''}, ${localClient.address.number || ''}${localClient.address.complement ? ' - ' + localClient.address.complement : ''} - ${localClient.address.neighborhood || ''}, ${localClient.address.city || ''} - ${localClient.address.state || ''}, ${localClient.address.cep || ''}` : '';


    const classificationBadges: { [key: string]: { text: string, icon: string, classes: string } } = {
        'Nova': { text: 'Nova', icon: '✨', classes: 'bg-blue-100 text-blue-800' },
        'Recorrente': { text: 'Recorrente', icon: '💎', classes: 'bg-green-100 text-green-800' },
        'VIP': { text: 'VIP', icon: '👑', classes: 'bg-purple-100 text-purple-800' },
        'Inativa': { text: 'Inativa', icon: '⏳', classes: 'bg-yellow-100 text-yellow-800' },
    };
    const badgeInfo = classificationBadges[classification] || null;

    const TabButton: React.FC<{ tabName: string; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors duration-200 focus:outline-none ${activeTab === tabName
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
        >
            {icon}
            {label}
        </button>
    );

    const renderInfoTab = () => {
        if (!localClient) return null;
        return (
            <div className="space-y-0">
                <InfoSection title={t('identificationAndAccess')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <InfoItem icon={<UsersIcon />} label={t('fullName')} value={localClient.legalName} />
                        <InfoItem icon={<UsersIcon />} label={t('socialName')} value={localClient.socialName} />
                        <InfoItem icon={<MailIcon />} label={t('email')} value={localClient.email} />
                        <InfoItem icon={<PhoneIcon />} label={t('phone')} value={localClient.phone} />
                        {localClient.additionalPhones?.map((phone: any, idx: number) => (
                            <InfoItem
                                key={idx}
                                icon={<PhoneIcon />}
                                label={`${t('additionalContacts')} (${phone.sector || 'Geral'})`}
                                value={phone.number}
                            />
                        ))}
                    </div>
                </InfoSection>

                <InfoSection title={t('personalDocuments')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <InfoItem icon={<IdCardIcon />} label="CPF" value={localClient.cpf} />
                        <InfoItem icon={<IdCardIcon />} label="RG" value={localClient.rg} />
                        <InfoItem icon={<CakeIcon />} label={t('birthDate')} value={(() => {
                            if (!localClient.birthdate) return null;
                            const datePart = localClient.birthdate.split('T')[0];
                            const [year, month, day] = datePart.split('-');
                            return `${day}/${month}/${year}`;
                        })()} />
                        <InfoItem icon={<UsersIcon />} label={t('maritalStatus')} value={localClient.maritalStatus} />
                        <InfoItem icon={<BuildingStorefrontIcon />} label="Unidade de Preferência" value={localClient.preferredUnit} />
                        {/* New Fields */}
                        <InfoItem icon={<UsersIcon />} label="Time" value={localClient.team} />
                        <InfoItem icon={<StarIcon className="h-5 w-5 text-gray-400" />} label="Observações" value={localClient.observations} />
                        <InfoItem icon={<UserPlusIcon />} label="Parentesco" value={localClient.kinship} />
                        <InfoItem icon={<UsersIcon />} label="Gênero" value={localClient.gender} />
                        <InfoItem
                            icon={<StarIcon className="h-5 w-5 text-gray-400" />}
                            label="Cadastro Completo"
                            value={localClient.isCompleteRegistration ? 'Sim' : 'Não'}
                        />
                    </div>
                    {localClient.relationships && localClient.relationships.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="text-md font-bold text-gray-800 mb-4">{t('relationshipSectionTitle')}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {localClient.relationships.map(rel => {
                                    const relatedClient = existingClients.find(c => c.id === rel.clientId);
                                    if (!relatedClient) return null;
                                    return (
                                        <div key={rel.clientId} className="p-3 flex items-center gap-4 bg-gray-100 rounded-lg">
                                            <img src={relatedClient.photo} alt={relatedClient.name} className="w-12 h-12 rounded-full" />
                                            <div>
                                                <p className="font-bold text-gray-800">{relatedClient.name}</p>
                                                <p className="text-sm text-primary font-semibold">{rel.type}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </InfoSection>

                <InfoSection title={t('address')}>
                    <p className="text-sm text-gray-600 flex items-start gap-2">
                        <MapPinIcon className="mt-0.5 flex-shrink-0" />
                        {fullAddress || t('addressNotProvided')}
                    </p>
                </InfoSection>

                <InfoSection title={t('preferencesAndMarketing')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {localClient.howTheyFoundUs === 'Indicação' && localClient.indicatedBy ? (
                            (() => {
                                const indicatorClient = existingClients.find(c => c.name === localClient.indicatedBy);
                                if (indicatorClient) {
                                    const relationship = localClient.relationships?.find(r => r.clientId === indicatorClient.id);
                                    return (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 mb-1">{t('acquisitionChannelLabel')}</p>
                                            <div className="p-3 flex items-center gap-4 bg-gray-100 rounded-lg">
                                                <img src={indicatorClient.photo} alt={indicatorClient.name} className="w-12 h-12 rounded-full" />
                                                <div className="flex-grow">
                                                    <p className="font-bold text-gray-800">{indicatorClient.name}</p>
                                                    {relationship && (
                                                        <p className="text-sm text-primary font-semibold">{relationship.type}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return <InfoItem icon={<QuestionMarkCircleIcon />} label={t('acquisitionChannelLabel')} value={howTheyFoundUsValue} />;
                            })()
                        ) : (
                            <InfoItem icon={<QuestionMarkCircleIcon />} label={t('acquisitionChannelLabel')} value={localClient.howTheyFoundUs} />
                        )}
                    </div>
                </InfoSection>

                <InfoSection title="Planos e Pacotes">
                    {isLoadingDetails ? (
                        <div className="flex items-center space-x-2 text-sm text-gray-500 py-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span>Carregando planos e pacotes...</span>
                        </div>
                    ) : localClient.packages && localClient.packages.length > 0 ? (
                        <div className="space-y-3">
                            {localClient.packages.map((pkg: any, idx: number) => {
                                const isPlan = pkg.type === 'plan';
                                const total = Number(pkg.total_sessions || pkg.sessions || 0);
                                const used = Number(pkg.used_sessions || pkg.clicks || 0);
                                const status = (pkg.status || 'active').toLowerCase();

                                let statusClasses = 'bg-green-100 text-green-800';
                                if (status === 'expired') statusClasses = 'bg-red-100 text-red-800';
                                else if (status === 'archived') statusClasses = 'bg-gray-100 text-gray-800';

                                return (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-800">{pkg.name}</p>
                                                <span className="text-[10px] uppercase font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                    {isPlan ? 'Plano' : 'Pacote'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                    {used}/{total} sessões
                                                </span>
                                                {pkg.start_date && (
                                                    <p className="text-[10px] text-gray-500">Início: {new Date(pkg.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusClasses}`}>
                                                {status === 'active' ? 'Ativo' : status === 'expired' ? 'Expirado' : 'Arquivado'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Nenhum plano ou pacote vinculado.</p>
                    )}
                </InfoSection>
                <InfoSection title={t('financialSummary')}>
                    <div className="space-y-3">
                        <p className="flex justify-between text-sm"><span className="text-black">{t('totalSpent')}:</span> <span className="font-bold text-black">{financialSummary.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                        <p className="flex justify-between text-sm"><span className="text-black">{t('averageTicket')}:</span> <span className="font-bold text-black">{financialSummary.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
                        <p className="flex justify-between text-sm"><span className="text-black">{t('mostFrequentService')}:</span> <span className="font-bold text-black">{financialSummary.mostFrequentService}</span></p>
                    </div>
                </InfoSection>
                {
                    localClient.preferences && localClient.preferences.length > 0 && (
                        <InfoSection title={t('observationsAndPreferences')}>
                            <ul className="list-disc list-inside space-y-1">
                                {localClient.preferences.map((pref, index) => (
                                    <li key={index} className="text-sm text-gray-600">{pref}</li>
                                ))}
                            </ul>
                        </InfoSection>
                    )
                }
            </div >
        );
    };

    return (
        <>
            {notification && (
                <div className="fixed top-24 right-8 z-[70] bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce-in flex items-center">
                    {notification}
                </div>
            )}
            {viewingImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-80 animate-fade-in"
                    onClick={() => setViewingImage(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Visualização de imagem"
                >
                    <button
                        onClick={() => setViewingImage(null)}
                        className="absolute top-4 right-4 bg-white/20 text-white rounded-full h-10 w-10 flex items-center justify-center text-2xl font-bold shadow-lg hover:bg-white/40 transition-colors"
                        aria-label="Fechar"
                    >
                        &times;
                    </button>
                    <img
                        src={viewingImage}
                        alt="Visualização ampliada"
                        className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            {renderConfirmationModal()}

            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 report-modal-wrapper ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                aria-labelledby="modal-title" role="dialog" aria-modal="true"
            >
                <style>
                    {`
                @media print {
                    body > *:not(.report-modal-wrapper) {
                        display: none !important;
                    }
                    .report-modal-wrapper, .report-modal-panel {
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        max-width: 100% !important;
                        max-height: 100% !important;
                        overflow: visible !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .report-modal-backdrop {
                        display: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #print-section {
                        overflow: visible !important;
                        height: auto !important;
                        max-height: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    thead {
                        display: table-header-group;
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                }
            `}
                </style>
                <div className={`fixed inset-0 bg-gray-500 bg-opacity-75 report-modal-backdrop`} onClick={handleClose}></div>
                <div className={`relative bg-white rounded-lg shadow-xl transform transition-all w-full max-w-4xl flex flex-col report-modal-panel ${animationClass}`} style={{ maxHeight: '90vh' }}>

                    {/* Header */}
                    <div className="p-6 bg-secondary rounded-t-lg">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-4">
                                {(localClient.photo || localClient.photoUrl || localClient.photo_url) && !(localClient.photo || localClient.photoUrl || localClient.photo_url).includes('pravatar') ? (
                                    <img src={localClient.photo || localClient.photoUrl || localClient.photo_url} alt={localClient.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-primary" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 ring-4 ring-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-2xl font-bold text-white" id="modal-title">
                                        {localClient.name}
                                    </h3>
                                    {localClient.useSocialName ? (
                                        localClient.legalName && localClient.legalName !== localClient.name && (
                                            <p className="text-lg font-medium text-gray-300">({localClient.legalName})</p>
                                        )
                                    ) : (
                                        localClient.socialName && localClient.socialName !== localClient.name && (
                                            <p className="text-lg font-medium text-gray-300">({localClient.socialName})</p>
                                        )
                                    )}
                                    {badgeInfo && (
                                        <span className={`mt-2 inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${badgeInfo.classes}`}>
                                            {badgeInfo.icon} <span className="ml-1.5">{badgeInfo.text}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 no-print">
                                <button onClick={() => setIsReminderModalOpen(true)} className="text-gray-400 hover:text-white p-2 rounded-full transition-colors" title={t('reminderAlert')}>
                                    <ClockIcon />
                                </button>
                                <button onClick={handlePrint} className="text-gray-400 hover:text-white p-2 rounded-full transition-colors" title={t('printProfile')}>
                                    <PrintIcon />
                                </button>
                                {isBlocked ? (
                                    <button onClick={() => setIsConfirmingAction('unblock')} className="text-gray-400 hover:text-green-500 p-2 rounded-full transition-colors" title={t('unblockClient')}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v3m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button onClick={() => setIsConfirmingAction('block')} className="text-gray-400 hover:text-yellow-400 p-2 rounded-full transition-colors" title={t('blockClient')}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                    </button>
                                )}
                                <button onClick={() => setIsConfirmingAction('delete')} className="text-gray-400 hover:text-red-500 p-2 rounded-full transition-colors" title={t('deleteClient')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <button onClick={handleClose} className="text-gray-400 hover:text-white text-3xl leading-none flex items-center justify-center h-10 w-10">&times;</button>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <HeaderStat icon={<VisitsIcon />} label={t('totalVisits')} value={localClient.totalVisits || 0} />
                            <HeaderStat icon={<CalendarIcon />} label={t('lastVisit')} value={lastVisitDateFormatted} />
                            <HeaderStat icon={<UserPlusIcon />} label={t('clientSince')} value={clientSince} />
                        </div>
                    </div>

                    {isBlocked && (
                        <div className="p-4 bg-yellow-100 border-b border-yellow-500 no-print">
                            <div className="flex items-center text-yellow-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="font-bold">{t('clientIsBlocked')}</p>
                                    <p className="text-sm"><strong className="font-semibold">{t('reason')}:</strong> {localClient.blocked?.reason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="border-b border-gray-200 px-6 no-print">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                            <TabButton tabName="info" label={t('info')} icon={<InfoIcon />} />
                            <TabButton tabName="history" label="Histórico" icon={<HistoryIcon />} />
                            <TabButton tabName="contracts" label={t('contract')} icon={<ContractIcon />} />
                            <TabButton tabName="photos" label={t('photos')} icon={<PhotoIcon />} />
                        </nav>
                    </div>

                    {/* Content */}
                    <div id="print-section" className="p-6 flex-grow overflow-y-auto bg-gray-50">
                        {activeTab === 'info' && renderInfoTab()}
                        {activeTab === 'history' && (() => {
                            // Define explicitly what is considered "completed/historical"
                            const completedStatuses = ['atendido', 'concluido', 'concluído', 'cancelado', 'faltou'];

                            // Filter history:
                            // Completed = matches the list above
                            // Pending = everything else (Agendado, Confirmado, Em Atendimento, Reagendado, A Realizar, etc.)
                            const completedServices = localClient.history.filter(item => completedStatuses.includes((item.status || '').toLowerCase()));
                            const pendingServices = localClient.history.filter(item => !completedStatuses.includes((item.status || '').toLowerCase()));

                            const getSessionInfo = (item: ClientHistory) => {
                                if (!item.package_id && !item.salon_plan_id) return null;
                                const sub = localClient?.packages?.find(p =>
                                    (item.package_id && p.package_id === item.package_id) ||
                                    (item.salon_plan_id && p.plan_id === item.salon_plan_id)
                                );
                                if (!sub) return null;
                                const total = sub.total_sessions || 0;
                                const allRelevantItems = localClient?.history.filter(h =>
                                    (item.package_id && h.package_id === item.package_id) ||
                                    (item.salon_plan_id && h.salon_plan_id === item.salon_plan_id)
                                ).filter(h => !['cancelado', 'desmarcou'].includes((h.status || '').toLowerCase()))
                                    .sort((a, b) => {
                                        const dateA = new Date(a.date).getTime();
                                        const dateB = new Date(b.date).getTime();
                                        if (dateA !== dateB) return dateA - dateB;
                                        return (a.time || '').localeCompare(b.time || '');
                                    });
                                const index = allRelevantItems.findIndex(h => h.id === item.id);
                                if (index === -1) return null;

                                const current = index + 1;
                                const isLast = current >= total && total > 0;
                                let label = '';

                                if (total > 0) {
                                    if (item.salon_plan_id) { // Plan nomenclature
                                        label = `Vez ${current} de ${total}`;
                                    } else {
                                        label = `Sessão ${current} de ${total}`; // Package nomenclature
                                    }
                                } else {
                                    label = `Sessão ${current}`; // Fallback
                                }

                                return { label, isLast };
                            };
                            return (
                                <div>
                                    {/* Sub-tabs */}
                                    <div className="flex border-b mb-4">
                                        <button
                                            onClick={() => setActiveSubTab('servicos')}
                                            className={`px-4 py-2 font-medium text-sm ${activeSubTab === 'servicos' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                                        >
                                            Histórico de Serviços
                                        </button>
                                        <button
                                            onClick={() => setActiveSubTab('agendamentos')}
                                            className={`px-4 py-2 font-medium text-sm ${activeSubTab === 'agendamentos' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                                        >
                                            Histórico de Agendamentos
                                        </button>
                                    </div>

                                    {/* Content based on sub-tab */}
                                    {activeSubTab === 'servicos' && (() => {
                                        // Build contract-level view from packages (one row per subscription)
                                        const contracts = (localClient.packages || []).filter(
                                            (pkg: any) => pkg.type === 'package' || pkg.type === 'plan'
                                        );

                                        return (
                                            <>
                                                <h4 className="text-lg font-semibold text-gray-800 mb-3">Contratos & Assinaturas ({contracts.length})</h4>
                                                <div className="space-y-3">
                                                    {contracts.length > 0 ? contracts.map((contract: any) => {
                                                        // Count consumed sessions dynamically from history
                                                        const relatedAppointments = (localClient.history || []).filter((h: ClientHistory) => {
                                                            if (contract.type === 'package' && contract.package_id) {
                                                                return h.package_id === contract.package_id && !['cancelado', 'desmarcou'].includes((h.status || '').toLowerCase());
                                                            }
                                                            if (contract.type === 'plan' && contract.plan_id) {
                                                                return h.salon_plan_id === contract.plan_id && !['cancelado', 'desmarcou'].includes((h.status || '').toLowerCase());
                                                            }
                                                            return false;
                                                        });

                                                        const consumed = relatedAppointments.length;
                                                        const total = contract.total_sessions || 0;
                                                        const isCompleted = (total > 0 && consumed >= total) || contract.status === 'archived' || contract.status === 'expired' || contract.status === 'cancelado';
                                                        const isActive = contract.status === 'active' || !contract.status;

                                                        // Nomenclature
                                                        const sessionLabel = total > 0
                                                            ? (contract.type === 'plan'
                                                                ? `Vez ${consumed} de ${total}`
                                                                : `Sessão ${consumed} de ${total}`)
                                                            : (consumed > 0
                                                                ? (contract.type === 'plan' ? `${consumed} vezes` : `${consumed} sessões`)
                                                                : 'Nenhuma sessão');

                                                        // Find a representative history item for ScheduleInternalModal
                                                        const representativeItem = relatedAppointments.length > 0
                                                            ? relatedAppointments[relatedAppointments.length - 1]
                                                            : null;

                                                        // Fabricate a historyItem for the modal
                                                        const historyItemForModal: ClientHistory = {
                                                            id: representativeItem?.id || 0,
                                                            name: contract.name,
                                                            date: representativeItem?.date || new Date().toISOString().split('T')[0],
                                                            time: representativeItem?.time || '09:00',
                                                            professional: representativeItem?.professional || 'Profissional',
                                                            professionalId: representativeItem?.professionalId,
                                                            service_id: representativeItem?.service_id,
                                                            package_id: contract.type === 'package' ? contract.package_id : undefined,
                                                            salon_plan_id: contract.type === 'plan' ? contract.plan_id : undefined,
                                                            type: contract.type === 'package' ? 'Pacote' : 'Plano',
                                                            total_sessions: total,
                                                            consumed_sessions: consumed,
                                                        };

                                                        return (
                                                            <div key={contract.id} className={`flex justify-between items-center bg-white p-4 rounded-xl border ${isCompleted ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50/20'}`}>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <p className={`font-bold ${isCompleted ? 'text-gray-500' : 'text-gray-800'}`}>{contract.name}</p>
                                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${contract.type === 'package' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
                                                                            {contract.type === 'package' ? 'Pacote' : 'Plano'}
                                                                        </span>
                                                                        {!isActive && (
                                                                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border bg-gray-100 text-gray-500 border-gray-200">
                                                                                {contract.status === 'archived' ? 'Arquivado' : (contract.status === 'expired' ? 'Expirado' : contract.status)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${isCompleted ? 'text-gray-600 bg-gray-100 border-gray-200' : 'text-blue-700 bg-blue-100 border-blue-200'}`}>
                                                                            {sessionLabel}
                                                                        </span>
                                                                        {total > 0 && (
                                                                            <div className="flex-1 max-w-[120px] h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all ${isCompleted ? 'bg-gray-400' : 'bg-blue-500'}`}
                                                                                    style={{ width: `${Math.min((consumed / total) * 100, 100)}%` }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {/* Archive / Reactivate */}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleArchiveSubscription(contract.id, contract.type); }}
                                                                        className={`p-2 transition-colors rounded-full ${contract.status === 'archived' ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                                        title={contract.status === 'archived' ? "Reativar" : "Arquivar/Concluir"}
                                                                    >
                                                                        <CheckCircleIcon className="h-5 w-5" />
                                                                    </button>

                                                                    {/* Delete */}
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteSubscription(contract.id, contract.type); }}
                                                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                                                                        title="Excluir"
                                                                    >
                                                                        <TrashIcon className="h-5 w-5" />
                                                                    </button>

                                                                    {/* Schedule - Only if active and not fully consumed */}
                                                                    {!isCompleted && isActive ? (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setInternalScheduleModal({ isOpen: true, historyItem: historyItemForModal });
                                                                            }}
                                                                            className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors shadow-sm flex items-center gap-1 ml-2"
                                                                            title="Agendar Próxima"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                            </svg>
                                                                            Agendar
                                                                        </button>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    }) : <p className="text-center text-gray-500 py-4 bg-light rounded-lg">Nenhum pacote ou plano ativo.</p>}
                                                </div>
                                            </>
                                        );
                                    })()}

                                    {activeSubTab === 'agendamentos' && (
                                        <>
                                            <h4 className="text-lg font-semibold text-gray-800 mb-3">Histórico Completo de Agendamentos</h4>
                                            <div className="space-y-3">
                                                {localClient.history.length > 0 ? (
                                                    localClient.history.map(item => {
                                                        const consumptionState = getSessionInfo(item);
                                                        const statusKey = (item.status || '').toLowerCase();
                                                        const statusStyles: { [key: string]: string } = {
                                                            'atendido': 'bg-green-100 text-green-800',
                                                            'concluido': 'bg-green-100 text-green-800',
                                                            'concluído': 'bg-green-100 text-green-800',
                                                            'agendado': 'bg-blue-100 text-blue-800',
                                                            'a realizar': 'bg-orange-100 text-orange-800',
                                                            'faltou': 'bg-red-100 text-red-800',
                                                            'desmarcou': 'bg-gray-100 text-gray-800',
                                                            'reagendado': 'bg-yellow-100 text-yellow-800',
                                                            'cancelado': 'bg-red-100 text-red-800'
                                                        };
                                                        const statusClass = statusStyles[statusKey] || 'bg-gray-100 text-gray-800';
                                                        const isValidDate = item.date && !isNaN(new Date(item.date).getTime()) && item.date !== 'Pendente';
                                                        const dateDisplay = isValidDate ? new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : <span className="italic">{t('datePending')}</span>;

                                                        // Logic for showing 'Em Andamento' or 'Ativo' label if it's a non-final session of a package/plan
                                                        const displayStatus = (consumptionState && !consumptionState.isLast && (statusKey === 'concluido' || statusKey === 'concluído' || statusKey === 'atendido'))
                                                            ? 'Em Andamento'
                                                            : item.status;

                                                        return (
                                                            <div key={item.id} className="bg-white p-4 rounded-lg border">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-semibold text-gray-800">{item.name}</p>
                                                                            {consumptionState && (
                                                                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                                                    {consumptionState.label}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-500">Data: {dateDisplay}</p>
                                                                        <p className="text-sm text-gray-500">Hora: {item.time}</p>
                                                                        <p className="text-sm text-gray-500">Profissional: {item.professional}</p>
                                                                        {item.price && <p className="text-sm text-gray-500">Valor: R$ {item.price}</p>}
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-2">
                                                                        <span className={`text-sm font-medium px-2 py-1 rounded-full capitalize ${statusClass}`}>
                                                                            {displayStatus}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p className="text-center text-gray-500 py-4 bg-light rounded-lg">Nenhum agendamento encontrado.</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        {activeTab === 'contracts' && localClient.documents && (
                            <div className="space-y-4">
                                {onEdit && (
                                    <div className="flex justify-end mb-2">
                                        <button
                                            onClick={() => onEdit(localClient)}
                                            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            Adicionar Contrato / Anexo
                                        </button>
                                    </div>
                                )}
                                {localClient.documents.map((doc, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border">
                                        <div>
                                            <p className="font-semibold text-gray-800">{doc.name}</p>
                                            <p className="text-sm text-gray-500">{doc.type}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {doc.signed ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingSignedDoc(doc)}
                                                    className="text-sm font-semibold text-green-600 flex items-center gap-1 hover:underline"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                    Ver Assinatura
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenSignatureModal(doc)}
                                                    className="text-sm font-semibold text-blue-600 hover:underline"
                                                >
                                                    Assinar
                                                </button>
                                            )}
                                            <button onClick={() => handleViewDocument(doc)} className="text-sm text-gray-500 hover:text-gray-800 p-1 rounded-full" title="Visualizar"><ViewIcon className="h-4 w-4" /></button>
                                            <button onClick={() => handleDownloadDocument(doc)} className="text-sm text-gray-500 hover:text-gray-800 p-1 rounded-full" title="Baixar"><DownloadIcon className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'photos' && (
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-3">Galeria de Fotos do Cliente</h4>
                                {localClient.procedurePhotos.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {localClient.procedurePhotos.map((photo, index) => (
                                            <div key={index} className="relative group">
                                                <img src={photo} alt={`${t('procedure')} ${index + 1}`} className="w-full h-32 object-cover rounded-lg shadow-md" />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg">
                                                    <button onClick={() => setViewingImage(photo)} title={t('view')} className="p-2 bg-white/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40">
                                                        <ViewIcon />
                                                    </button>
                                                    <button onClick={() => handleDownloadPhoto(photo, index)} title={t('download')} className="p-2 bg-white/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40" style={{ transitionDelay: '50ms' }}>
                                                        <DownloadIcon />
                                                    </button>
                                                    <button onClick={() => handleDeletePhoto(index)} title={t('delete')} className="p-2 bg-white/20 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40" style={{ transitionDelay: '100ms' }}>
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-center text-gray-500 py-8">{t('noProcedurePhotos')}</p>}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 rounded-b-lg border-t no-print">
                        <div className="flex gap-2">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(localClient)}
                                    disabled={isBlocked}
                                    className="py-2 px-4 text-sm font-semibold rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
                                    {t('edit')}
                                </button>
                            )}
                            <button
                                onClick={() => navigate('scheduling', { clientId: client.id })}
                                disabled={isBlocked}
                                className="py-2 px-4 text-sm font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">
                                {t('schedule')}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {t('close')}
                        </button>
                    </div>
                </div>
            </div>
            <ReminderModal
                isOpen={isReminderModalOpen}
                onClose={() => setIsReminderModalOpen(false)}
                onSave={handleSaveReminder}
            />
            {/* Signature Viewer Modal */}
            {viewingSignedDoc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-60 animate-fade-in" onClick={() => setViewingSignedDoc(null)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-xl w-full animate-bounce-in" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-secondary text-center mb-4">
                                Assinatura do Contrato
                            </h3>
                            <p className="text-sm text-gray-500 text-center mb-4">{viewingSignedDoc.name}</p>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Photo */}
                                <div className="text-center">
                                    <h4 className="font-semibold text-gray-700 mb-2">Foto do Cliente</h4>
                                    {viewingSignedDoc.userPhoto ? (
                                        <div className="space-y-2">
                                            <img
                                                src={viewingSignedDoc.userPhoto}
                                                alt="Foto do cliente"
                                                className="w-32 h-32 object-cover rounded-full mx-auto shadow-md border-2 border-primary"
                                            />
                                            <a
                                                href={viewingSignedDoc.userPhoto}
                                                download={`foto_${localClient?.name?.replace(/\s+/g, '_')}.png`}
                                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                            >
                                                <DownloadIcon className="h-4 w-4" />
                                                Baixar Foto
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm">Foto não disponível</p>
                                    )}
                                </div>

                                {/* Signature */}
                                <div className="text-center">
                                    <h4 className="font-semibold text-gray-700 mb-2">Assinatura</h4>
                                    {viewingSignedDoc.signatureImg ? (
                                        <div className="space-y-2">
                                            <img
                                                src={viewingSignedDoc.signatureImg}
                                                alt="Assinatura"
                                                className="w-full max-w-[200px] h-auto mx-auto border rounded-lg bg-gray-50 p-2"
                                            />
                                            <a
                                                href={viewingSignedDoc.signatureImg}
                                                download={`assinatura_${localClient?.name?.replace(/\s+/g, '_')}.png`}
                                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                            >
                                                <DownloadIcon className="h-4 w-4" />
                                                Baixar Assinatura
                                            </a>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm">Assinatura não disponível</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 flex justify-end rounded-b-lg">
                            <button
                                onClick={() => setViewingSignedDoc(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isRefundModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-bounce-in">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Estornar Atendimento</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Esta ação irá cancelar o serviço, estornar o valor no financeiro e devolver a sessão ao cliente (se aplicável).
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo do Estorno
                            </label>
                            <textarea
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Descreva o motivo..."
                                className="w-full p-3 border rounded-lg focus:ring-primary focus:border-primary text-gray-800"
                                rows={3}
                            />
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                            <button
                                onClick={() => setIsRefundModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmRefund}
                                disabled={!refundReason.trim()}
                                className="px-5 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors"
                            >
                                Confirmar Estorno
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <SignatureModal
                isOpen={signatureModal.isOpen}
                onClose={() => setSignatureModal({ isOpen: false, item: null })}
                onSign={handleSaveSignature}
                contractText={signatureModal.item?.content || ''}
            />

            {internalScheduleModal.historyItem && (
                <ScheduleInternalModal
                    isOpen={internalScheduleModal.isOpen}
                    onClose={() => setInternalScheduleModal({ isOpen: false, historyItem: null })}
                    client={{
                        id: localClient?.id || 0,
                        name: localClient?.name || '',
                        photo: localClient?.photo,
                        avatar: localClient?.avatar
                    }}
                    professional={{
                        id: internalScheduleModal.historyItem.professionalId || 0,
                        name: internalScheduleModal.historyItem.professional || 'Profissional'
                    }}
                    service={{
                        id: internalScheduleModal.historyItem.service_id || 0,
                        name: internalScheduleModal.historyItem.name || 'Serviço'
                    }}
                    contractInfo={{
                        package_subscription_id: localClient?.packages?.find(p => p.package_id === internalScheduleModal.historyItem?.package_id)?.id,
                        salon_plan_subscription_id: localClient?.packages?.find(p => p.plan_id === internalScheduleModal.historyItem?.salon_plan_id)?.id,
                        package_id: internalScheduleModal.historyItem.package_id,
                        salon_plan_id: internalScheduleModal.historyItem.salon_plan_id,
                        label: internalScheduleModal.historyItem.package_id ? 'Pacote' : 'Plano'
                    }}
                    onScheduleSuccess={() => {
                        // Refresh client data to show the new appointment
                        fetchClientData();
                    }}
                    professionals={professionals}
                />
            )}
        </>
    );
};

export default ClientDetailModal;
