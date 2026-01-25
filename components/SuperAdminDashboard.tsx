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

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const res = await tenantsAPI.list();
                setTenants(res.data);
            } catch (error) {
                console.error("Error fetching tenants:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTenants();
    }, []);

    if (loading) return <div className="p-8">Carregando salões...</div>;

    return (
        <div className="container mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold text-secondary mb-6">Gestão de Salões (Tenants)</h2>
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
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tenant.plan?.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tenant.trial_ends_at ? new Date(tenant.trial_ends_at).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-primary hover:text-primary-dark mr-3">Editar</button>
                                    <button className="text-red-600 hover:text-red-900">Suspender</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
