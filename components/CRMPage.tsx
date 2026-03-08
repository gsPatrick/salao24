import React, { useState, useMemo, useEffect, useRef } from 'react';
import CRMSettingsModal from './CRMSettingsModal';
import ClientDetailModal from './ClientDetailModal';
import ClassificationBadge from './common/ClassificationBadge';
import { useLanguage } from '../contexts/LanguageContext';
import { useData, SystemUser, mapClientFromAPI } from '../contexts/DataContext';
import { Client, Professional, Service, Appointment } from '../types';
import { clientsAPI, crmAPI } from '../lib/api';
import { displayCurrency } from '../lib/formatUtils';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { CRMRulesModal } from './CRMRulesModal';

// --- Helper Functions ---
const getClientStatus = (birthdate?: string, lastVisit?: string, totalVisits: number = 0) => {
    const today = new Date();
    // Parse birthdate using string splitting to avoid timezone issues
    let birthMonth: number | null = null;
    let birthDay: number | null = null;
    if (birthdate) {
        const datePart = birthdate.split('T')[0];
        const [, month, day] = datePart.split('-').map(Number);
        birthMonth = month - 1; // JS months are 0-indexed
        birthDay = day;
    }
    const lastVisitDate = lastVisit ? new Date(lastVisit + 'T00:00:00') : null;

    const isBirthdayToday = birthMonth !== null && birthDay !== null ? (today.getDate() === birthDay && today.getMonth() === birthMonth) : false;
    const isBirthdayMonth = birthMonth !== null ? (today.getMonth() === birthMonth) : false;

    const daysSinceLastVisit = lastVisitDate ? Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    let classification: 'Nova' | 'Recorrente' | 'VIP' | 'Inativa' = 'Nova';
    if (daysSinceLastVisit > 60) {
        classification = 'Inativa';
    } else if (totalVisits > 5) {
        classification = 'VIP';
    } else if (totalVisits >= 2) {
        classification = 'Recorrente';
    }

    return { isBirthdayToday, isBirthdayMonth, classification };
};

// --- Icons ---
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.89.001 2.228.651 4.39 1.849 6.22l-1.072 3.912 3.995-1.045zM9.266 8.39c-.195-.315-.315-.32-1.125-.32h-.125c-.25 0-.5.063-.75.315-.25.25-.938.938-.938 2.25s.938 2.625 1.063 2.75c.125.125.938 1.438 2.313 2.063.315.125.563.25.75.315.5.125.938.063 1.313-.19.438-.315.938-.938 1.125-1.25.19-.315.19-.563.063-.69-.125-.125-.25-.19-.5-.315s-.938-.438-1.063-.5c-.125-.063-.19-.063-.25 0-.063.063-.25.315-.313.375-.063.063-.125.063-.25 0-.125-.063-.5-.19-1-1.25C8.313 9.77 7.938 9.27 7.813 9.145c-.125-.125-.063-.19 0-.25.063-.063.25-.25.313-.313.063-.062.125-.125.19-.19.063-.062.063-.125 0-.19s-.25-.625-.313-.75z" />
    </svg>
);
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V8a1 1 0 011-1h12a1 1 0 011 1v7.546zM12 12.5a.5.5 0 110-1 .5.5 0 010 1zM3 21h18v-1a1 1 0 00-1-1H4a1 1 0 00-1 1v1z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500 mb-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;
const ClientsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ContractIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SortIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 10h12M3 16h6" /></svg>;


// --- Components ---
const Confetti: React.FC = () => (
    <>
        <span className="absolute top-[15%] left-[10%] w-1 h-2 bg-red-400 rotate-45 opacity-70"></span>
        <span className="absolute top-[5%] left-[50%] w-1.5 h-1.5 bg-blue-400 rounded-full opacity-70"></span>
        <span className="absolute top-[20%] left-[85%] w-1 h-2.5 bg-green-400 -rotate-45 opacity-70"></span>
        <span className="absolute top-[50%] left-[25%] w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-70"></span>
        <span className="absolute top-[70%] left-[5%] w-1 h-1 bg-pink-400 rounded-full opacity-70"></span>
        <span className="absolute top-[85%] left-[35%] w-1.5 h-1 bg-indigo-400 rotate-12 opacity-70"></span>
        <span className="absolute top-[60%] left-[90%] w-1.5 h-1.5 bg-teal-400 rounded-full opacity-70"></span>
        <span className="absolute top-[95%] left-[70%] w-1 h-2 bg-orange-400 -rotate-12 opacity-70"></span>
        <span className="absolute top-[40%] left-[60%] w-1 h-1 bg-purple-400 rounded-full opacity-70"></span>
    </>
);


// ClassificationBadge is now imported from common

