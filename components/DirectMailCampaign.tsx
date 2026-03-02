import React, { useState, useMemo } from 'react';
import { NewDirectMailModal } from './NewDirectMailModal';
// FIX: Changed to a default import as DirectMailDetailsModal will be changed to a default export.
import DirectMailDetailsModal from './DirectMailDetailsModal';
import { useLanguage } from '../contexts/LanguageContext';
import { Schedule } from './ScheduleSettingsModal';
import { DirectMailCampaignData } from '../types';

interface DirectMailCampaignProps {
    campaigns: DirectMailCampaignData[];
    onAddCampaign: (data: Omit<DirectMailCampaignData, 'id' | 'status' | 'history' | 'roi'>) => void;
    onUpdateCampaign: (campaign: DirectMailCampaignData) => void;
    onDeleteCampaign: (campaignId: number) => void;
    onArchiveCampaign: (campaignId: number) => void;
    onUnarchiveCampaign: (campaignId: number) => void;
    onSendCampaign: (campaignId: number) => void;
    isIndividualPlan: boolean;
    unitName?: string;
    unitPhone?: string;
}

const SendTypeIcon: React.FC<{ type: 'Email' | 'SMS' | 'WhatsApp' }> = ({ type }) => {
    // Icons remain the same as before...
    switch (type) {
        case 'Email':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
        case 'SMS':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
        case 'WhatsApp':
            return <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16.75 13.96c.25.41.4 1 .25 1.61l-.01.01c-.13 1.14-.65 2.2-1.48 2.9l-.1.1c-.93.78-2.02 1.25-3.23 1.34l-.06.01h-3.21c-4.87 0-8.83-3.95-8.83-8.83s3.95-8.83 8.83-8.83 8.83 3.95 8.83 8.83c0 .34-.02.67-.06.99l-.01 0c-.31 1.8-.13 3.61.51 5.32l.11.29zM12 21.92c4.34 0 7.88-3.54 7.88-7.88s-3.54-7.88-7.88-7.88-7.88 3.54-7.88 7.88c0 2.05.79 3.93 2.11 5.35l.12.12c.1.09.2.18.29.27l-1.38 3.97 4.09-1.37c.37.07.74.12 1.13.15h3.04c.01-.01 0 0 0 0z" /><path d="M15.26 13.01c-.08-.12-.3-.2-.52-.32-.22-.12-.52-.27-.8-.37-.28-.1-.52-.16-.72-.16-.29 0-.57.1-.77.37-.2.27-.76.95-.92 1.15s-.33.22-.61.07c-.28-.15-1.18-.53-2.13-1.42s-1.58-1.95-1.63-2.05c-.05-.1-.01-.2.08-.31.09-.11.2-.27.3-.37.1-.1.15-.22.22-.37.07-.15.04-.28-.02-.42s-.72-1.72-.98-2.32c-.27-.6-.52-.52-.72-.52-.18 0-.4 0-.61 0s-.57.08-.85.37c-.28.3-.95.95-.95 2.32 0 1.38 1.03 2.7 1.18 2.87s1.8 2.92 4.49 4.18c2.69 1.26 3.3.93 3.73.85.43-.08 1.18-.52 1.38-.98.2-.47.2-.85.15-.98-.05-.12-.17-.2-.25-.32z" /></svg>;
    }
};

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-gray-100 p-3 rounded-lg text-center">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-xl font-bold text-secondary">{value}</p>
    </div>
);


