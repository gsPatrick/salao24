import React, { useState, useMemo } from 'react';
import ClientDetailModal from './ClientDetailModal';
import ClientSearchModal from './ClientSearchModal';
import ScheduleReturnModal from './ScheduleReturnModal';
import PreRegistrationModal from './PreRegistrationModal';
import { NewClientModal } from './NewClientModal';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabaseClient';

// --- Interfaces ---

interface User {
    name: string;
    email: string;
    avatarUrl: string;
    role?: 'admin' | 'gerente' | 'concierge' | 'profissional';
}

interface ProfessionalAgendaPageProps {
    currentUser: User | null;
    onBack?: () => void;
    navigate: (page: string) => void;
    onComingSoon?: (featureName: string) => void;
}

type AppointmentStatus = 'Agendado' | 'Confirmado' | 'Em Espera' | 'Atendido' | 'confirmado';

interface Appointment {
    id: number;
    time: string;
    clientId: number;
    service: string;
    status: AppointmentStatus;
    date: string;
    professionalId?: number;
    [key: string]: any;
}

interface Notification {
    id: number;
    message: string;
}

// --- Components ---

const Confetti: React.FC = () => (
    <>
        <span className="absolute top-[15%] left-[10%] w-1 h-2 bg-red-400 rotate-45 opacity-70"></span>
        <span className="absolute top-[5%] left-[50%] w-2 h-2 bg-blue-400 rounded-full opacity-70"></span>
        <span className="absolute top-[20%] left-[85%] w-1 h-3 bg-green-400 -rotate-45 opacity-70"></span>
        <span className="absolute top-[50%] left-[25%] w-2 h-2 bg-yellow-400 rounded-full opacity-70"></span>
        <span className="absolute top-[70%] left-[5%] w-1 h-1 bg-pink-400 rounded-full opacity-70"></span>
        <span className="absolute top-[85%] left-[35%] w-2 h-1 bg-indigo-400 rotate-12 opacity-70"></span>
        <span className="absolute top-[60%] left-[90%] w-2 h-2 bg-teal-400 rounded-full opacity-70"></span>
        <span className="absolute top-[95%] left-[70%] w-1 h-2 bg-orange-400 -rotate-12 opacity-70"></span>
        <span className="absolute top-[40%] left-[60%] w-1.5 h-1.5 bg-purple-400 rounded-full opacity-70"></span>
    </>
);

