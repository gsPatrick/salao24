
import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';

// Replicating interfaces that would be in a shared file
interface User {
    name: string;
    email: string;
    avatarUrl: string;
    role?: 'admin' | 'gerente' | 'concierge' | 'profissional';
}
type AppointmentStatus = 'Agendado' | 'Confirmado' | 'Em Espera' | 'Atendido' | 'Falta' | 'confirmado'; // Add lowercase for API compat

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


const AppointmentCard: React.FC<{
    appointment: any;
    onStatusChange: (newStatus: AppointmentStatus) => void;
    onClick: () => void;
    currentUser: User | null;
    onReassignClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    isDraggable: boolean;
    isDragging: boolean;
    // Optional: pass client directly if already fetched
    clientData?: any;
}> = ({
    appointment,
    onStatusChange,
    onClick,
    currentUser,
    onReassignClick,
    onDragStart,
    onDragEnd,
    isDraggable,
    isDragging,
    clientData,
}) => {
        const { t } = useLanguage();
        const { getClientById, clients } = useData();

        // Use passed clientData or look up from context, fallback to mock-style lookup
        const client = clientData || getClientById(appointment.clientId) || clients.find(c => c.id === appointment.clientId);
        if (!client) return null;

        const appointmentDate = new Date(appointment.date + 'T00:00:00');
        const [clientBirthYear, clientBirthMonth, clientBirthDay] = client.birthdate ? client.birthdate.split('-').map(Number) : [null, null, null];
        const isBirthday = clientBirthMonth !== null && clientBirthDay !== null &&
            (appointmentDate.getMonth() + 1) === clientBirthMonth &&
            appointmentDate.getDate() === clientBirthDay;

        const shouldShowAlert = useMemo(() => {
            if (!client.registrationDate) return false;
            const registrationDate = new Date(client.registrationDate);
            const sixMonthsLater = new Date(registrationDate.getFullYear(), registrationDate.getMonth() + 6, registrationDate.getDate());
            return sixMonthsLater < appointmentDate;
        }, [client.registrationDate, appointmentDate]);

        const AlertIcon = () => (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        );

        const statusStyles: { [key in AppointmentStatus]: string } = {
            'Atendido': 'bg-green-100 text-green-800 border-green-200',
            'Em Espera': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Agendado': 'bg-blue-100 text-blue-800 border-blue-200',
            'Confirmado': 'bg-teal-100 text-teal-800 border-teal-200',
            'confirmado': 'bg-teal-100 text-teal-800 border-teal-200',
            'Falta': 'bg-red-100 text-red-800 border-red-200',
        };

        const handleActionClick = (e: React.MouseEvent) => {
            e.stopPropagation();
        };

        const canReassign = currentUser && ['admin', 'gerente', 'concierge'].includes(currentUser.role || '');

        return (
            <div
                onClick={onClick}
                className={`p-3 rounded-lg shadow-md flex flex-col space-y-2 transition-all duration-200 relative overflow-hidden group ${isBirthday ? 'bg-yellow-300' : 'bg-white'
                    } ${isDraggable ? 'cursor-grab' : 'cursor-pointer'} ${isDragging ? 'opacity-30' : 'transform hover:scale-105'
                    }`}
                draggable={isDraggable}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
            >
                {isBirthday && <Confetti />}

                {/* Top Section: Info */}
                <div className="flex justify-between items-start w-full">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0 z-10">
                            <img src={client.photo} alt={client.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            {isBirthday && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl transform -rotate-[15deg]" role="img" aria-label="Rosto festivo">🥳</span>
                            )}
                            {shouldShowAlert && (
                                <div className="absolute bottom-0 -right-1 z-20">
                                    <AlertIcon />
                                    <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2">
                                        {t('confirmOrUpdateData')}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm truncate ${isBirthday ? 'text-black' : 'text-secondary'}`}>{client.name}</p>
                            <p className={`text-xs truncate ${isBirthday ? 'text-gray-700' : 'text-gray-500'}`}>{appointment.service}</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 pl-2">
                        <p className={`font-semibold text-lg ${isBirthday ? 'text-black' : 'text-primary'}`}>{appointment.time}</p>
                    </div>
                </div>

                {/* Bottom Section: Actions */}
                <div className="flex justify-between items-center w-full pt-2 border-t border-gray-200/80">
                    <select
                        value={appointment.status}
                        onClick={handleActionClick}
                        onChange={(e) => onStatusChange(e.target.value as AppointmentStatus)}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full appearance-none text-center border ${statusStyles[appointment.status]} focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer`}
                    >
                        <option value="Agendado">{t('statusScheduled')}</option>
                        <option value="Confirmado">Confirmado</option>
                        <option value="Em Espera">{t('statusWaiting')}</option>
                        <option value="Atendido">{t('statusAttended')}</option>
                        <option value="Falta">{t('statusMissed')}</option>
                    </select>

                    {canReassign && (
                        <button onClick={(e) => { handleActionClick(e); onReassignClick(); }} className="p-1 rounded-full text-gray-500 hover:bg-gray-200" title={t('reassignProfessional')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </button>
                    )}
                </div>
            </div>
        );
    };
export default AppointmentCard;
