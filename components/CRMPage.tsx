import React, { useState, useEffect } from 'react';
import { crmAPI } from '../lib/api';
import { Lead } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CRMPageProps {
    onBack?: () => void;
    [key: string]: any;
}

const CRMPage: React.FC<CRMPageProps> = ({ onBack }) => {
    const { t } = useLanguage();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newLeadName, setNewLeadName] = useState('');
    const [newLeadPhone, setNewLeadPhone] = useState('');

    const stages = [
        { id: 'novo', label: 'Novo', color: 'bg-blue-100 text-blue-800' },
        { id: 'em_atendimento', label: 'Em Atendimento', color: 'bg-yellow-100 text-yellow-800' },
        { id: 'agendado', label: 'Agendado', color: 'bg-purple-100 text-purple-800' },
        { id: 'arquivado', label: 'Arquivado', color: 'bg-gray-100 text-gray-800' }
    ];

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setIsLoading(true);
        try {
            const result = await crmAPI.listLeads();
            setLeads(result);
        } catch (error) {
            console.error("Error loading leads:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStageChange = async (leadId: number, newStage: string) => {
        // Optimistic update
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStage as any } : l));
        try {
            await crmAPI.updateLeadStatus(leadId, newStage);
        } catch (error) {
            console.error("Error updating lead status:", error);
            loadLeads();
        }
    };

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newLead = await crmAPI.createLead({
                name: newLeadName,
                phone: newLeadPhone,
                status: 'novo',
                source: 'Manual'
            });
            setLeads(prev => [...prev, newLead]);
            setIsAddModalOpen(false);
            setNewLeadName('');
            setNewLeadPhone('');
        } catch (error) {
            console.error("Error adding lead:", error);
            alert("Erro ao adicionar lead.");
        }
    };

    const getLeadsByStage = (stageId: string) => {
        return leads.filter(l => (l.status || 'novo') === stageId);
    };

    return (
        <div className="container mx-auto px-6 py-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    {onBack && (
                        <button onClick={onBack} className="mb-2 text-primary hover:underline flex items-center gap-1">
                            <span>←</span> Voltar
                        </button>
                    )}
                    <h1 className="text-3xl font-bold text-secondary">CRM & Pipeline de Vendas</h1>
                    <p className="text-gray-500">Gerencie seus potenciais clientes visualmente.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow transition"
                >
                    + Novo Lead
                </button>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 min-w-max h-full pb-4">
                    {stages.map(stage => (
                        <div key={stage.id} className="w-80 bg-gray-50 rounded-xl flex flex-col h-full border border-gray-200">
                            <div className={`p-4 border-b border-gray-200 rounded-t-xl font-bold flex justify-between items-center ${stage.color.replace('text', 'border').split(' ')[0]}`}>
                                <span>{stage.label}</span>
                                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                                    {getLeadsByStage(stage.id).length}
                                </span>
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                                {isLoading ? (
                                    <div className="animate-pulse space-y-3">
                                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                                    </div>
                                ) : (
                                    getLeadsByStage(stage.id).map(lead => (
                                        <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                                            <div className="font-bold text-gray-800">{lead.name}</div>
                                            <div className="text-sm text-gray-500 mb-3">{lead.phone || 'Sem telefone'}</div>

                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {stages.filter(s => s.id !== stage.id).map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => handleStageChange(lead.id, s.id)}
                                                        className={`text-[10px] px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 ${s.color}`}
                                                        title={`Mover para ${s.label}`}
                                                    >
                                                        {s.label.split(' ')[0]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {getLeadsByStage(stage.id).length === 0 && !isLoading && (
                                    <div className="text-center py-8 text-gray-400 text-sm italic">
                                        Nenhum lead nesta etapa
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Lead Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-secondary mb-4">Adicionar Novo Lead</h2>
                        <form onSubmit={handleAddLead} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    value={newLeadName}
                                    onChange={e => setNewLeadName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                                <input
                                    type="tel"
                                    required
                                    value={newLeadPhone}
                                    onChange={e => setNewLeadPhone(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-lg"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMPage;
