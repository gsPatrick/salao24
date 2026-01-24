import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { NewServiceModal } from './NewServiceModal';

interface Service {
    id: number;
    name: string;
    description?: string;
    duration: string | number;
    price: string;
    category?: string;
    unit?: string;
    suspended?: boolean;
    isFavorite?: boolean;
    [key: string]: any;
}

interface Package {
    id: number;
    name: string;
    price: number;
    services?: string[];
    suspended?: boolean;
    [key: string]: any;
}

interface Plan {
    id: number;
    name: string;
    price: string;
    description?: string;
    suspended?: boolean;
    [key: string]: any;
}


interface ServicesPageProps {
    onBack?: () => void;
    services: Service[];
    packages?: Package[];
    plans?: Plan[];
    onSaveService: (service: Partial<Service>) => void;
    onSavePackage?: (pkg: Partial<Package>) => void;
    onSavePlan?: (plan: Partial<Plan>) => void;
    onDeleteService: (id: number) => void;
    onSuspendService: (id: number) => void;
    onDeletePackage?: (id: number) => void;
    onSuspendPackage?: (id: number) => void;
    onDeletePlan?: (id: number) => void;
    onSuspendPlan?: (id: number) => void;
    serviceCategories?: string[];
    onAddServiceCategory?: (category: string) => void;
    onUpdateServiceCategory?: (oldCategory: string, newCategory: string) => void;
    onDeleteServiceCategory?: (category: string) => void;
    onToggleFavorite?: (id: number) => void;
    onComingSoon?: (featureName: string) => void;
}