const formatDateForLookup = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ClientAppointmentCard: React.FC<{
    appointment: Appointment;
    appointmentDate: Date;
    onStatusChange: (newStatus: AppointmentStatus) => void;
    onClick: () => void;
    client: any; // Pass client directly
}> = ({ appointment, appointmentDate, onStatusChange, onClick, client }) => {
    if (!client) return null;

    const [clientBirthYear, clientBirthMonth, clientBirthDay] = client.birthdate ? client.birthdate.split('-').map(Number) : [null, null, null];
    const isBirthday = clientBirthMonth !== null && clientBirthDay !== null &&
        (appointmentDate.getMonth() + 1) === clientBirthMonth &&
        appointmentDate.getDate() === clientBirthDay;

    const statusStyles: { [key in AppointmentStatus]: string } = {
        'Atendido': 'bg-green-100 text-green-800 border-green-200',
        'Em Espera': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Agendado': 'bg-blue-100 text-blue-800 border-blue-200',
        'Confirmado': 'bg-teal-100 text-teal-800 border-teal-200',
        'confirmado': 'bg-teal-100 text-teal-800 border-teal-200',
    };

    const handleSelectClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div onClick={onClick} className={`p-4 rounded-xl shadow-lg flex items-center space-x-4 transition-transform transform hover:scale-[1.02] cursor-pointer relative overflow-hidden ${isBirthday ? 'bg-yellow-300' : 'bg-white'}`}>
            {isBirthday && <Confetti />}
            <div className="relative flex-shrink-0 z-10">
                <img src={client.avatar || client.photo_url || 'https://i.pravatar.cc/150'} alt={client.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-white/50" />
                {isBirthday && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl transform -rotate-[15deg]" role="img" aria-label="Rosto festivo">🥳</span>
                )}
            </div>
            <div className="flex-1 border-l-2 border-primary/20 pl-4 relative z-10">
                <p className={`font-bold text-lg ${isBirthday ? 'text-black' : 'text-secondary'}`}>{client.name}</p>
                <p className={`${isBirthday ? 'text-gray-700' : 'text-gray-600'}`}>{appointment.service}</p>
            </div>
            <div className="text-center space-y-2 relative z-10">
                <p className={`font-bold text-xl ${isBirthday ? 'text-black' : 'text-primary'}`}>{appointment.time}</p>
                <select
                    value={appointment.status}
                    onClick={handleSelectClick}
                    onChange={(e) => onStatusChange(e.target.value as AppointmentStatus)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full appearance-none text-center border ${statusStyles[appointment.status]} focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer`}
                    aria-label="Alterar status do agendamento"
                >
                    <option value="Agendado">Agendado</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Em Espera">Em Espera</option>
                    <option value="Atendido">Atendido</option>
                </select>
            </div>
        </div>
    );
};

const NoAppointmentsCard: React.FC = () => (
    <div className="text-center py-10 bg-light rounded-xl h-full flex flex-col justify-center items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500 text-lg">Nenhum agendamento.</p>
    </div>
);


const ProfessionalAgendaPage: React.FC<ProfessionalAgendaPageProps> = ({ currentUser, onBack, navigate, onComingSoon }) => {
    const { t } = useLanguage();
    const { appointments: contextAppointments, clients: contextClients, professionals: contextProfessionals, saveClient, saveAppointment, updateAppointmentStatus } = useData();

    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Derive professional data
    const professionalData = useMemo(() => {
        if (!currentUser) return null;
        return contextProfessionals.find(p => p.email === currentUser.email) || contextProfessionals[0];
    }, [currentUser, contextProfessionals]);

    // Derive schedule from appointments
    const appointmentsForProfessional = useMemo(() => {
        if (!professionalData) return [];
        return contextAppointments.filter(a => a.professionalId === professionalData.id);
    }, [contextAppointments, professionalData]);

    const [notifications, setNotifications] = useState<Notification[]>([]);

    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isScheduleReturnModalOpen, setIsScheduleReturnModalOpen] = useState(false);
    const [clientToSchedule, setClientToSchedule] = useState<any | null>(null);

    // State from GeneralAgendaPage
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isPreRegModalOpen, setIsPreRegModalOpen] = useState(false);
    const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<any | null>(null);
    const [preRegInitialData, setPreRegInitialData] = useState<{ professionalName: string; date: Date; time: string } | null>(null);

    const handleStatusChange = async (appointmentId: number, newStatus: AppointmentStatus) => {
        const targetAppointment = contextAppointments.find(appt => appt.id === appointmentId);
        if (targetAppointment && newStatus === 'Em Espera' && professionalData) {
            const client = contextClients.find(c => c.id === targetAppointment.clientId);
            const clientName = client ? client.name : 'Um cliente';
            const newNotification: Notification = {
                id: Date.now(),
                message: `${clientName} está aguardando por você.`,
            };
            setNotifications(prev => [...prev, newNotification]);
        }
        await updateAppointmentStatus(appointmentId, newStatus);
    };

    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleCardClick = (appointment: Appointment) => {
        const clientData = contextClients.find(c => c.id === appointment.clientId);
        if (clientData) {
            setSelectedClient(clientData);
            setSelectedAppointment(appointment);
            setIsPreRegModalOpen(true);
        }
    };

    const handleOpenFullRegistration = () => {
        const client = selectedAppointment ? contextClients.find(c => c.id === selectedAppointment.clientId) : undefined;
        if (client) {
            setClientToEdit(client);
            setIsPreRegModalOpen(false);
            setIsNewClientModalOpen(true);
        }
    };


    const handleSelectClientForScheduling = (client: any) => {
        setIsSearchModalOpen(false);
        setClientToSchedule(client);
        setIsScheduleReturnModalOpen(true);
    };

    const handleScheduleReturn = async (newAppointment: { service: string; date: Date; time: string; }) => {
        if (!clientToSchedule || !professionalData) return;
        await saveAppointment({
            clientId: clientToSchedule.id,
            professionalId: professionalData.id,
            date: formatDateForLookup(newAppointment.date),
            time: newAppointment.time,
            service: newAppointment.service,
            status: 'Agendado'
        });
        setIsScheduleReturnModalOpen(false);
        setClientToSchedule(null);
    };


    const handleQuickSchedule = async (payload: {
        clientName: string;
        clientPhone: string;
        serviceName: string;
        professionalName: string;
        date: string; // YYYY-MM-DD
        time: string; // HH:MM
    }) => {
        // 1) Find the professional ID in the context using the professionalName from the payload
        const selectedProfessional = contextProfessionals.find(p => p.name === payload.professionalName);
        const targetProfessionalId = selectedProfessional ? selectedProfessional.id : professionalData?.id || 1;

        // 2) Find or Create Client
        let client = contextClients.find(c => c.name === payload.clientName || c.phone === payload.clientPhone);
        if (!client) {
            client = await saveClient({
                name: payload.clientName,
                phone: payload.clientPhone,
                howTheyFoundUs: 'Agendamento Rápido',
                registrationDate: new Date().toISOString(),
            }) as any;
        }

        if (client && client.id) {
            // 3) Create Appointment
            await saveAppointment({
                clientId: client.id,
                professionalId: targetProfessionalId,
                date: payload.date,
                time: payload.time,
                service: payload.serviceName,
                status: 'Agendado',
            });
        }
    };


    const handleNav = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        const amount = direction === 'prev' ? -1 : 1;
        if (viewMode === 'day') newDate.setDate(newDate.getDate() + amount);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() + (amount * 7));
        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + amount);
        setCurrentDate(newDate);
    };

    const renderAgendaContent = () => {
        // Filter appointments for the current view
        const getAppointmentsForDate = (date: Date) => {
            const dateKey = formatDateForLookup(date);
            // Ensure strict string comparison YYYY-MM-DD
            return appointmentsForProfessional.filter(a => {
                // Handle cases where a.date might be full ISO string from some API versions
                const apptDate = a.date.includes('T') ? a.date.split('T')[0] : a.date;
                return apptDate === dateKey;
            });
        };

        if (viewMode === 'day') {
            const appointments = getAppointmentsForDate(currentDate);
            return (
                <div className="space-y-4">
                    {appointments.length > 0 ? (
                        appointments.sort((a, b) => a.time.localeCompare(b.time)).map((appt) => (
                            <ClientAppointmentCard
                                key={`${appt.id}`}
                                appointment={appt}
                                appointmentDate={currentDate}
                                onStatusChange={(newStatus) => handleStatusChange(appt.id, newStatus)}
                                onClick={() => handleCardClick(appt)}
                                client={contextClients.find(c => c.id === appt.clientId)}
                            />
                        ))
                    ) : <NoAppointmentsCard />}
                </div>
            );
        }
        if (viewMode === 'week') {
            const startOfWeek = new Date(currentDate);
            const dayOfWeek = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday as start
            startOfWeek.setDate(diff);

            return (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {Array.from({ length: 7 }).map((_, i) => {
                        const day = new Date(startOfWeek);
                        day.setDate(startOfWeek.getDate() + i);
                        const appointments = getAppointmentsForDate(day);
                        return (
                            <div key={i} className="bg-light p-3 rounded-lg">
                                <p className="font-bold text-center text-secondary">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                                <p className="text-sm text-center text-gray-500 mb-3">{day.getDate()}</p>
                                <div className="space-y-3">
                                    {appointments.length > 0 ? (
                                        appointments.sort((a, b) => a.time.localeCompare(b.time)).map((appt) => (
                                            <div key={`${appt.id}`} className="bg-white p-2 rounded shadow text-xs">
                                                <p className="font-semibold text-primary">{appt.time}</p>
                                                <p className="text-gray-600 truncate">{contextClients.find(c => c.id === appt.clientId)?.name}</p>
                                            </div>
                                        ))
                                    ) : <p className="text-xs text-center text-gray-400 pt-4">Vazio</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }
        if (viewMode === 'month') {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            return (
                <div className="overflow-x-auto pb-2">
                    <div className="grid grid-cols-7 gap-1 bg-light p-2 rounded-lg min-w-[320px]">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="text-center font-bold text-secondary text-sm">{d}</div>)}
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                        {Array.from({ length: daysInMonth }).map((_, day) => {
                            const date = new Date(year, month, day + 1);
                            const appointments = getAppointmentsForDate(date);
                            return (
                                <div key={day} className="bg-white p-2 rounded h-28 overflow-y-auto">
                                    <p className="font-bold text-gray-700">{day + 1}</p>
                                    {appointments.map((appt) => (
                                        <div key={`${appt.id}`} className="bg-primary/10 text-primary text-xs p-1 rounded mt-1 truncate">
                                            {appt.time} - {contextClients.find(c => c.id === appt.clientId)?.name.split(' ')[0]}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return null;
    };

    const getHeaderText = () => {
        if (viewMode === 'day') {
            return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
        }
        if (viewMode === 'week') {
            const start = new Date(currentDate);
            const dayOfWeek = start.getDay();
            const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            start.setDate(diff);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${start.toLocaleDateString('pt-BR', { day: '2-digit' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`;
        }
        if (viewMode === 'month') {
            return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        }
        return '';
    };

    if (!currentUser || !professionalData) return <div>Carregando...</div>;

    return (
        <div className="container mx-auto px-6 py-8">
            {onBack && (
                <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Voltar ao Dashboard
                </button>
            )}
            <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6">
                <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/20" />
                    <div>
                        <p className="text-sm text-gray-500">Agenda de</p>
                        <h1 className="text-2xl font-bold text-secondary">{currentUser.name}</h1>
                        <p className="text-md text-primary font-semibold">{professionalData.specialty}</p>
                    </div>
                </div>

                {/* Header with Toggles and Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 p-4 bg-light rounded-lg">
                    <div className="flex items-center bg-gray-200 p-1 rounded-full">
                        {(['day', 'week', 'month'] as const).map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-1 text-sm font-semibold rounded-full capitalize transition-colors duration-200 ${viewMode === mode ? 'bg-primary text-white shadow' : 'text-gray-600'}`}>
                                {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center">
                        <button onClick={() => handleNav('prev')} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h2 className="text-lg font-bold text-secondary text-center w-64 capitalize cursor-pointer hover:underline" onClick={() => setCurrentDate(new Date())} title="Ir para Hoje">
                            {getHeaderText()}
                        </h2>
                        <button onClick={() => handleNav('next')} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="ml-2 px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                            Hoje
                        </button>
                    </div>
                    <div className="flex gap-3 flex-wrap justify-center">
                        <button
                            onClick={() => setIsSearchModalOpen(true)}
                            className="py-2 px-4 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary-dark transition-colors flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            Buscar Cliente
                        </button>
                        <button
                            onClick={() => {
                                setSelectedClient(null);
                                setSelectedAppointment(null);
                                setPreRegInitialData({
                                    professionalId: professionalData?.id,
                                    professionalName: currentUser.name,
                                    date: currentDate,
                                    time: '',
                                });
                                setIsPreRegModalOpen(true);
                            }}
                            className="py-2 px-4 bg-teal-500 text-white font-semibold rounded-lg shadow hover:bg-teal-600 transition-colors flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a1 1 0 100-2 1 1 0 000 2z" /></svg>
                            Agendamento Rápido
                        </button>
                    </div>
                </div>

                {/* Agenda Content */}
                <div>{renderAgendaContent()}</div>
            </div>

            {/* Modals */}
            <ClientDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                client={selectedClient}
                navigate={navigate}
            />
            <PreRegistrationModal
                isOpen={isPreRegModalOpen}
                onClose={() => { setIsPreRegModalOpen(false); setSelectedAppointment(null); setPreRegInitialData(null); }}
                onCompleteRegistration={handleOpenFullRegistration}
                client={selectedClient}
                appointment={selectedAppointment ? { service: selectedAppointment.service, time: selectedAppointment.time } : undefined}
                initialData={preRegInitialData || undefined}
                isIndividualPlan={true}
                currentUser={currentUser}
                onQuickSchedule={handleQuickSchedule}
            />
            <NewClientModal
                isOpen={isNewClientModalOpen}
                onClose={() => { setIsNewClientModalOpen(false); setClientToEdit(null); }}
                onSave={async (clientData) => {
                    await saveClient({
                        ...clientData,
                        registrationDate: clientData.registrationDate || new Date().toISOString(),
                    });
                    setIsNewClientModalOpen(false);
                    setClientToEdit(null);
                }}
                existingClients={contextClients}
                clientToEdit={clientToEdit}
                acquisitionChannels={[]}
                onComingSoon={onComingSoon}
            />
            <ClientSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                clients={contextClients}
                onSelectClient={handleSelectClientForScheduling}
            />
            <ScheduleReturnModal
                isOpen={isScheduleReturnModalOpen}
                onClose={() => setIsScheduleReturnModalOpen(false)}
                client={clientToSchedule}
                professional={professionalData}
                onSchedule={handleScheduleReturn}
            />

            {/* Notifications */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        onClick={() => dismissNotification(notification.id)}
                        className="bg-yellow-400 text-black p-4 rounded-lg shadow-xl cursor-pointer flex items-center animate-bounce-in max-w-sm"
                        role="alert"
                        aria-live="assertive"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="font-semibold">{notification.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfessionalAgendaPage;