// FIX: Changed to a named export to resolve module resolution errors.
export const DirectMailCampaign: React.FC<DirectMailCampaignProps> = ({ campaigns, onAddCampaign, onUpdateCampaign, onDeleteCampaign, onArchiveCampaign, onUnarchiveCampaign, onSendCampaign, isIndividualPlan, unitName, unitPhone }) => {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<DirectMailCampaignData | null>(null);
    const [campaignToEdit, setCampaignToEdit] = useState<DirectMailCampaignData | null>(null);
    const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'rascunho' | 'agendado' | 'enviado'>('all');
    const [view, setView] = useState<'active' | 'archived'>('active');
    const [searchQuery, setSearchQuery] = useState('');

    const activeCampaigns = useMemo(() => campaigns.filter(c => !c.archived), [campaigns]);
    const archivedCampaigns = useMemo(() => campaigns.filter(c => c.archived), [campaigns]);

    const campaignsInView = view === 'active' ? activeCampaigns : archivedCampaigns;

    const filteredCampaigns = useMemo(() => {
        let tempCampaigns = campaignsInView;

        if (statusFilter !== 'all') {
            tempCampaigns = tempCampaigns.filter(campaign => campaign.status === statusFilter);
        }

        if (searchQuery.trim() !== '') {
            const lowercasedQuery = searchQuery.toLowerCase();
            tempCampaigns = tempCampaigns.filter(campaign =>
                campaign.name.toLowerCase().includes(lowercasedQuery) ||
                (campaign.description && campaign.description.toLowerCase().includes(lowercasedQuery))
            );
        }

        return tempCampaigns;
    }, [campaignsInView, statusFilter, searchQuery]);

    const handleSave = (data: Omit<DirectMailCampaignData, 'id' | 'status' | 'history' | 'roi'>) => {
        if (campaignToEdit) {
            onUpdateCampaign({ ...campaignToEdit, ...data });
        } else {
            onAddCampaign(data as any);
        }
        setIsModalOpen(false);
        setCampaignToEdit(null);
    };

    const handleViewDetails = (campaign: DirectMailCampaignData) => {
        setSelectedCampaign(campaign);
        setIsDetailsModalOpen(true);
    };

    const handleEdit = (e: React.MouseEvent, campaign: DirectMailCampaignData) => {
        e.stopPropagation();
        setCampaignToEdit(campaign);
        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, campaign: DirectMailCampaignData) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja excluir a campanha "${campaign.name}"?`)) {
            onDeleteCampaign(campaign.id);
        }
    };

    const toggleExpand = (campaignId: number) => {
        setExpandedCampaignId(prevId => (prevId === campaignId ? null : campaignId));
    };

    return (
        <>
            <div className="space-y-8 max-w-4xl mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-secondary mb-1">Campanhas de Mala Direta</h2>
                            <p className="text-sm text-gray-500">Crie, dispare e analise suas campanhas de Email, SMS ou WhatsApp.</p>
                        </div>
                        <button
                            onClick={() => { setCampaignToEdit(null); setIsModalOpen(true); }}
                            className="flex-shrink-0 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            Criar Mala Direta
                        </button>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="direct-mail-filter" className="sr-only">Filtro</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                id="direct-mail-filter"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filtrar por nome ou descrição..."
                                className="w-full p-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="border-b border-gray-200 mb-4">
                            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                <button onClick={() => setView('active')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm ${view === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>
                                    Ativas ({activeCampaigns.length})
                                </button>
                                <button onClick={() => setView('archived')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm ${view === 'archived' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>
                                    Arquivadas ({archivedCampaigns.length})
                                </button>
                            </nav>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2 sm:mb-0">Campanhas Criadas</h3>
                            <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-lg">
                                {(['all', 'rascunho', 'agendado', 'enviado'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${statusFilter === status
                                            ? 'bg-primary text-white shadow'
                                            : 'text-gray-600 hover:bg-gray-300'
                                            }`}
                                    >
                                        {status === 'all' ? 'Todas' : status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {filteredCampaigns.length > 0 ? (
                            <div className="space-y-4">
                                {filteredCampaigns.map((campaign) => {
                                    const isExpanded = expandedCampaignId === campaign.id;
                                    return (
                                        <div key={campaign.id} className="border border-gray-200 rounded-lg">
                                            <div className="flex justify-between items-center bg-light p-4">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <SendTypeIcon type={campaign.sendType} />
                                                    <span className="font-medium text-gray-800">{campaign.name}</span>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${campaign.status === 'enviado' ? 'bg-green-100 text-green-800' : campaign.status === 'agendado' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>
                                                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleViewDetails(campaign)} className="text-xs font-semibold text-blue-600 hover:underline">Ver Detalhes</button>
                                                    <button onClick={(e) => handleEdit(e, campaign)} className="text-xs font-semibold text-gray-600 hover:underline">Editar</button>
                                                    {view === 'active' ? (
                                                        <button onClick={(e) => { e.stopPropagation(); onArchiveCampaign(campaign.id); }} className="text-xs font-semibold text-yellow-600 hover:underline">Arquivar</button>
                                                    ) : (
                                                        <button onClick={(e) => { e.stopPropagation(); onUnarchiveCampaign(campaign.id); }} className="text-xs font-semibold text-green-600 hover:underline">Desarquivar</button>
                                                    )}
                                                    <button
                                                        onClick={() => onSendCampaign(campaign.id)}
                                                        className="text-sm font-bold py-2 px-3 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                                                    >
                                                        Disparar
                                                    </button>
                                                    <button onClick={() => toggleExpand(campaign.id)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="p-4 space-y-6 animate-fade-in">
                                                    {/* History Section */}
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-2">Histórico de Disparos</h4>
                                                        {campaign.history.length > 0 ? (
                                                            <div className="max-h-40 overflow-y-auto border rounded-md">
                                                                <table className="min-w-full text-sm">
                                                                    <thead className="bg-gray-100">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Data</th>
                                                                            <th className="px-4 py-2 text-left font-medium text-gray-600">Destinatários</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y">
                                                                        {campaign.history.map((h, index) => (
                                                                            <tr key={index}>
                                                                                <td className="px-4 py-2 text-gray-800">{h.date}</td>
                                                                                <td className="px-4 py-2 text-gray-800">{h.recipients}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 text-center bg-gray-50 p-4 rounded-md">Nenhum disparo realizado.</p>
                                                        )}
                                                    </div>
                                                    {/* ROI Section */}
                                                    <div>
                                                        <h4 className="font-semibold text-gray-700 mb-2">Análise de ROI (Dados do último disparo)</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                            <StatCard title="Total de Envios" value={String(campaign.roi.totalSent)} />
                                                            <StatCard title="Taxa de Abertura" value={campaign.roi.openRate} />
                                                            <StatCard title="Cliques" value={String(campaign.roi.clicks)} />
                                                            <StatCard title="Conversões" value={String(campaign.roi.conversions)} />
                                                            <StatCard title="Receita Gerada" value={`R$ ${campaign.roi.revenue.toFixed(2).replace('.', ',')}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                                <p className="text-gray-500">{campaigns.length > 0 ? 'Nenhuma campanha encontrada com o filtro atual.' : 'Nenhuma campanha de mala direta criada.'}</p>
                                <p className="text-sm text-gray-400 mt-1">{campaigns.length > 0 ? 'Tente um filtro diferente.' : 'Clique em "Criar Mala Direta" para começar.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <NewDirectMailModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setCampaignToEdit(null); }}
                onSave={handleSave}
                isIndividualPlan={isIndividualPlan}
                campaignToEdit={campaignToEdit}
                unitName={unitName}
                unitPhone={unitPhone}
            />
            <DirectMailDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                campaign={selectedCampaign}
            />
        </>
    );
};