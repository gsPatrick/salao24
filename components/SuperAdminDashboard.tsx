import React, { useState, useEffect, useRef } from 'react';
import { tenantsAPI, superAdminAPI } from '../lib/api';

interface Tenant {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    subscription_status: string;
    trial_ends_at: string | null;
    plan?: { name: string };
    cnpj_cpf?: string;
    phone?: string;
    email?: string;
    owner?: {
        name: string;
        phone?: string;
        email?: string;
    };
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
    subtitle?: string;
    description?: string;
    call_to_action?: string;
    image_url: string;
    mobile_image_url?: string;
    link_url: string;
    click_count: number;
    target_area: string;
    is_active: boolean;
    order: number;
}


export const SuperAdminTenantsPage: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [filters, setFilters] = useState({ name: '', country: '', state: '', city: '', neighborhood: '' });
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
            <h2 className="text-2xl font-bold text-secondary mb-6">Gestão de Salões</h2>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-md mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pesquisar por Nome</label>
                    <input
                        type="text"
                        placeholder="Nome do salão..."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-primary focus:border-primary bg-white"
                        value={filters.name}
                        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                    />
                </div>
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
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">CNPJ/CPF</label>
                                    <p className="text-lg font-medium">{selectedTenant.cnpj_cpf || 'Não informado'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Telefone Negócio</label>
                                    <p className="text-lg font-medium">{selectedTenant.phone || 'Não informado'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Nome do ADM</label>
                                    <p className="text-lg font-medium">{selectedTenant.owner?.name || 'Não informado'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Telefone ADM</label>
                                    <p className="text-lg font-medium">{selectedTenant.owner?.phone || 'Não informado'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Endereço</label>
                                    <p className="text-lg font-medium">
                                        {selectedTenant.address ?
                                            `${selectedTenant.address.street || ''}, ${selectedTenant.address.number || ''} - ${selectedTenant.address.neighborhood || ''}, ${selectedTenant.address.city || ''}/${selectedTenant.address.state || ''}` :
                                            'Não informado'}
                                    </p>
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

    // Image states
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
    const [mobileImagePreviewUrl, setMobileImagePreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mobileFileInputRef = useRef<HTMLInputElement>(null);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const res = await superAdminAPI.getBanners();
            setBanners(res.data);
        } catch (error) {
            console.error("Error fetching banners:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    useEffect(() => {
        if (!isModalOpen) {
            setImageFile(null);
            setImagePreviewUrl(null);
            setMobileImageFile(null);
            setMobileImagePreviewUrl(null);
        }
    }, [isModalOpen]);

    const handleFileSelect = (selectedFile: File | null, isMobile: boolean = false) => {
        if (isMobile) {
            setMobileImageFile(selectedFile);
            if (selectedFile) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setMobileImagePreviewUrl(event.target?.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setMobileImagePreviewUrl(null);
            }
        } else {
            setImageFile(selectedFile);
            if (selectedFile) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setImagePreviewUrl(event.target?.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setImagePreviewUrl(null);
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja excluir este banner?")) return;
        try {
            await superAdminAPI.deleteBanner(id);
            fetchBanners();
        } catch (error) {
            alert("Erro ao excluir banner");
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        let imageUrl = editingBanner?.image_url || '';
        if (imageFile) {
            imageUrl = `data:image/jpeg;base64,${imagePreviewUrl?.split(',')[1] || ''}`;
        }

        let mobileImageUrl = editingBanner?.mobile_image_url || '';
        if (mobileImageFile) {
            mobileImageUrl = `data:image/jpeg;base64,${mobileImagePreviewUrl?.split(',')[1] || ''}`;
        }

        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            call_to_action: formData.get('call_to_action'),
            image_url: imageUrl,
            mobile_image_url: mobileImageUrl,
            link_url: formData.get('link_url'),
            target_area: formData.get('target_area'),
            is_active: true,
            order: parseInt(formData.get('order') as string || '0')
        };

        try {
            if (editingBanner) {
                await superAdminAPI.updateBanner(editingBanner.id, data);
            } else {
                await superAdminAPI.createBanner(data);
            }
            setIsModalOpen(false);
            setEditingBanner(null);
            fetchBanners();
        } catch (error) {
            alert("Erro ao salvar banner");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-secondary tracking-tight">Banners Globais</h2>
                    <p className="text-gray-500 mt-1">Gerencie anúncios para todos os salões da plataforma.</p>
                </div>
                <button
                    onClick={() => { setEditingBanner(null); setIsModalOpen(true); }}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                    + Novo Banner
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {banners.length > 0 ? banners.map((banner) => (
                    <div key={banner.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={banner.image_url}
                                alt={banner.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-4 left-4">
                                <span className="bg-white/90 backdrop-blur-md text-secondary text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                                    {banner.target_area.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <p className="text-white text-xs font-medium truncate w-full">{banner.link_url}</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-lg text-secondary mb-1 truncate">{banner.title}</h3>
                            <p className="text-sm text-gray-400 mb-4 line-clamp-2 h-10">{banner.description || 'Sem descrição'}</p>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    <span className="text-sm font-bold text-secondary">{banner.click_count} <span className="text-gray-400 font-normal">cliques</span></span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setEditingBanner(banner); setIsModalOpen(true); }}
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                                        title="Editar"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-colors"
                                        title="Excluir"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-24 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-secondary mb-2">Nenhum banner ativo</h3>
                        <p className="text-gray-400 max-w-xs mx-auto mb-8">Comece criando um novo banner para exibir anúncios e comunicações globais.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white text-primary px-8 py-3 rounded-2xl font-bold shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95"
                        >
                            + Criar primeiro banner
                        </button>
                    </div>
                )}
            </div>

            {/* Banner Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-secondary/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                            <div>
                                <h3 className="text-2xl font-bold text-secondary leading-none">{editingBanner ? 'Editar Banner' : 'Novo Banner'}</h3>
                                <p className="text-sm text-gray-400 mt-2">Configure os detalhes da sua campanha visual.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm border border-gray-100 transition-all hover:rotate-90"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Título do Banner</label>
                                    <input
                                        name="title"
                                        required
                                        defaultValue={editingBanner?.title}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-300"
                                        placeholder="Ex: Oferta de Carnaval 2024"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição</label>
                                    <textarea
                                        name="description"
                                        defaultValue={editingBanner?.description}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all min-h-[100px]"
                                        placeholder="Descreva o objetivo deste banner..."
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Imagens do Banner</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Desktop Banner Upload */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`relative group h-32 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${imagePreviewUrl || editingBanner?.image_url ? 'border-primary/30 p-0' : 'border-gray-100 hover:border-primary/50 bg-gray-50/30'}`}
                                        >
                                            {imagePreviewUrl || editingBanner?.image_url ? (
                                                <>
                                                    <img src={imagePreviewUrl || editingBanner?.image_url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold">Alterar Desktop</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                                                    <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-tight">Desktop</span>
                                                </>
                                            )}
                                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
                                        </div>

                                        {/* Mobile Banner Upload */}
                                        <div
                                            onClick={() => mobileFileInputRef.current?.click()}
                                            className={`relative group h-32 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden ${mobileImagePreviewUrl || editingBanner?.mobile_image_url ? 'border-primary/30' : 'border-gray-100 hover:border-primary/50 bg-gray-50/30'}`}
                                        >
                                            {mobileImagePreviewUrl || editingBanner?.mobile_image_url ? (
                                                <>
                                                    <img src={mobileImagePreviewUrl || editingBanner?.mobile_image_url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold">Alterar Mobile</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    <span className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-tight">Mobile</span>
                                                </>
                                            )}
                                            <input ref={mobileFileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e.target.files?.[0] || null, true)} />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center italic">Arraste as imagens ou clique para selecionar. Formatos suportados: JPG, PNG, WEBP.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Chamada (CTA)</label>
                                    <input
                                        name="call_to_action"
                                        defaultValue={editingBanner?.call_to_action}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                        placeholder="Ex: Saiba mais"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">URL de Destino</label>
                                    <input
                                        name="link_url"
                                        defaultValue={editingBanner?.link_url}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                        placeholder="https://suapagina.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Área de Exibição</label>
                                    <div className="relative">
                                        <select
                                            name="target_area"
                                            defaultValue={editingBanner?.target_area || 'todos'}
                                            className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none transition-all cursor-pointer"
                                        >
                                            <option value="todos">Todos os canais</option>
                                            <option value="painel_de_controle">Painel de Controle</option>
                                            <option value="area_do_cliente">Área do Cliente</option>
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ordem de Exibição</label>
                                    <input
                                        type="number"
                                        name="order"
                                        defaultValue={editingBanner?.order || 0}
                                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white hover:border-gray-300 transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    const form = document.querySelector('form');
                                    if (form) form.requestSubmit();
                                }}
                                className="flex-1 px-6 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95"
                            >
                                {editingBanner ? 'Salvar Alterações' : 'Publicar Banner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


