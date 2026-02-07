import React, { useState, useEffect } from 'react';
import { NewServiceModal } from './NewServiceModal';
import NewPackageModal from './NewPackageModal';
import NewPlanModal from './NewPlanModal';
import { useData } from '../contexts/DataContext';
import { Service as ContextService, Package, SalonPlan as Plan } from '../types';

// Props for the main page
interface ServicesPageProps {
    onBack?: () => void;
}

const StarIconOutline = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const StarIconSolid = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const ServicesPage: React.FC<ServicesPageProps> = ({
    onBack,
}) => {
    const {
        services,
        saveService,
        deleteService,
        toggleSuspendService,
        toggleFavoriteService,
        packages,
        savePackage,
        deletePackage,
        toggleSuspendPackage,
        toggleFavoritePackage,
        salonPlans: plans,
        saveSalonPlan,
        deleteSalonPlan,
        toggleSuspendSalonPlan,
        toggleFavoriteSalonPlan,
        serviceCategories,
        addServiceCategory: onAddServiceCategory,
        updateServiceCategory: onUpdateServiceCategory,
        deleteServiceCategory: onDeleteServiceCategory,
    } = useData();
    // State management
    const [activeTab, setActiveTab] = useState('services');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'service' | 'package' | 'plan' | null>(null);
    const [itemToEdit, setItemToEdit] = useState<any | null>(null);
    const [filterQuery, setFilterQuery] = useState('');
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [showSuspended, setShowSuspended] = useState(false);

    const openModal = (type: 'service' | 'package' | 'plan', item?: any) => {
        setModalType(type);
        setItemToEdit(item || null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalType(null);
        setItemToEdit(null);
    };

    const TabButton: React.FC<{ tabName: string; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-lg font-semibold border-b-4 transition-colors duration-300 ${activeTab === tabName ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
        >
            {label}
        </button>
    );

    const renderList = (items: any[], type: 'service' | 'package' | 'plan') => {
        const handleDelete = (id: number, name: string) => {
            if (window.confirm(`Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`)) {
                if (type === 'service') deleteService(id);
                if (type === 'package') deletePackage(id);
                if (type === 'plan') deleteSalonPlan(id);
            }
        };

        const handleSuspend = (id: number) => {
            if (type === 'service') toggleSuspendService(id);
            if (type === 'package') toggleSuspendPackage(id);
            if (type === 'plan') toggleSuspendSalonPlan(id);
        };

        const filteredItems = items.filter(item => {
            const matchesQuery = item.name.toLowerCase().includes(filterQuery.toLowerCase());
            const matchesFavorite = !showOnlyFavorites || item.isFavorite;
            const matchesSuspended = showSuspended || !item.suspended;
            return matchesQuery && matchesFavorite && matchesSuspended;
        });

        return filteredItems.length > 0 ? (
            <div className="space-y-3">
                {filteredItems.map(item => (
                    <div key={item.id} className={`bg-white p-4 rounded-lg shadow-md flex justify-between items-center transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${item.suspended ? 'opacity-50' : ''}`}>
                        <div>
                            <p className="font-bold text-secondary flex items-center">
                                {item.name}
                                {item.suspended && <span className="ml-3 text-xs font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">SUSPENSO</span>}
                            </p>
                            <p className="text-sm text-gray-500">
                                {type === 'service' && `${item.duration} - R$ ${item.price}`}
                                {type === 'package' && `${item.sessions} sessões - R$ ${item.price}`}
                                {type === 'plan' && `${item.duration} - R$ ${item.price}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button onClick={() => openModal(type, item)} className="text-sm text-blue-600 hover:underline font-semibold">Editar</button>
                            <button onClick={() => handleSuspend(item.id)} className={`text-sm font-semibold ${item.suspended ? 'text-green-600 hover:underline' : 'text-yellow-600 hover:underline'}`}>
                                {item.suspended ? 'Reativar' : 'Suspender'}
                            </button>
                            <button onClick={() => handleDelete(item.id, item.name)} className="text-sm text-red-600 hover:underline font-semibold">Excluir</button>
                            <button
                                onClick={() => {
                                    if (type === 'service') toggleFavoriteService(item.id);
                                    if (type === 'package') toggleFavoritePackage(item.id);
                                    if (type === 'plan') toggleFavoriteSalonPlan(item.id);
                                }}
                                className={`p-2 rounded-full transition-colors ${item.isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-yellow-100 hover:text-yellow-500'}`}
                                title={item.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            >
                                {item.isFavorite ? <StarIconSolid /> : <StarIconOutline />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 bg-light rounded-lg">
                <p className="text-gray-500">{items.length > 0 ? 'Nenhum item encontrado com o filtro atual.' : 'Nenhum item cadastrado.'}</p>
            </div>
        );
    };


    return (
        <>
            <div className="container mx-auto px-6 py-8">
                {onBack && (
                    <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold">
                        &larr; Voltar ao Dashboard
                    </button>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-secondary">Serviços</h1>
                        <p className="text-gray-600 mt-1">Gerencie os serviços, pacotes e planos oferecidos.</p>
                    </div>
                </div>

                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Filtrar por nome..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="w-full sm:w-1/2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                    />
                    <button
                        onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors ${showOnlyFavorites ? 'bg-yellow-400 text-white shadow' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                    >
                        {showOnlyFavorites ? <StarIconSolid /> : <StarIconOutline />}
                        Mostrar Apenas Favoritos
                    </button>
                    <button
                        onClick={() => setShowSuspended(!showSuspended)}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors ${showSuspended ? 'bg-primary text-white shadow' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {showSuspended ? 'Ocultar Suspensos' : 'Mostrar Suspensos'}
                    </button>
                </div>

                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-4">
                        <TabButton tabName="services" label="Serviços" />
                        <TabButton tabName="packages" label="Pacotes" />
                        <TabButton tabName="plans" label="Planos" />
                    </nav>
                </div>

                {activeTab === 'services' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button onClick={() => openModal('service')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">+ Novo Serviço</button>
                        </div>
                        {renderList(services, 'service')}
                    </div>
                )}
                {activeTab === 'packages' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button onClick={() => openModal('package')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">+ Novo Pacote</button>
                        </div>
                        {renderList(packages.filter(p => !p.usageType || p.usageType === 'Serviços'), 'package')}
                    </div>
                )}
                {activeTab === 'plans' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <button onClick={() => openModal('plan')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg">+ Novo Plano</button>
                        </div>
                        {renderList(plans.filter(p => !p.usageType || p.usageType === 'Serviços'), 'plan')}
                    </div>
                )}
            </div>

            {modalType === 'service' && (
                <NewServiceModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onSave={saveService}
                    itemToEdit={itemToEdit}
                    categories={serviceCategories}
                    onAddCategory={onAddServiceCategory}
                    onUpdateCategory={onUpdateServiceCategory}
                    onDeleteCategory={onDeleteServiceCategory}
                />
            )}
            {modalType === 'package' && (
                <NewPackageModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onSave={savePackage}
                    itemToEdit={itemToEdit}
                    categories={serviceCategories}
                    onAddCategory={onAddServiceCategory}
                    usageType="Serviços"
                />
            )}
            {modalType === 'plan' && (
                <NewPlanModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onSave={saveSalonPlan}
                    itemToEdit={itemToEdit}
                    categories={serviceCategories}
                    onAddCategory={onAddServiceCategory}
                    usageType="Serviços"
                />
            )}
        </>
    );
};
export default ServicesPage;