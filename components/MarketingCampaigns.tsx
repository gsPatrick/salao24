

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { NewDirectMailModal } from './NewDirectMailModal';
// FIX: Changed to a default import as DirectMailDetailsModal will be changed to a default export.
import DirectMailDetailsModal from './DirectMailDetailsModal';
import { useLanguage } from '../contexts/LanguageContext';
import { Client, DirectMailCampaignData } from '../types';
import ScheduleSettingsModal, { Schedule } from './ScheduleSettingsModal';
import { aiAPI, marketingAPI } from '../lib/api';
// FIX: Add missing imports for DirectMailCampaign and EmailServerSettings.
import { DirectMailCampaign } from './DirectMailCampaign';
import { EmailServerSettings } from './EmailServerSettings';
import { CampaignDetailsModal } from './CampaignDetailsModal';
import NewAcquisitionChannelModal from './NewAcquisitionChannelModal';


// --- Interfaces ---

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
    targetAudience: string[]; // Alterado para array de strings
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
        url?: string | null;
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
}

interface MarketingCampaignsProps {
    onAddCampaign: (data: any) => void;
    onUpdateCampaign: (campaign: Campaign) => void;
    onArchiveCampaign: (id: number) => void;
    onUnarchiveCampaign: (id: number) => void;
    onDuplicateCampaign: (id: number) => void;
    campaigns: Campaign[];

    onAddDirectMailCampaign: (data: Omit<DirectMailCampaignData, 'id' | 'status' | 'history' | 'roi'>) => void;
    onUpdateDirectMailCampaign: (campaign: DirectMailCampaignData) => void;
    onDeleteDirectMailCampaign: (campaignId: number) => void;
    onArchiveDirectMailCampaign: (campaignId: number) => void;
    onUnarchiveDirectMailCampaign: (campaignId: number) => void;
    onSendDirectMailCampaign: (campaignId: number) => void;
    directMailCampaigns: DirectMailCampaignData[];

    clients: Client[];
    appointments: any[];
    isIndividualPlan: boolean;
    unitName: string;
    unitPhone?: string;

    // Acquisition Channel Props
    acquisitionChannels: AcquisitionChannel[];
    onSaveAcquisitionChannel: (data: { name: string; duration: string }) => void;
    onSuspendAcquisitionChannel: (channelId: number, channelName: string, isSuspended?: boolean) => void;
    onArchiveAcquisitionChannel: (channelId: number, channelName: string) => void;
    onUnarchiveAcquisitionChannel: (channelId: number, channelName: string) => void;
    onOpenEditChannelModal: (channel: any | null) => void;
    isNewChannelModalOpen?: boolean;
    onCloseNewChannelModal?: () => void;
    channelToEdit?: any | null;
    navigate?: (page: string) => void;
    onComingSoon?: (featureName: string) => void;
}

const getClientGroups = (clients: Client[], appointments: Appointment[]) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const formatDateForLookup = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayKey = formatDateForLookup(today);
    const scheduledClientIds = new Set(appointments.filter(a => a.date === todayKey).map(a => a.clientId));

    const groups: { [key: string]: Client[] } = {
        'Todos os Clientes': clients,
        'Novos Clientes (Últimos 7 dias)': [],
        'Aniversariantes do Mês': [],
        'Agendados Hoje': [],
        'Faltantes': [],
        'Reagendados': [],
        'Inativos (60+ dias)': []
    };

    clients.forEach(client => {
        if (client.birthdate) {
            const birthDate = new Date(client.birthdate);
            if (birthDate.getMonth() === today.getMonth()) {
                groups['Aniversariantes do Mês'].push(client);
            }
        }
        if (scheduledClientIds.has(client.id)) {
            groups['Agendados Hoje'].push(client);
        }
        if (client.status === 'Faltante') {
            groups['Faltantes'].push(client);
        }
        if (client.status === 'Reagendado') {
            groups['Reagendados'].push(client);
        }
        if (client.registrationDate) {
            const regDate = new Date(client.registrationDate);
            const diffTime = Math.abs(startOfToday.getTime() - regDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) {
                groups['Novos Clientes (Últimos 7 dias)'].push(client);
            }
        }
        if (client.lastVisit) {
            const lastVisitDate = new Date(client.lastVisit);
            const daysSinceLastVisit = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastVisit > 60) {
                groups['Inativos (60+ dias)'].push(client);
            }
        }
    });

    return groups;
};