const ClientCard: React.FC<{
    client: any;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    isDragging: boolean;
    onOpenChat?: (clientId: number) => void;
    appointments: any[];
    services: Service[];
    professionals: Professional[];
    columnIcon?: string;
    columnTitle?: string;
    tagIcon?: string;
    tagTitle?: string;
}> = ({ client: rawClient, onClick, onDragStart, onDragEnd, isDragging, onOpenChat, appointments, services, professionals, columnIcon, columnTitle, tagIcon, tagTitle }) => {
    // Enrich client with history from global appointments if not present
    const client = useMemo(() => {
        const enriched = { ...rawClient };
        if (!enriched.history || enriched.history.length === 0) {
            const clientAppts = appointments.filter((a: any) => String(a.clientId) === String(enriched.id) || String(a.client_id) === String(enriched.id));
            if (clientAppts.length > 0) {
                enriched.history = clientAppts.map((apt: any) => ({
                    id: apt.id,
                    name: apt.service || 'Serviço',
                    date: apt.date,
                    time: apt.time ? String(apt.time).substring(0, 5) : '00:00',
                    professional: professionals.find((p: any) => p.id === apt.professionalId)?.name || 'Profissional',
                    status: apt.status,
                    price: apt.price || '0',
                    package_id: apt.package_id || apt.packageId,
                    salon_plan_id: apt.salon_plan_id || apt.salonPlanId,
                    service_id: apt.service_id || apt.serviceId,
                    type: apt.package_id ? 'Pacote' : (apt.salon_plan_id ? 'Plano' : 'Serviço'),
                    total_sessions: apt.total_sessions || 0,
                    consumed_sessions: apt.consumed_sessions || 0,
                }));
            }
        }
        // Build packages from history if not present
        if (!enriched.packages || enriched.packages.length === 0) {
            const pkgMap: any = {};
            (enriched.history || []).forEach((h: any) => {
                if (h.package_id && !pkgMap[`pkg-${h.package_id}`]) {
                    pkgMap[`pkg-${h.package_id}`] = {
                        id: `pkg-${h.package_id}`,
                        name: h.name || 'Pacote',
                        type: 'package',
                        package_id: h.package_id,
                        total_sessions: h.total_sessions || 0,
                        sessions: h.total_sessions || 0,
                        totalSessions: h.total_sessions || 0,
                        status: 'active'
                    };
                }
                if (h.salon_plan_id && !pkgMap[`plan-${h.salon_plan_id}`]) {
                    pkgMap[`plan-${h.salon_plan_id}`] = {
                        id: `plan-${h.salon_plan_id}`,
                        name: h.name || 'Plano',
                        type: 'plan',
                        plan_id: h.salon_plan_id,
                        total_sessions: h.total_sessions || 0,
                        sessions: h.total_sessions || 0,
                        totalSessions: h.total_sessions || 0,
                        status: 'active'
                    };
                }
            });
            enriched.packages = Object.values(pkgMap);
        }
        return enriched;
    }, [rawClient, appointments, professionals]);

    const { isBirthdayMonth, classification: calculatedClassification } = getClientStatus(client.birthdate, client.lastVisit, client.totalVisits);
    // Prioritize explicit classification (from drag/drop or DB) over calculated one
    const classification = client.classification || calculatedClassification;

    const cardClasses = `p-3 rounded-lg shadow-md border-l-4 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 hover:shadow-xl w-full text-left cursor-grab relative ${isBirthdayMonth ? 'bg-yellow-300 border-pink-400' : 'bg-white border-gray-200'
        } ${isDragging ? 'opacity-50' : ''}`;
    const formattedBirthdate = client.birthdate ? (() => {
        const [year, month, day] = client.birthdate.split('-');
        return `${day}/${month}`;
    })() : 'N/A';

    return (
        <div
            onClick={onClick}
            className={cardClasses}
            draggable="true"
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            {isBirthdayMonth && <Confetti />}
            <div className="flex items-start gap-4 relative z-10">
                <div className="relative flex-shrink-0">
                    <img src={client.photo} alt={client.name} className="w-16 h-16 rounded-full object-cover shadow-sm border border-gray-100" />
                    {isBirthdayMonth && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl transform -rotate-[15deg]" role="img" aria-label="Rosto festivo">🥳</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1 mb-1">
                        <h3 className={`font-bold text-base truncate leading-tight ${isBirthdayMonth ? 'text-black' : 'text-secondary'}`}>{client.name}</h3>
                        <ClassificationBadge classification={classification} customIcon={tagIcon || columnIcon} customText={tagTitle || columnTitle} />
                    </div>
                    <div className={`text-xs space-y-1.5 ${isBirthdayMonth ? 'text-gray-700' : 'text-gray-500'}`}>
                        <div className="flex items-center justify-between">
                            <a href={`tel:${client.phone.replace(/\D/g, '')}`} title="Ligar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-current hover:text-primary transition-colors truncate">
                                <PhoneIcon />
                                <span className="truncate">{client.phone}</span>
                            </a>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenChat?.(client.id);
                                }}
                                title="WhatsApp"
                                className="text-current hover:text-green-500 transition-colors flex-shrink-0"
                            >
                                <WhatsAppIcon />
                            </button>
                        </div>
                        <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-current hover:text-primary transition-colors truncate">
                            <MailIcon /><span className="truncate">{client.email}</span>
                        </a>
                        <p className="flex items-center gap-2"><CakeIcon /><span className="font-medium">{formattedBirthdate}</span></p>
                    </div>
                </div>
            </div>

            <hr className="my-3 border-gray-100" />

            <div className="relative z-10">
                <h4 className={`text-sm font-semibold mb-2 ${isBirthdayMonth ? 'text-gray-800' : 'text-secondary'}`}>Próximo Agendamento:</h4>
                <div className={`text-xs ${isBirthdayMonth ? 'text-gray-800' : 'text-gray-700'}`}>
                    {(() => {
                        const today = new Date();
                        const formatDateForLookup = (date: Date): string => {
                            const year = date.getFullYear();
                            const month = (date.getMonth() + 1).toString().padStart(2, '0');
                            const day = date.getDate().toString().padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        };
                        const todayKey = formatDateForLookup(today);
                        const clientAppointments = (client.history || []).filter((a: any) => (a.status || '').toLowerCase() === 'agendado' && a.date >= todayKey).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                        if (clientAppointments.length > 0) {
                            const nextAppointment = clientAppointments[0];
                            const professional = (professionals as Professional[]).find(p => p.id === nextAppointment.professionalId);

                            const datePart = nextAppointment.date.split('T')[0];
                            const [aYear, aMonth, aDay] = datePart.split('-');
                            const formattedDate = `${aDay}/${aMonth}/${aYear}`;

                            return (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-secondary">Data:</span>
                                        <span className="font-semibold">{formattedDate}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-secondary">Hora:</span>
                                        <span className="font-semibold">{nextAppointment.time}</span>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-secondary flex-shrink-0 mr-4">Serviço:</span>
                                        <span className="text-right break-words font-semibold">{nextAppointment.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-secondary">Profissional:</span>
                                        <span className="font-semibold">{professional?.name || 'Não definido'}</span>
                                    </div>
                                </div>
                            );
                        } else {
                            return <span className="text-gray-500 italic">Nenhum agendamento futuro</span>;
                        }
                    })()}
                </div>
            </div>

            {(() => {
                const activePackages = (client.packages || []).filter((pkg: any) => {
                    const total = Number(pkg.totalSessions || pkg.total_sessions || pkg.sessions || 0);
                    const used = (client.history || []).filter((h: any) => {
                        const statusLower = (h.status || '').toLowerCase();
                        const isExcluded = ['cancelado', 'desmarcou', 'faltou'].includes(statusLower);
                        if (isExcluded) return false;
                        if (pkg.type === 'package' && pkg.package_id) return h.package_id === pkg.package_id;
                        if (pkg.type === 'plan' && pkg.plan_id) return h.salon_plan_id === pkg.plan_id;
                        return false;
                    }).length;
                    return total > 0 ? used < total : true;
                });

                if (activePackages.length === 0) return null;

                return (
                    <div className="mt-4 pt-1">
                        <h4 className={`text-sm font-semibold mb-3 ${isBirthdayMonth ? 'text-gray-800' : 'text-secondary'}`}>Pacotes e Planos Ativos</h4>
                        <div className="space-y-4">
                            {activePackages.map((pkg: any, idx: number) => {
                                const total = Number(pkg.totalSessions || pkg.total_sessions || pkg.sessions || 0);
                                const used = (client.history || []).filter((h: any) => {
                                    if (pkg.type === 'package' && pkg.package_id) return h.package_id === pkg.package_id && !['cancelado', 'desmarcou', 'faltou'].includes((h.status || '').toLowerCase());
                                    if (pkg.type === 'plan' && pkg.plan_id) return h.salon_plan_id === pkg.plan_id && !['cancelado', 'desmarcou', 'faltou'].includes((h.status || '').toLowerCase());
                                    return false;
                                }).length;

                                const percentage = Math.min((used / total) * 100, 100);

                                return (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex justify-between items-center gap-2">
                                            <span className={`text-xs font-semibold truncate ${isBirthdayMonth ? 'text-black' : 'text-secondary'}`}>{pkg.name}</span>
                                            <span className="text-xs font-bold text-primary flex-shrink-0">
                                                {pkg.type === 'plan' ? `${used}/${total} x` : `${used} de ${total} vezes`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};


const KanbanColumn: React.FC<{
    columnId: string;
    title: string;
    icon: string;
    clients: any[];
    config: CrmColumnConfig;
    isConfigOpen: boolean;
    onToggleConfig: (id: string) => void;
    onConfigChange: (id: string, field: keyof CrmColumnConfig, value: any) => void;
    onActionChange: (columnId: string, actionId: string, field: keyof AIAction, value: any) => void;
    onCreateAction: (columnId: string) => void;
    onRemoveAction: (columnId: string, actionId: string) => void;
    onCardClick: (client: any) => void;
    onDragStart: (e: React.DragEvent, clientId: number) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    isDropTarget: boolean;
    draggedClientId: number | null;
    isIndividualPlan: boolean;
    currentUser: SystemUser | null;
    navigate: (page: string) => void;
    onOpenChat?: (clientId: number) => void;
    appointments: any[];
    services: Service[];
    professionals: Professional[];
}> = ({
    columnId, title, icon, clients, config, isConfigOpen, onToggleConfig,
    onConfigChange, onActionChange, onCreateAction, onRemoveAction,
    onCardClick, onDragStart, onDragOver, onDrop, onDragEnter, onDragLeave,
    onDragEnd, isDropTarget, draggedClientId, isIndividualPlan, currentUser,
    navigate, onOpenChat, appointments, services, professionals
}) => {
        const safeClients = clients || [];
        const fileInputRef = useRef<HTMLInputElement>(null);

        // Verificar se o usuário está em plano que bloqueia IA (Individual ou Essencial)
        const isPlanRestricted = (currentUser?.plan === 'Individual' || currentUser?.plan === 'Empresa Essencial') && !currentUser?.is_super_admin;

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                const fileName = e.target.files[0].name;
                onConfigChange(columnId, 'attachmentName', fileName);
            }
        };

        const handleRemoveFile = () => {
            onConfigChange(columnId, 'attachmentName', undefined);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset the input so the same file can be selected again
            }
        };

        return (
            <div
                className={`flex-1 min-w-[300px] bg-light rounded-xl p-4 transition-all duration-300 ${isDropTarget ? 'bg-primary/10 border-2 border-dashed border-primary' : ''}`}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-secondary flex items-center">{icon} <span className="ml-2">{title} ({safeClients.length})</span></h2>
                    <button onClick={() => onToggleConfig(columnId)} className="text-gray-400 hover:text-primary p-1 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
                {isConfigOpen && (
                    <div className="bg-white p-4 rounded-md mb-4 border border-gray-200 shadow-inner space-y-3 animate-fade-in">
                        {(config.ai_actions || []).map((action, index) => (
                            <div key={action.id || index} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-secondary">{action.title || 'Automação CRM'}</h4>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-green-100 text-green-700">
                                        Automação Ativa
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                                    {action.description ? action.description.substring(0, 200) + (action.description.length > 200 ? '...' : '') : 'Régua de automação configurada.'}
                                </p>
                            </div>
                        ))}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-[11px] text-gray-400">Funis e automações são gerenciados pelo sistema.</span>
                        </div>
                    </div>
                )}
                <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                    {safeClients.map(client => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            columnIcon={icon}
                            columnTitle={title}
                            tagIcon={config.tagIcon}
                            tagTitle={config.tagTitle}
                            onClick={() => onCardClick(client)}
                            onDragStart={(e) => onDragStart(e, client.id)}
                            onDragEnd={onDragEnd}
                            isDragging={draggedClientId === client.id}
                            onOpenChat={onOpenChat}
                            appointments={appointments}
                            services={services}
                            professionals={professionals}
                        />
                    ))}
                </div>
            </div>
        );
    }

const PlaceholderView: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <div className="text-center p-16 bg-light rounded-lg animate-fade-in border-2 border-dashed">
        <div className="mx-auto h-12 w-12 text-gray-400">
            {icon}
        </div>
        <h2 className="mt-6 text-xl font-semibold text-gray-700">{title}</h2>
        <p className="text-gray-500 mt-2">Esta seção está em desenvolvimento e estará disponível em breve.</p>
    </div>
);

interface AIAction {
    id: string;
    title: string;
    description: string;
    active: boolean;
    attachmentName?: string;
}

interface CrmColumnConfig {
    id: string;
    title: string;
    icon: string;
    visible: boolean;
    deletable?: boolean;
    description?: string;
    compiled_rules?: any[];
    ai_actions?: AIAction[];
    tagIcon?: string;
    tagTitle?: string;
}

interface Classification {
    text: string;
    icon: string;
}

interface CRMPageProps {
    onBack?: () => void;
    currentUser: SystemUser | null;
    clients: Client[];
    appointments: any[];
    navigate: (page: string) => void;
    onOpenChat?: (clientId: number) => void;
}

const CRMPage: React.FC<CRMPageProps> = ({ onBack, currentUser, navigate, onOpenChat, clients: initialClients, appointments: initialAppointments }) => {
    const { clients: dataClients, appointments: dataAppointments, services, professionals, crmSettings, updateCrmSettings } = useData();
    const clients = (initialClients && initialClients.length > 0) ? initialClients : dataClients;
    const appointments = (initialAppointments && initialAppointments.length > 0) ? initialAppointments : dataAppointments;
    const { t } = useLanguage();

    // Verificar se o usuário está em plano que bloqueia IA (Individual ou Essencial)
    const isPlanRestricted = (currentUser?.plan === 'Individual' || currentUser?.plan === 'Empresa Essencial') && !currentUser?.is_super_admin;

    const [activeTab, setActiveTab] = useState('clientes');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [completenessFilter, setCompletenessFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
    const [columnFilter, setColumnFilter] = useState<string[]>([]);
    const [isColumnFilterOpen, setIsColumnFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'last-visit-desc' | 'last-visit-asc'>('last-visit-desc');
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);


    const [columnsConfig, setColumnsConfig] = useState<CrmColumnConfig[]>([
        {
            id: 'new',
            title: 'Novos Clientes',
            description: "Converter novos contatos em agendamento. 8 tentativas com intervalos progressivos. Se agendar → Agendados. Se não responder → Inativos.",
            icon: '⭐',
            tagIcon: '⭐',
            tagTitle: 'Novo',
            visible: true,
            deletable: false,
            ai_actions: [
                {
                    title: 'Funil Novos Clientes',
                    description: "Objetivo: Converter novos contatos em agendamento.\n8 tentativas: Dia 0, 2, 3, 4, 5, 12, 19, 26.\nSe agendar → Funil Agendados.\nSe não responder após 8ª tentativa → Funil Inativos.",
                    active: true
                }
            ]
        },
        {
            id: 'scheduled',
            title: 'Agendados',
            description: "Garantir comparecimento. Lembretes 48h, 24h e 2h antes. Confirmação com opções 1/2/3. Se faltar → Faltantes. Se concluir → Recorrente.",
            icon: '✅',
            tagIcon: '✅',
            tagTitle: 'Agendado',
            visible: true,
            deletable: false,
            ai_actions: [
                {
                    title: 'Funil Agendados',
                    description: "Objetivo: Garantir comparecimento do cliente.\nLembrete 48h antes, Confirmação 24h antes (1=Confirmar, 2=Desmarcar, 3=Reagendar), Lembrete 2h antes.\nSe desmarcar/faltar → Funil Faltantes.\nSe concluir sem novo agendamento → Funil Recorrentes.",
                    active: true
                }
            ]
        },
        {
            id: 'absent',
            title: 'Faltantes',
            description: "Recuperar clientes que faltaram. 8 tentativas de reagendamento. Se reagendar → Agendados. Se não reagendar → Inativos.",
            icon: '❌',
            tagIcon: '❌',
            tagTitle: 'Faltou',
            visible: true,
            deletable: false,
            ai_actions: [
                {
                    title: 'Funil Faltantes',
                    description: "Objetivo: Recuperar clientes que faltaram.\n8 tentativas: Dia 0, 2, 3, 4, 5, 12, 19, 26.\nSe reagendar → Funil Agendados.\nSe não reagendar após 8ª tentativa → Funil Inativos.",
                    active: true
                }
            ]
        },
        {
            id: 'recurrent',
            title: 'Recorrentes (Ativos)',
            description: "Clientes ativos e fidelizados. Monitoramento passivo. Se ficar 60 dias sem agendar → Inativos.",
            icon: '💎',
            tagIcon: '💎',
            tagTitle: 'Recorrente',
            visible: true,
            deletable: false,
            ai_actions: [
                {
                    title: 'Funil Recorrente',
                    description: "Objetivo: Manter clientes ativos.\n60 dias sem agendamento → mover para Funil Inativos.\nNovo agendamento dentro do prazo → permanece recorrente.",
                    active: true
                }
            ]
        },
        {
            id: 'inactive',
            title: 'Inativos (+60 Dias)',
            description: "Reativar clientes inativos. 2 ciclos de 8 tentativas com 30 dias de intervalo. Se agendar → Agendados.",
            icon: '⏳',
            tagIcon: '⏳',
            tagTitle: 'Inativo',
            visible: true,
            deletable: false,
            ai_actions: [
                {
                    title: 'Funil Inativo',
                    description: "Objetivo: Reativar clientes inativos (60+ dias).\n2 ciclos de 8 tentativas: Dia 0, 2, 3, 4, 5, 12, 19, 26.\nIntervalo de 30 dias entre ciclos.\nSe agendar → Funil Agendados.\nSe não agendar após 2 ciclos → permanecer inativo.",
                    active: true
                }
            ]
        }
    ]);

    const [classifications, setClassifications] = useState<Classification[]>([
        { text: 'Recorrente', icon: '💎' },
        { text: 'Novo', icon: '⭐' },
        { text: 'Agendado', icon: '✅' },
        { text: 'Faltou', icon: '❌' },
        { text: 'Inativo', icon: '⏳' }
    ]);

    // Load persisted settings
    useEffect(() => {
        if (crmSettings?.funnel_stages) {
            // Start with the full mandatory list (from state's initial value)
            const baseStages = [
                { id: 'new', title: 'Novos Clientes', icon: '⭐', tagIcon: '⭐', tagTitle: 'Novo', description: "Converter novos contatos em agendamento. 8 tentativas com intervalos progressivos. Se agendar → Agendados. Se não responder → Inativos.", visible: true, deletable: false, ai_actions: [{ title: 'Funil Novos Clientes', description: "Objetivo: Converter novos contatos em agendamento.\n8 tentativas: Dia 0, 2, 3, 4, 5, 12, 19, 26.\nSe agendar → Funil Agendados.\nSe não responder após 8ª tentativa → Funil Inativos.", active: true }] },
                { id: 'scheduled', title: 'Agendados', icon: '✅', tagIcon: '✅', tagTitle: 'Agendado', description: "Garantir comparecimento. Lembretes 48h, 24h e 2h antes. Confirmação com opções 1/2/3. Se faltar → Faltantes. Se concluir → Recorrente.", visible: true, deletable: false, ai_actions: [{ title: 'Funil Agendados', description: "Objetivo: Garantir comparecimento do cliente.\nLembrete 48h antes, Confirmação 24h antes (1=Confirmar, 2=Desmarcar, 3=Reagendar), Lembrete 2h antes.\nSe desmarcar/faltar → Funil Faltantes.\nSe concluir sem novo agendamento → Funil Recorrentes.", active: true }] },
                { id: 'absent', title: 'Faltantes', icon: '❌', tagIcon: '❌', tagTitle: 'Faltou', description: "Recuperar clientes que faltaram. 8 tentativas de reagendamento. Se reagendar → Agendados. Se não reagendar → Inativos.", visible: true, deletable: false, ai_actions: [{ title: 'Funil Faltantes', description: "Objetivo: Recuperar clientes que faltaram.\n8 tentativas: Dia 0, 2, 3, 4, 5, 12, 19, 26.\nSe reagendar → Funil Agendados.\nSe não reagendar após 8ª tentativa → Funil Inativos.", active: true }] },
                { id: 'recurrent', title: 'Recorrentes (Ativos)', icon: '💎', tagIcon: '💎', tagTitle: 'Recorrente', description: "Clientes ativos e fidelizados. Monitoramento passivo. Se ficar 60 dias sem agendar → Inativos.", visible: true, deletable: false, ai_actions: [{ title: 'Funil Recorrente', description: "Objetivo: Manter clientes ativos.\n60 dias sem agendamento → mover para Funil Inativos.\nNovo agendamento dentro do prazo → permanece recorrente.", active: true }] },
                { id: 'inactive', title: 'Inativos (+60 Dias)', icon: '⏳', tagIcon: '⏳', tagTitle: 'Inativo', description: "Reativar clientes inativos. 2 ciclos de 8 tentativas com 30 dias de intervalo. Se agendar → Agendados.", visible: true, deletable: false, ai_actions: [{ title: 'Funil Inativo', description: "Objetivo: Reativar clientes inativos (60+ dias).\n2 ciclos de 8 tentativas: Dia 0, 2, 3, 4, 5, 12, 19, 26.\nIntervalo de 30 dias entre ciclos.\nSe agendar → Funil Agendados.\nSe não agendar após 2 ciclos → permanecer inativo.", active: true }] }
            ];

            const mergedStages = baseStages.map(baseStage => {
                const dbStage = crmSettings.funnel_stages.find(s => s.id === baseStage.id);
                if (!dbStage) return baseStage;

                return {
                    ...baseStage,
                    visible: dbStage.visible !== false,
                    icon: dbStage.icon || baseStage.icon,
                    tagIcon: dbStage.tagIcon || baseStage.tagIcon,
                    tagTitle: dbStage.tagTitle || baseStage.tagTitle,
                    title: baseStage.title, // Force updated title even if DB has old one
                    // If DB has custom AI actions, it might be legacy, but we'll respect 'active' flag if we ever add a toggle.
                    // For now, we enforce our detailed descriptions but preserve visibility.
                };
            });

            setColumnsConfig(mergedStages);
        }
        if (crmSettings?.classifications) {
            setClassifications(crmSettings.classifications);
        }
    }, [crmSettings]);

    const handleSaveClassifications = async (updatedClassifications: Classification[]) => {
        setClassifications(updatedClassifications);
        await updateCrmSettings({ classifications: updatedClassifications });
    };

    // State for drag and drop
    const [cardPositions, setCardPositions] = useState<{ [key: string]: any[] } | null>(null);
    const [draggedClientId, setDraggedClientId] = useState<number | null>(null);
    const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
    const [openConfigColumnId, setOpenConfigColumnId] = useState<string | null>(null);

    // State and ref for drag-to-scroll
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDraggingScroll, setIsDraggingScroll] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const isIndividualPlan = currentUser?.plan === 'Individual';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsColumnFilterOpen(false);
            }
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setIsSortDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggleConfig = (columnId: string) => {
        setOpenConfigColumnId(prev => (prev === columnId ? null : columnId));
    };

    const handleColumnFilterChange = (columnId: string) => {
        setColumnFilter(prev =>
            prev.includes(columnId)
                ? prev.filter(id => id !== columnId)
                : [...prev, columnId]
        );
    };

    const handleColumnConfigChange = async (columnId: string, field: keyof CrmColumnConfig, value: any) => {
        const updated = columnsConfig.map(col =>
            col.id === columnId ? { ...col, [field]: value } : col
        );
        setColumnsConfig(updated);
        await updateCrmSettings({ funnel_stages: updated });
    };

    const handleActionChange = async (columnId: string, actionId: string, field: keyof AIAction, value: any) => {
        const updated = columnsConfig.map(col => {
            if (col.id === columnId) {
                const updatedActions = (col.ai_actions || []).map(action =>
                    action.id === actionId ? { ...action, [field]: value } : action
                );
                return { ...col, ai_actions: updatedActions };
            }
            return col;
        });
        setColumnsConfig(updated);
        await updateCrmSettings({ funnel_stages: updated });
    };

    const handleCreateAction = async (columnId: string) => {
        const updated = columnsConfig.map(col => {
            if (col.id === columnId) {
                const newAction: AIAction = {
                    id: Date.now().toString(),
                    title: 'Nova Ação',
                    description: '',
                    active: false
                };
                return { ...col, ai_actions: [...(col.ai_actions || []), newAction] };
            }
            return col;
        });
        setColumnsConfig(updated);
        await updateCrmSettings({ funnel_stages: updated });
    };

    const handleRemoveAction = async (columnId: string, actionId: string) => {
        const updated = columnsConfig.map(col => {
            if (col.id === columnId) {
                const updatedActions = (col.ai_actions || []).filter(a => a.id !== actionId);
                return { ...col, ai_actions: updatedActions };
            }
            return col;
        });
        setColumnsConfig(updated);
        await updateCrmSettings({ funnel_stages: updated });
    };


    const clientGroups = useMemo(() => {
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const formatDateForLookup = (date: Date): string => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const todayKey = formatDateForLookup(today);
        const scheduledClientIds = new Set(appointments.filter(a => a.date === todayKey).map(a => a.clientId));

        const groups: { [key: string]: any[] } = {};
        columnsConfig.forEach(col => {
            groups[col.id] = [];
        });

        console.log(`[CRM] Validating clients: ${clients.length}`);


        const filteredClients = clients.filter(client => {
            // Completeness Filter (based on CPF)
            if (completenessFilter === 'complete') {
                const isComplete = !!client.cpf && client.cpf.replace(/\D/g, '').length === 11;
                if (!isComplete) return false;
            } else if (completenessFilter === 'incomplete') {
                const isComplete = !!client.cpf && client.cpf.replace(/\D/g, '').length === 11;
                if (isComplete) return false;
            }

            // Text Search
            const textSearchMatch = (() => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase().replace(/[.\-/() ]/g, '');
                if (!query) return true;
                const name = client.name.toLowerCase();
                const phone = (client.phone || '').replace(/[.\-/() ]/g, '');
                const cpf = (client.cpf || '').replace(/[.\-/() ]/g, '');
                return name.includes(searchQuery.toLowerCase()) || phone.includes(query) || cpf.includes(query);
            })();

            if (!textSearchMatch) return false;

            // Date Filter
            const dateMatch = (() => {
                if (!startDate && !endDate) return true;

                const start = startDate ? new Date(startDate + 'T00:00:00') : null;
                const end = endDate ? new Date(endDate + 'T23:59:59') : null;

                return appointments.some(appt => {
                    if (appt.clientId !== client.id) return false;

                    const apptDate = new Date(appt.date + 'T00:00:00');

                    if (start && end) {
                        return apptDate >= start && apptDate <= end;
                    }
                    if (start) {
                        return apptDate >= start;
                    }
                    if (end) {
                        return apptDate <= end;
                    }
                    return false;
                });
            })();

            return dateMatch;
        });

        filteredClients.forEach(client => {
            // Explicit crm_stage from backend takes precedence (for manual moves or saved automated ones)
            if (client.crm_stage && groups[client.crm_stage]) {
                groups[client.crm_stage].push(client);
                return;
            }

            // Fallback: Automatic grouping for clients without a specific manual stage

            // Priority 1: Birthday
            if (client.birthdate) {
                const datePart = client.birthdate.split('T')[0];
                const [, month, day] = datePart.split('-').map(Number);
                const birthMonth = month - 1;
                const birthDay = day;
                if (birthDay === today.getDate() && birthMonth === today.getMonth()) {
                    if (groups.birthday) {
                        groups.birthday.push(client);
                        return;
                    }
                }
            }

            // Priority 2: Scheduled Today
            if (scheduledClientIds.has(client.id)) {
                if (groups.scheduled) {
                    groups.scheduled.push(client);
                    return;
                }
            }

            // Priority 3: Specific Statuses (Synced from Agenda)
            if (client.status === 'Faltante') {
                if (groups.absent) {
                    groups.absent.push(client);
                    return;
                }
            }
            if (client.status === 'Reagendado') {
                if (groups.rescheduled) {
                    groups.rescheduled.push(client);
                    return;
                }
            }

            // Priority 3.5: Recurrent/Active Clients
            if (client.lastVisit) {
                const lastVisitDate = new Date(client.lastVisit);
                const daysSinceLastVisit = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceLastVisit <= 60 && client.totalVisits > 0) {
                    if (groups.recurrent) {
                        groups.recurrent.push(client);
                        return;
                    }
                }
            }

            // Priority 4: Inactive Clients
            if (client.lastVisit) {
                const lastVisitDate = new Date(client.lastVisit);
                const daysSinceLastVisit = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceLastVisit > 60) {
                    if (groups.inactive) {
                        groups.inactive.push(client);
                        return;
                    }
                }
            }

            // Priority 5: New Client (Fallback)
            if (groups.new) {
                groups.new.push(client);
            } else {
                // If 'new' column doesn't exist, put in first visible column
                const firstCol = columnsConfig.find(c => c.visible);
                if (firstCol) groups[firstCol.id].push(client);
            }
        });



        // Sorting logic
        for (const key in groups) {
            if (Array.isArray(groups[key])) {
                groups[key].sort((a, b) => {
                    switch (sortOrder) {
                        case 'name-asc':
                            return a.name.localeCompare(b.name);
                        case 'name-desc':
                            return b.name.localeCompare(a.name);
                        case 'last-visit-asc':
                            const dateAscA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
                            const dateAscB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
                            if (dateAscA === 0) return 1;
                            if (dateAscB === 0) return -1;
                            return dateAscA - dateAscB;
                        case 'last-visit-desc':
                        default:
                            const dateDescA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
                            const dateDescB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
                            if (dateDescA === 0) return 1;
                            if (dateDescB === 0) return -1;
                            return dateDescB - dateDescA;
                    }
                });
            }
        }

        console.log('[CRM] Groups distribution:', Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])));
        return groups;
    }, [clients, appointments, searchQuery, startDate, endDate, sortOrder, completenessFilter, columnsConfig]);

    // Initialize card positions on first load only.
    // Do NOT reset on every clientGroups change — that would overwrite manual drag-and-drop state.
    // Initialize card positions on first load only.
    // Do NOT reset on every clientGroups change — that would overwrite manual drag-and-drop state.
    useEffect(() => {
        setCardPositions(prev => {
            if (prev === null || prev === undefined) return clientGroups;

            // Optimization: Calculate existing IDs set ONCE (O(N)) instead of per column (O(C*N))
            const merged = { ...prev };

            // Prune invalid columns (columns that no longer exist in config) from merged state
            // This ensures clients in deleted columns are not "stuck" there and can be re-distributed
            for (const colId in merged) {
                if (!clientGroups[colId]) {
                    delete merged[colId];
                }
            }

            const existingIds = new Set<string>();
            Object.values(merged).forEach((col: any) => {
                if (Array.isArray(col)) {
                    col.forEach((c: any) => existingIds.add(String(c.id)));
                }
            });

            // Merge: keep manual positions but add any NEW clients that appeared
            for (const colId in clientGroups) {
                if (!merged[colId]) merged[colId] = [];

                clientGroups[colId].forEach((client: any) => {
                    // Only add if not found in ANY column of the previous state
                    if (!existingIds.has(String(client.id))) {
                        merged[colId].push(client);
                        existingIds.add(String(client.id)); // Add to set to prevent duplicates if clientGroups has dupes (unlikely)
                    }
                });
            }

            // Remove clients that no longer exist in the source data
            // We need to know which IDs are valid in clientGroups
            const validIds = new Set<string>();
            Object.values(clientGroups).forEach((col: any) => {
                if (Array.isArray(col)) {
                    col.forEach((c: any) => validIds.add(String(c.id)));
                }
            });

            for (const colId in merged) {
                merged[colId] = merged[colId].filter((c: any) => validIds.has(String(c.id)));
            }

            return merged;
        });
    }, [clientGroups]);


    const handleDragStart = (e: React.DragEvent, clientId: number) => {
        e.dataTransfer.setData('clientId', String(clientId));
        setDraggedClientId(clientId);
    };

    const handleDragEnd = () => {
        setDraggedClientId(null);
        setDragOverColumnId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDragEnter = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setDragOverColumnId(columnId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverColumnId(null);
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        setDragOverColumnId(null);
        setDraggedClientId(null);
        const rawClientId = e.dataTransfer.getData('clientId');
        const clientId = rawClientId ? parseInt(rawClientId, 10) : null;

        console.log(`[CRM] Handling drop for client ${clientId} into column ${targetColumnId}`);

        if (!clientId) return;

        setCardPositions(currentPositions => {
            if (!currentPositions) return currentPositions;

            let sourceColumnId: string | null = null;
            let draggedClient: any = null;

            // Find the client and its source column
            for (const colId in currentPositions) {
                const clientIndex = currentPositions[colId].findIndex(c => c.id === clientId);
                if (clientIndex !== -1) {
                    sourceColumnId = colId;
                    draggedClient = { ...currentPositions[colId][clientIndex] };
                    break;
                }
            }

            if (!sourceColumnId || !draggedClient || sourceColumnId === targetColumnId) {
                return currentPositions;
            }

            console.log(`[CRM] Moving client ${clientId} from ${sourceColumnId} to ${targetColumnId}`);

            // Sync tag logic
            const targetColumn = columnsConfig.find(c => c.id === targetColumnId);
            const targetIcon = targetColumn ? (targetColumn.tagIcon || targetColumn.icon) : null;
            const matchingTag = targetIcon ? classifications.find(cls => cls.icon === targetIcon) : null;

            if (matchingTag) {
                draggedClient.classification = matchingTag.text;
                draggedClient.classificationIcon = matchingTag.icon;
            }
            // Update crm_stage optimistically so recalculations (snapping) respect this
            draggedClient.crm_stage = targetColumnId;

            const newPositions = { ...currentPositions };
            newPositions[sourceColumnId] = (newPositions[sourceColumnId] || []).filter(c => c.id !== clientId);
            newPositions[targetColumnId] = [...(newPositions[targetColumnId] || []), draggedClient];

            return newPositions;
        });

        // Also persist the stage change to the backend
        const targetColumnAPI = columnsConfig.find(c => c.id === targetColumnId);
        const targetIconAPI = targetColumnAPI ? (targetColumnAPI.tagIcon || targetColumnAPI.icon) : null;
        const matchingTagAPI = targetIconAPI ? classifications.find(cls => cls.icon === targetIconAPI) : null;

        console.log(`[CRM] Sending API update for client ${clientId}: stage=${targetColumnId}`);

        clientsAPI.update(clientId, {
            crm_stage: targetColumnId,
            classification: matchingTagAPI?.text || undefined
        }).then(response => {
            console.log(`[CRM] API update success for client ${clientId}`, response);
        }).catch(err => {
            console.error('[CRM] API update failed:', err);
        });
    };

    const columnsToRender = useMemo(() => {
        const currentPositions = cardPositions || clientGroups;
        return columnsConfig.map(config => ({
            ...config,
            clients: (currentPositions && currentPositions[config.id]) ? currentPositions[config.id] : [],
        }));
    }, [columnsConfig, cardPositions, clientGroups]);

    const handleSaveSettings = async (updatedConfig: CrmColumnConfig[]) => {
        setColumnsConfig(updatedConfig);
        await updateCrmSettings({ funnel_stages: updatedConfig });
    };

    const handleCardClick = (client: any) => {
        setSelectedClient(client);
        setIsDetailModalOpen(true);
    };

    // --- Drag-to-scroll handlers ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) {
            return;
        }
        if (scrollContainerRef.current) {
            setIsDraggingScroll(true);
            setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
            setScrollLeft(scrollContainerRef.current.scrollLeft);
        }
    };

    const handleMouseLeave = () => {
        setIsDraggingScroll(false);
    };

    const handleMouseUp = () => {
        setIsDraggingScroll(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingScroll || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX);
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    const TabButton: React.FC<{ tabId: string, label: string, icon: React.ReactNode }> = ({ tabId, label, icon }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none ${activeTab === tabId
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
        >
            {icon}
            {label}
        </button>
    );

    const ClientAppointmentsView = () => {
        const [selectedClient, setSelectedClient] = useState<Client | null>(null);
        const [fullClient, setFullClient] = useState<any>(null);
        const [isLoadingClient, setIsLoadingClient] = useState(false);
        const [searchQuery, setSearchQuery] = useState('');
        const [showSearchResults, setShowSearchResults] = useState(false);
        const searchRef = useRef<HTMLDivElement>(null);

        const [appointmentFilters, setAppointmentFilters] = useState({
            startDate: '',
            endDate: '',
            status: 'all',
        });

        // Fetch full client details when a client is selected
        useEffect(() => {
            if (!selectedClient) { setFullClient(null); return; }
            let canceled = false;
            setIsLoadingClient(true);
            clientsAPI.getById(selectedClient.id).then(response => {
                if (!canceled) {
                    const data = response.data || response;
                    setFullClient(mapClientFromAPI(data));
                }
            }).catch(err => console.error('Error fetching client details:', err))
                .finally(() => { if (!canceled) setIsLoadingClient(false); });
            return () => { canceled = true; };
        }, [selectedClient]);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                    setShowSearchResults(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const searchResults = useMemo(() => {
            if (searchQuery.length < 2) return [];
            const query = searchQuery.toLowerCase();
            return clients.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
            );
        }, [searchQuery, clients]);

        const clientAppointments = useMemo(() => {
            if (!selectedClient) return [];

            // If we have full client data with history, use it as the primary source
            if (fullClient?.history && fullClient.history.length > 0) {
                return fullClient.history.map((h: any) => {
                    const professional = (professionals as Professional[]).find(p => p.id === h.professionalId || p.name === h.professional);
                    return {
                        ...h,
                        service: h.name || h.service,
                        price: h.price || '0',
                        professionalName: professional?.name || h.professional || 'N/A',
                    };
                }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            }

            // Fallback: use global appointments with improved price lookup
            return appointments
                .filter(a => a.clientId === selectedClient.id)
                .map(a => {
                    const service = (services as Service[]).find(s => s.name === a.service);
                    const professional = (professionals as Professional[]).find(p => p.id === a.professionalId);
                    // Prioritize the appointment's own price over the service catalog price
                    const appointmentPrice = a.price && parseFloat(String(a.price)) > 0 ? a.price : (service?.price || '0');
                    return {
                        ...a,
                        price: appointmentPrice,
                        professionalName: professional?.name || 'N/A',
                    };
                })
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }, [selectedClient, fullClient, appointments, services, professionals]);

        const filteredAppointments = useMemo(() => {
            return clientAppointments.filter(appt => {
                const apptDate = new Date(appt.date);
                if (appointmentFilters.startDate && apptDate < new Date(appointmentFilters.startDate)) return false;
                if (appointmentFilters.endDate && apptDate > new Date(appointmentFilters.endDate)) return false;
                if (appointmentFilters.status !== 'all' && appt.status !== appointmentFilters.status) return false;
                return true;
            });
        }, [clientAppointments, appointmentFilters]);

        const clientSummary = useMemo(() => {
            if (!selectedClient) return null;
            const completionStatuses = ['atendido', 'concluído', 'concluido', 'finalizado', 'pago'];
            const attendedAppointments = clientAppointments.filter(a => completionStatuses.includes((a.status || '').toLowerCase()));
            const totalSpent = attendedAppointments.reduce((sum, a) => {
                const priceStr = String(a.price || '0').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
                const price = parseFloat(priceStr);
                return sum + (isNaN(price) ? 0 : price);
            }, 0);

            // Use backend values if available from full client data
            const finalTotalSpent = (fullClient?.totalSpent && parseFloat(fullClient.totalSpent) > 0)
                ? parseFloat(fullClient.totalSpent)
                : totalSpent;

            return {
                totalAppointments: clientAppointments.length,
                attendedCount: attendedAppointments.length,
                totalSpent: finalTotalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                lastVisit: attendedAppointments.length > 0 ? new Date(attendedAppointments[0].date).toLocaleDateString('pt-BR') : 'N/A',
            };
        }, [selectedClient, fullClient, clientAppointments]);

        const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setAppointmentFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        };

        if (!selectedClient) {
            return (
                <div className="text-center p-8 bg-light rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-700">Selecione um Cliente</h2>
                    <p className="text-gray-500 mt-2">Busque por nome ou telefone para ver o histórico de agendamentos.</p>
                    <div ref={searchRef} className="relative max-w-lg mx-auto mt-6">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowSearchResults(true)}
                            placeholder="Buscar cliente..."
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
                        />
                        {showSearchResults && searchResults.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {searchResults.map(client => (
                                    <li key={client.id}>
                                        <button
                                            onClick={() => {
                                                setSelectedClient(client);
                                                setSearchQuery('');
                                                setShowSearchResults(false);
                                            }}
                                            className="w-full text-left flex items-start p-3 hover:bg-gray-100"
                                        >
                                            <img src={client.photo} alt={client.name} className="w-10 h-10 rounded-full mr-3 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-black truncate">{client.name}</p>
                                                {client.history && client.history.length > 0 ? (
                                                    <div className="mt-1 text-xs space-y-0.5">
                                                        {client.history.slice(0, 2).map(h => (
                                                            <p key={h.id} className="truncate text-black">
                                                                {new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR')}	{h.name}	{h.professional}	{displayCurrency(h.price)}	{h.status}
                                                            </p>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 truncate">{client.phone}</p>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-center gap-4">
                    <img src={selectedClient.photo} alt={selectedClient.name} className="w-20 h-20 rounded-full" />
                    <div className="flex-1 text-center sm:text-left">
                        <h2 className="text-2xl font-bold text-secondary">{selectedClient.name}</h2>
                        <p className="text-gray-500">{selectedClient.email}</p>
                    </div>
                    <div className="flex gap-4 text-center">
                        <div>
                            <p className="text-xl font-bold text-black">{clientSummary?.totalAppointments}</p>
                            <p className="text-sm text-gray-500">Agendamentos</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-green-600">{clientSummary?.attendedCount}</p>
                            <p className="text-sm text-gray-500">Atendidos</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-black">{clientSummary?.totalSpent}</p>
                            <p className="text-sm text-gray-500">Total Gasto</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-black">{clientSummary?.lastVisit}</p>
                            <p className="text-sm text-gray-500">Última Visita</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => navigate('scheduling')} className="py-2 px-4 bg-primary text-white text-sm font-semibold rounded-md">Novo Agendamento</button>
                        <button onClick={() => setSelectedClient(null)} className="py-2 px-4 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md">Trocar Cliente</button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <input type="date" name="startDate" value={appointmentFilters.startDate} onChange={handleFilterChange} className="p-2 border rounded-md" />
                        <input type="date" name="endDate" value={appointmentFilters.endDate} onChange={handleFilterChange} className="p-2 border rounded-md" />
                        <select name="status" value={appointmentFilters.status} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-md">
                            <option value="all">Todos os Status</option>
                            <option value="Atendido">Atendido</option>
                            <option value="Agendado">Agendado</option>
                            <option value="Faltou">Faltou</option>
                            <option value="Desmarcou">Desmarcou</option>
                        </select>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profissional</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAppointments.map(appt => (
                                    <tr key={appt.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-black">{new Date(appt.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-black">{appt.service}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-black">{appt.professionalName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-black">{displayCurrency(appt.price)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${appt.status === 'Atendido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{appt.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const ClientCompleteHistoryView = () => {
        const [selectedClient, setSelectedClient] = useState<Client | null>(null);
        const [fullClient, setFullClient] = useState<any>(null);
        const [isLoadingClient, setIsLoadingClient] = useState(false);
        const [searchQuery, setSearchQuery] = useState('');
        const [showSearchResults, setShowSearchResults] = useState(false);
        const searchRef = useRef<HTMLDivElement>(null);

        const ServiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a1 1 0 000-2H4a1 1 0 000 2zm1.5 8.5A.5.5 0 016 12v4a1 1 0 001 1h6a1 1 0 001-1v-4a.5.5 0 011 0v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a.5.5 0 01.5-.5z" /><path d="M10 12a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5zM15 4h-3a1 1 0 100 2h3a1 1 0 100-2zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" /></svg>;
        const RegistrationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;

        // Fetch full client details when a client is selected
        useEffect(() => {
            if (!selectedClient) { setFullClient(null); return; }
            let canceled = false;
            setIsLoadingClient(true);
            clientsAPI.getById(selectedClient.id).then(response => {
                if (!canceled) {
                    const data = response.data || response;
                    setFullClient(mapClientFromAPI(data));
                }
            }).catch(err => console.error('Error fetching client details:', err))
                .finally(() => { if (!canceled) setIsLoadingClient(false); });
            return () => { canceled = true; };
        }, [selectedClient]);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                    setShowSearchResults(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const searchResults = useMemo(() => {
            if (searchQuery.length < 2) return [];
            const query = searchQuery.toLowerCase();
            return clients.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
            );
        }, [searchQuery, clients]);

        const timelineEvents = useMemo(() => {
            // Use fullClient (deep data) if available, otherwise fallback to selectedClient (shallow)
            const clientData = fullClient || selectedClient;
            if (!clientData) return [];

            const events: any[] = [];

            events.push({
                type: 'registration',
                date: clientData.registrationDate,
                title: 'Cliente Cadastrado',
                description: `Cliente cadastrado via ${clientData.howTheyFoundUs || 'canal desconhecido'}.`
            });

            // Use history from full client data (includes completed services)
            const history = clientData.history || [];
            history.forEach((item: any) => {
                events.push({
                    type: 'service',
                    date: item.date,
                    title: item.name,
                    description: `Com ${item.professional} às ${item.time}.${item.price ? ' Valor: ' + displayCurrency(item.price) : ''}`,
                    status: item.status
                });
            });

            const documents = clientData.documents || [];
            documents.forEach((doc: any) => {
                if (doc.signed) {
                    const firstServiceDate = history[0]?.date || clientData.registrationDate;
                    events.push({
                        type: 'document',
                        date: firstServiceDate,
                        title: 'Documento Assinado',
                        description: `${doc.type}: ${doc.name}`
                    });
                }
            });

            return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }, [selectedClient, fullClient]);

        const getStatusInfo = (status: string) => {
            switch (status) {
                case 'Atendido':
                case 'concluído':
                    return { icon: '✅', color: 'text-green-600', text: status };
                case 'Agendado':
                case 'a realizar':
                    return { icon: '🗓️', color: 'text-blue-600', text: status };
                case 'Faltou':
                    return { icon: '❌', color: 'text-red-600', text: status };
                case 'Desmarcou':
                case 'Reagendado':
                    return { icon: '🔄', color: 'text-yellow-600', text: status };
                default:
                    return { icon: '❔', color: 'text-gray-600', text: status };
            }
        };

        if (!selectedClient) {
            return (
                <div className="text-center p-8 bg-light rounded-lg">
                    <h2 className="text-xl font-semibold text-gray-700">Selecione um Cliente</h2>
                    <p className="text-gray-500 mt-2">Busque por nome ou telefone para ver o histórico completo.</p>
                    <div ref={searchRef} className="relative max-w-lg mx-auto mt-6">
                        <input
                            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowSearchResults(true)} placeholder="Buscar cliente..."
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm"
                        />
                        {showSearchResults && searchResults.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {searchResults.map(client => (
                                    <li key={client.id}>
                                        <button onClick={() => { setSelectedClient(client); setSearchQuery(''); setShowSearchResults(false); }}
                                            className="w-full text-left flex items-center p-3 hover:bg-gray-100"
                                        >
                                            <img src={client.photo} alt={client.name} className="w-10 h-10 rounded-full mr-3" />
                                            <div>
                                                <p className="font-semibold text-black">{client.name}</p>
                                                <p className="text-sm text-gray-500">{client.phone}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img src={selectedClient.photo} alt={selectedClient.name} className="w-20 h-20 rounded-full" />
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-secondary">{selectedClient.name}</h2>
                            <p className="text-gray-500">{selectedClient.email}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedClient(null)} className="py-2 px-4 bg-gray-200 text-gray-700 text-sm font-semibold rounded-md hover:bg-gray-300">Trocar Cliente</button>
                </div>

                <div className="relative pl-8">
                    <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200"></div>
                    <div className="space-y-8">
                        {timelineEvents.map((event, index) => {
                            let icon, iconBg;
                            if (event.type === 'registration') {
                                icon = <RegistrationIcon />;
                                iconBg = 'bg-blue-500';
                            } else if (event.type === 'document') {
                                icon = <ContractIcon />;
                                iconBg = 'bg-purple-500';
                            } else {
                                icon = <ServiceIcon />;
                                iconBg = 'bg-primary';
                            }
                            return (
                                <div key={index} className="relative">
                                    <div className={`absolute -left-8 top-1 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white ${iconBg}`}>
                                        {React.cloneElement(icon, { className: "h-5 w-5" })}
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-md border">
                                        <p className="text-xs text-gray-500 font-semibold">{
                                            (() => {
                                                const date = new Date(event.date + 'T00:00:00');
                                                return !isNaN(date.getTime())
                                                    ? date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
                                                    : 'data invalida';
                                            })()
                                        }</p>
                                        <h4 className="font-bold text-gray-800 mt-1">{event.title}</h4>
                                        <p className="text-sm text-gray-600">{event.description}</p>
                                        {event.status && (
                                            <div className="mt-2 flex items-center text-sm">
                                                <span className="mr-2">{getStatusInfo(event.status).icon}</span>
                                                <span className={`font-semibold ${getStatusInfo(event.status).color}`}>{getStatusInfo(event.status).text}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const sortOptions = [
        { key: 'last-visit-desc', label: 'Última Visita (Recente)' },
        { key: 'last-visit-asc', label: 'Última Visita (Antiga)' },
        { key: 'name-asc', label: 'Nome (A-Z)' },
        { key: 'name-desc', label: 'Nome (Z-A)' },
    ];

    const handleSortChange = (newSortOrder: 'name-asc' | 'name-desc' | 'last-visit-desc' | 'last-visit-asc') => {
        setSortOrder(newSortOrder);
        setIsSortDropdownOpen(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'clientes':
                return (
                    <div
                        className={`flex space-x-6 overflow-x-auto pb-4 ${isDraggingScroll ? 'cursor-grabbing' : 'cursor-grab'}`}
                        ref={scrollContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                    >
                        {columnsToRender
                            .filter(c => c.visible && (columnFilter.length === 0 ? true : columnFilter.includes(c.id)))
                            .map(column => (
                                <KanbanColumn
                                    key={column.id}
                                    columnId={column.id}
                                    title={column.title}
                                    clients={column.clients}
                                    icon={column.icon}
                                    config={column}
                                    isConfigOpen={openConfigColumnId === column.id}
                                    onToggleConfig={handleToggleConfig}
                                    onConfigChange={handleColumnConfigChange}
                                    onActionChange={handleActionChange}
                                    onCreateAction={handleCreateAction}
                                    onRemoveAction={handleRemoveAction}
                                    onCardClick={handleCardClick}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, column.id)}
                                    onDragEnter={(e) => handleDragEnter(e, column.id)}
                                    onDragLeave={handleDragLeave}
                                    onDragEnd={handleDragEnd}
                                    isDropTarget={dragOverColumnId === column.id}
                                    draggedClientId={draggedClientId}
                                    isIndividualPlan={isIndividualPlan}
                                    currentUser={currentUser}
                                    navigate={navigate}
                                    onOpenChat={onOpenChat}
                                    appointments={appointments}
                                    services={services}
                                    professionals={professionals}
                                />
                            ))}
                    </div>
                );
            case 'agendamentos':
                return <ClientAppointmentsView />;
            case 'historico':
                return <ClientCompleteHistoryView />;
            default:
                return null;
        }
    };


    return (
        <>
            <div className="container mx-auto px-6 py-8">
                {onBack && (
                    <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold transition-colors duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Voltar ao Dashboard
                    </button>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-secondary">CRM</h1>
                        <div className="flex items-center mt-1">
                            <p className="text-gray-600">Visualize e organize o funil de clientes.</p>
                            <div className="relative group ml-2">
                                <InfoIcon />
                                <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                                    Clientes são classificados automaticamente, mas você pode movê-los entre as colunas arrastando os cards.
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row gap-4 items-center flex-wrap">

                    <div className="relative flex-grow w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="start-date-crm" className="text-sm font-medium text-gray-700">De:</label>
                        <input
                            id="start-date-crm"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
                            aria-label="Filtrar por data de início do agendamento"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="end-date-crm" className="text-sm font-medium text-gray-700">Até:</label>
                        <input
                            id="end-date-crm"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
                            aria-label="Filtrar por data final do agendamento"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="crm-completeness-filter" className="text-sm font-medium text-gray-700">Cadastro:</label>
                        <select
                            id="crm-completeness-filter"
                            value={completenessFilter}
                            onChange={(e) => setCompletenessFilter(e.target.value as any)}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
                        >
                            <option value="all">Todos</option>
                            <option value="complete">Completos (CPF)</option>
                            <option value="incomplete">Incompletos (S/ CPF)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 sm:ml-auto">
                        {(searchQuery || startDate || endDate || completenessFilter !== 'all') && (
                            <button
                                onClick={() => { setSearchQuery(''); setStartDate(''); setEndDate(''); setCompletenessFilter('all'); }}
                                className="text-sm text-primary hover:underline font-semibold whitespace-nowrap"
                            >
                                Limpar Filtros
                            </button>
                        )}
                        <div ref={filterRef} className="relative group">
                            <button
                                type="button"
                                onClick={() => setIsColumnFilterOpen(prev => !prev)}
                                className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 p-2 rounded-lg flex items-center justify-center transition-colors duration-300 relative"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                {columnFilter.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                                        {columnFilter.length}
                                    </span>
                                )}
                            </button>
                            <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                                Colunas
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                            </div>
                            {isColumnFilterOpen && (
                                <div className="absolute z-20 mt-2 w-64 bg-white rounded-md shadow-lg border right-0">
                                    <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                                        <p className="font-semibold text-sm">Filtrar colunas visíveis</p>
                                        {columnsConfig.filter(c => c.visible).map(col => (
                                            <label key={col.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-100 rounded-md">
                                                <input
                                                    type="checkbox"
                                                    checked={columnFilter.includes(col.id)}
                                                    onChange={() => handleColumnFilterChange(col.id)}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-gray-700">{col.icon} {col.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="px-4 py-2 bg-gray-50 border-t">
                                        <button onClick={() => setColumnFilter([])} className="text-xs text-primary hover:underline">
                                            Limpar Filtro
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div ref={sortRef} className="relative group">
                            <button
                                type="button"
                                onClick={() => setIsSortDropdownOpen(prev => !prev)}
                                className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 p-2 rounded-lg flex items-center transition-colors duration-300"
                            >
                                <SortIcon />
                            </button>
                            <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                                Ordenar
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                            </div>
                            {isSortDropdownOpen && (
                                <div className="absolute z-20 mt-2 w-56 bg-white rounded-md shadow-lg border right-0 animate-fade-in-down">
                                    <div className="p-2" role="menu">
                                        {sortOptions.map(option => (
                                            <button
                                                key={option.key}
                                                onClick={() => handleSortChange(option.key as any)}
                                                className={`w-full text-left p-2 rounded-md text-sm ${sortOrder === option.key ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                                                role="menuitem"
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {(currentUser?.role === 'admin' || currentUser?.role === 'Administrador' || currentUser?.is_super_admin) && (
                            <div className="relative group">
                                <button
                                    id="crm-settings-btn"
                                    onClick={() => setIsSettingsModalOpen(true)}
                                    className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 p-2 rounded-lg flex items-center transition-colors duration-300 flex-shrink-0">
                                    <SettingsIcon />
                                </button>
                                <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                                    Configurar
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>


                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <TabButton tabId="clientes" label="Clientes" icon={<ClientsIcon />} />
                        <TabButton tabId="agendamentos" label="Agendamentos" icon={<CalendarIcon />} />
                        <TabButton tabId="historico" label="Histórico" icon={<HistoryIcon />} />
                    </nav>
                </div>

                {renderContent()}

            </div>
            <CRMSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                columns={columnsConfig}
                onSave={handleSaveSettings}
                classifications={classifications}
                onClassificationsChange={handleSaveClassifications}
                canCustomize={!isPlanRestricted}
            />
            <ClientDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                client={selectedClient}
                navigate={navigate}
                existingClients={clients}
            />
            <CRMRulesModal
                isOpen={isRulesModalOpen}
                onClose={() => setIsRulesModalOpen(false)}
                settings={crmSettings}
                onSettingsUpdated={() => {
                    // Force refresh or just assume crmSettings will update
                }}
            />
        </>
    );
};

export default CRMPage;