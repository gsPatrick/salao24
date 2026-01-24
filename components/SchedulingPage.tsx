import React, { useState, useEffect } from 'react';
import { appointmentsAPI } from '../lib/api';
import { Service, Professional } from '../types';

// --- Constants ---
const units = ['Unidade Boa Viagem', 'Unidade Piedade'];
const anyProfessional: Professional = {
    id: -1,
    name: 'Qualquer profissional',
    photo: 'https://i.pravatar.cc/150?u=any',
    occupation: 'Todos',
    specialties: [],
    cpf: '',
    birthdate: '',
    phone: '',
    email: '',
    address: {},
    unit: ''
};

// --- Interfaces ---
interface SchedulingPageProps {
    navigate: (page: string) => void;
    goBack: () => void;
    isClientView?: boolean;
    isIndividualPlan?: boolean;
    onPayForService: (service: { name: string; price: string; }) => void;
    services: Service[];
    professionals: Professional[];
    onCreateAppointment?: (appointment: {
        clientId?: number;
        date: string;
        time: string;
        service: string;
        status: 'Agendado' | 'Em Espera' | 'Atendido';
    }) => void;
    currentClientId?: number;
}

interface Selection {
    unit: string | null;
    service: Service | null;
    professional: Professional | null;
    date: string | null;
    time: string | null;
    availableSlots: string[];
}

