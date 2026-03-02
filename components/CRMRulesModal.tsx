import React, { useState, useEffect } from 'react';
import { crmAPI } from '../lib/api';

interface CRMRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: any;
    onSettingsUpdated: () => void;
}

const triggerLabels: Record<string, string> = {
    'inactivity': 'Inatividade',
    'time_in_stage': 'Tempo no Funil',
    'appointment_created': 'Agendamento Criado',
    'appointment_completed': 'Agendamento Concluído (Status alterado)',
    'status_changed': 'Status Alterado'
};

const actionLabels: Record<string, string> = {
    'move_client': 'Mover Cliente para Funil/Tag',
    'send_message': 'Enviar Mensagem',
    'notify_admin': 'Notificar Admin / Executar Ação Interna'
};

export const CRMRulesModal: React.FC<CRMRulesModalProps> = ({ isOpen, onClose, settings, onSettingsUpdated }) => {
    const [activeTab, setActiveTab] = useState<string>('');
    const [funnels, setFunnels] = useState<any[]>([]);
    const [editingDescription, setEditingDescription] = useState('');
    const [previewRules, setPreviewRules] = useState<any[] | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (settings?.funnel_stages) {
            setFunnels(settings.funnel_stages);
            if (!activeTab && settings.funnel_stages.length > 0) {
                setActiveTab(settings.funnel_stages[0].id);
                setEditingDescription(settings.funnel_stages[0].description || '');
            }
        }
    }, [settings, isOpen]);

    if (!isOpen) return null;

    const activeFunnel = funnels.find(f => f.id === activeTab);

    const handleTabChange = (id: string) => {
        setActiveTab(id);
        const funnel = funnels.find(f => f.id === id);
        setEditingDescription(funnel?.description || '');
        setPreviewRules(null);
        setError('');
    };

    const handlePreview = async () => {
        if (!editingDescription.trim()) {
            setError('A instrução não pode estar vazia.');
            return;
        }
        setIsLoadingPreview(true);
        setError('');
        try {
            const { getAuthHeaders } = require('../lib/api');
            const appUrl = (window as any).API_URL || import.meta.env.VITE_API_URL || 'https://salao-api.rdwhjt.easypanel.host';
            const headers = getAuthHeaders ? getAuthHeaders() : {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            };

            const res = await fetch(`${appUrl}/api/crm/settings/preview-rules`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ description: editingDescription })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Erro ao gerar preview de regras');
            }

            const data = await res.json();
            setPreviewRules(data.compiled_rules || []);
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar preview de regras');
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            // Update the funnel description locally
            const updatedFunnels = funnels.map(f => {
                if (f.id === activeTab) {
                    return { ...f, description: editingDescription };
                }
                return f;
            });

            // If preview was generated successfully, use it explicitly (to avoid server double-trip if possible, 
            // but the server will re-compile anyway if the description changed based on crm.service.js logic)
            // It's safer to just send the description and let the backend recompile, ensuring consistency.

            await crmAPI.updateSettings({
                ...settings,
                funnel_stages: updatedFunnels
            });

            setPreviewRules(null);
            onSettingsUpdated();
            // Don't close so they can edit others
            const msg = document.createElement('div');
            msg.className = "fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[600] transition-opacity duration-300";
            msg.textContent = "Regras salvas com sucesso!";
            document.body.appendChild(msg);
            setTimeout(() => {
                msg.style.opacity = '0';
                setTimeout(() => msg.remove(), 300);
            }, 300);

        } catch (err: any) {
            setError(err.message || 'Erro ao salvar configurações');
        } finally {
            setIsSaving(false);
        }
    };

    const renderRules = (rules: any[]) => {
        if (!rules || rules.length === 0) {
            return <p className="text-gray-500 italic text-sm">Nenhuma regra ativa para este funil.</p>;
        }

        return (
            <div className="space-y-3">
                {rules.map((rule, idx) => (
                    <div key={idx} className="bg-white border rounded-lg p-3 shadow-sm text-sm">
                        <div className="flex items-start gap-2 mb-2">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                                ⚡ Gatilho
                            </span>
                            <span className="font-medium text-gray-800">
                                {triggerLabels[rule.trigger] || rule.trigger}
                                {rule.conditions && Object.keys(rule.conditions).length > 0 && (
                                    <span className="text-gray-500 font-normal ml-1">
                                        ({Object.entries(rule.conditions).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join(', ')})
                                    </span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                                🎯 Ação
                            </span>
                            <span className="text-gray-700">
                                <span className="font-medium">{actionLabels[rule.action?.type] || rule.action?.type}</span>
                                {rule.action?.params && Object.keys(rule.action.params).length > 0 && (
                                    <span className="text-gray-500 ml-1 block mt-1">
                                        {Object.entries(rule.action.params).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-secondary">Configurar Regras dos Funis</h2>
                            <p className="text-sm text-gray-500">Ajuste os comandos da IA para automatizar os funis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-2 rounded-full transition-colors bg-white shadow-sm border">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body Elements... */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-1/4 border-r bg-gray-50 overflow-y-auto">
                        <div className="p-4 border-b">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Etapas Ativas</h3>
                        </div>
                        <ul className="divide-y divide-gray-100">
                            {funnels.filter(f => f.visible !== false).map(funnel => (
                                <li key={funnel.id}>
                                    <button
                                        onClick={() => handleTabChange(funnel.id)}
                                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${activeTab === funnel.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-gray-100 border-l-4 border-transparent'}`}
                                    >
                                        <span className="text-xl">{funnel.icon || '📌'}</span>
                                        <span className={`font-medium text-sm truncate ${activeTab === funnel.id ? 'text-primary' : 'text-gray-700'}`}>
                                            {funnel.title}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Main Content */}
                    <div className="w-3/4 flex flex-col overflow-hidden bg-gray-50/50">
                        {activeFunnel ? (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Editor */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                                        <h3 className="font-semibold text-secondary flex items-center gap-2">
                                            <span className="text-lg">🤖</span> Instruções para a IA
                                        </h3>
                                        <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">Prompt Base</span>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 mb-2">
                                            Descreva detalhadamente quando o cliente deve ser movido deste funil e para onde. A IA lerá este texto para gerar as regras estruturadas (abaixo).
                                        </p>
                                        <textarea
                                            value={editingDescription}
                                            onChange={(e) => setEditingDescription(e.target.value)}
                                            className="w-full h-48 p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-y font-mono"
                                            placeholder="Ex: Se o cliente não comparecer, mova para Faltantes. Se agendar novamente, mova para Agendados..."
                                        />
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                onClick={handlePreview}
                                                disabled={isLoadingPreview}
                                                className="bg-secondary/10 text-secondary hover:bg-secondary hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                                            >
                                                {isLoadingPreview ? (
                                                    <><div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> Analisando com IA...</>
                                                ) : (
                                                    <>✨ Atualizar e Testar Regras</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-start gap-2 text-sm border border-red-100">
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                {/* Rules View */}
                                <div className={`grid ${previewRules !== null ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                            Regras Atuais Salvas
                                        </h3>
                                        <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                            {renderRules(activeFunnel.compiled_rules || [])}
                                        </div>
                                    </div>

                                    {previewRules !== null && (
                                        <div className="bg-blue-50/50 rounded-xl shadow-sm border border-blue-100 p-4 animate-fade-in relative">
                                            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                                                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">Preview</span>
                                            </div>
                                            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2 border-b border-blue-100 pb-2">
                                                <span className="text-xl">✨</span> Novas Regras Geradas
                                            </h3>
                                            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                {renderRules(previewRules)}
                                            </div>
                                            <div className="mt-4 p-3 bg-white rounded border border-blue-100 text-xs text-blue-600 font-medium">
                                                Revise as regras acima. Se estiverem corretas, clique em Salvar Configuração. Caso contrário, ajuste o texto e teste novamente.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400">
                                Selecione um funil à esquerda para configurar
                            </div>
                        )}

                        {/* Footer Controls */}
                        <div className="bg-white border-t p-4 flex justify-between items-center shadow-lg z-10">
                            <span className="text-xs text-gray-500">
                                Lembrete: Alterar o texto irá <strong className="text-gray-700">sobrescrever</strong> as regras anteriores.
                            </span>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Salvando...</>
                                    ) : (
                                        <>💾 Salvar Configuração Atual</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
