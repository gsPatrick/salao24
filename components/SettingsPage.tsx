
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserManagementModal from './UserManagementModal';
import UnitManagementModal from './UnitManagementModal';
import AccessHistoryPage from './AccessHistoryPage';
import { paymentsAPI } from '../lib/api';

import { useLanguage } from '../contexts/LanguageContext';
import { useData, SystemUser as User, Unit, Tenant } from '../contexts/DataContext';
import { formatPhone, formatCEP, formatCPFOrCNPJ } from '../lib/maskUtils';


// --- Interfaces ---
interface WorkingHour {
    day: string;
    open: boolean;
    start: string;
    end: string;
    lunchStart: string;
    lunchEnd: string;
}

interface PermissionDetails {
    create: boolean;
    view: boolean;
    delete: boolean;
    export: boolean;
}

interface Contract {
    planName: string;
    price: string;
    date: string;
    contractText: string;
    signatureImg: string;
    userPhoto: string;
    userName: string;
    userCpf: string;
}

// User and Unit interfaces removed in favor of DataContext types

interface Professional {
    id: number;
    name: string;
    email: string;
    photo: string;
    occupation: string;
}

interface SettingsPageProps {
    onBack?: () => void;
    units?: Unit[];
    selectedUnit?: string;
    onUnitsChange?: (unitName: string) => void;
    professionals?: Professional[];
    isIndividualPlan: boolean;
    onPayInstallment: (planName: 'Individual' | 'Empresa' | 'Vitalício' | 'Empresa Essencial' | 'Empresa Pro' | 'Empresa Premium') => void;
    currentUser: User | null;
    onLogout: () => void;
    navigate: (page: string) => void;
    users?: User[];
    onUsersChange?: (users: User[]) => void;
}

interface PlanSettingsProps {
    t: (key: string, options?: any) => string;
    onPayInstallment: (planName: 'Individual' | 'Empresa' | 'Vitalício' | 'Empresa Essencial' | 'Empresa Pro' | 'Empresa Premium') => void;
    currentUser: User | null;
    onLogout: () => void;
    navigate: (page: string) => void;
    tenant: Tenant | null; // Keep tenant prop for other info
}

// Minimal Interface for Asaas Payment
interface AsaasPayment {
    id: string;
    dateCreated: string;
    value: number;
    netValue: number;
    status: string; // PENDING, RECEIVED, OVERDUE, etc.
    billingType: string;
    invoiceUrl: string;
    description: string;
    dueDate: string;
}