const ServicesPage: React.FC<ServicesPageProps> = ({
    onBack,
    services,
    packages = [],
    plans = [],
    onSaveService,
    onSavePackage,
    onSavePlan,
    onDeleteService,
    onSuspendService,
    onDeletePackage,
    onSuspendPackage,
    onDeletePlan,
    onSuspendPlan,
    serviceCategories = [],
    onAddServiceCategory,
    onUpdateServiceCategory,
    onDeleteServiceCategory,
    onToggleFavorite,
    onComingSoon
}) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'services' | 'packages' | 'plans'>('services');
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'active' | 'suspended'>('active');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesView = view === 'active' ? !service.suspended : service.suspended;
            const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
            return matchesSearch && matchesView && matchesCategory;
        });
    }, [services, searchQuery, view, selectedCategory]);

    const filteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesView = view === 'active' ? !pkg.suspended : pkg.suspended;
            return matchesSearch && matchesView;
        });
    }, [packages, searchQuery, view]);

    const handleSaveService = (serviceData: any) => {
        onSaveService(serviceData);
    };

    const handleDeleteConfirm = (id: number, type: 'service' | 'package' | 'plan') => {
        if (window.confirm('Tem certeza que deseja excluir? Esta ação não pode ser desfeita.')) {
            if (type === 'service') onDeleteService(id);
            else if (type === 'package' && onDeletePackage) onDeletePackage(id);
            else if (type === 'plan' && onDeletePlan) onDeletePlan(id);
        }
    };

    const formatPrice = (price: string | number) => {
        const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.')) : price;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numPrice || 0);
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
                        <h1 className="text-3xl font-bold text-secondary">Serviços</h1>
                        <p className="text-gray-500 mt-1">Gerencie seus serviços, pacotes e planos</p>
                    </div>
                    <button
                        onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {activeTab === 'services' ? 'Novo Serviço' : activeTab === 'packages' ? 'Novo Pacote' : 'Novo Plano'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'services' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Serviços ({services.filter(s => !s.suspended).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('packages')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'packages' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Pacotes ({packages.filter(p => !p.suspended).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'plans' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Planos ({plans.filter(p => !p.suspended).length})
                        </button>
                    </nav>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por nome ou descrição..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    {activeTab === 'services' && serviceCategories.length > 0 && (
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">Todas as Categorias</option>
                            {serviceCategories.map((cat, idx) => (
                                <option key={idx} value={cat}>{cat}</option>
                            ))}
                        </select>
                    )}
                    <div className="flex bg-gray-100 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setView('active')}
                            className={`px-4 py-2 text-sm font-medium ${view === 'active' ? 'bg-primary text-white' : 'text-gray-600'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setView('suspended')}
                            className={`px-4 py-2 text-sm font-medium ${view === 'suspended' ? 'bg-primary text-white' : 'text-gray-600'}`}
                        >
                            Suspensos
                        </button>
                    </div>
                </div>

                {/* Services Grid */}
                {activeTab === 'services' && (
                    filteredServices.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredServices.map(service => (
                                <div
                                    key={service.id}
                                    className={`bg-light p-5 rounded-xl border border-transparent hover:border-primary transition-all group ${service.suspended ? 'opacity-60' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-secondary text-lg">{service.name}</h3>
                                                {service.isFavorite && (
                                                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                )}
                                            </div>
                                            {service.category && (
                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                                    {service.category}
                                                </span>
                                            )}
                                        </div>
                                        {onToggleFavorite && (
                                            <button
                                                onClick={() => onToggleFavorite(service.id)}
                                                className="text-gray-400 hover:text-yellow-500 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill={service.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {service.description && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                                    )}

                                    <div className="flex items-center justify-between text-sm mb-4">
                                        <div className="flex items-center gap-1 text-gray-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {service.duration}
                                        </div>
                                        <span className="font-bold text-primary text-lg">{formatPrice(service.price)}</span>
                                    </div>

                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditingItem(service); setIsModalOpen(true); }}
                                            className="flex-1 py-1 px-3 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => onSuspendService(service.id)}
                                            className={`flex-1 py-1 px-3 text-xs rounded ${service.suspended ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                                        >
                                            {service.suspended ? 'Ativar' : 'Suspender'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteConfirm(service.id, 'service')}
                                            className="flex-1 py-1 px-3 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-light rounded-lg">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-500 font-medium">Nenhum serviço encontrado</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {searchQuery ? 'Tente ajustar sua busca' : 'Adicione seu primeiro serviço'}
                            </p>
                        </div>
                    )
                )}

                {/* Packages Tab */}
                {activeTab === 'packages' && (
                    filteredPackages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPackages.map(pkg => (
                                <div key={pkg.id} className={`bg-light p-5 rounded-xl border border-transparent hover:border-primary transition-all group ${pkg.suspended ? 'opacity-60' : ''}`}>
                                    <h3 className="font-bold text-secondary text-lg mb-2">{pkg.name}</h3>
                                    <p className="text-2xl font-bold text-primary mb-4">{formatPrice(pkg.price)}</p>
                                    {pkg.services && pkg.services.length > 0 && (
                                        <div className="text-sm text-gray-600 mb-4">
                                            <p className="font-medium mb-1">Serviços inclusos:</p>
                                            <ul className="list-disc list-inside text-xs">
                                                {pkg.services.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                                                {pkg.services.length > 3 && <li>+{pkg.services.length - 3} mais...</li>}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="flex-1 py-1 px-3 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Editar</button>
                                        <button
                                            onClick={() => onSuspendPackage?.(pkg.id)}
                                            className={`flex-1 py-1 px-3 text-xs rounded ${pkg.suspended ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                                        >
                                            {pkg.suspended ? 'Ativar' : 'Suspender'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-light rounded-lg">
                            <p className="text-gray-500">Nenhum pacote encontrado</p>
                        </div>
                    )
                )}

                {/* Plans Tab */}
                {activeTab === 'plans' && (
                    plans.filter(p => view === 'active' ? !p.suspended : p.suspended).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plans.filter(p => view === 'active' ? !p.suspended : p.suspended).map(plan => (
                                <div key={plan.id} className={`bg-light p-5 rounded-xl border border-transparent hover:border-primary transition-all group ${plan.suspended ? 'opacity-60' : ''}`}>
                                    <h3 className="font-bold text-secondary text-lg mb-2">{plan.name}</h3>
                                    <p className="text-2xl font-bold text-primary mb-2">{plan.price}</p>
                                    {plan.description && <p className="text-sm text-gray-600 mb-4">{plan.description}</p>}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="flex-1 py-1 px-3 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Editar</button>
                                        <button
                                            onClick={() => onSuspendPlan?.(plan.id)}
                                            className={`flex-1 py-1 px-3 text-xs rounded ${plan.suspended ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                                        >
                                            {plan.suspended ? 'Ativar' : 'Suspender'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-light rounded-lg">
                            <p className="text-gray-500">Nenhum plano encontrado</p>
                        </div>
                    )
                )}

                {/* Stats */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-primary">{services.filter(s => !s.suspended).length}</p>
                        <p className="text-sm text-gray-600">Serviços Ativos</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-green-600">{packages.filter(p => !p.suspended).length}</p>
                        <p className="text-sm text-gray-600">Pacotes Ativos</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-600">{plans.filter(p => !p.suspended).length}</p>
                        <p className="text-sm text-gray-600">Planos Ativos</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-purple-600">{serviceCategories.length}</p>
                        <p className="text-sm text-gray-600">Categorias</p>
                    </div>
                </div>
            </div>

            {/* Service Modal */}
            {isModalOpen && activeTab === 'services' && (
                <NewServiceModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
                    onSave={handleSaveService}
                    itemToEdit={editingItem}
                    categories={serviceCategories || []}
                    onAddCategory={onAddServiceCategory || (() => { })}
                    onUpdateCategory={onUpdateServiceCategory || (() => { })}
                    onDeleteCategory={onDeleteServiceCategory || (() => { })}
                />
            )}
        </div>
    );
};

export default ServicesPage;
