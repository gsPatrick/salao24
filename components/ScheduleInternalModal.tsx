import React, { useState, useEffect } from 'react';
import { appointmentsAPI } from '../lib/api';

interface Professional {
    id: number;
    name: string;
    photo?: string;
    avatar?: string;
    occupation?: string;
}

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
        package_id?: number;
        salon_plan_id?: number;
        label: string;
        sessionIndex?: number;
        totalSessions?: number;
    } | null;
    onScheduleSuccess: () => void;
    professionals: Professional[];
}

const ScheduleInternalModal: React.FC<ScheduleInternalModalProps> = ({
    isOpen,
    onClose,
    client,
    professional,
    service,
    contractInfo,
    onScheduleSuccess,
    professionals
}) => {
    const [step, setStep] = useState<'professional' | 'datetime'>('professional');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedProf, setSelectedProf] = useState(professional);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep('professional');
            setSelectedProf(professional);
            setSelectedTime(null);
        }
    }, [isOpen, professional]);

    useEffect(() => {
        if (isOpen && step === 'datetime' && selectedProf && service && selectedDate) {
            fetchAvailability();
        }
    }, [isOpen, step, selectedProf, service, selectedDate]);

    const fetchAvailability = async () => {
        if (!selectedProf || !service || !selectedDate) return;
        setLoadingSlots(true);
        try {
            const response = await appointmentsAPI.getAvailability({
                date: selectedDate,
                professionalId: selectedProf.id,
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
        // Allow if we have service_id OR package_id OR salon_plan_id
        if (!client || !selectedProf || (!service?.id && !contractInfo?.package_id && !contractInfo?.salon_plan_id) || !selectedDate || !selectedTime) return;

        setIsSubmitting(true);
        try {
            const response = await appointmentsAPI.create({
                clientId: client.id,
                professionalId: selectedProf.id,
                service_id: service.id || undefined,
                date: selectedDate,
                time: selectedTime,
                status: 'agendado',
                price: '0.00', // Already paid via package/plan
                payment_status: 'linked_to_package',
                package_id: contractInfo?.package_id,
                salon_plan_id: contractInfo?.salon_plan_id,
                package_subscription_id: typeof contractInfo?.package_subscription_id === 'number' ? contractInfo.package_subscription_id : undefined,
                salon_plan_subscription_id: typeof contractInfo?.salon_plan_subscription_id === 'number' ? contractInfo.salon_plan_subscription_id : undefined,
                notes: `Agendado via ${contractInfo?.label || 'Contrato'}`
            });

            if (response.success) {
                onScheduleSuccess();
                handleClose();
            } else {
                alert('Erro ao agendar: ' + (response.message || 'Erro desconhecido'));
            }
        } catch (error: any) {
            console.error('Error creating appointment:', error);
            const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Erro desconhecido ao agendar.';
            alert(`Erro ao realizar o agendamento: ${msg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen && !isExiting) return null;
    if (!client || !service) return null;

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
                    <p className="text-primary-foreground/80 text-sm mt-1">
                        {step === 'professional' ? 'Escolha o profissional para o atendimento' : 'Selecione a data e o horário desejados'}
                    </p>
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
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                    {contractInfo?.label}
                                    {contractInfo?.sessionIndex && contractInfo?.totalSessions && (
                                        <span className="ml-1 opacity-90">
                                            ({contractInfo.sessionIndex}ª de {contractInfo.totalSessions})
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {step === 'professional' ? (
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Selecione o Profissional</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                {professionals && professionals.filter(p => !p.suspended && !p.archived).length > 0 ? (
                                    professionals.filter(p => !p.suspended && !p.archived).map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                setSelectedProf({ id: p.id, name: p.name });
                                                setStep('datetime');
                                            }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left ${selectedProf?.id === p.id
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold overflow-hidden border border-gray-200">
                                                {(p.photo || p.avatar) ? (
                                                    <img src={p.photo || p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    p.name.charAt(0)
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold text-sm truncate ${selectedProf?.id === p.id ? 'text-primary' : 'text-gray-800'}`}>{p.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{p.occupation || 'Profissional'}</p>
                                            </div>
                                            {selectedProf?.id === p.id && (
                                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-500 text-sm">Nenhum profissional disponível no momento.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Selected Prof Recap */}
                            <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                        {selectedProf?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-800">{selectedProf?.name}</p>
                                        <p className="text-[10px] text-blue-600">Profissional selecionado</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep('professional')}
                                    className="text-xs font-bold text-primary hover:underline px-2 py-1"
                                >
                                    Alterar
                                </button>
                            </div>

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
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
                    <p className="text-xs text-secondary/60 max-w-[180px]">Este agendamento será registrado com valor zero, consumindo do saldo do contrato.</p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={step === 'datetime' ? () => setStep('professional') : handleClose}
                            className="px-5 py-2.5 bg-white text-gray-600 font-bold border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            {step === 'datetime' ? 'Voltar' : 'Cancelar'}
                        </button>
                        {step === 'datetime' && (
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={!selectedTime || isSubmitting}
                                className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none hover:bg-primary/90 transition-all"
                            >
                                {isSubmitting ? 'Agendando...' : 'Confirmar'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleInternalModal;
