
import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon, UserIcon, TrashIcon } from '@heroicons/react/24/outline';
import { clientsAPI, appointmentsAPI } from '../api';
import ScheduleInternalModal from './ScheduleInternalModal'; // Import internal schedule modal

interface Client {
    id: number;
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    birth_date?: string;
    notes?: string;
    address?: string;
    history?: ClientHistory[];
    packages?: ClientPackage[];
    salon_plans?: ClientSalonPlan[];
    total_visits?: number;
    last_visit?: string; // string date
    status?: string; // e.g. 'Ativo', 'Inativo'
}

interface ClientHistory {
    id: number;
    date: string;
    time: string;
    service?: string; // Legacy
    service_id?: number;
    package_id?: number;
    salon_plan_id?: number;
    package_subscription_id?: number; // New: link to specific subscription
    salon_plan_subscription_id?: number; // New: link to specific subscription
    professional: string;
    professionalId?: number;
    status: string;
    price: string;
    name?: string; // For display in consolidated view
    type?: 'service' | 'package' | 'plan';
    total_sessions?: number;
    consumed_sessions?: number;
    session_index?: number; // New: tracking index
}

interface ClientPackage {
    id: number;
    name: string;
    sessions: number; // total sessions
    sessions_consumed: number;
    price: string;
    validity_days?: number;
    created_at?: string;
    status?: string;
}

interface ClientSalonPlan {
    id: number;
    name: string;
    price: string;
    sessions: number; // total sessions per cycle
    sessions_consumed: number;
    cycle_start?: string;
    cycle_end?: string;
    created_at?: string;
    status?: string;
}

interface ClientDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    onRefresh?: () => void; // Callback to refresh client list/data
}

