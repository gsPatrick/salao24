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
        <div className="bg-gray-200 p-3 rounded-lg shadow-inner relative text-center group h-full">
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
    openingTime?: string;
    closingTime?: string;
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
    openingTime = '08:00',
    closingTime = '18:00',
}) => {
        const { t } = useLanguage();
        const { services: apiServices } = useData();

        const timeToMinutes = (time: string) => {
            if (!time || typeof time !== 'string') return 0;
            // Handle HH:MM:SS or HH:MM
            const parts = time.split(':').map(Number);
            const hours = parts[0] || 0;
            const minutes = parts[1] || 0;
            return hours * 60 + minutes;
        };

        const minutesToTime = (minutes: number) => {
            const h = Math.floor(minutes / 60).toString().padStart(2, '0');
            const m = (minutes % 60).toString().padStart(2, '0');
            return `${h}:${m}`;
        };

        // Merge appointments and blocks into a single sorted list
        const itemsForDay = [
            ...appointments.map(a => {
                const service = apiServices.find(s => (a.service_id && s.id === a.service_id) || s.name === a.service);
                const defaultDuration = service ? parseInt(String(service.duration), 10) : 60;

                let itemEndTime = (a as any).end_time || a.endTime;
                if (!itemEndTime) {
                    itemEndTime = minutesToTime(timeToMinutes(a.time) + defaultDuration);
                }

                return {
                    type: 'appointment' as const,
                    startTime: a.time,
                    endTime: itemEndTime,
                    data: a
                };
            }),
            ...blocks.map(b => ({
                type: 'block' as const,
                startTime: b.startTime,
                endTime: b.endTime,
                data: b
            }))
        ].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        const renderedItems: any[] = [];
        let currentTime = timeToMinutes(openingTime);
        const endTime = timeToMinutes(closingTime);
        const slotDuration = 30;

        while (currentTime < endTime) {
            const currentSlotTime = minutesToTime(currentTime);

            // Check if any item COVERS this time slot (starts at or before, ends after)
            const coveringItem = itemsForDay.find(i => {
                const itemStart = timeToMinutes(i.startTime);
                const itemEnd = timeToMinutes(i.endTime);
                return currentTime >= itemStart && currentTime < itemEnd;
            });

            if (coveringItem) {
                const itemStart = timeToMinutes(coveringItem.startTime);

                if (Math.abs(currentTime - itemStart) < 1) {
                    // This is the START of the item - render the appointment/block card
                    renderedItems.push({
                        type: coveringItem.type,
                        data: coveringItem.data,
                        startTime: coveringItem.startTime,
                        endTime: coveringItem.endTime,
                        slotTime: currentSlotTime
                    });
                } else {
                    // This slot is COVERED by the item but not the start - render as "reserved"
                    renderedItems.push({
                        type: 'reserved' as const,
                        time: currentSlotTime,
                        parentType: coveringItem.type,
                        parentData: coveringItem.data
                    });
                }
                currentTime += slotDuration;
            } else {
                // Normal empty slot
                renderedItems.push({ type: 'slot' as const, time: currentSlotTime });
                currentTime += slotDuration;
            }
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
                <div className="space-y-3 h-[calc(100vh-380px)] overflow-y-auto pr-2 relative">
                    {renderedItems.length > 0 ? (
                        renderedItems.map((item, index) => {
                            if (item.type === 'appointment') {
                                return (
                                    <AppointmentCard
                                        key={`appt-${item.data.id}`}
                                        appointment={{ ...item.data, endTime: item.endTime }}
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
                            if (item.type === 'reserved') {
                                return (
                                    <div key={`reserved-${item.time}-${index}`} className="h-32 border-b border-gray-100 relative bg-gray-50 rounded-lg flex items-center justify-center">
                                        <span className="absolute -top-2 left-0 text-[10px] text-gray-400">{item.time}</span>
                                        <span className="text-xs text-gray-400 italic">Reservado</span>
                                    </div>
                                );
                            }
                            if (item.type === 'slot') {
                                return (
                                    <div key={`slot-${item.time}-${index}`} className="h-32 border-b border-gray-100 relative group" onClick={() => onOpenNewAppointment(professional, item.time)}>
                                        <div className="flex items-center justify-center h-full cursor-pointer hover:bg-primary/5 transition-colors">
                                            <PlusIcon />
                                            <span className="ml-1 text-sm text-gray-500">{item.time}</span>
                                        </div>
                                    </div>
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