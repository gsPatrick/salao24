import React, { useState, useMemo, useRef } from 'react';
import { NewClientModal } from './NewClientModal';
import ClientDetailModal from './ClientDetailModal';
import { useLanguage } from '../contexts/LanguageContext';

interface Client {
    id: number;
    name: string;
    phone: string;
    email?: string;
    photo?: string;
    lastVisit?: string;
    totalVisits?: number;
    howTheyFoundUs?: string;
    registrationDate?: string;
    birthdate?: string;
    blocked?: boolean;
    tags?: string[];
    [key: string]: any;
}

// --- Icons ---
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.89.001 2.228.651 4.39 1.849 6.22l-1.072 3.912 3.995-1.045zM9.266 8.39c-.195-.315-.315-.32-1.125-.32h-.125c-.25 0-.5.063-.75.315-.25.25-.938.938-.938 2.25s.938 2.625 1.063 2.75c.125.125.938 1.438 2.313 2.063.315.125.563.25.75.315.5.125.938.063 1.313-.19.438-.315.938-.938 1.125-1.25.19-.315.19-.563.063-.69-.125-.125-.25-.19-.5-.315s-.938-.438-1.063-.5c-.125-.063-.19-.063-.25 0-.063.063-.25.315-.313.375-.063.063-.125.063-.25 0-.125-.063-.5-.19-1-1.25C8.313 9.77 7.938 9.27 7.813 9.145c-.125-.125-.063-.19 0-.25.063-.063.25-.25.313-.313.063-.062.125-.125.19-.19.063-.062.063-.125 0-.19s-.25-.625-.313-.75z" />
    </svg>
);
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V8a1 1 0 011-1h12a1 1 0 011 1v7.546zM12 12.5a.5.5 0 110-1 .5.5 0 010 1zM3 21h18v-1a1 1 0 00-1-1H4a1 1 0 00-1 1v1z" /></svg>;

// --- Helper Functions ---
const getClientStatus = (birthdate?: string, lastVisit?: string, totalVisits: number = 0) => {
    const today = new Date();
    const birthDate = birthdate ? new Date(birthdate) : null;
    const lastVisitDate = lastVisit ? new Date(lastVisit) : null;

    const isBirthdayToday = birthDate ? (today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth()) : false;
    const isBirthdayMonth = birthDate ? (today.getMonth() === birthDate.getMonth()) : false;

    const daysSinceLastVisit = lastVisitDate ? Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    let classification: 'Nova' | 'Recorrente' | 'VIP' | 'Inativa' = 'Nova';
    if (daysSinceLastVisit > 60) {
        classification = 'Inativa';
    } else if (totalVisits > 5) {
        classification = 'VIP';
    } else if (totalVisits >= 2) {
        classification = 'Recorrente';
    }

    return { isBirthdayToday, isBirthdayMonth, classification };
};

const Confetti: React.FC = () => (
    <>
        <span className="absolute top-[15%] left-[10%] w-1 h-2 bg-red-400 rotate-45 opacity-70"></span>
        <span className="absolute top-[5%] left-[50%] w-1.5 h-1.5 bg-blue-400 rounded-full opacity-70"></span>
        <span className="absolute top-[20%] left-[85%] w-1 h-2.5 bg-green-400 -rotate-45 opacity-70"></span>
        <span className="absolute top-[50%] left-[25%] w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-70"></span>
        <span className="absolute top-[70%] left-[5%] w-1 h-1 bg-pink-400 rounded-full opacity-70"></span>
        <span className="absolute top-[85%] left-[35%] w-1.5 h-1 bg-indigo-400 rotate-12 opacity-70"></span>
        <span className="absolute top-[60%] left-[90%] w-1.5 h-1.5 bg-teal-400 rounded-full opacity-70"></span>
        <span className="absolute top-[95%] left-[70%] w-1 h-2 bg-orange-400 -rotate-12 opacity-70"></span>
        <span className="absolute top-[40%] left-[60%] w-1 h-1 bg-purple-400 rounded-full opacity-70"></span>
    </>
);