// --- Icons for MessageTypeSelector ---
const TextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const AudioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;

const messageTypes = [
    { type: 'texto', icon: <TextIcon />, label: 'Texto' },
    { type: 'imagem', icon: <ImageIcon />, label: 'Imagem' },
    { type: 'audio', icon: <AudioIcon />, label: 'Áudio' },
    { type: 'arquivo', icon: <FileIcon />, label: 'Arquivo' },
];

const MessageTypeSelector: React.FC<{ selected: string; onChange: (type: string) => void }> = ({ selected, onChange }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Mensagem</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {messageTypes.map(({ type, icon, label }) => (
                    <button
                        type="button"
                        key={type}
                        onClick={() => onChange(type)}
                        className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all duration-200 space-y-2 ${selected === type
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <div className={`${selected === type ? 'text-primary' : 'text-gray-500'}`}>{icon}</div>
                        <span className={`text-sm font-semibold ${selected === type ? 'text-primary' : 'text-gray-700'}`}>{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};


// --- Recreated NewCampaignModal ---
// This was created because the original file was missing from your project.
const NewCampaignModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    campaignToEdit: Campaign | null;
    clients: Client[];
    appointments: Appointment[];
    isIndividualPlan: boolean;
    unitPhone?: string;
}> = ({ isOpen, onClose, onSave, campaignToEdit, clients, appointments, isIndividualPlan, unitPhone }) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [publicoAlvo, setPublicoAlvo] = useState<string[]>([]);
    const [isAudienceDropdownOpen, setIsAudienceDropdownOpen] = useState(false);
    const [messageType, setMessageType] = useState<'texto' | 'imagem' | 'audio' | 'arquivo'>('texto');
    const [file, setFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [minDelay, setMinDelay] = useState(30);
    const [maxDelay, setMaxDelay] = useState(90);
    const [scheduleDate, setScheduleDate] = useState('');
    const [sendLimit, setSendLimit] = useState(200);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [estimatedAudience, setEstimatedAudience] = useState<number | null>(null);

    const [isExiting, setIsExiting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audienceRef = useRef<HTMLDivElement>(null);

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleSettings, setScheduleSettings] = useState<Schedule[]>([]);
    const [isImprovingText, setIsImprovingText] = useState(false);

    const crmGroups = useMemo(() => getClientGroups(clients, appointments), [clients, appointments]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        clients.forEach(client => {
            if (client.tags && Array.isArray(client.tags)) {
                client.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [clients]);

    const handleAudienceChange = async (groupName: string, isTag: boolean = false) => {
        const identifier = isTag ? `tag:${groupName}` : groupName;
        const newAudience = publicoAlvo.includes(identifier)
            ? publicoAlvo.filter(g => g !== identifier)
            : [...publicoAlvo, identifier];

        setPublicoAlvo(newAudience);

        // Fetch dynamic count from backend
        try {
            const data = await marketingAPI.getAudienceCount(groupName);
            if (data.success) {
                setEstimatedAudience(data.count);
            }
        } catch (error) {
            console.error('Error fetching audience count:', error);
        }
    };

    const { audienceSum, uniqueClientCount } = useMemo(() => {
        if (!publicoAlvo || !Array.isArray(publicoAlvo) || publicoAlvo.length === 0) return { audienceSum: 0, uniqueClientCount: 0 };

        const clientSet = new Set<Client>();
        let sum = 0;

        publicoAlvo.forEach(identifier => {
            if (!identifier) return; // FIX: Skip if identifier is null or undefined

            let groupClients: Client[] = [];
            if (typeof identifier === 'string' && identifier.startsWith('tag:')) {
                const tagName = identifier.substring(4);
                groupClients = clients.filter(client => client.tags && client.tags.includes(tagName));
            } else if (crmGroups[identifier]) {
                groupClients = crmGroups[identifier];
            }

            sum += groupClients.length;
            groupClients.forEach(client => clientSet.add(client));
        });

        return { audienceSum: sum, uniqueClientCount: clientSet.size };
    }, [publicoAlvo, crmGroups, clients]);

    const resetForm = () => {
        setName('');
        setPublicoAlvo([]);
        setMessageType('texto');
        setFile(null);
        setFilePreviewUrl(null);
        setMessageText('');
        setMinDelay(30);
        setMaxDelay(90);
        setScheduleDate('');
        setScheduleSettings([]);
        setSendLimit(200);
        setPhoneNumber('');
    };

    useEffect(() => {
        if (isOpen) {
            if (campaignToEdit) {
                setName(campaignToEdit.name);
                // FIX: Ensure targetAudience is an array and filter out any null/undefined values
                const audience = Array.isArray(campaignToEdit.targetAudience)
                    ? campaignToEdit.targetAudience
                    : (campaignToEdit.targetAudience ? [campaignToEdit.targetAudience] : []);
                setPublicoAlvo(audience.filter(Boolean));
                setMessageType(campaignToEdit.messageType);
                setMessageText(campaignToEdit.messageText);
                setScheduleDate(campaignToEdit.scheduleDate);
                setMinDelay(campaignToEdit.minDelay || 30);
                setMaxDelay(campaignToEdit.maxDelay || 90);
                if (campaignToEdit.file) {
                    setFile({ name: campaignToEdit.file.name, size: 0, type: '' } as File);
                    setFilePreviewUrl(campaignToEdit.file.url || null);
                } else {
                    setFile(null);
                    setFilePreviewUrl(null);
                }
                setScheduleSettings(campaignToEdit.scheduleSettings || []);
                setSendLimit(campaignToEdit.sendLimit || 200);
                setPhoneNumber(campaignToEdit.phoneNumber || '');
            } else {
                resetForm();
            }
        }
    }, [isOpen, campaignToEdit]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (audienceRef.current && !audienceRef.current.contains(event.target as Node)) {
                setIsAudienceDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            setIsExiting(false);
        }, 300);
    };

    const handleFileSelect = (selectedFile: File | null) => {
        if (selectedFile) {
            setFile(selectedFile);
            if (messageType === 'imagem' || messageType === 'audio') {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setFilePreviewUrl(event.target?.result as string);
                };
                reader.readAsDataURL(selectedFile);
            }
        } else {
            setFile(null);
            setFilePreviewUrl(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { handleFileSelect(e.dataTransfer.files[0]); } };
    const formatDelay = (seconds: number) => { const minutes = Math.floor(seconds / 60); const remainingSeconds = seconds % 60; return `${minutes}m ${remainingSeconds}s`; };
    const handleSaveSchedule = (schedule: Schedule[]) => { setScheduleSettings(schedule); setIsScheduleModalOpen(false); };

    const handleImproveText = async () => {
        if (!messageText.trim()) { alert('Por favor, escreva um texto antes de pedir para a IA melhorar.'); return; }
        setIsImprovingText(true);
        try {
            const result = await aiAPI.improveText(messageText);
            if (result && result.text) {
                setMessageText(result.text);
            }
        } catch (error: any) {
            console.error("Erro ao melhorar o texto com IA:", error);
            alert(`Ocorreu um erro ao tentar melhorar o texto: ${error.message || 'Erro desconhecido'}`);
        }
        finally { setIsImprovingText(false); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || publicoAlvo.length === 0 || !phoneNumber) {
            alert('Por favor, preencha o nome da campanha, selecione um público-alvo e um número para disparo.');
            return;
        }
        onSave({
            name,
            targetAudience: publicoAlvo,
            audienceCount: uniqueClientCount,
            messageType,
            messageText,
            minDelay,
            maxDelay,
            scheduleDate,
            file: file ? { name: file.name, url: filePreviewUrl } : null,
            scheduleSettings,
            sendLimit,
            phoneNumber
        });
        handleClose();
    };

    if (!isOpen && !isExiting) return null;

    const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';

    return (
        <>
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`} onClick={handleClose}>
                <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-2xl ${animationClass}`} onClick={e => e.stopPropagation()}>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-secondary">{campaignToEdit ? t('editCampaignTitle') : 'Criar Nova Campanha'}</h3>
                            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">

                                <div>
                                    <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700">Nome da Campanha</label>
                                    <input id="campaign-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Promoção de Verão" className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div ref={audienceRef}>
                                        <label className="block text-sm font-medium text-gray-700">Público-alvo</label>
                                        <div className="mt-1">
                                            <button type="button" onClick={() => setIsAudienceDropdownOpen(!isAudienceDropdownOpen)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-left flex justify-between items-center">
                                                <span className="text-gray-500">Selecione um ou mais públicos...</span>
                                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                            </button>
                                            {isAudienceDropdownOpen && (
                                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border max-h-60 overflow-y-auto">
                                                    {Object.entries(crmGroups).map(([groupName, groupClients]) => (
                                                        <label key={groupName} className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer">
                                                            <span className="text-black">
                                                                {groupName} <span className="text-xs text-gray-500">({(groupClients as any[]).length})</span>
                                                            </span>
                                                            <input type="checkbox" checked={publicoAlvo.includes(groupName)} onChange={() => handleAudienceChange(groupName, false)} className="h-4 w-4 text-primary rounded border-gray-300" />
                                                        </label>
                                                    ))}
                                                    {allTags.length > 0 && (
                                                        <>
                                                            <div className="p-2 pt-3">
                                                                <p className="text-xs font-bold text-gray-500 uppercase">Tags</p>
                                                            </div>
                                                            {allTags.map((tagName) => {
                                                                const tagIdentifier = `tag:${tagName}`;
                                                                const tagClientCount = clients.filter(c => c.tags?.includes(tagName)).length;
                                                                return (
                                                                    <label key={tagIdentifier} className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer">
                                                                        <span className="text-black">
                                                                            {tagName} <span className="text-xs text-gray-500">({tagClientCount})</span>
                                                                        </span>
                                                                        <input type="checkbox" checked={publicoAlvo.includes(tagIdentifier)} onChange={() => handleAudienceChange(tagName, true)} className="h-4 w-4 text-primary rounded border-gray-300" />
                                                                    </label>
                                                                );
                                                            })}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {publicoAlvo.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {publicoAlvo.map(identifier => (
                                                    <span key={identifier} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                                                        {identifier.startsWith('tag:') ? identifier.substring(4) : identifier}
                                                        <button type="button" onClick={() => {
                                                            const isTag = identifier.startsWith('tag:');
                                                            const name = isTag ? identifier.substring(4) : identifier;
                                                            handleAudienceChange(name, isTag);
                                                        }}>&times;</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {estimatedAudience !== null && publicoAlvo.length > 0 && (
                                            <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700 font-medium">
                                                Estimativa de alcance: {estimatedAudience} contatos
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center md:text-left">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Público estimado
                                            <div className="relative inline-block ml-1 group">
                                                <span className="text-gray-400 cursor-help">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </span>
                                                <div className="absolute bottom-full mb-2 w-56 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                                                    Soma dos públicos selecionados. Um cliente pode ser contado mais de uma vez se pertencer a múltiplos grupos. O alcance real será de {uniqueClientCount} clientes únicos.
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                                </div>
                                            </div>
                                        </label>
                                        <p className="mt-1 text-2xl font-bold text-primary">{audienceSum} contatos</p>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="phone-number" className="block text-sm font-medium text-gray-700">Selecionar número de envio (WhatsApp)</label>
                                    <select id="phone-number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                        <option value="">Selecione um número...</option>
                                        {unitPhone && (
                                            <option value={unitPhone}>Número Principal ({unitPhone})</option>
                                        )}
                                        {!unitPhone && (
                                            <>
                                                <option value="WhatsApp para Atendimento">WhatsApp para Atendimento</option>
                                                <option value="WhatsApp para Leads" disabled={isIndividualPlan}>WhatsApp para Leads {isIndividualPlan && '(Plano Empresa)'}</option>
                                            </>
                                        )}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">O número deve estar conectado na página de Canais.</p>
                                </div>

                                <MessageTypeSelector selected={messageType} onChange={(type) => setMessageType(type as any)} />

                                {messageType !== 'texto' && (
                                    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-300'}`}>
                                        {filePreviewUrl && messageType === 'imagem' ? (
                                            <div className="text-center relative"><img src={filePreviewUrl} alt="Preview" className="mx-auto max-h-40 rounded-md shadow-md" /><button type="button" onClick={(e) => { e.stopPropagation(); handleFileSelect(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button><p className="text-xs text-gray-600 mt-2 truncate">{file?.name}</p></div>
                                        ) : (<div className="space-y-1 text-center"><svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg><div className="flex text-sm text-gray-600"><p className="pl-1">Arraste e solte ou clique para selecionar</p></div>{file ? (<p className="text-xs text-green-600 font-semibold mt-2">Arquivo: {file.name}</p>) : (<p className="text-xs text-gray-500">Imagem, áudio ou PDF, até 5MB</p>)}</div>)}
                                        <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFileSelect(e.target.files ? e.target.files[0] : null)} />
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="campaign-message" className="block text-sm font-medium text-gray-700">Escreva sua mensagem aqui...</label>
                                    <textarea id="campaign-message" value={messageText} onChange={e => setMessageText(e.target.value)} rows={4} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                    <button type="button" onClick={handleImproveText} disabled={isImprovingText} className="mt-2 flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-gray-700 disabled:bg-gray-400">
                                        {isImprovingText ? (<><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Melhorando...</span></>) : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg><span>Melhorar texto com IA</span></>)}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Intervalo de delay entre contatos: <span className="font-bold text-primary">{formatDelay(minDelay)} - {formatDelay(maxDelay)}</span></label>
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="min-delay" className="block text-xs font-medium text-gray-500">Mínimo: {formatDelay(minDelay)}</label>
                                                <input id="min-delay" type="range" min="10" max="300" step="5" value={minDelay} onChange={e => {
                                                    const newMin = Number(e.target.value);
                                                    setMinDelay(newMin);
                                                    if (newMin > maxDelay) {
                                                        setMaxDelay(newMin);
                                                    }
                                                }} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                                            </div>
                                            <div>
                                                <label htmlFor="max-delay" className="block text-xs font-medium text-gray-500">Máximo: {formatDelay(maxDelay)}</label>
                                                <input id="max-delay" type="range" min="10" max="300" step="5" value={maxDelay} onChange={e => {
                                                    const newMax = Number(e.target.value);
                                                    setMaxDelay(newMax);
                                                    if (newMax < minDelay) {
                                                        setMinDelay(newMax);
                                                    }
                                                }} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1"><span>10s</span><span>5m</span></div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="send-limit" className="block text-sm font-medium text-gray-700">Limite de envio por dia: <span className="font-bold text-primary">{sendLimit}</span></label>
                                        <input id="send-limit" type="range" min="200" max="300" step="10" value={sendLimit} onChange={e => setSendLimit(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary mt-2" />
                                        <div className="flex justify-between text-xs text-gray-500"><span>200</span><span>300</span></div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Recomendado 200 envios por dia, campanha só é enviada uma vez por número.</p>

                                <div className="pt-4 border-t">
                                    <button type="button" onClick={() => setIsScheduleModalOpen(true)} className="text-sm font-semibold text-primary hover:underline">Configurar horários permitidos para disparo</button>
                                </div>

                                <div>
                                    <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700">Data de Agendamento</label>
                                    <input id="schedule-date" type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">{campaignToEdit ? t('updateCampaign') : 'Criar Campanha'}</button>
                            <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2">{t('cancel')}</button>
                        </div>
                    </form>
                </div>
            </div>
            <ScheduleSettingsModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSave={handleSaveSchedule}
                initialSchedule={scheduleSettings}
            />
        </>
    );
};


// --- Main Component ---
// FIX: Changed to a named export to resolve module resolution errors.
export const MarketingCampaigns: React.FC<MarketingCampaignsProps> = (props) => {
    const { t } = useLanguage();
    const { onComingSoon, onAddCampaign, onUpdateCampaign, onArchiveCampaign, onUnarchiveCampaign, onDuplicateCampaign, campaigns, clients, appointments, isIndividualPlan, navigate } = props;
    const [activeTab, setActiveTab] = useState('campanhas');

    const TabButton: React.FC<{ tabId: string; label: string }> = ({ tabId, label }) => (
        <button
            onClick={() => {
                setActiveTab(tabId);
            }}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <TabButton tabId="campanhas" label={t('marketingTabCampaigns')} />
                    <TabButton tabId="canal-aquisicao" label={t('marketingTabAcquisitionChannel')} />
                    <TabButton tabId="mala-direta" label={t('marketingTabDirectMail')} />
                    <TabButton tabId="servidor" label={t('marketingTabServer')} />
                </nav>
            </div>

            <div className="mt-6 animate-fade-in">
                {activeTab === 'campanhas' && <CampaignsTab {...props} />}
                {activeTab === 'canal-aquisicao' && <AcquisitionChannelsTab {...props} />}
                {activeTab === 'mala-direta' && <DirectMailTab {...props} />}
                {activeTab === 'servidor' && (
                    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Servidor de E-mail</h3>
                        <p className="text-gray-500 max-w-md mb-8">
                            Configure suas credenciais SMTP para ter controle total sobre o envio de e-mails transacionais e marketing.
                        </p>
                        <button
                            onClick={() => navigate?.('settings?tab=email-server')}
                            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105"
                        >
                            Configurar Servidor nas Configurações
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- Tab Components ---

const CampaignsTab: React.FC<Partial<MarketingCampaignsProps>> = ({ onAddCampaign, onUpdateCampaign, onArchiveCampaign, onUnarchiveCampaign, onDuplicateCampaign, campaigns, clients, appointments, isIndividualPlan, navigate, unitPhone }) => {
    const { t } = useLanguage();
    const [isUpsertModalOpen, setIsUpsertModalOpen] = useState(false);
    const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
    const [view, setView] = useState<'active' | 'archived'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedCampaignForDetails, setSelectedCampaignForDetails] = useState<Campaign | null>(null);
    const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;

    const handleViewDetails = (campaign: Campaign) => {
        setSelectedCampaignForDetails(campaign);
        setDetailsModalOpen(true);
    };

    const handleArchive = (e: React.MouseEvent, campaignId: number) => { e.stopPropagation(); onArchiveCampaign?.(campaignId); };
    const handleUnarchive = (e: React.MouseEvent, campaignId: number) => { e.stopPropagation(); onUnarchiveCampaign?.(campaignId); };
    const handleDuplicate = (e: React.MouseEvent, campaignId: number) => { e.stopPropagation(); onDuplicateCampaign?.(campaignId); };
    const handleEdit = (e: React.MouseEvent, campaign: Campaign) => { e.stopPropagation(); setCampaignToEdit(campaign); setIsUpsertModalOpen(true); };
    const handleAddNew = () => { setCampaignToEdit(null); setIsUpsertModalOpen(true); };

    const handleSave = (campaignData: any) => {
        if (campaignToEdit) {
            onUpdateCampaign?.({ ...campaignToEdit, ...campaignData });
        } else {
            onAddCampaign?.(campaignData);
        }
        setIsUpsertModalOpen(false);
    };

    const activeCampaigns = useMemo(() => campaigns?.filter(c => !c.archived) || [], [campaigns]);
    const archivedCampaigns = useMemo(() => campaigns?.filter(c => c.archived) || [], [campaigns]);
    const campaignsInView = view === 'active' ? activeCampaigns : archivedCampaigns;

    const filteredCampaigns = useMemo(() => {
        if (!searchQuery.trim()) return campaignsInView;
        const lowercasedQuery = searchQuery.toLowerCase();
        return campaignsInView.filter(campaign =>
            campaign.name.toLowerCase().includes(lowercasedQuery) ||
            (Array.isArray(campaign.targetAudience) && campaign.targetAudience.join(' ').toLowerCase().includes(lowercasedQuery))
        );
    }, [campaignsInView, searchQuery]);

    const Stat: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-primary">{icon}</span>
            <div>
                <p className="font-bold text-secondary leading-tight">{value}</p>
                <p className="text-xs text-gray-500 leading-tight">{label}</p>
            </div>
        </div>
    );

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-secondary">Campanhas de Marketing</h2>
                    <p className="text-sm text-gray-500">Crie e gerencie suas campanhas para engajar seu público.</p>
                </div>
                <div className="relative group">
                    <button
                        onClick={handleAddNew}
                        disabled={isIndividualPlan}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg inline-flex items-center gap-2 transition-transform transform hover:scale-105 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        + {t('newCampaign')}
                    </button>
                    {isIndividualPlan && (
                        <div className="absolute bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded py-3 px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10 text-center">
                            <div className="font-bold mb-1 flex items-center justify-center gap-1">
                                <LockIcon /> {t('planEnterprise')}
                            </div>
                            <p className="mb-2">{t('marketingUpgradeTooltip')}</p>
                            <button
                                onClick={() => navigate?.('upgrade_to_empresa')}
                                className="w-full mt-2 py-1.5 px-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors pointer-events-auto"
                            >
                                {t('upgradeButton')}
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="my-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por nome ou público..."
                    className="w-full p-2 pl-4 border border-gray-300 rounded-lg shadow-sm"
                />
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setView('active')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${view === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Ativas ({activeCampaigns.length})</button>
                    <button onClick={() => setView('archived')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${view === 'archived' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Arquivadas ({archivedCampaigns.length})</button>
                </nav>
            </div>

            {filteredCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {filteredCampaigns.map(campaign => (
                        <div key={campaign.id} onClick={() => handleViewDetails(campaign)} className="bg-white p-5 rounded-xl shadow-lg border border-transparent hover:border-primary transition-all duration-300 group cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-secondary truncate">{campaign.name}</h3>
                                    <p className="text-sm text-secondary truncate">Público: <span className="font-medium text-secondary">{Array.isArray(campaign.targetAudience) ? campaign.targetAudience.join(', ') : campaign.targetAudience}</span></p>
                                    <p className="text-sm text-secondary mt-1">{t('scheduledDateLabel')}: <span className="font-medium text-secondary">{campaign.scheduleDate ? new Date(campaign.scheduleDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não agendada'}</span></p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                    <p className="font-medium text-secondary text-xs">{t('status')}</p>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${campaign.status === 'Concluída' ? 'bg-green-100 text-secondary' : campaign.status === 'Agendada' ? 'bg-gray-200 text-secondary' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {campaign.status}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-around items-center">
                                <Stat label={t('campaignReach')} value={campaign.stats?.alcance || 0} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                                <Stat label={t('campaignConversions')} value={campaign.stats?.conversoes || 0} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 00-1.564.317z" /></svg>} />
                                <Stat label={t('campaignRevenue')} value={`R$ ${(campaign.stats?.receita || 0).toFixed(2)}`} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m-4 0H8v1m4-1v-1m-4 5v1m-2-4h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" /></svg>} />
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-end items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleViewDetails(campaign); }} className="text-sm font-semibold text-gray-600 hover:text-primary">{t('details')}</button>
                                <button onClick={(e) => handleEdit(e, campaign)} className="text-sm font-semibold text-blue-600 hover:underline">{t('edit')}</button>
                                <button onClick={(e) => handleDuplicate(e, campaign.id)} className="text-sm font-semibold text-gray-500 hover:text-primary">{t('duplicate')}</button>
                                {view === 'active' ? (
                                    <button onClick={(e) => handleArchive(e, campaign.id)} className="text-sm font-semibold text-yellow-600 hover:text-yellow-800">{t('archive')}</button>
                                ) : (
                                    <button onClick={(e) => handleUnarchive(e, campaign.id)} className="text-sm font-semibold text-green-600 hover:text-green-800">{t('unarchive')}</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-light rounded-lg mt-6">
                    <p className="text-gray-500">Nenhuma campanha encontrada.</p>
                </div>
            )}
            <NewCampaignModal
                isOpen={isUpsertModalOpen}
                onClose={() => setIsUpsertModalOpen(false)}
                onSave={handleSave}
                campaignToEdit={campaignToEdit}
                clients={clients || []}
                appointments={appointments || []}
                isIndividualPlan={!!isIndividualPlan}
                unitPhone={unitPhone}
            />
            <CampaignDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                campaign={selectedCampaignForDetails}
                clients={clients || []}
                appointments={appointments || []}
            />
        </>
    );
};

const DirectMailTab: React.FC<Partial<MarketingCampaignsProps>> = ({ directMailCampaigns, onAddDirectMailCampaign, onUpdateDirectMailCampaign, onDeleteDirectMailCampaign, onArchiveDirectMailCampaign, onUnarchiveDirectMailCampaign, onSendDirectMailCampaign, isIndividualPlan }) => {
    // Content from DirectMailCampaign.tsx
    const props = {
        campaigns: directMailCampaigns || [],
        onAddCampaign: onAddDirectMailCampaign!,
        onUpdateCampaign: onUpdateDirectMailCampaign!,
        onDeleteCampaign: onDeleteDirectMailCampaign!,
        onArchiveCampaign: onArchiveDirectMailCampaign!,
        onUnarchiveCampaign: onUnarchiveDirectMailCampaign!,
        onSendCampaign: onSendDirectMailCampaign!,
        isIndividualPlan: isIndividualPlan || false,
    };
    return <DirectMailCampaign {...props} />;
};

const AcquisitionChannelsTab: React.FC<Partial<MarketingCampaignsProps>> = ({
    acquisitionChannels = [],
    onSaveAcquisitionChannel,
    onOpenEditChannelModal,
    onSuspendAcquisitionChannel,
    onArchiveAcquisitionChannel,
    onUnarchiveAcquisitionChannel,
    isNewChannelModalOpen,
    onCloseNewChannelModal,
    channelToEdit,
    clients,
    onComingSoon
}) => {
    const { t } = useLanguage();
    const [view, setView] = useState<'active' | 'archived'>('active');

    const handleAddNew = () => {
        onOpenEditChannelModal?.(null);
    };

    const channelsWithClientCount = useMemo(() => {
        return acquisitionChannels.map(channel => {
            const count = clients?.filter(client => (client.how_found_us || client.howTheyFoundUs) === channel.name).length || 0;
            return { ...channel, clients: count };
        });
    }, [acquisitionChannels, clients]);

    const activeChannels = useMemo(() => channelsWithClientCount.filter(c => !c.archived), [channelsWithClientCount]);
    const archivedChannels = useMemo(() => channelsWithClientCount.filter(c => c.archived), [channelsWithClientCount]);
    const channelsToDisplay = view === 'active' ? activeChannels : archivedChannels;

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-secondary">{t('acquisitionChannelTitle')}</h2>
                    <p className="text-sm text-gray-500">{t('acquisitionChannelSubtitle')}</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-5 rounded-lg inline-flex items-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                >
                    + {t('newAcquisitionChannel')}
                </button>
            </div>

            <div className="my-6 border-b border-gray-200 flex justify-end">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setView('active')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm ${view === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>{t('viewActive')} ({activeChannels.length})</button>
                    <button onClick={() => setView('archived')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm ${view === 'archived' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}>{t('viewArchived')} ({archivedChannels.length})</button>
                </nav>
            </div>

            {channelsToDisplay.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('channelNameHeader')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('channelDurationHeader')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('channelClientsHeader')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('channelStatusHeader')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('channelActionsHeader')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {channelsToDisplay.map(channel => (
                                <tr key={channel.id} className={`${channel.suspended ? 'bg-gray-50 opacity-60' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{channel.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{channel.duration}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 text-center font-bold">{channel.clients}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${channel.suspended ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                                            {channel.suspended ? t('statusSuspended') : t('statusActive')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <button onClick={() => onOpenEditChannelModal?.(channel)} className="text-blue-600 hover:underline">{t('edit')}</button>
                                        <button onClick={() => onSuspendAcquisitionChannel?.(channel.id, channel.name, channel.suspended)} className={channel.suspended ? "text-green-600 hover:underline" : "text-yellow-600 hover:underline"}>
                                            {channel.suspended ? t('actionReactivate') : t('actionSuspend')}
                                        </button>
                                        {view === 'active' ? (
                                            <button onClick={() => onArchiveAcquisitionChannel?.(channel.id, channel.name)} className="text-gray-500 hover:underline">{t('archive')}</button>
                                        ) : (
                                            <button onClick={() => onUnarchiveAcquisitionChannel?.(channel.id, channel.name)} className="text-gray-500 hover:underline">{t('unarchive')}</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-16 bg-light rounded-lg">
                    <p className="text-gray-500">{view === 'active' ? t('noActiveChannels') : t('noArchivedChannels')}</p>
                    {view === 'active' && <p className="text-sm text-gray-400 mt-1">{t('addNewChannelPrompt')}</p>}
                </div>
            )}

            <NewAcquisitionChannelModal
                isOpen={isNewChannelModalOpen ?? false}
                onClose={onCloseNewChannelModal!}
                onSave={onSaveAcquisitionChannel!}
                channelToEdit={channelToEdit}
            />
        </>
    );
};

const EmailServerSettingsTab: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <EmailServerSettings />
        </div>
    );
};

const AutomationsTab: React.FC<{ onComingSoon?: (featureName: string) => void }> = ({ onComingSoon }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-secondary">Automações de Marketing</h3>
                <p className="text-gray-500 mt-2">Conecte o Salão24h com as melhores ferramentas de automação do mercado.</p>
            </div>

            <div className="space-y-6">
                <div className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-[#0084FF] rounded-lg flex items-center justify-center text-white">
                            <span className="font-extrabold text-xl">M</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-secondary text-lg">ManyChat</h4>
                            <p className="text-sm text-gray-500">Automação de DMs no Instagram, WhatsApp e Messenger.</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ManyChat API Key</label>
                        <input
                            type="password"
                            disabled
                            placeholder="••••••••••••••••••••••••••••"
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm cursor-not-allowed"
                        />
                    </div>

                    <button
                        onClick={() => onComingSoon?.('A engine de automação inteligente (ManyChat style) estará disponível na versão 2.0.')}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
                    >
                        Ativar Automações ManyChat
                    </button>

                    <p className="text-center text-[11px] text-gray-400 mt-4 italic">
                        * Requer plano Enterprise ou addon de Automação Ativo.
                    </p>
                </div>
            </div>
        </div>
    );
}; export default MarketingCampaigns;
