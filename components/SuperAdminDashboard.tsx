import React, { useState, useEffect } from 'react';
import { tenantsAPI, superAdminAPI } from '../lib/api';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    subscription_status: string;
    trial_ends_at: string | null;
    plan?: { name: string };
    address?: {
        country?: string;
        state?: string;
        neighborhood?: string;
        city?: string;
        street?: string;
        number?: string;
        cep?: string;
    };
}

interface Banner {
    id: number;
    title: string;
    image_url: string;
    link_url: string;
    click_count: number;
}

export const SuperAdminTenantsPage: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [filters, setFilters] = useState({ country: '', state: '', city: '', neighborhood: '' });
    const [filterOptions, setFilterOptions] = useState<{ countries: string[], states: string[], cities: string[], neighborhoods: string[] }>({
        countries: [],
        states: [],
        cities: [],
        neighborhoods: []
    });

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const res = await tenantsAPI.list(filters);
            setTenants(res.data);
        } catch (error) {
            console.error("Error fetching tenants:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const res = await tenantsAPI.getFilterOptions();
            setFilterOptions(res.data);
        } catch (error) {
            console.error("Error fetching filter options:", error);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        fetchTenants();
    }, [filters]);

    const handleToggleLifetime = async (tenantId: number) => {
        try {
            await tenantsAPI.update(tenantId, { subscription_status: 'lifetime' });
            alert("Plano Vitalício ativado com sucesso!");
            fetchTenants();
            setSelectedTenant(prev => prev && prev.id === tenantId ? { ...prev, subscription_status: 'lifetime' } : prev);
        } catch (error) {
            alert("Erro ao ativar plano vitalício");
        }
    };

    if (loading && tenants.length === 0) return <div className="p-8">Carregando salões...</div>;

    return (
        <div className="container mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-secondary mb-6">Gestão de Salões (Tenants)</h2>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-md mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">País</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary bg-white"
                        value={filters.country}
                        onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                    >
                        <option value="">Todos</option>
                        {filterOptions.countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Estado</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary bg-white"
                        value={filters.state}
                        onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    >
                        <option value="">Todos</option>
                        {filterOptions.states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Cidade</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary bg-white"
                        value={filters.city}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    >
                        <option value="">Todos</option>
                        {filterOptions.cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bairro</label>
                    <select
                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary bg-white"
                        value={filters.neighborhood}
                        onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
                    >
                        <option value="">Todos</option>
                        {filterOptions.neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trial Expira</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                                    <div className="text-xs text-gray-500">/{tenant.slug}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tenant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {tenant.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                    {tenant.subscription_status === 'lifetime' && (
                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                            Vitalício
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tenant.plan?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setSelectedTenant(tenant)} className="text-primary hover:text-primary-dark mr-3">Visualizar</button>
                                    <button className="text-red-600 hover:text-red-900">Suspender</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tenant Detail Modal */}
            {selectedTenant && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-secondary">Detalhes do Salão</h3>
                            <button onClick={() => setSelectedTenant(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Nome do Negócio</label>
                                    <p className="text-lg font-medium">{selectedTenant.name}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Slug / URL</label>
                                    <p className="text-lg font-medium">/{selectedTenant.slug}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Status de Assinatura</label>
                                    <p className="text-lg font-medium capitalize">{selectedTenant.subscription_status}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Plano Atual</label>
                                    <p className="text-lg font-medium">{selectedTenant.plan?.name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-bold text-secondary mb-3">Status Vitalício</h4>
                                <div className="flex items-center justify-between bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <div>
                                        <p className="text-sm text-purple-800 font-medium">Ativar acesso permanente para este salão.</p>
                                        <p className="text-xs text-purple-600">Isso desabilitará cobranças e garantirá acesso contínuo.</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleLifetime(selectedTenant.id)}
                                        disabled={selectedTenant.subscription_status === 'lifetime'}
                                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${selectedTenant.subscription_status === 'lifetime' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'}`}
                                    >
                                        {selectedTenant.subscription_status === 'lifetime' ? 'Já é Vitalício' : 'Tornar Vitalício'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 text-right border-t">
                            <button onClick={() => setSelectedTenant(null)} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const SuperAdminBannersPage: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await superAdminAPI.getBanners();
                setBanners(res.data);
            } catch (error) {
                console.error("Error fetching banners:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    if (loading) return <div className="p-8">Carregando banners...</div>;

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-secondary">Banners Globais</h2>
                <button className="bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-transform">
                    + Novo Banner
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.length > 0 ? banners.map((banner) => (
                    <div key={banner.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 group">
                        <img src={banner.image_url} alt={banner.title} className="w-full h-40 object-cover" />
                        <div className="p-4">
                            <h3 className="font-bold text-lg text-secondary mb-1">{banner.title}</h3>
                            <p className="text-xs text-gray-500 mb-3 truncate">{banner.link_url}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">{banner.click_count} cliques</span>
                                <div className="flex gap-2">
                                    <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">Editar</button>
                                    <button className="text-sm font-semibold text-red-600 hover:text-red-800">Excluir</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <p className="text-gray-500">Nenhum banner global cadastrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
