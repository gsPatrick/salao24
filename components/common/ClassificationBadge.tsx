import React from 'react';
import { useData } from '../../contexts/DataContext';

interface ClassificationBadgeProps {
    classification: string;
    crmStage?: string | number;
    customIcon?: string;
    customText?: string;
}

const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({ classification, crmStage, customIcon, customText }) => {
    const { crmSettings } = useData();

    const colors: { [key: string]: string } = {
        'Nova': 'bg-blue-100 text-blue-800',
        'Novo': 'bg-blue-100 text-blue-800',
        'Novos Clientes': 'bg-blue-100 text-blue-800',
        'Recorrente': 'bg-green-100 text-green-800',
        'Recorrentes': 'bg-green-100 text-green-800',
        'Recorrentes (Ativos)': 'bg-green-100 text-green-800',
        'VIP': 'bg-purple-100 text-purple-800',
        'Inativa': 'bg-yellow-100 text-yellow-800',
        'Inativo': 'bg-yellow-100 text-yellow-800',
        'Inativos': 'bg-yellow-100 text-yellow-800',
        'Inativos (60+ dias)': 'bg-yellow-100 text-yellow-800',
        'Agendado': 'bg-indigo-100 text-indigo-800',
        'Agendados': 'bg-indigo-100 text-indigo-800',
        'Faltou': 'bg-red-100 text-red-800',
        'Faltantes': 'bg-red-100 text-red-800',
    };

    const icons: { [key: string]: string } = {
        'Nova': '⭐',
        'Novo': '⭐',
        'Recorrente': '💎',
        'VIP': '👑',
        'Inativa': '⏳',
        'Inativo': '⏳',
        'Agendado': '✅',
        'Faltou': '❌'
    };

    // Try to find matching stage in CRM settings
    const stage = crmSettings?.funnel_stages?.find(s => {
        const stageId = String(s.id || '').toLowerCase();
        const stageTitle = String(s.title || '').toLowerCase();
        const stageTagTitle = String(s.tagTitle || '').toLowerCase();
        const targetCls = String(classification || '').toLowerCase();
        const targetStageId = String(crmStage || '').toLowerCase();

        // 1. If crmStage is provided, try exact match by ID first
        if (crmStage && stageId === targetStageId) return true;

        // 2. Fallback to matching by classification text
        return stageId === targetCls ||
            stageTitle === targetCls ||
            stageTagTitle === targetCls ||
            (targetCls === 'inativa' && stageId === 'inactive') ||
            (targetCls === 'nova' && stageId === 'new') ||
            (targetCls === 'recorrente' && stageId === 'recurrent');
    });

    // Determine text and icon, with priority to custom props, then CRM settings, then defaults
    const displayText = customText || stage?.tagTitle || stage?.title || classification;
    const displayIcon = customIcon || stage?.tagIcon || stage?.icon || icons[classification] || '👤';

    // Try to find color by exact match, or fallback to default
    const colorClass = colors[displayText] || colors[classification] || 'bg-gray-100 text-gray-800';

    return (
        <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${colorClass}`}>
            <span>{displayIcon}</span>
            <span>{displayText}</span>
        </span>
    );
};

export default ClassificationBadge;
