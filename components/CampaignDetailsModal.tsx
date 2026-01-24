

import React, { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Client } from '../types';
import { Schedule } from './ScheduleSettingsModal';

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
    sendLimit?: number;
    phoneNumber?: string;
}

interface CampaignDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaign: Campaign | null;
    clients: Client[];
    appointments: any[];
}

const TargetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const StatusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const LimitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-light p-3 rounded-lg flex items-center space-x-3">
        <div className="p-2 rounded-full bg-primary/10 text-primary">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-base font-bold text-secondary truncate" title={String(value)}>{value}</p>
        </div>
    </div>
);

export const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({ isOpen, onClose, campaign, clients, appointments }) => {
    const { t } = useLanguage();

    const targetAudienceList = useMemo(() => {
        if (!campaign || !clients || !appointments) return [];

        const selectedClients = new Set<Client>();

        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const scheduledClientIds = new Set(appointments.filter((a: any) => a.date === todayKey).map((a: any) => a.clientId));

        campaign.targetAudience.forEach(identifier => {
            let groupClients: Client[] = [];
            if (identifier.startsWith('tag:')) {
                const tagName = identifier.substring(4);
                groupClients = clients.filter(client => client.tags && client.tags.includes(tagName));
            } else {
                switch (identifier) {
                    case 'Novos Clientes (Últimos 7 dias)':
                        groupClients = clients.filter(c => {
                            if (!c.registrationDate) return false;
                            const regDate = new Date(c.registrationDate);
                            const diffDays = (startOfToday.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24);
                            return diffDays <= 7;
                        });
                        break;
                    case 'Aniversariantes do Mês':
                        groupClients = clients.filter(c => {
                            if (!c.birthdate) return false;
                            const birthDate = new Date(c.birthdate + 'T00:00:00');
                            return birthDate.getMonth() === today.getMonth();
                        });
                        break;
                    case 'Agendados Hoje':
                        groupClients = clients.filter(c => scheduledClientIds.has(c.id));
                        break;
                    case 'Inativos (60+ dias)':
                        groupClients = clients.filter(c => {
                            if (!c.lastVisit) return false;
                            const lastVisitDate = new Date(c.lastVisit);
                            const daysSince = (today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24);
                            return daysSince > 60;
                        });
                        break;
                    case 'Todos os Clientes':
                        groupClients = [...clients];
                        break;
                }
            }
            groupClients.forEach(client => selectedClients.add(client));
        });

        return Array.from(selectedClients);
    }, [campaign, clients, appointments]);

    if (!isOpen || !campaign) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-bounce-in" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold text-secondary">{campaign.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <section>
                        <h4 className="font-semibold text-gray-800 mb-3">Sumário</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatCard title="Público-alvo" value={campaign.targetAudience.map(p => p.startsWith('tag:') ? p.substring(4) : p).join(', ')} icon={<TargetIcon />} />
                            <StatCard title="Clientes Impactados" value={targetAudienceList.length} icon={<UsersIcon />} />
                            <StatCard title={t('status')} value={campaign.status} icon={<StatusIcon />} />
                            <StatCard title={t('scheduledDateLabel')} value={campaign.scheduleDate ? new Date(campaign.scheduleDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não agendada'} icon={<CalendarIcon />} />
                            {campaign.sendLimit && (
                                <StatCard title={t('sendLimit')} value={`${campaign.sendLimit} / dia`} icon={<LimitIcon />} />
                            )}
                            {campaign.phoneNumber && (
                                <StatCard title={t('sentFrom')} value={campaign.phoneNumber} icon={<SendIcon />} />
                            )}
                        </div>
                    </section>

                    <section>
                        <h4 className="font-semibold text-gray-800 mb-3">Conteúdo da Mensagem</h4>
                        <div className="p-4 border rounded-md bg-gray-50 text-gray-800 text-sm space-y-4">
                            {campaign.file && campaign.file.url && campaign.messageType === 'imagem' && (
                                <div>
                                    <img src={campaign.file.url} alt={campaign.file.name} className="max-w-xs mx-auto h-auto rounded-md shadow-md" />
                                </div>
                            )}
                            {campaign.file && (!campaign.file.url || campaign.messageType !== 'imagem') && (
                                <p className="pt-3 border-t text-xs text-gray-500"><strong>Anexo:</strong> {campaign.file.name}</p>
                            )}
                            <p className="whitespace-pre-wrap">{campaign.messageText}</p>
                        </div>
                    </section>

                    <section>
                        <h4 className="font-semibold text-gray-800 mb-3">Resultados (ROI)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard title={t('campaignReach')} value={campaign.stats?.alcance || 0} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                            <StatCard title={t('campaignConversions')} value={campaign.stats?.conversoes || 0} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 00-1.564.317z" /></svg>} />
                            <StatCard title={t('campaignRevenue')} value={`R$ ${(campaign.stats?.receita || 0).toFixed(2)}`} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m-4 0H8v1m4-1v-1m-4 5v1m-2-4h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" /></svg>} />
                        </div>
                    </section>

                    <section>
                        <h4 className="font-semibold text-gray-800 mb-3">Clientes Impactados ({targetAudienceList.length})</h4>
                        {targetAudienceList.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto border rounded-md bg-gray-50 p-2">
                                <ul className="divide-y divide-gray-200">
                                    {targetAudienceList.map(client => (
                                        <li key={client.id} className="p-2 flex items-center gap-3">
                                            <img src={client.photo} alt={client.name} className="w-8 h-8 rounded-full" />
                                            <span className="text-sm font-medium text-gray-800">{client.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center bg-gray-100 p-4 rounded-md">Nenhum cliente neste público-alvo no momento.</p>
                        )}
                    </section>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse rounded-b-lg border-t">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-white text-gray-700 border rounded-md">
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};