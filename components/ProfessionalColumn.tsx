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

const BlockCard: React.FC<{ block: TimeBlock; onDelete: (blockId: number) => void; style?: React.CSSProperties; className?: string }> = ({ block, onDelete, style, className }) => {
    const { t } = useLanguage();
    const formatTime = (time: string) => {
        if (!time) return '';
        return time.split(':').slice(0, 2).join(':');
    };
    return (
        <div
            className={`bg-gray-200 p-3 rounded-lg shadow-inner relative text-center group h-full ${className || ''}`}
            style={style}
        >
            <div
                className="absolute inset-0 bg-repeat bg-center opacity-10"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }}
            ></div>
            <button onClick={() => onDelete(block.id)} className="absolute top-1 right-1 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={t('removeBlock')}>
                &times;
            </button>
            <p className="font-bold text-gray-700">{block.reason}</p>
            <p className="text-sm text-gray-600">{formatTime(block.startTime)} - {formatTime(block.endTime)}</p>
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

        const formatTime = (time: string) => {
            if (!time) return '';
            return time.split(':').slice(0, 2).join(':');
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
                    startTime: formatTime(a.time),
                    endTime: formatTime(itemEndTime),
                    data: a
                };
            }),
            ...blocks.map(b => ({
                type: 'block' as const,
                startTime: formatTime(b.startTime),
                endTime: formatTime(b.endTime),
                data: b
            }))
        ].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

        const PIXELS_PER_MINUTE = 4.26; // 128px / 30min ~= 4.26

        const renderedItems: any[] = [];
        let currentTime = timeToMinutes(openingTime);
        const endTime = timeToMinutes(closingTime);
        const slotDuration = 30;

        while (currentTime < endTime) {
            const currentSlotTime = minutesToTime(currentTime);

            // Check if any item STARTS at this time slot
            const startingItem = itemsForDay.find(i => {
                const itemStart = timeToMinutes(i.startTime);
                // Allow a small margin of error (e.g., 1 min) for float comparisons
                return Math.abs(currentTime - itemStart) < 1;
            });

            if (startingItem) {
                // Determine item duration
                const itemStart = timeToMinutes(startingItem.startTime);
                const itemEnd = timeToMinutes(startingItem.endTime);
                let duration = itemEnd - itemStart;

                // Fallback for 0 duration (shouldn't happen but safety first)
                if (duration <= 0) duration = 30;

                // Force fixed height for visual compactness (30 min equivalent), 
                // but keep duration for stepping through time in the loop
                const height = 30 * PIXELS_PER_MINUTE;

                renderedItems.push({
                    type: startingItem.type,
                    data: startingItem.data,
                    startTime: startingItem.startTime,
                    endTime: startingItem.endTime,
                    height: height,
                    slotTime: currentSlotTime
                });

                // Advance currentTime by the duration of the item
                // This effectively "skips" the slots covered by this item
                currentTime += duration;
            } else {
                // No item starts here. check if we are inside an item (covered)
                // Actually, since we advance by duration, we shouldn't be "inside" an item here 
                // UNLESS there's an overlap which the backend logic supposedly prevents.
                // But let's check just in case to avoid double rendering if data is messy.
                const isCovered = itemsForDay.some(i => {
                    const itemStart = timeToMinutes(i.startTime);
                    const itemEnd = timeToMinutes(i.endTime);
                    return currentTime > itemStart && currentTime < itemEnd;
                });

                if (!isCovered) {
                    // Render an empty available slot
                    renderedItems.push({
                        type: 'slot',
                        time: formatTime(currentSlotTime),
                        height: 30 * PIXELS_PER_MINUTE // Standard 30 min height
                    });
                    currentTime += slotDuration;
                } else {
                    // If covered but not starting (shouldn't happen with clean data + jump logic), 
                    // just advance to next slot to find the end of the blockage
                    currentTime += slotDuration;
                }
            }
        }

        return (
            <div
                className={`flex-shrink-0 w-full sm:w-80 bg-light p-4 rounded-xl space-y-4 transition-all duration-300 flex flex-col h-full ${isDropTarget ? 'bg-primary/10 border-2 border-dashed border-primary' : ''}`}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
            >
                {/* Header */}
                <div className="flex items-center space-x-3 pb-3 border-b flex-shrink-0">
                    <img src={professional.photo} alt={professional.name} className="w-10 h-10 rounded-full object-cover border-2 border-primary/20" />
                    <div>
                        <h3 className="font-bold text-secondary">{professional.name}</h3>
                        <p className="text-xs text-primary font-semibold uppercase tracking-wide">{professional.occupation || professional.role || 'Profissional'}</p>
                    </div>
                </div>

                {/* Scrollable Timeline */}
                <div className="flex-1 overflow-y-auto pr-2 relative custom-scrollbar space-y-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                    {renderedItems.map((item, index) => {
                        if (item.type === 'appointment') {
                            return (
                                <AppointmentCard
                                    key={`appt-${item.data.id}`}
                                    appointment={{ ...item.data, time: item.startTime, endTime: item.endTime }}
                                    onStatusChange={(newStatus) => onStatusChange(item.data.id, newStatus)}
                                    onClick={() => onCardClick(item.data)}
                                    currentUser={currentUser}
                                    onReassignClick={() => onReassignClick(item.data)}
                                    onDragStart={(e) => onDragStart(e, item.data.id)}
                                    onDragEnd={onDragEnd}
                                    isDraggable={isDraggable}
                                    isDragging={draggedAppointmentId === item.data.id}
                                    style={{ height: `${item.height}px` }}
                                    className="w-full"
                                />
                            );
                        }

                        if (item.type === 'block') {
                            return (
                                <BlockCard
                                    key={`block-${item.data.id}`}
                                    block={{ ...item.data }}
                                    onDelete={onDeleteBlock}
                                    style={{ height: `${item.height}px` }}
                                    className="w-full"
                                />
                            );
                        }

                        if (item.type === 'slot') {
                            return (
                                <div
                                    key={`slot-${item.time}-${index}`}
                                    className="w-full border-b border-gray-100 relative group transition-colors hover:bg-gray-50 rounded-lg"
                                    style={{ height: `${item.height}px` }}
                                    onClick={() => onOpenNewAppointment(professional, item.time)}
                                >
                                    <div className="flex items-center justify-center h-full cursor-pointer">
                                        <div className="flex items-center text-gray-400 group-hover:text-primary transition-colors">
                                            <span className="text-sm mr-2">{item.time}</span>
                                            <div className="bg-primary/10 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <PlusIcon />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>
            </div>
        );
    };

export default ProfessionalColumn;