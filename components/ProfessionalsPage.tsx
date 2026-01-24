import React, { useState, useMemo } from 'react';
import NewProfessionalModal from './NewProfessionalModal';
import { useLanguage } from '../contexts/LanguageContext';

interface Professional {
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

interface ProfessionalsPageProps {
    onBack?: () => void;
    professionals: Professional[];
    onSaveProfessional: (professional: Partial<Professional>) => void;
    onSuspendProfessional: (id: number) => void;
    onArchiveProfessional: (id: number) => void;
    isIndividualPlan?: boolean;
}

const ProfessionalsPage: React.FC<ProfessionalsPageProps> = ({
    onBack,
    professionals,
    onSaveProfessional,
    onSuspendProfessional,
    onArchiveProfessional,
    isIndividualPlan
}) => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [professionalToEdit, setProfessionalToEdit] = useState<Professional | null>(null);
    const [view, setView] = useState<'active' | 'suspended' | 'archived'>('active');

    const filteredProfessionals = useMemo(() => {
        return professionals.filter(prof => {
            const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prof.occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prof.email?.toLowerCase().includes(searchQuery.toLowerCase());

            if (view === 'active') return matchesSearch && !prof.suspended && !prof.archived;
            if (view === 'suspended') return matchesSearch && prof.suspended && !prof.archived;
            if (view === 'archived') return matchesSearch && prof.archived;
            return matchesSearch;
        });
    }, [professionals, searchQuery, view]);

    const handleSave = (professionalData: Partial<Professional>) => {
        onSaveProfessional(professionalData);
        setIsModalOpen(false);
        setProfessionalToEdit(null);
    };

    const handleEdit = (professional: Professional) => {
        setProfessionalToEdit(professional);
        setIsModalOpen(true);
    };

    const activeCount = professionals.filter(p => !p.suspended && !p.archived).length;
    const suspendedCount = professionals.filter(p => p.suspended && !p.archived).length;
    const archivedCount = professionals.filter(p => p.archived).length;

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
                        <h1 className="text-3xl font-bold text-secondary">Profissionais</h1>
                        <p className="text-gray-500 mt-1">Gerencie sua equipe de profissionais</p>
                    </div>
                    {!isIndividualPlan && (
                        <button
                            onClick={() => { setProfessionalToEdit(null); setIsModalOpen(true); }}
                            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Novo Profissional
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por nome, função ou email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setView('active')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Ativos ({activeCount})
                        </button>
                        <button
                            onClick={() => setView('suspended')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'suspended' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Suspensos ({suspendedCount})
                        </button>
                        <button
                            onClick={() => setView('archived')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'archived' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Arquivados ({archivedCount})
                        </button>
                    </nav>
                </div>

                {/* Professionals Grid */}
                {filteredProfessionals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProfessionals.map(prof => (
                            <div
                                key={prof.id}
                                className={`bg-light p-5 rounded-xl border border-transparent hover:border-primary transition-all group ${prof.suspended || prof.archived ? 'opacity-60' : ''}`}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <img
                                        src={prof.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.name)}&background=random&size=150`}
                                        alt={prof.name}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg mb-4"
                                    />
                                    <h3 className="font-bold text-secondary text-lg">{prof.name}</h3>
                                    {prof.occupation && (
                                        <p className="text-sm text-primary font-medium">{prof.occupation}</p>
                                    )}
                                    {prof.email && (
                                        <p className="text-xs text-gray-500 mt-1 truncate max-w-full">{prof.email}</p>
                                    )}
                                    {prof.phone && (
                                        <p className="text-xs text-gray-500">{prof.phone}</p>
                                    )}

                                    {prof.specialties && prof.specialties.length > 0 && (
                                        <div className="flex flex-wrap gap-1 justify-center mt-3">
                                            {prof.specialties.slice(0, 3).map((specialty, idx) => (
                                                <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                    {specialty}
                                                </span>
                                            ))}
                                            {prof.specialties.length > 3 && (
                                                <span className="text-xs text-gray-400">+{prof.specialties.length - 3}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="mt-4">
                                        {prof.archived ? (
                                            <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">Arquivado</span>
                                        ) : prof.suspended ? (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">Suspenso</span>
                                        ) : (
                                            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">Ativo</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(prof)}
                                        className="flex-1 py-1 px-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                        Editar
                                    </button>
                                    {!prof.archived && (
                                        <>
                                            <button
                                                onClick={() => onSuspendProfessional(prof.id)}
                                                className={`flex-1 py-1 px-2 text-xs rounded ${prof.suspended ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                                            >
                                                {prof.suspended ? 'Ativar' : 'Suspender'}
                                            </button>
                                            <button
                                                onClick={() => onArchiveProfessional(prof.id)}
                                                className="flex-1 py-1 px-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                            >
                                                Arquivar
                                            </button>
                                        </>
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
                        <p className="text-gray-500 font-medium">Nenhum profissional encontrado</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchQuery ? 'Tente ajustar sua busca' : 'Adicione seu primeiro profissional'}
                        </p>
                    </div>
                )}

                {/* Stats */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-primary">{professionals.length}</p>
                        <p className="text-sm text-gray-600">Total</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                        <p className="text-sm text-gray-600">Ativos</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-yellow-600">{suspendedCount}</p>
                        <p className="text-sm text-gray-600">Suspensos</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-gray-600">{archivedCount}</p>
                        <p className="text-sm text-gray-600">Arquivados</p>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <NewProfessionalModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setProfessionalToEdit(null); }}
                    onSave={handleSave}
                    professionalToEdit={professionalToEdit}
                />
            )}
        </div>
    );
};

export default ProfessionalsPage;
