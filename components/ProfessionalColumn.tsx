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

        const SLOT_HEIGHT = 120; // Height of a 30-min slot in pixels matches the 'h-32' class used before (approx)
        // Actually h-32 is 8rem = 128px. Let's use standard h-24 (96px) or h-32 (128px) for 30 mins to make it spacious.
        // The previous code had h-32 (128px) for empty slots. Let's stick to that for consistency.
        const PIXELS_PER_MINUTE = 4.26; // 128px / 30min ~= 4.26

        // Generate all 30-min slots for the background grid
        const slots: any[] = [];
        let currentT = timeToMinutes(openingTime);
        const end = timeToMinutes(closingTime);

        while (currentT < end) {
            slots.push({
                time: minutesToTime(currentT),
                minutes: currentT
            });
            currentT += 30;
        }

        // Calculate absolute position and height for items
        const getPositionStyles = (startTime: string, endTime: string) => {
            const start = timeToMinutes(startTime);
            const end = timeToMinutes(endTime);
            const duration = end - start;

            const startOffset = start - timeToMinutes(openingTime);
            const top = (startOffset / 30) * 128; // 128px per 30 mins
            const height = (duration / 30) * 128;

            return { top, height };
        };

        return (
            <div
                className={`flex-shrink-0 w-full sm:w-80 bg-light rounded-xl transition-all duration-300 flex flex-col h-full ${isDropTarget ? 'bg-primary/10 border-2 border-dashed border-primary' : ''}`}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
            >
                {/* Header */}
                <div className="flex items-center space-x-3 p-4 border-b bg-white rounded-t-xl z-20 sticky top-0 shadow-sm">
                    <img src={professional.photo} alt={professional.name} className="w-10 h-10 rounded-full object-cover border-2 border-primary/20" />
                    <div>
                        <h3 className="font-bold text-secondary">{professional.name}</h3>
                        <p className="text-xs text-primary font-semibold uppercase tracking-wide">{professional.occupation || professional.role || 'Profissional'}</p>
                    </div>
                </div>

                {/* Scrollable Timeline */}
                <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-white/50" style={{ height: 'calc(100vh - 280px)' }}>
                    <div className="relative" style={{ height: `${slots.length * 128}px` }}> {/* Total height container */}

                        {/* 1. Background Grid Slots */}
                        {slots.map((slot, index) => (
                            <div
                                key={`slot-${slot.time}`}
                                className="absolute w-full border-b border-gray-100/80 hover:bg-gray-50 transition-colors group"
                                style={{
                                    top: `${index * 128}px`,
                                    height: '128px'
                                }}
                                onClick={() => onOpenNewAppointment(professional, slot.time)}
                            >
                                <div className="absolute top-2 left-2 text-xs text-gray-400 font-medium bg-white/80 px-1 rounded">
                                    {slot.time}
                                </div>
                                <div className="hidden group-hover:flex items-center justify-center h-full cursor-pointer">
                                    <div className="bg-primary/10 text-primary p-2 rounded-full hover:bg-primary/20 transition-all transform hover:scale-110">
                                        <PlusIcon />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 2. Items (Appointments & Blocks) - Rendered over the grid */}
                        {itemsForDay.map((item: any) => {
                            const { top, height } = getPositionStyles(item.startTime, item.endTime);

                            // Slight padding to fit within lines
                            const style = {
                                top: `${top}px`,
                                height: `${height}px`,
                                paddingBottom: '2px', // gap
                                zIndex: 10
                            };

                            if (item.type === 'appointment') {
                                return (
                                    <div key={`appt-${item.data.id}`} className="absolute w-full px-1 left-0 right-0 transition-all hover:z-20" style={style}>
                                        <AppointmentCard
                                            appointment={{ ...item.data, time: item.startTime, endTime: item.endTime }} // normalized content
                                            onStatusChange={(newStatus) => onStatusChange(item.data.id, newStatus)}
                                            onClick={() => onCardClick(item.data)}
                                            currentUser={currentUser}
                                            onReassignClick={() => onReassignClick(item.data)}
                                            onDragStart={(e) => onDragStart(e, item.data.id)}
                                            onDragEnd={onDragEnd}
                                            isDraggable={isDraggable}
                                            isDragging={draggedAppointmentId === item.data.id}
                                            // Pass height style to card if accepted, or wrapping div handles it
                                            // AppointmentCard handles its own internal layout, but we need to ensure it fills height
                                            className="h-full"
                                        />
                                    </div>
                                );
                            }

                            if (item.type === 'block') {
                                return (
                                    <div key={`block-${item.data.id}`} className="absolute w-full px-1 left-0 right-0 group z-10" style={style}>
                                        <BlockCard
                                            block={{ ...item.data }}
                                            onDelete={onDeleteBlock}
                                        />
                                    </div>
                                );
                            }

                            return null;
                        })}

                    </div>
                </div>
            </div>
        );
    };

export default ProfessionalColumn;