export default function ClientDetailModal({ isOpen, onClose, client, onRefresh }: ClientDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
    const [localClient, setLocalClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(false);
    const [internalScheduleModal, setInternalScheduleModal] = useState<{ isOpen: boolean, historyItem: ClientHistory | null }>({ isOpen: false, historyItem: null });
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null); // For accordion

    console.log("ClientDetailModal loaded - v3");

    // --- Data Fetching ---
    useEffect(() => {
        if (isOpen && client) {
            setLoading(true);
            // Fetch full client details including history and packages
            clientsAPI.getById(client.id)
                .then(data => {
                    console.log("Client data fetched:", data);
                    setLocalClient(data);
                })
                .catch(err => {
                    console.error("Error fetching client details:", err);
                    setLocalClient(client); // Fallback to prop data
                })
                .finally(() => setLoading(false));
        } else {
            setLocalClient(null);
        }
    }, [isOpen, client]);


    // --- Helper Components ---
    const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | undefined }) => (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="p-2 bg-white rounded-full border border-gray-200 shadow-sm">
                <Icon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value || '-'}</p>
            </div>
        </div>
    );

    const InfoSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-900 mb-3 border-b pb-1 border-gray-200 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full inline-block"></span>
                {title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {children}
            </div>
        </div>
    );

    const formatStatus = (status: string) => {
        const s = (status || '').toLowerCase().trim();
        if (['concluido', 'concluído', 'finalizado', 'atendido'].includes(s)) return 'Atendido';
        if (['pago'].includes(s)) return 'Pago';
        // Capitalize first letter for others
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const getStatusClass = (status: string) => {
        const s = (status || '').toLowerCase().trim();
        if (['concluido', 'concluído', 'finalizado', 'atendido'].includes(s)) return 'bg-green-100 text-green-700';
        if (['agendado', 'confirmado', 'reagendado'].includes(s)) return 'bg-blue-100 text-blue-700';
        if (['cancelado', 'desmarcou', 'faltou'].includes(s)) return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-700';
    };


    // --- Actions ---
    const handleClose = () => {
        setLocalClient(null);
        setActiveTab('info');
        onClose();
    };

    const handleSchedule = (historyItem: ClientHistory) => {
        // Open internal modal with pre-filled details
        setInternalScheduleModal({ isOpen: true, historyItem });
    };

    const handleInternalScheduleClose = () => {
        setInternalScheduleModal({ isOpen: false, historyItem: null });
    };

    const handleManualConsumption = async (contract: any) => {
        if (!localClient) return;

        // Logic to consume a session manually or mark as concluded
        const confirmMsg = `Confirmar realização de "${contract.name}"?`;
        if (window.confirm(confirmMsg)) {
            try {
                if (contract.appointmentId) {
                    // Update existing appointment status via updateStatus for full side-effects
                    await appointmentsAPI.updateStatus(contract.appointmentId, 'concluido');
                } else {
                    await appointmentsAPI.create({
                        client_id: localClient.id,
                        service_id: contract.service_id,
                        package_id: contract.package_id, // If strictly package consumption
                        salon_plan_id: contract.plan_id, // If strictly plan consumption
                        professional_id: contract.professionalId, // We assume professional is selected or we need a prompt?
                        status: 'concluido',
                        date: new Date().toISOString().split('T')[0],
                        time: new Date().toTimeString().split(' ')[0].slice(0, 5)
                    });
                }

                // Refresh data
                if (onRefresh) onRefresh(); // Trigger parent refresh
                // Re-fetch local client
                const freshData = await clientsAPI.getById(localClient.id);
                setLocalClient(freshData);

            } catch (error) {
                console.error("Error confirming service:", error);
                alert("Erro ao confirmar serviço. Tente novamente.");
            }
        }
    };

    const handleOpenRefundModal = (appointmentId: number) => {
        const reason = prompt("Motivo do estorno:");
        if (reason) {
            appointmentsAPI.cancel(appointmentId, reason) // Assuming cancel handles refund for concluded
                .then(() => {
                    alert("Estorno realizado e sessão marcada como cancelada.");
                    if (onRefresh) onRefresh();
                    if (localClient) clientsAPI.getById(localClient.id).then(setLocalClient);
                })
                .catch(err => {
                    console.error("Erro ao estornar:", err);
                    alert("Erro ao realizar estorno.");
                });
        }
    };

    const handleDeleteSubscription = async (id: number, type: 'package' | 'plan') => {
        if (window.confirm("Tem certeza que deseja excluir este contrato? O histórico será mantido mas o vínculo removido.")) {
            // Implementation depends on API capabilities. Assuming delete endpoint exists.
            // For now, alert functionality not fully implemented on backend for direct delete of sub via frontend typically.
            // But we can add a 'cancel' subscription endpoint or similar.
            alert("Funcionalidade de exclusão de contrato em desenvolvimento.");
        }
    };

    const toggleAccordion = (id: string) => {
        setExpandedSubscriptionId(prev => prev === id ? null : id);
    };

    if (!isOpen) return null;

    const isAdmin = true; // Replace with actual role check

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleClose}></div>

                {/* Modal Panel */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <UserIcon className="h-6 w-6 text-purple-200" />
                            Detalhes do Cliente
                        </h3>
                        <button
                            onClick={handleClose}
                            className="bg-white/20 rounded-full p-1 hover:bg-white/30 text-white transition-colors focus:outline-none"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="bg-white px-6 py-6 h-[70vh] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                            </div>
                        ) : localClient ? (
                            <>
                                {/* Brief Summary Card */}
                                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">{localClient.name}</h2>
                                        {localClient.email && <p className="text-sm text-gray-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span>{localClient.email}</p>}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Status</div>
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                            {localClient.status || 'Ativo'}
                                        </span>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-gray-200 mb-6">
                                    <button
                                        className={`pb-4 px-6 text-sm font-medium transition-colors border-b-2 ${activeTab === 'info' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                        onClick={() => setActiveTab('info')}
                                    >
                                        Informações Pessoais
                                    </button>
                                    <button
                                        className={`pb-4 px-6 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                        onClick={() => setActiveTab('history')}
                                    >
                                        Histórico & Pacotes
                                    </button>
                                </div>

                                {/* Info Tab */}
                                {activeTab === 'info' && (
                                    <div className="animate-fadeIn">
                                        <InfoSection title="Dados de Contato">
                                            <InfoItem icon={UserIcon} label="Telefone" value={localClient.phone} />
                                            <InfoItem icon={UserIcon} label="CPF" value={localClient.cpf} />
                                            <InfoItem icon={CalendarIcon} label="Aniversário" value={localClient.birth_date ? new Date(localClient.birth_date).toLocaleDateString() : undefined} />
                                        </InfoSection>

                                        <InfoSection title="Endereço">
                                            <div className="col-span-2 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700">
                                                {localClient.address || 'Não informado'}
                                            </div>
                                        </InfoSection>

                                        <InfoSection title="Estatísticas">
                                            <InfoItem icon={ClockIcon} label="Última Visita" value={localClient.last_visit ? new Date(localClient.last_visit).toLocaleDateString() : 'Nunca'} />
                                            <InfoItem icon={UserIcon} label="Total de Visitas" value={String(localClient.total_visits || 0)} />
                                        </InfoSection>

                                        {localClient.notes && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-bold text-gray-900 mb-3 border-b pb-1 border-gray-200">Notas</h4>
                                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800 italic">
                                                    "{localClient.notes}"
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* History Tab */}
                                {activeTab === 'history' && (
                                    <div className="animate-fadeIn">
                                        {(() => {
                                            // Process Data for Consolidated View
                                            // 1. Identify active packages/Plans
                                            const activePackages = (localClient.packages || [])
                                                .filter(p => !p.status || p.status === 'active')
                                                .map(p => ({ ...p, type: 'package' }));
                                            const activePlans = (localClient.salon_plans || [])
                                                .filter(p => !p.status || p.status === 'active')
                                                .map(p => ({ ...p, type: 'plan' }));

                                            // Combine Contracts
                                            const contracts = [...activePackages, ...activePlans];

                                            // 2. Map Contracts to Display Items
                                            // We need to link history items to these contracts if possible, or show them as containers

                                            // Helper to find related appointments for a contract
                                            const getRelatedAppointments = (contract: any) => {
                                                return (localClient.history || []).filter(h => {
                                                    if (contract.type === 'package') return h.package_id === contract.id || h.package_subscription_id === contract.id; // Adjusted check
                                                    if (contract.type === 'plan') return h.salon_plan_id === contract.id || h.salon_plan_subscription_id === contract.id;
                                                    return false;
                                                }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                            };

                                            const packageItems = contracts.map(contract => {
                                                const relatedAppointments = getRelatedAppointments(contract);
                                                const consumed = contract.sessions_consumed;
                                                const total = contract.sessions;
                                                const isRealized = consumed >= total; // Simple check, reality might differ
                                                // Check if there is an active/future appointment for this contract to determine 'Next Action'
                                                const hasFuture = relatedAppointments.some(a => ['agendado', 'confirmado'].includes((a.status || '').toLowerCase()));
                                                const isActive = !isRealized && (contract.status === 'active' || !contract.status);

                                                return { ...contract, relatedAppointments, consumed, total, isRealized, isActive };
                                            });

                                            // Merge standalone appointments as single services
                                            const singleServiceItems = (localClient.history || [])
                                                .filter((h: ClientHistory) => !h.package_id && !h.salon_plan_id)
                                                .map((h: ClientHistory) => {
                                                    const statusLower = (h.status || '').toLowerCase();
                                                    const isRealized = statusLower === 'concluido' || statusLower === 'finalizado' || statusLower === 'atendido';
                                                    const isActive = !isRealized && !['cancelado', 'desmarcou', 'faltou'].includes(statusLower);
                                                    return {
                                                        id: `apt-${h.id}`,
                                                        appointmentId: h.id,
                                                        name: h.name,
                                                        type: 'service',
                                                        consumed: isRealized ? 1 : 0,
                                                        total: 1,
                                                        isRealized,
                                                        isActive,
                                                        relatedAppointments: [h],
                                                        date: h.date,
                                                        status: h.status,
                                                        price: h.price
                                                    };
                                                });

                                            const combinedItems = [...packageItems, ...singleServiceItems];
                                            const activeContracts = combinedItems.filter((c: any) => c.isActive);
                                            const archivedContracts = combinedItems.filter((c: any) => c.isRealized);

                                            return (
                                                <div className="space-y-6">
                                                    {/* Active Contracts */}
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Serviços Pendentes ({activeContracts.length})
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {activeContracts.length > 0 ? activeContracts.map((contract: any) => {
                                                                const { consumed, total, isCompleted, isActive } = contract;

                                                                // Nomenclature
                                                                const sessionLabel = total > 0
                                                                    ? (contract.type === 'plan'
                                                                        ? `Vez ${consumed} de ${total}`
                                                                        : `Sessão ${consumed} de ${total}`)
                                                                    : (consumed > 0
                                                                        ? (contract.type === 'plan' ? `${consumed} vezes` : `${consumed} sessões`)
                                                                        : 'Nenhuma sessão');

                                                                // Find a representative history item for ScheduleInternalModal
                                                                const representativeItem = contract.relatedAppointments.length > 0
                                                                    ? contract.relatedAppointments[contract.relatedAppointments.length - 1]
                                                                    : null;

                                                                // Determine correct price to show based on type
                                                                let displayPrice = '0.00';
                                                                if (contract.type === 'package') {
                                                                    displayPrice = contract.price || '0.00';
                                                                } else if (contract.type === 'plan') {
                                                                    displayPrice = contract.price || '0.00';
                                                                } else if (contract.type === 'service') {
                                                                    displayPrice = contract.price || '0.00';
                                                                }

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
                                                                    type: contract.type === 'package' ? 'Pacote' : contract.type === 'plan' ? 'Plano' : 'Serviço',
                                                                    total_sessions: total,
                                                                    consumed_sessions: consumed,
                                                                    price: displayPrice,
                                                                };

                                                                return (
                                                                    <div key={contract.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <p className="font-bold text-gray-800">{contract.name}</p>
                                                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${contract.type === 'package' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                                                    contract.type === 'plan' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                                                                                        'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                                                                    {contract.type === 'package' ? 'Pacote' : contract.type === 'plan' ? 'Plano' : 'Serviço'}
                                                                                </span>
                                                                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                                                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(displayPrice))}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                {contract.type !== 'service' && (
                                                                                    <>
                                                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full border text-blue-700 bg-blue-100 border-blue-200">
                                                                                            {sessionLabel}
                                                                                        </span>
                                                                                        {total > 0 && (
                                                                                            <div className="flex-1 max-w-[120px] h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                                                <div
                                                                                                    className="h-full rounded-full transition-all bg-blue-500"
                                                                                                    style={{ width: `${Math.min((consumed / total) * 100, 100)}%` }}
                                                                                                />
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            {contract.type === 'service' ? (
                                                                                // For standalone services pending, usually means scheduled. 
                                                                                // If we want "A Realizar" functionality (consume):
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleManualConsumption(contract);
                                                                                    }}
                                                                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
                                                                                >
                                                                                    A Realizar
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={async (e) => {
                                                                                        e.stopPropagation();
                                                                                        if (contract.type === 'service') {
                                                                                            handleManualConsumption(contract);
                                                                                        } else {
                                                                                            // Auto-conclude logic for packages/plans
                                                                                            const pendingApt = contract.relatedAppointments?.find((a: any) =>
                                                                                                ['agendado', 'confirmado', 'reagendado'].includes((a.status || '').toLowerCase())
                                                                                            );

                                                                                            if (pendingApt) {
                                                                                                try {
                                                                                                    await appointmentsAPI.updateStatus(pendingApt.id, 'concluido');
                                                                                                    if (onRefresh) onRefresh();
                                                                                                } catch (err) {
                                                                                                    console.error("Error auto-concluding previous session:", err);
                                                                                                }
                                                                                            }

                                                                                            setInternalScheduleModal({ isOpen: true, historyItem: historyItemForModal });
                                                                                        }
                                                                                    }}
                                                                                    className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition ${contract.type === 'service' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                                                                                >
                                                                                    {contract.type === 'service' ? 'A Realizar' : 'Agendar'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }) : <p className="text-center text-gray-500 py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">Nenhum contrato ativo.</p>}
                                                        </div>
                                                    </div>



                                                    {/* Archived Contracts */}
                                                    {archivedContracts.length > 0 && (
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                                Serviços Realizados ({archivedContracts.length})
                                                            </h4>
                                                            <div className="space-y-3">
                                                                {archivedContracts.map((contract: any) => {
                                                                    const representativeItem = contract.relatedAppointments.length > 0
                                                                        ? contract.relatedAppointments[contract.relatedAppointments.length - 1]
                                                                        : null;
                                                                    return (
                                                                        <div key={contract.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                                            <div className="flex items-center gap-2">
                                                                                <p className="font-semibold text-gray-800">{contract.name}</p>
                                                                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border bg-green-50 text-green-600 border-green-200">
                                                                                    Pago
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                {isAdmin && representativeItem && (
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleOpenRefundModal(representativeItem.id); }}
                                                                                        className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors rounded-full"
                                                                                        title="Estornar Última Sessão"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                                                                                        </svg>
                                                                                    </button>
                                                                                )}
                                                                                {isAdmin && (
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteSubscription(contract.id, contract.type); }}
                                                                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                                                        title="Excluir"
                                                                                    >
                                                                                        <TrashIcon className="h-5 w-5" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Full History with Accordion */}
                                                    <div>
                                                        <h4 className="text-lg font-semibold text-gray-800 mb-3 toggle-header">
                                                            Histórico de Agendamentos
                                                        </h4>

                                                        {localClient.history && localClient.history.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {(() => {
                                                                    const groupedHistory: any[] = [];

                                                                    const historyItems = [...localClient.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                                                    const findGroup = (pkgId?: number, planId?: number) => {
                                                                        return groupedHistory.find(g =>
                                                                            (pkgId && g.package_id === pkgId) ||
                                                                            (planId && g.salon_plan_id === planId)
                                                                        );
                                                                    };

                                                                    historyItems.forEach(item => {
                                                                        if (item.package_id || item.salon_plan_id) {
                                                                            let group = findGroup(item.package_id, item.salon_plan_id);

                                                                            if (!group) {
                                                                                group = {
                                                                                    id: `group_${item.package_id || item.salon_plan_id}_${item.id}`, // temp ID
                                                                                    name: item.name, // Package name usually
                                                                                    type: item.package_id ? 'package' : 'plan',
                                                                                    package_id: item.package_id,
                                                                                    salon_plan_id: item.salon_plan_id,
                                                                                    items: [],
                                                                                    latestDate: item.date,
                                                                                    price: item.price // Might be 0.00 for sessions
                                                                                };
                                                                                groupedHistory.push(group);
                                                                            }
                                                                            group.items.push(item);
                                                                        } else {
                                                                            groupedHistory.push({
                                                                                id: `apt_${item.id}`,
                                                                                type: 'service',
                                                                                ...item,
                                                                                items: [item] // Treat as single item group for consistency if needed
                                                                            });
                                                                        }
                                                                    });

                                                                    return groupedHistory.map((group) => {
                                                                        if (group.type === 'service') {
                                                                            const item = group;
                                                                            return (
                                                                                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                                                                                    <div>
                                                                                        <p className="font-bold text-gray-800">{item.name}</p>
                                                                                        <p className="text-sm text-gray-500">
                                                                                            {new Date(item.date).toLocaleDateString()} às {item.time ? item.time.slice(0, 5) : '--:--'} • {item.professional}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(item.status)}`}>
                                                                                            {formatStatus(item.status)}
                                                                                        </span>
                                                                                        <p className="text-xs text-gray-400 mt-1">
                                                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(item.price))}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        } else {
                                                                            // Accordion Group
                                                                            const isExpanded = expandedSubscriptionId === group.id;
                                                                            const itemCount = group.items.length;
                                                                            // Get proper package price if available from client.packages
                                                                            let pkgPrice = '0.00';
                                                                            if (group.package_id) {
                                                                                const foundPkg = localClient.packages?.find(p => p.id === group.package_id || p.name === group.name); // loose match if ID mismatch
                                                                                if (foundPkg) pkgPrice = foundPkg.price;
                                                                            } else if (group.salon_plan_id) {
                                                                                const foundPlan = localClient.salon_plans?.find(p => p.id === group.salon_plan_id || p.name === group.name);
                                                                                if (foundPlan) pkgPrice = foundPlan.price;
                                                                            }

                                                                            // Get status of latest session to show in header
                                                                            const latestSession = group.items[0];
                                                                            const latestStatus = latestSession ? latestSession.status : '';

                                                                            return (
                                                                                <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                                                                    <button
                                                                                        onClick={() => toggleAccordion(group.id)}
                                                                                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                                                                    >
                                                                                        <div className="flex items-center gap-3">
                                                                                            <div className={`p-2 rounded-full ${group.type === 'package' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>
                                                                                                {group.type === 'package' ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg> : <CalendarIcon className="h-5 w-5" />}
                                                                                            </div>
                                                                                            <div className="text-left">
                                                                                                <p className="font-bold text-gray-800">{group.name}</p>
                                                                                                <p className="text-xs text-gray-500">{itemCount} sessões registradas</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-3">
                                                                                            <span className="text-sm font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(pkgPrice))}
                                                                                            </span>
                                                                                            {/* Status Badge in Header */}
                                                                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusClass(latestStatus)}`}>
                                                                                                {formatStatus(latestStatus)}
                                                                                            </span>
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                                            </svg>
                                                                                        </div>
                                                                                    </button>

                                                                                    {isExpanded && (
                                                                                        <div className="border-t border-gray-200 divide-y divide-gray-100 bg-white">
                                                                                            {group.items.map((session: any) => (
                                                                                                <div key={session.id} className="p-3 pl-12 flex justify-between items-center hover:bg-gray-50">
                                                                                                    <div>
                                                                                                        <p className="text-sm font-medium text-gray-800">
                                                                                                            {session.session_index ? `Sessão ${session.session_index}` : 'Sessão'}
                                                                                                        </p>
                                                                                                        <p className="text-xs text-gray-500">
                                                                                                            {new Date(session.date).toLocaleDateString()} • {session.time?.slice(0, 5)} • {session.professional}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusClass(session.status)}`}>
                                                                                                            {formatStatus(session.status)}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        }
                                                                    });

                                                                })()}
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-500 italic text-center py-4">Nenhum histórico disponível.</p>
                                                        )}
                                                    </div>

                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>

                    {/* Internal Modal Handling */}
                    {internalScheduleModal.isOpen && internalScheduleModal.historyItem && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                                <button
                                    onClick={handleInternalScheduleClose}
                                    className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                                >
                                    <XMarkIcon className="h-5 w-5 text-gray-600" />
                                </button>
                                <ScheduleInternalModal
                                    isOpen={internalScheduleModal.isOpen}
                                    onClose={handleInternalScheduleClose}
                                    historyItem={internalScheduleModal.historyItem} // Pass the item
                                    onScheduleSuccess={() => {
                                        handleInternalScheduleClose();
                                        if (onRefresh) onRefresh();
                                        // Refresh local
                                        if (localClient) clientsAPI.getById(localClient.id).then(setLocalClient);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
