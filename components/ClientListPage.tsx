import React, { useState, useMemo } from 'react';
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
    blocked?: boolean;
    tags?: string[];
    [key: string]: any;
}

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
            const matchesView = view === 'all' ? !client.blocked : client.blocked;
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClients.map(client => (
                            <div
                                key={client.id}
                                className={`bg-light p-4 rounded-xl border border-transparent hover:border-primary transition-all cursor-pointer group ${client.blocked ? 'opacity-60' : ''}`}
                                onClick={() => setSelectedClient(client)}
                            >
                                <div className="flex items-center gap-4">
                                    <img
                                        src={client.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random`}
                                        alt={client.name}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-secondary truncate">{client.name}</h3>
                                        <p className="text-sm text-gray-500 truncate">{client.phone}</p>
                                        {client.email && <p className="text-xs text-gray-400 truncate">{client.email}</p>}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                    <span>{client.totalVisits || 0} visitas</span>
                                    {client.lastVisit && (
                                        <span>Última: {new Date(client.lastVisit).toLocaleDateString('pt-BR')}</span>
                                    )}
                                </div>
                                <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEditClient(client); }}
                                        className="flex-1 py-1 px-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                        Editar
                                    </button>
                                    {onOpenChat && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenChat(client.id); }}
                                            className="flex-1 py-1 px-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                        >
                                            Chat
                                        </button>
                                    )}
                                    {!client.blocked ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleBlock(client.id); }}
                                            className="flex-1 py-1 px-2 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                                        >
                                            Bloquear
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onUnblockClient(client.id); }}
                                            className="flex-1 py-1 px-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                        >
                                            Desbloquear
                                        </button>
                                    )}
                                </div>
                            </div>
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
                />
            )}
        </div>
    );
};

export default ClientListPage;
