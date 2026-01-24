import React from 'react';
import AppointmentCard from './AppointmentCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

// Replicating interfaces
interface User {
    name: string;
    email: string;
    avatarUrl: string;
    role?: 'admin' | 'gerente' | 'concierge' | 'profissional';
}
type AppointmentStatus = 'Agendado' | 'Confirmado' | 'Em Espera' | 'Atendido' | 'Falta' | 'confirmado';
interface Appointment {
    id: number;
    professionalId: number;
    clientId: number;
    date: string;
    time: string;
    service: string;
    status: AppointmentStatus;
}
interface TimeBlock {
    id: number;
    professionalId: number;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    reason: string;
    unit: string;
}

const BlockCard: React.FC<{ block: TimeBlock; onDelete: (blockId: number) => void }> = ({ block, onDelete }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-gray-200 p-3 rounded-lg shadow-inner relative text-center group">
            <div
                className="absolute inset-0 bg-repeat bg-center opacity-10"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }}
            ></div>
            <button onClick={() => onDelete(block.id)} className="absolute top-1 right-1 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={t('removeBlock')}>
                &times;
            </button>
            <p className="font-bold text-gray-700">{block.reason}</p>
            <p className="text-sm text-gray-600">{block.startTime} - {block.endTime}</p>
            {block.unit && block.unit !== 'all' && <p className="text-xs text-gray-500 mt-1">({block.unit})</p>}
        </div>
    )
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;

const ProfessionalColumn: React.FC<{
    professional: any;
    appointments: any[];
    blocks: TimeBlock[];
    onStatusChange: (appointmentId: number, newStatus: AppointmentStatus) => void;
    onCardClick: (appointment: Appointment) => void;
    onDeleteBlock: (blockId: number) => void;
    currentUser: User | null;
    onReassignClick: (appointment: Appointment) => void;
    isDropTarget: boolean;
    isDraggable: boolean;
    draggedAppointmentId: number | null;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragStart: (e: React.DragEvent, appointmentId: number) => void;
    onDragEnd: () => void;
    onOpenNewAppointment: (professional: any, time: string) => void;
}> = ({
    professional,
    appointments,
    blocks,
    onStatusChange,
    onCardClick,
    onDeleteBlock,
    currentUser,
    onReassignClick,
    isDropTarget,
    isDraggable,
    draggedAppointmentId,
    onDragOver,
    onDrop,
    onDragEnter,
    onDragLeave,
    onDragStart,
    onDragEnd,
    onOpenNewAppointment,
}) => {
        const { t } = useLanguage();
        const { services: apiServices } = useData();

        const timeToMinutes = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const minutesToTime = (minutes: number) => {
            const h = Math.floor(minutes / 60).toString().padStart(2, '0');
            const m = (minutes % 60).toString().padStart(2, '0');
            return `${h}:${m}`;
        };

        const itemsForDay = [
            ...appointments.map(a => {
                const service = apiServices.find(s => s.name === a.service);
                const duration = service ? parseInt(String(service.duration), 10) : 60; // Default 60 min
                return {
                    type: 'appointment' as const,
                    startTime: a.time,
                    endTime: minutesToTime(timeToMinutes(a.time) + duration),
                    data: a
                };
            }),
            ...blocks.map(b => ({
                type: 'block' as const,
                startTime: b.startTime,
                endTime: b.endTime,
                data: b
            }))
        ].sort((a, b) => a.startTime.localeCompare(b.startTime));

        const renderedItems = [];
        let currentTime = timeToMinutes('09:00'); // workday start
        const endTime = timeToMinutes('18:00'); // workday end
        const slotDuration = 30;

        itemsForDay.forEach(item => {
            const itemStartTime = timeToMinutes(item.startTime);

            // Fill gap before the item with available slots
            while (currentTime < itemStartTime) {
                const slotTime = minutesToTime(currentTime);
                renderedItems.push({ type: 'slot' as const, time: slotTime });
                currentTime += slotDuration;
            }

            // Add the actual item (appointment or block)
            renderedItems.push(item);

            // Update currentTime to be after the item
            currentTime = Math.max(currentTime, timeToMinutes(item.endTime));
        });

        // Fill gap after the last item until end of day
        while (currentTime < endTime) {
            const slotTime = minutesToTime(currentTime);
            renderedItems.push({ type: 'slot' as const, time: slotTime });
            currentTime += slotDuration;
        }

        return (
            <div
                className={`flex-shrink-0 w-full sm:w-80 bg-light p-4 rounded-xl space-y-4 transition-all duration-300 ${isDropTarget ? 'bg-primary/10 border-2 border-dashed border-primary' : ''}`}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
            >
                <div className="flex items-center space-x-3 pb-3 border-b">
                    <img src={professional.photo} alt={professional.name} className="w-10 h-10 rounded-full" />
                    <div>
                        <h3 className="font-bold text-secondary">{professional.name}</h3>
                        <p className="text-sm text-primary font-semibold">{professional.specialties?.[0] || professional.occupation}</p>
                    </div>
                </div>
                <div className="space-y-3 h-[calc(100vh-380px)] overflow-y-auto pr-2">
                    {renderedItems.length > 0 ? (
                        renderedItems.map((item, index) => {
                            if (item.type === 'appointment') {
                                return (
                                    <AppointmentCard
                                        key={`appt-${item.data.id}`}
                                        appointment={item.data}
                                        onStatusChange={(newStatus) => onStatusChange(item.data.id, newStatus)}
                                        onClick={() => onCardClick(item.data)}
                                        currentUser={currentUser}
                                        onReassignClick={() => onReassignClick(item.data)}
                                        onDragStart={(e) => onDragStart(e, item.data.id)}
                                        onDragEnd={onDragEnd}
                                        isDraggable={isDraggable}
                                        isDragging={draggedAppointmentId === item.data.id}
                                    />
                                );
                            }
                            if (item.type === 'block') {
                                return (
                                    <BlockCard
                                        key={`block-${item.data.id}`}
                                        block={item.data}
                                        onDelete={onDeleteBlock}
                                    />
                                );
                            }
                            if (item.type === 'slot') {
                                return (
                                    <button
                                        key={`slot-${item.time}-${index}`}
                                        onClick={() => onOpenNewAppointment(professional, item.time)}
                                        className="w-full text-center p-3 border-2 border-dashed border-primary/30 rounded-lg text-primary/70 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <PlusIcon />
                                        <span className="font-semibold">{item.time}</span>
                                    </button>
                                );
                            }
                            return null;
                        })
                    ) : (
                        <p className="text-center text-gray-500 text-sm pt-10">{t('noAppointments')}</p>
                    )}
                </div>
            </div>
        );
    };

export default ProfessionalColumn;