const ClassificationBadge: React.FC<{ classification: string }> = ({ classification }) => {
    const colors: { [key: string]: string } = {
        'Nova': 'bg-blue-100 text-blue-800',
        'Recorrente': 'bg-green-100 text-green-800',
        'VIP': 'bg-purple-100 text-purple-800',
        'Inativa': 'bg-yellow-100 text-yellow-800',
    };
    const icons: { [key: string]: string } = { 'Nova': '👤', 'Recorrente': '💎', 'VIP': '👑', 'Inativa': '⏳' };
    return <span className={`text-[10px] font-semibold mr-2 px-2 py-0.5 rounded-full ${colors[classification] || 'bg-gray-100 text-gray-800'}`}>{icons[classification] || '👤'} {classification}</span>;
};

const ClientCard: React.FC<{ client: Client, onClick: () => void, onOpenChat?: (clientId: number) => void }> = ({ client, onClick, onOpenChat }) => {
    const { isBirthdayMonth, classification } = getClientStatus(client.birthdate, client.lastVisit, client.totalVisits);

    const cardClasses = `p-4 rounded-xl shadow-md border-l-4 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg w-full text-left cursor-pointer relative overflow-hidden ${isBirthdayMonth ? 'bg-yellow-300 border-pink-400' : 'bg-white border-gray-200'
        } ${client.blocked ? 'opacity-60' : ''}`;

    const formattedBirthdate = client.birthdate ? new Date(client.birthdate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--';

    return (
        <div onClick={onClick} className={cardClasses}>
            {isBirthdayMonth && <Confetti />}
            <div className="flex items-start space-x-4 relative z-10">
                <div className="relative flex-shrink-0">
                    <img
                        src={client.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random`}
                        alt={client.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    {isBirthdayMonth && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl transform -rotate-[15deg]" role="img" aria-label="Rosto festivo">🥳</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold truncate ${isBirthdayMonth ? 'text-black' : 'text-secondary'}`}>{client.name}</h3>
                        <ClassificationBadge classification={classification} />
                    </div>
                    <div className={`text-xs space-y-1.5 mt-2 ${isBirthdayMonth ? 'text-gray-800' : 'text-gray-500'}`}>
                        <div className="flex items-center justify-between">
                            <a href={`tel:${client.phone.replace(/\D/g, '')}`} onClick={(e) => e.stopPropagation()} title="Ligar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-bold hover:text-primary transition-colors">
                                <PhoneIcon />
                                <span>{client.phone}</span>
                            </a>
                            <div className="flex items-center gap-2">
                                {onOpenChat && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenChat?.(client.id);
                                        }}
                                        title="WhatsApp"
                                        className="text-current hover:text-green-600 transition-colors"
                                    >
                                        <WhatsAppIcon />
                                    </button>
                                )}
                            </div>
                        </div>
                        {client.email && (
                            <a href={`mailto:${client.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 text-current hover:text-primary transition-colors truncate">
                                <MailIcon /><span>{client.email}</span>
                            </a>
                        )}
                        <p className="flex items-center gap-2"><CakeIcon /><span>{formattedBirthdate}</span></p>
                    </div>
                </div>
            </div>
            {client.blocked && (
                <div className="absolute top-2 right-2">
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Bloqueado</span>
                </div>
            )}
        </div>
    );
};

interface ClientListPageProps {
    onBack?: () => void;
    navigate: (page: string) => void;
    clients: Client[];
    onAddNewClient: (client: Partial<Client>) => void;
    acquisitionChannels: any[];
    onOpenChat?: (clientId: number) => void;
    onDeleteClient: (clientId: number) => void;
    onBlockClient: (clientId: number, reason: string) => void;
    onUnblockClient: (clientId: number) => void;
    isIndividualPlan?: boolean;
    onComingSoon?: (featureName: string) => void;
}

const ClientListPage: React.FC<ClientListPageProps> = ({
    onBack,
    navigate,
    clients,
    onAddNewClient,
    acquisitionChannels,
    onOpenChat,
    onDeleteClient,
    onBlockClient,
    onUnblockClient,
    isIndividualPlan,
    onComingSoon
}) => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [view, setView] = useState<'all' | 'blocked'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'registrationDate'>('name');

    const filteredClients = useMemo(() => {
        let result = clients.filter(client => {
            const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.phone?.includes(searchQuery) ||
                client.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesView = view === 'all' ? !client.blocked?.status : client.blocked?.status;
            return matchesSearch && matchesView;
        });

        result.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'lastVisit') return (b.lastVisit || '').localeCompare(a.lastVisit || '');
            if (sortBy === 'registrationDate') return (b.registrationDate || '').localeCompare(a.registrationDate || '');
            return 0;
        });

        return result;
    }, [clients, searchQuery, view, sortBy]);

    const handleSaveClient = (clientData: Partial<Client>) => {
        onAddNewClient(clientData);
        setIsModalOpen(false);
        setClientToEdit(null);
    };

    const handleEditClient = (client: Client) => {
        setClientToEdit(client);
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = (clientId: number) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
            onDeleteClient(clientId);
            setSelectedClient(null);
        }
    };

    const handleBlock = (clientId: number) => {
        const reason = window.prompt('Motivo do bloqueio:');
        if (reason) {
            onBlockClient(clientId, reason);
        }
    };

    return (
        <div className="container mx-auto px-6 py-8">
            {onBack && (
                <button onClick={onBack} className="mb-6 flex items-center text-primary hover:text-primary-dark font-semibold transition-colors">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar ao Dashboard
                </button>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-lg">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">Clientes</h1>
                        <p className="text-gray-500 mt-1">Gerencie sua base de clientes</p>
                    </div>
                    <button
                        onClick={() => { setClientToEdit(null); setIsModalOpen(true); }}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Novo Cliente
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por nome, telefone ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    >
                        <option value="name">Ordenar por Nome</option>
                        <option value="lastVisit">Última Visita</option>
                        <option value="registrationDate">Data de Cadastro</option>
                    </select>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setView('all')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'all' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Ativos ({clients.filter(c => !c.blocked).length})
                        </button>
                        <button
                            onClick={() => setView('blocked')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'blocked' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Bloqueados ({clients.filter(c => c.blocked).length})
                        </button>
                    </nav>
                </div>

                {/* Client List */}
                {filteredClients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClients.map(client => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                onClick={() => setSelectedClient(client)}
                                onOpenChat={onOpenChat}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-light rounded-lg">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-500 font-medium">Nenhum cliente encontrado</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchQuery ? 'Tente ajustar sua busca' : 'Adicione seu primeiro cliente'}
                        </p>
                    </div>
                )}

                {/* Stats */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-primary">{clients.length}</p>
                        <p className="text-sm text-gray-600">Total de Clientes</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-green-600">{clients.filter(c => !c.blocked).length}</p>
                        <p className="text-sm text-gray-600">Clientes Ativos</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-600">
                            {clients.filter(c => {
                                if (!c.registrationDate) return false;
                                const regDate = new Date(c.registrationDate);
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                return regDate >= thirtyDaysAgo;
                            }).length}
                        </p>
                        <p className="text-sm text-gray-600">Novos (30 dias)</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-yellow-600">{clients.filter(c => c.blocked).length}</p>
                        <p className="text-sm text-gray-600">Bloqueados</p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <NewClientModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setClientToEdit(null); }}
                onSave={handleSaveClient}
                existingClients={clients}
                clientToEdit={clientToEdit}
                acquisitionChannels={acquisitionChannels}
                onComingSoon={onComingSoon}
            />

            {selectedClient && (
                <ClientDetailModal
                    isOpen={!!selectedClient}
                    onClose={() => setSelectedClient(null)}
                    client={selectedClient}
                    onEdit={handleEditClient}
                    onDelete={handleDeleteConfirm}
                    onOpenChat={onOpenChat}
                    onBlock={onBlockClient}
                    onUnblock={onUnblockClient}
                    existingClients={clients}
                    navigate={navigate}
                />
            )}
        </div>
    );
};

export default ClientListPage;
