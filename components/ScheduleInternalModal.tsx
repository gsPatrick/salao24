import React, { useState, useEffect } from 'react';
import { appointmentsAPI } from '../lib/api';

interface ScheduleInternalModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: {
        id: number;
        name: string;
        photo?: string;
        avatar?: string;
    } | null;
    professional: {
        id: number;
        name: string;
    } | null;
    service: {
        id: number;
        name: string;
    } | null;
    contractInfo: {
        package_subscription_id?: number;
        salon_plan_subscription_id?: number;
        label: string;
    } | null;
    onScheduleSuccess: () => void;
}

const ScheduleInternalModal: React.FC<ScheduleInternalModalProps> = ({
    isOpen,
    onClose,
    client,
    professional,
    service,
    contractInfo,
    onScheduleSuccess
}) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (isOpen && professional && service && selectedDate) {
            fetchAvailability();
        }
    }, [isOpen, professional, service, selectedDate]);

    const fetchAvailability = async () => {
        if (!professional || !service || !selectedDate) return;
        setLoadingSlots(true);
        try {
            const response = await appointmentsAPI.getAvailability({
                date: selectedDate,
                professionalId: professional.id,
                serviceId: service.id
            });
            if (response.success) {
                setAvailableSlots(response.data.slots || []);
            }
        } catch (error) {
            console.error('Error fetching availability:', error);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            setIsExiting(false);
        }, 300);
    };

    const handleConfirm = async () => {
        if (!client || !professional || !service || !selectedDate || !selectedTime) return;

        setIsSubmitting(true);
        try {
            const response = await appointmentsAPI.create({
                clientId: client.id,
                professionalId: professional.id,
                service_id: service.id,
                date: selectedDate,
                time: selectedTime,
                status: 'agendado',
                price: '0.00', // Already paid via package/plan
                package_subscription_id: contractInfo?.package_subscription_id,
                salon_plan_subscription_id: contractInfo?.salon_plan_subscription_id,
                notes: `Agendado via ${contractInfo?.label || 'Contrato'}`
            });

            if (response.success) {
                onScheduleSuccess();
                handleClose();
            } else {
                alert('Erro ao agendar: ' + (response.message || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert('Erro ao realizar o agendamento.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen && !isExiting) return null;
    if (!client || !professional || !service) return null;

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-black/50 backdrop-blur-sm' : 'opacity-0'}`}>
            <div className={`bg-white rounded-2xl shadow-2xl transform transition-all duration-300 w-full max-w-lg overflow-hidden ${isOpen && !isExiting ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="bg-primary p-6 text-white relative">
                    <button onClick={handleClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <h3 className="text-xl font-bold">Agendar Próxima</h3>
                    <p className="text-primary-foreground/80 text-sm mt-1">Vincular agendamento ao contrato existente</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header Info */}
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden ring-2 ring-white shadow-sm">
                            {(client.photo || client.avatar) ? (
                                <img src={client.photo || client.avatar} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                                client.name.charAt(0)
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-secondary leading-tight">{client.name}</p>
                            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{service.name}</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{contractInfo?.label}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Selecione a Data</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedTime(null);
                                    }}
                                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-primary focus:ring-0 transition-all text-secondary font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-gray-700">Horários Disponíveis</label>
                                {loadingSlots && <span className="text-xs text-primary animate-pulse font-bold">Carregando...</span>}
                            </div>

                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-100 scrollbar-thin">
                                {loadingSlots ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="h-10 bg-gray-200 animate-pulse rounded-lg"></div>
                                    ))
                                ) : availableSlots.length > 0 ? (
                                    availableSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`p-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${selectedTime === time
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 transform scale-105'
                                                    : 'bg-white hover:bg-primary/10 text-secondary border border-gray-100'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-4 py-8 text-center">
                                        <p className="text-gray-500 text-sm font-medium">Nenhum horário disponível para esta data.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
                    <p className="text-xs text-secondary/60 max-w-[180px]">Este agendamento será registrado com valor zero, consumindo do saldo do contrato.</p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 bg-white text-gray-600 font-bold border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!selectedTime || isSubmitting}
                            className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none hover:bg-primary/90 transition-all"
                        >
                            {isSubmitting ? 'Agendando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleInternalModal;