// --- New Modal Component for Cancellation ---
const CancelSubscriptionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    t: (key: string) => string;
}> = ({ isOpen, onClose, onConfirm, t }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 animate-fade-in"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all animate-bounce-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900" id="modal-title">
                        {t('cancelSubscriptionTitle')}
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500">
                            {t('cancelSubscriptionWarning') || 'Ao cancelar, você continuará com acesso até o fim do período vigente, mas a renovação automática será desativada para o próximo mês. Tem certeza?'}
                        </p>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                        {t('confirm')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const roleTranslationKeys: { [key in User['role']]: string } = {
    'Administrador': 'roleAdmin',
    'Gerente': 'roleManager',
    'Profissional': 'roleProfessional',
    'Concierge': 'roleConcierge',
    'admin': 'roleAdmin',
    'gerente': 'roleManager',
    'recepcao': 'roleConcierge',
    'profissional': 'roleProfessional'
};

const defaultPermissions = { dashboard: { create: false, view: false, delete: false, export: false }, agenda: { create: false, view: false, delete: false, export: false }, minhaAgenda: { create: false, view: false, delete: false, export: false }, clientes: { create: false, view: false, delete: false, export: false }, crm: { create: false, view: false, delete: false, export: false }, contratos: { create: false, view: false, delete: false, export: false }, financeiro: { create: false, view: false, delete: false, export: false }, estoque: { create: false, view: false, delete: false, export: false }, servicos: { create: false, view: false, delete: false, export: false }, profissionais: { create: false, view: false, delete: false, export: false }, configuracoes: { create: false, view: false, delete: false, export: false }, usuarios: { create: false, view: false, delete: false, export: false }, registroPonto: { create: false, view: false, delete: false, export: false }, relatorio: { create: false, view: false, delete: false, export: false } };

const rolePermissions: { [key in User['role']]: { [key: string]: PermissionDetails } } = {
    Administrador: { dashboard: { create: true, view: true, delete: true, export: true }, agenda: { create: true, view: true, delete: true, export: true }, minhaAgenda: { create: true, view: true, delete: true, export: true }, clientes: { create: true, view: true, delete: true, export: true }, crm: { create: true, view: true, delete: true, export: true }, contratos: { create: true, view: true, delete: true, export: true }, financeiro: { create: true, view: true, delete: true, export: true }, estoque: { create: true, view: true, delete: true, export: true }, servicos: { create: true, view: true, delete: true, export: true }, profissionais: { create: true, view: true, delete: true, export: true }, configuracoes: { create: true, view: true, delete: true, export: true }, usuarios: { create: true, view: true, delete: true, export: true }, registroPonto: { create: true, view: true, delete: true, export: true }, relatorio: { create: true, view: true, delete: true, export: true } },
    Gerente: { dashboard: { create: true, view: true, delete: false, export: true }, agenda: { create: true, view: true, delete: true, export: true }, minhaAgenda: { create: true, view: true, delete: true, export: true }, clientes: { create: true, view: true, delete: true, export: true }, crm: { create: true, view: true, delete: false, export: true }, contratos: { create: true, view: true, delete: true, export: true }, financeiro: { create: false, view: true, delete: false, export: true }, estoque: { create: true, view: true, delete: true, export: true }, servicos: { create: true, view: true, delete: true, export: true }, profissionais: { create: true, view: true, delete: true, export: true }, configuracoes: { create: false, view: false, delete: false, export: false }, usuarios: { create: false, view: false, delete: false, export: false }, registroPonto: { create: true, view: true, delete: true, export: true }, relatorio: { create: true, view: true, delete: false, export: true } },
    Profissional: { dashboard: { create: false, view: false, delete: false, export: false }, agenda: { create: false, view: false, delete: false, export: false }, minhaAgenda: { create: true, view: true, delete: false, export: true }, clientes: { create: true, view: true, delete: false, export: true }, crm: { create: false, view: true, delete: false, export: false }, contratos: { create: false, view: false, delete: false, export: false }, financeiro: { create: false, view: false, delete: false, export: false }, estoque: { create: false, view: false, delete: false, export: false }, servicos: { create: false, view: false, delete: false, export: false }, profissionais: { create: false, view: false, delete: false, export: false }, configuracoes: { create: false, view: false, delete: false, export: false }, usuarios: { create: false, view: false, delete: false, export: false }, registroPonto: { create: true, view: true, delete: false, export: false }, relatorio: { create: false, view: false, delete: false, export: false } },
    Concierge: { dashboard: { create: false, view: true, delete: false, export: false }, agenda: { create: true, view: true, delete: false, export: true }, minhaAgenda: { create: false, view: false, delete: false, export: false }, clientes: { create: true, view: true, delete: false, export: true }, crm: { create: false, view: true, delete: false, export: false }, contratos: { create: false, view: false, delete: false, export: false }, financeiro: { create: false, view: false, delete: false, export: false }, estoque: { create: false, view: false, delete: false, export: false }, servicos: { create: false, view: false, delete: false, export: false }, profissionais: { create: false, view: false, delete: false, export: false }, configuracoes: { create: false, view: false, delete: false, export: false }, usuarios: { create: false, view: false, delete: false, export: false }, registroPonto: { create: true, view: true, delete: false, export: false }, relatorio: { create: false, view: false, delete: false, export: false } },
    admin: { dashboard: { create: true, view: true, delete: true, export: true }, agenda: { create: true, view: true, delete: true, export: true }, minhaAgenda: { create: true, view: true, delete: true, export: true }, clientes: { create: true, view: true, delete: true, export: true }, crm: { create: true, view: true, delete: true, export: true }, contratos: { create: true, view: true, delete: true, export: true }, financeiro: { create: true, view: true, delete: true, export: true }, estoque: { create: true, view: true, delete: true, export: true }, servicos: { create: true, view: true, delete: true, export: true }, profissionais: { create: true, view: true, delete: true, export: true }, configuracoes: { create: true, view: true, delete: true, export: true }, usuarios: { create: true, view: true, delete: true, export: true }, registroPonto: { create: true, view: true, delete: true, export: true }, relatorio: { create: true, view: true, delete: true, export: true } },
    gerente: { ...defaultPermissions, dashboard: { create: true, view: true, delete: false, export: true }, agenda: { create: true, view: true, delete: true, export: true }, clientes: { create: true, view: true, delete: true, export: true } },
    recepcao: { ...defaultPermissions, agenda: { create: true, view: true, delete: false, export: true }, clientes: { create: true, view: true, delete: false, export: true } },
    profissional: { ...defaultPermissions, minhhAgenda: { create: true, view: true, delete: false, export: true } }
};

export const SettingsPage: React.FC<SettingsPageProps> = ({
    onBack,
    selectedUnit,
    onUnitsChange,
    isIndividualPlan,
    onPayInstallment,
    currentUser,
    onLogout,
    navigate
}) => {
    const { t } = useLanguage();
    const { users, saveUser, deleteUser, units, saveUnit, deleteUnit, tenant, updateTenant, uploadTenantLogo, professionals, auditLogs, loading } = useData(); // Use DataContext
    const [activeTab, setActiveTab] = useState('conta');
    const [notification, setNotification] = useState<string | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [tabOrder, setTabOrder] = useState(['conta', 'unidade', 'usuario', 'historico']);

    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);
    const [draggedTab, setDraggedTab] = useState<string | null>(null);

    const currentPlanName = tenant?.plan?.display_name || currentUser?.plan || 'Individual';

    const canAddMultipleUnits = ['Empresa Essencial', 'Empresa Pro', 'Empresa Premium', 'Vitalício', 'Plano Vitalício'].includes(currentPlanName);

    const canRegisterNewUnit = canAddMultipleUnits || units.length === 0;

    // Overdue Block Logic
    const isOverdue = tenant?.subscription_status === 'OVERDUE';

    const handleTabReorder = (dragged: string, target: string) => {
        const newOrder = [...tabOrder];
        const draggedIndex = newOrder.indexOf(dragged);
        const targetIndex = newOrder.indexOf(target);

        if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
            newOrder.splice(draggedIndex, 1);
            newOrder.splice(targetIndex, 0, dragged);
            setTabOrder(newOrder);
        }
    };


    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (message: string) => {
        setNotification(message);
    };

    const handleUserSave = async (userData: any) => {
        try {
            await saveUser(userData);
            showNotification(t('userSavedSuccess'));
            setIsUserModalOpen(false);
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert('Erro ao salvar usuário: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleUserDelete = async (userId: number, userName: string) => {
        if (window.confirm(t('confirmDeleteUser', { name: userName }))) {
            await deleteUser(userId);
        }
    };

    const handleUserSuspend = async (userId: number, userName: string, isSuspended?: boolean) => {
        const action = isSuspended ? t('actionReactivate').toLowerCase() : t('actionSuspend').toLowerCase();
        if (window.confirm(t('confirmSuspendUser', { action, name: userName }))) {
            await saveUser({ id: userId, suspended: !isSuspended });
            showNotification(isSuspended ? t('userReactivatedSuccess', { name: userName }) : t('userSuspendedSuccess', { name: userName }));
        }
    };

    const handleUnitSave = async (unitData: any) => {
        try {
            await saveUnit(unitData);
            showNotification(t('unitSavedSuccess'));
            setIsUnitModalOpen(false);
        } catch (error: any) {
            console.error('Error saving unit:', error);
            alert('Erro ao salvar unidade: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleUnitDelete = async (unitId: number, unitName: string) => {
        if (window.confirm(t('confirmDeleteUnit', { name: unitName }))) {
            await deleteUnit(unitId);
        }
    };

    const handleUnitSuspend = async (unitId: number) => {
        const unit = units.find(u => u.id === unitId);
        if (unit) {
            await saveUnit({ id: unitId, suspended: !unit.suspended });
        }
    };


    const TabButton: React.FC<{ tabName: string; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`whitespace-nowrap py-3 px-4 border-b-4 font-bold text-sm transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-t-md cursor-move select-none ${activeTab === tabName
                ? 'border-primary text-secondary'
                : 'border-transparent text-gray-600 hover:text-secondary hover:border-primary/30'
                }`}
            draggable="true"
            onDragStart={(e) => {
                setDraggedTab(tabName);
                e.dataTransfer.setData('text/plain', tabName);
                e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={() => {
                setDraggedTab(null);
            }}
            onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
                e.preventDefault();
                const draggedTabName = e.dataTransfer.getData('text/plain');
                if (draggedTabName && draggedTabName !== tabName) {
                    handleTabReorder(draggedTabName, tabName);
                }
            }}
        >
            <span className={`${draggedTab === tabName ? 'opacity-50' : ''}`}>
                {label}
            </span>
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'usuario':
                const usersToDisplay = users;
                return (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-secondary">{t('settingsUser')}</h2>
                                <p className="text-gray-500 text-sm">{t('settingsUserDesc')}</p>
                            </div>
                            <div className="relative group">
                                <button
                                    onClick={() => { setUserToEdit(null); setIsUserModalOpen(true); }}
                                    disabled={isIndividualPlan}
                                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {t('settingsUserButtonAdd')}
                                </button>
                                {isIndividualPlan && (
                                    <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                                        {t('settingsUserTooltipIndividualPlan')}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('settingsUserHeaderUser')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('settingsUserHeaderPermission')}</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {usersToDisplay.map(user => (
                                        <tr key={user.id} className={user.suspended ? 'bg-gray-50 opacity-60' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt={user.name} />
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    <span className="font-semibold">{t(roleTranslationKeys[user.role])}</span>
                                                    {user.suspended && <span className="ml-2 text-xs font-bold bg-gray-500 text-white px-2 py-1 rounded-full">{t('statusSuspended')}</span>}
                                                </div>
                                                <div className="text-xs text-gray-500">{t('permissoesAtivas', { count: Object.keys(user.permissions).length })}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => { setUserToEdit(user); setIsUserModalOpen(true); }} className="text-primary hover:text-primary-dark">{t('edit')}</button>
                                                <button
                                                    onClick={() => handleUserSuspend(user.id, user.name, user.suspended)}
                                                    className={`transition-colors ${user.suspended ? 'text-green-600 hover:text-green-800' : 'text-yellow-600 hover:text-yellow-800'}`}
                                                >
                                                    {user.suspended ? t('actionReactivate') : t('actionSuspend')}
                                                </button>
                                                <button onClick={() => handleUserDelete(user.id, user.name)} className="text-red-600 hover:text-red-800">{t('delete')}</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'unidade':
                const unitsToDisplay = !canAddMultipleUnits ? units.slice(0, 1) : units;
                return (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-secondary">{t('settingsTabUnit')}</h2>
                                <p className="text-gray-500 text-sm">{t('settingsUnitDesc')}</p>
                            </div>
                            <div className="relative group">
                                <button
                                    onClick={() => { setUnitToEdit(null); setIsUnitModalOpen(true); }}
                                    disabled={!canRegisterNewUnit}
                                    className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {t('settingsUnitButtonAdd')}
                                </button>
                                {!canRegisterNewUnit && (
                                    <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                                        {t('planEnterprise')}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('settingsUnitHeaderName')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('settingsUnitHeaderPhone')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {unitsToDisplay.map(unit => (
                                        <tr key={unit.id} className={`${unit.suspended ? 'bg-gray-50' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-gray-900">{unit.name}</p>
                                                <p className="text-xs text-gray-500">{unit.address.street}, {unit.address.number}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <p>{unit.phone}</p>
                                                {unit.additionalPhones && unit.additionalPhones.length > 0 && <p className="text-xs text-gray-500">+ {t('additionalPhones', { count: unit.additionalPhones.length })}</p>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${unit.suspended ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                                                    {unit.suspended ? t('statusSuspendedUnit') : 'Ativa'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                {selectedUnit !== unit.name && !unit.suspended && (
                                                    <button
                                                        onClick={() => onUnitsChange && onUnitsChange(unit.name)}
                                                        className="text-green-600 hover:text-green-800 font-bold"
                                                    >
                                                        Selecionar
                                                    </button>
                                                )}
                                                <button onClick={() => { setUnitToEdit(unit); setIsUnitModalOpen(true); }} className="text-primary hover:text-primary-dark">{t('edit')}</button>
                                                <button onClick={() => handleUnitSuspend(unit.id)} disabled={!canAddMultipleUnits} className={`transition-colors ${!canAddMultipleUnits ? 'text-gray-400 cursor-not-allowed' : (unit.suspended ? "text-green-600 hover:text-green-800" : "text-yellow-600 hover:text-yellow-800")}`}>
                                                    {unit.suspended ? t('actionReactivate') : t('actionSuspend')}
                                                </button>
                                                <button onClick={() => handleUnitDelete(unit.id, unit.name)} disabled={!canAddMultipleUnits} className={`transition-colors ${!canAddMultipleUnits ? 'text-gray-400 cursor-not-allowed' : "text-red-600 hover:text-red-800"}`}>
                                                    {t('delete')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'conta':
                return (
                    <div className="animate-fade-in space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-secondary">Dados da Conta</h2>
                            <p className="text-gray-500 text-sm">Gerencie sua assinatura, informações de faturamento e dados da empresa.</p>
                        </div>

                        <div className="space-y-12">
                            {/* Assinatura Section (formerly 'plano') */}
                            <section>
                                <PlanSettings t={t} onPayInstallment={onPayInstallment} currentUser={currentUser} onLogout={onLogout} navigate={navigate} tenant={tenant} />
                            </section>

                            <hr className="border-gray-100" />

                            {/* Informações da Empresa Section */}
                            <section>
                                <h3 className="text-lg font-bold text-secondary mb-4">Informações da Empresa</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Nome do Negócio</label>
                                            <input
                                                type="text"
                                                value={tenant?.name || ''}
                                                disabled
                                                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">CNPJ / CPF</label>
                                            <input
                                                type="text"
                                                value={formatCPFOrCNPJ(tenant?.cnpj_cpf || '')}
                                                disabled
                                                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">E-mail de Cobrança</label>
                                            <input
                                                type="text"
                                                value={currentUser?.email || ''}
                                                disabled
                                                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Segmento</label>
                                            <input
                                                type="text"
                                                value={tenant?.business_segment || ''}
                                                disabled
                                                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-start space-x-3">
                                    <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs text-blue-700">Para alterar dados cadastrais da empresa ou o e-mail principal, entre em contato com nosso suporte.</p>
                                </div>
                            </section>
                        </div>
                    </div>
                );
            case 'historico':
                return (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold text-secondary">{t('settingsTabAccessHistory')}</h2>
                        <p className="text-gray-500 text-sm mb-6">{t('settingsAccessHistoryDesc')}</p>
                        <AccessHistoryPage
                            logs={auditLogs.map(log => ({
                                id: log.id.toString(),
                                userId: log.user_id,
                                action: log.action,
                                details: log.details,
                                timestamp: log.created_at,
                                ip: log.ip_address,
                                userAgent: log.user_agent,
                                userName: log.user?.name,
                                userAvatar: log.user?.avatar_url
                            }))}
                            users={users}
                            loading={loading.auditLogs}
                        />
                    </div>
                );
        }
    };


    return (
        <div className="container mx-auto px-6 py-8 relative">
            {/* Payment Overdue Modal Block */}
            {isOverdue && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/95 backdrop-blur-md animate-fade-in text-white">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl animate-bounce-in border border-primary/20 text-gray-800">
                        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-secondary mb-4">Assinatura Pendente</h2>
                        <p className="text-gray-600 mb-8 leading-relaxed">Detectamos uma pendência financeira em sua conta. Para continuar utilizando os serviços do Salão24h, por favor regularize sua assinatura através do Asaas.</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('upgrade_to_empresa')}
                                className="w-full py-4 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-lg"
                            >
                                Regularizar Agora
                            </button>
                            <button
                                onClick={onLogout}
                                className="w-full py-3 text-gray-500 hover:text-secondary font-medium transition-colors"
                            >
                                Sair da Conta
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {notification && (
                <div className="fixed top-24 right-8 z-50 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-bounce-in flex items-center">
                    <span>{notification}</span>
                </div>
            )}
            {onBack && (
                <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold">
                    &larr; {t('back')}
                </button>
            )}

            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-secondary mb-2">{t('settingsTitle')}</h1>
                    <p className="text-gray-600">{t('settingsSubtitle')}</p>
                </div>

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        {tabOrder.map(tabName => {
                            const tabLabels: Record<string, string> = {
                                'conta': 'Dados da Conta',
                                'unidade': t('settingsTabUnit'),
                                'usuario': t('settingsTabUser'),
                                'historico': t('settingsTabAccessHistory')
                            };
                            return <TabButton key={tabName} tabName={tabName} label={tabLabels[tabName] || tabName} />;
                        })}
                    </nav>
                </div>

                <main className="flex-1 mt-6">
                    {renderContent()}
                </main>
            </div>
            <UserManagementModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleUserSave}
                userToEdit={userToEdit}
                professionals={professionals}
                users={users}
            />
            <UnitManagementModal
                isOpen={isUnitModalOpen}
                onClose={() => setIsUnitModalOpen(false)}
                onSave={handleUnitSave}
                unitToEdit={unitToEdit}
            />
        </div>
    );
};

// --- Sub-components for each tab ---


const PlanSettings: React.FC<PlanSettingsProps> = ({ t, onPayInstallment, currentUser, onLogout, navigate, tenant }) => {
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [invoices, setInvoices] = useState<AsaasPayment[]>([]);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

    useEffect(() => {
        const fetchInvoices = async () => {
            setIsLoadingInvoices(true);
            try {
                // Assuming paymentsAPI is imported from '../lib/api'
                // We need to dynamically import or having it available. 
                // Since this file imports everything from 'api.ts' via '../contexts/DataContext' usually, 
                // but here it seems standalone. Let's use the standard import if available or existing hooks.
                // Re-checking imports: 'api.ts' is likely imported as 'paymentsAPI' or similar.
                // Assuming global 'paymentsAPI' or importing it at the top would be better.
                // For this edit, I'll rely on global fetch or assume imports exist.
                // Actually, let's use the explicit import in the file header if I could, but I can't see it now.
                // I will assume `paymentsAPI` is available or I will fix the import in a separate block if needed.
                // WAIT: I can't add imports easily without seeing the top.
                // Let's assume I can use `useData` context if I updated it, but I didn't update DataContext.
                // I will fallback to `paymentsAPI.getInvoices()` and assume I need to double check imports.
                // Let's try to fetch using the imported `paymentsAPI`.
                const result = await paymentsAPI.getInvoices();
                if (result && Array.isArray(result.data)) {
                    setInvoices(result.data);
                }
            } catch (error) {
                console.error("Failed to fetch invoices", error);
            } finally {
                setIsLoadingInvoices(false);
            }
        };

        fetchInvoices();
    }, []);

    const planDetailsMap = {
        'Individual': { name: t('pricingIndividualPlanName'), desc: t('pricingIndividualPlanDesc') },
        'Empresa Essencial': { name: 'Empresa Essencial', desc: 'Para equipes pequenas com as ferramentas essenciais para crescer.' },
        'Empresa Pro': { name: 'Empresa Pro', desc: 'A solução ideal para negócios em expansão, com IA por voz e mais automações.' },
        'Empresa Premium': { name: 'Empresa Premium', desc: 'Para grandes operações e redes, com suporte dedicado e gerente de contas.' },
        'Vitalício': { name: 'Plano Vitalício', desc: 'Acesso completo e gratuito à plataforma.' },
        'Empresa': { name: t('pricingEnterprisePlanName'), desc: t('pricingEnterprisePlanDesc') },
    };

    const planKey = tenant?.plan?.display_name || currentUser?.plan || 'Individual';
    const currentPlanName = planKey;
    const currentPlanDesc = planDetailsMap[planKey as keyof typeof planDetailsMap]?.desc || (tenant?.plan?.name ? `Acesso ao plano ${tenant.plan.name}` : '');
    const businessSegmentLabel = currentUser?.businessSegmentLabel;

    const canUpgrade = !['Empresa Premium', 'Vitalício', 'Plano Vitalício'].includes(planKey);

    const handleCancelSubscription = () => {
        setIsCancelModalOpen(true);
    };

    const confirmCancellation = async () => {
        try {
            await paymentsAPI.cancelSubscription();
            alert('Assinatura cancelada com sucesso. Seu acesso continua ativo até o fim do ciclo atual.');
            setIsCancelModalOpen(false);
            // Optionally refresh tenant data or redirect
            // navigate('dashboard'); 
        } catch (error) {
            console.error(error);
            alert('Erro ao cancelar assinatura. Tente novamente ou contate o suporte.');
        }
    };

    const handleDownloadInvoice = (invoice: { date: string, value: string, status: string }) => {
        try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF();
            const clientName = currentUser?.name || 'Cliente';
            const clientEmail = currentUser?.email || 'email@cliente.com';

            // Header
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Salão24h', 20, 20);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Rua Fictícia, 123 - Boa Viagem, Recife-PE', 20, 28);
            doc.text('contato@salao24h.app | (81) 99999-9999', 20, 34);

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('FATURA', 190, 20, { align: 'right' });

            // Client Info
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Cobrança para:', 20, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(clientName, 20, 56);
            doc.text(clientEmail, 20, 62);

            // Invoice Details
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Data da Fatura:', 140, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(invoice.date, 190, 50, { align: 'right' });

            doc.setFont('helvetica', 'bold');
            doc.text('Status:', 140, 56);
            doc.setFont('helvetica', 'normal');
            doc.text(invoice.status, 190, 56, { align: 'right' });

            // Table using autoTable plugin
            (doc as any).autoTable({
                startY: 80,
                head: [['Descrição', 'Valor']],
                body: [
                    [`Assinatura Mensal - Plano ${currentPlanName}`, invoice.value],
                ],
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }, // #10b981
            });

            // Total
            const finalY = (doc as any).autoTable.previous.finalY;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Total:', 140, finalY + 15);
            doc.text(invoice.value, 190, finalY + 15, { align: 'right' });

            // Footer
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text('Obrigado por ser nosso cliente!', 105, 280, { align: 'center' });

            const filename = `fatura_salao24h_${invoice.date.replace(/\//g, '-')}.pdf`;
            doc.save(filename);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Não foi possível gerar o PDF. A biblioteca 'jspdf' ou 'jspdf-autotable' pode não estar carregada corretamente.");
        }
    };

    const handleDownloadContract = (contract: Contract) => {
        try {
            if (typeof (window as any).jspdf === 'undefined' || typeof (window as any).jspdf.jsPDF === 'undefined') {
                alert('Erro: A biblioteca para gerar PDF não foi carregada. Tente recarregar a página.');
                console.error('jsPDF not found on window object.');
                return;
            }

            const { jsPDF } = (window as any).jspdf;
            const pdf = new jsPDF('p', 'pt', 'a4');
            const margin = 40;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const usableWidth = pageWidth - margin * 2;
            let y = margin;

            // Header
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Salão24h', margin, y);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(150);
            pdf.text('Contrato de Prestação de Serviços', margin, y + 12);
            y += 40;

            // Safe values
            const planName = contract.planName || t('unspecifiedPlan');
            const userName = contract.userName || currentUser?.name || t('unspecifiedClient');
            const userCpf = contract.userCpf || '000.000.000-00';
            const contractDate = contract.date || new Date().toLocaleDateString('pt-BR');
            const contractText = contract.contractText || t('contractTextUnavailable');

            // Title
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0);
            pdf.text(`Contrato - Plano ${planName}`, pageWidth / 2, y, { align: 'center' });
            y += 25;

            // Use autoTable for parties
            (pdf as any).autoTable({
                startY: y,
                theme: 'plain',
                headStyles: { fillColor: [245, 245, 245], textColor: 20, fontStyle: 'bold' },
                body: [
                    ['CONTRATANTE', `${userName}, CPF: ${userCpf}`],
                    ['CONTRATADA', 'Salão24h, CNPJ: XX.XXX.XXX/0001-XX'],
                    ['DATA DE INÍCIO', contractDate],
                ],
                didDrawPage: (data: any) => {
                    y = data.cursor.y; // Update y position after table
                }
            });
            y += 20;

            // Contract Text
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const lines = pdf.splitTextToSize(contractText, usableWidth);
            const textHeight = lines.length * 12; // Adjusted line height for 10pt font
            if (y + textHeight > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                y = margin;
            }
            pdf.text(lines, margin, y);
            y += textHeight + 40;

            // Signature Section
            if (y + 120 > pdf.internal.pageSize.getHeight() - margin) { // Check space for signature block
                pdf.addPage();
                y = margin;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Assinatura Digital e Verificação', margin, y);
            y += 20;

            // Add images with error handling
            try {
                if (contract.userPhoto && contract.userPhoto.startsWith('data:image')) {
                    pdf.addImage(contract.userPhoto, 'PNG', margin, y, 80, 80);
                    pdf.text('Foto de Verificação', margin + 40, y + 90, { align: 'center' });
                }
            } catch (e) { console.error("Could not add user photo to PDF", e); }

            try {
                if (contract.signatureImg && contract.signatureImg.startsWith('data:image')) {
                    pdf.addImage(contract.signatureImg, 'PNG', margin + 150, y, 150, 75);
                    pdf.line(margin + 150, y + 80, margin + 300, y + 80); // Signature line
                    pdf.text('Assinatura Digital do Contratante', margin + 225, y + 90, { align: 'center' });
                }
            } catch (e) { console.error("Could not add signature image to PDF", e); }

            y += 120;

            pdf.save(`Contrato_Salao24h_${userName.replace(/\s/g, '_')}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Não foi possível gerar o PDF. Verifique o console para mais detalhes.");
        }
    };


    return (
        <div className="space-y-10 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold text-secondary">{t('currentPlanTitle')}</h2>
                <div className="mt-4 p-4 border-2 border-primary rounded-lg bg-primary/5 flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-primary">{currentPlanName}</h3>
                        <p className="text-gray-600 mt-1">{currentPlanDesc}</p>
                        {businessSegmentLabel && (
                            <p className="text-sm text-gray-700 mt-2">
                                <span className="font-semibold">Segmento do negócio: </span>
                                {businessSegmentLabel}
                            </p>
                        )}
                    </div>
                    {canUpgrade ? (
                        <button onClick={() => navigate('upgrade_to_empresa')} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-full transition duration-300 transform hover:scale-105 shadow-md flex-shrink-0">
                            Fazer Upgrade
                        </button>
                    ) : (
                        <p className="font-semibold text-green-600">{t('bestPlanMessage')} ✨</p>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold text-secondary">{t('paymentAndInvoicesTitle')}</h2>
                <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center p-3 bg-light rounded-md">
                        <span className="font-medium text-gray-700">{t('nextBillingDateLabel')}:</span>
                        <span className="font-bold text-secondary">{tenant?.nextBillingDate ? new Date(tenant.nextBillingDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'A definir'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-light rounded-md">
                        <span className="font-medium text-gray-700">{t('paymentMethodLabel')}:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-secondary">{tenant?.asaas_customer_id ? 'Gateway de Pagamento Asaas' : 'Não configurado'}</span>
                            <button onClick={() => navigate('updatePaymentMethod')} className="text-xs text-primary hover:underline">{t('changePaymentMethodButton')}</button>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-secondary mb-3">{t('invoiceHistoryTitle')}</h3>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('invoiceHeaderDate')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('invoiceHeaderValue')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('invoiceHeaderStatus')}</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('invoiceHeaderActions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingInvoices ? (
                                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Carregando faturas...</td></tr>
                                ) : invoices.length > 0 ? (
                                    invoices.map((invoice, index) => (
                                        <tr key={invoice.id || index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('pt-BR') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.value)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${invoice.status === 'RECEIVED' || invoice.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                        invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {invoice.status === 'RECEIVED' || invoice.status === 'CONFIRMED' ? t('invoiceStatusPaid') :
                                                        invoice.status === 'OVERDUE' ? 'Vencida' : invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {invoice.invoiceUrl ? (
                                                    <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark cursor-pointer">
                                                        Visualizar
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">Indisponível</span>
                                                )}
                                                {/* Removed PDF generation for now as we have direct link */}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">{t('noInvoicesFound') || 'Nenhuma fatura encontrada.'}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold text-secondary">{t('signedContractsTitle')}</h2>
                <p className="text-gray-600 mt-1">{t('signedContractsDesc')}</p>
                <div className="mt-6 space-y-4">
                    {currentUser?.contracts && currentUser.contracts.length > 0 ? (
                        currentUser.contracts.map((contract, index) => (
                            <div key={index} className="bg-light p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-full mr-4 bg-primary/10 text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-secondary">{t('contract')} - {contract.planName}</p>
                                        <p className="text-sm text-gray-500">{t('signedOn')}: {contract.date}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownloadContract(contract)}
                                    className="w-full sm:w-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    {t('downloadPDF')}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-gray-500">{t('noSignedContracts')}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-red-500">
                <h2 className="text-xl font-bold text-secondary">{t('subscriptionManagementTitle')}</h2>
                <p className="text-sm text-gray-500 mt-2">{t('cancelSubscriptionWarning').substring(0, t('cancelSubscriptionWarning').indexOf('Você perderá'))}</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button onClick={handleCancelSubscription} className="py-2 px-4 border border-red-500 text-red-500 font-semibold rounded-lg hover:bg-red-50 transition-colors">
                        {t('cancelSubscriptionButton')}
                    </button>
                    <button disabled className="py-2 px-4 border border-gray-300 text-gray-400 font-semibold rounded-lg cursor-not-allowed">
                        {t('pauseSubscriptionButton')}
                    </button>
                </div>
            </div>

            <CancelSubscriptionModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={confirmCancellation}
                t={t}
            />
        </div>
    );
};