// --- Component ---
const SchedulingPage: React.FC<SchedulingPageProps> = ({ navigate, goBack, isClientView, isIndividualPlan, onPayForService, services, professionals, onCreateAppointment, currentClientId }) => {
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState<Selection>({
        unit: 'Unidade Boa Viagem',
        service: null,
        professional: null,
        date: null,
        time: null,
        availableSlots: [],
    });
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        const fetchSlots = async () => {
            if (selection.professional?.id && selection.service?.id && selectedDate) {
                setLoadingSlots(true);
                try {
                    const formattedDate = selectedDate.toISOString().split('T')[0];
                    const response = await appointmentsAPI.getAvailability({
                        date: formattedDate,
                        professionalId: selection.professional.id,
                        serviceId: selection.service.id
                    });
                    if (response.success) {
                        setSelection(prev => ({ ...prev, availableSlots: response.data }));
                    }
                } catch (error) {
                    console.error('Error fetching availability:', error);
                } finally {
                    setLoadingSlots(false);
                }
            }
        };
        fetchSlots();
    }, [selection.professional, selection.service, selectedDate]);

    const unitsToShow = isIndividualPlan ? [units[0]] : units;
    const professionalForIndividualPlan = professionals.length > 0 ? professionals[0] : null;
    const professionalsToShow = isIndividualPlan && professionalForIndividualPlan ? [professionalForIndividualPlan] : professionals;

    const steps = ['Unidade', 'Serviço', 'Profissional', 'Data e Hora', 'Confirmação'];

    useEffect(() => {
        if (isClientView) {
            setStep(2);
        }
    }, [isClientView]);

    const handleNextStep = () => setStep(prev => prev + 1);
    const handlePrevStep = () => {
        if (isClientView && step === 2) {
            goBack();
        } else {
            setStep(prev => prev - 1)
        }
    };

    const select = (key: keyof Selection, value: any) => {
        setSelection(prev => ({ ...prev, [key]: value }));
        handleNextStep();
    };

    const renderCalendar = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();

        const calendarDays = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isPast = date < today;
            const isSelected = selectedDate.toDateString() === date.toDateString();

            // In a real app, we might check if this specific date has ANY slots
            // For now, let's just enable all future dates if a service is selected
            let hasSlots = !isPast && selection.service !== null;

            let buttonClasses = "w-10 h-10 rounded-full flex flex-col items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 relative pt-1";
            let dayIndicator;

            if (isPast) {
                buttonClasses += " text-gray-400 cursor-not-allowed bg-gray-100";
            } else if (isSelected) {
                buttonClasses += " bg-primary text-white font-bold shadow-lg";
                dayIndicator = <div className="absolute bottom-1 w-1.5 h-1.5 bg-white rounded-full"></div>;
            } else if (hasSlots) {
                buttonClasses += " hover:bg-primary/10 text-secondary";
                dayIndicator = <div className="absolute bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full"></div>;
            } else {
                buttonClasses += " text-gray-400 bg-gray-50 cursor-not-allowed";
                dayIndicator = <div className="absolute bottom-1 w-1.5 h-1.5 bg-red-400 rounded-full"></div>;
            }

            calendarDays.push(
                <button
                    type="button"
                    key={day}
                    disabled={isPast || !hasSlots}
                    onClick={() => setSelectedDate(date)}
                    className={buttonClasses}
                >
                    <span>{day}</span>
                    {dayIndicator}
                </button>
            );
        }

        const monthName = calendarMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        return (
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100 transition-colors">&larr;</button>
                    <h3 className="font-bold capitalize text-secondary">{monthName}</h3>
                    <button type="button" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100 transition-colors">&rarr;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2 font-semibold">
                    <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1 justify-items-center">
                    {calendarDays}
                </div>
                <div className="mt-4 flex justify-center items-center space-x-4 text-xs text-gray-600">
                    <div className="flex items-center"><div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></div>Disponível</div>
                    <div className="flex items-center"><div className="w-2.5 h-2.5 bg-accent rounded-full mr-2"></div>Indisponível</div>
                </div>
            </div>
        )
    };

    const renderContent = () => {
        switch (step) {
            case 1:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center text-secondary mb-6">Onde você quer ser atendido(a)?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {unitsToShow.map(unit => (
                                <button key={unit} onClick={() => select('unit', unit)} className="p-8 bg-white rounded-xl shadow-lg hover:shadow-primary/20 hover:border-primary border-2 border-transparent transition-all duration-300 text-center transform hover:scale-105">
                                    <p className="text-xl font-semibold text-secondary">{unit}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 2:
                const availableServices = services.map(s => ({
                    ...s,
                    duration: parseInt(String(s.duration)),
                    professional_ids: s.professional_ids || [],
                    allowAny: s.allowAny ?? true,
                }));

                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center text-secondary mb-6">Qual serviço você deseja?</h2>
                        <div className="space-y-4">
                            {availableServices.map(service => (
                                <button key={service.id} onClick={() => select('service', service)} className="w-full p-4 bg-white rounded-xl shadow-lg hover:shadow-primary/20 hover:border-primary border-2 border-transparent transition-all duration-300 flex justify-between items-center text-left">
                                    <div>
                                        <p className="font-bold text-secondary">{service.name}</p>
                                        <p className="text-sm text-gray-500">{service.duration} min</p>
                                    </div>
                                    <p className="text-lg font-semibold text-primary">R$ {service.price}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 3: {
                const qualifiedProfessionals = professionalsToShow.filter(prof =>
                    selection.service?.professional_ids?.includes(prof.id)
                );
                const showAnyProfessional = selection.service?.allowAny && !isIndividualPlan;
                const displayOptions = [...qualifiedProfessionals];
                if (showAnyProfessional) {
                    displayOptions.unshift(anyProfessional);
                }

                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center text-secondary mb-6">Com quem você gostaria de ser atendido(a)?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {displayOptions.map(prof => (
                                <button key={prof.id} onClick={() => select('professional', prof)} className="p-6 bg-white rounded-xl shadow-lg hover:shadow-primary/20 hover:border-primary border-2 border-transparent transition-all duration-300 text-center flex flex-col items-center">
                                    <img src={prof.photo} alt={prof.name} className="w-20 h-20 rounded-full mb-4" />
                                    <p className="font-semibold text-secondary">{prof.name}</p>
                                </button>
                            ))}
                        </div>
                        {displayOptions.length === 0 && (
                            <p className="text-center text-gray-500 mt-6">Nenhum profissional disponível para este serviço. Por favor, volte e selecione outro serviço.</p>
                        )}
                    </div>
                );
            }

            case 4:
                if (!selection.professional || !selection.service) return null;

                return (
                    <div>
                        <div className="flex flex-col items-center mb-6 text-center">
                            <img src={selection.professional.photo} alt={selection.professional.name} className="w-24 h-24 rounded-full mb-2 ring-4 ring-primary/20" />
                            <p className="font-bold text-secondary text-lg">Você está agendando com:</p>
                            <p className="text-xl font-semibold text-primary">{selection.professional.name}</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {renderCalendar()}
                            <div>
                                <h3 className="text-lg font-bold text-center text-secondary mb-4">
                                    Horários para <span className="text-primary">{selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
                                </h3>
                                <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2 bg-light rounded-lg">
                                    {loadingSlots ? (
                                        <div className="col-span-3 text-center py-4">Carregando horários...</div>
                                    ) : selection.availableSlots.length > 0 ? selection.availableSlots.map(time => (
                                        <button
                                            type="button"
                                            key={time}
                                            onClick={() => {
                                                setSelection(prev => ({
                                                    ...prev,
                                                    date: selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }),
                                                    time: time,
                                                }));
                                                handleNextStep();
                                            }}
                                            className="p-3 bg-white text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors duration-300 shadow"
                                        >
                                            {time}
                                        </button>
                                    )) : (
                                        <p className="col-span-3 text-center text-gray-500 py-4">Nenhum horário disponível para este dia.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center text-secondary mb-6">Confirme seu Agendamento</h2>
                        <div className="bg-white p-8 rounded-2xl shadow-xl space-y-4 text-secondary">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium text-gray-500">Unidade:</span>
                                <span className="font-bold">{selection.unit}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium text-gray-500">Serviço:</span>
                                <span className="font-bold">{selection.service?.name}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium text-gray-500">Profissional:</span>
                                <span className="font-bold">{selection.professional?.name}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="font-medium text-gray-500">Data e Hora:</span>
                                <span className="font-bold">{selection.date} às {selection.time}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                <span className="text-xl font-medium text-gray-500">Total:</span>
                                <span className="text-2xl font-extrabold text-primary">R$ {selection.service?.price}</span>
                            </div>
                        </div>
                        <div className="mt-8 space-y-4">
                            <button
                                onClick={() => {
                                    if (selection.service && selection.date && selection.time) {
                                        onCreateAppointment?.({
                                            clientId: currentClientId,
                                            date: selectedDate.toISOString().split('T')[0],
                                            time: selection.time,
                                            service: selection.service.name,
                                            status: 'Agendado',
                                        });
                                    }
                                    handleNextStep();
                                }}
                                className="w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors duration-300"
                            >
                                Confirmar e pagar na unidade
                            </button>
                            <button onClick={() => {
                                if (selection.service) {
                                    onPayForService({ name: selection.service.name, price: selection.service.price });
                                }
                            }} className="w-full flex justify-center py-4 px-4 border-2 border-primary text-lg font-medium rounded-md text-primary bg-transparent hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-300">
                                Pagar adiantado
                            </button>
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="text-center animate-fade-in">
                        <div className="mx-auto mb-6">
                            <svg className="w-24 h-24 text-primary" fill="none" viewBox="0 0 52 52">
                                <circle className="animate-scale-in stroke-current text-primary/20" cx="26" cy="26" r="25" strokeWidth="4" />
                                <path
                                    className="animate-draw-check stroke-current"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ strokeDasharray: 34, strokeDashoffset: 34 }}
                                    d="M14 27l8 8 16-16"
                                />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-secondary mb-4">Agendamento Confirmado!</h2>
                        <p className="text-gray-600 mb-2">Enviamos um lembrete para você. Mal podemos esperar para te ver!</p>
                        <p className="font-bold text-secondary text-lg">{selection.date} às {selection.time}</p>
                        <button onClick={isClientView ? () => navigate('clientApp') : () => navigate('home')} className="mt-8 py-3 px-8 bg-primary hover:bg-primary-dark text-white font-bold rounded-full transition duration-300">
                            {isClientView ? 'Voltar para Meus Agendamentos' : 'Voltar para o Início'}
                        </button>
                    </div>
                );
        }
    };

    const currentStep = isClientView ? step - 1 : step;
    const totalSteps = isClientView ? steps.length - 1 : steps.length;


    return (
        <div className="min-h-screen bg-light py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full mx-auto space-y-8">
                {step < 6 && (
                    <div className="relative">
                        <div className="flex justify-between items-center mb-2">
                            {step > 1 ? (
                                <button onClick={handlePrevStep} className="font-medium text-primary hover:text-primary-dark">&larr; Voltar</button>
                            ) : (
                                <button onClick={goBack} className="font-medium text-primary hover:text-primary-dark">&larr; Sair</button>
                            )}
                            <span className="text-sm font-semibold text-gray-500">Passo {currentStep} de {totalSteps}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${(currentStep / totalSteps) * 100}%` }}></div>
                        </div>
                    </div>
                )}
                <div className="bg-light p-4 sm:p-8 rounded-2xl">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default SchedulingPage;
