
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

// --- Interfaces ---
interface Client {
  id: number;
  name: string;
  avatar: string;
  phone?: string;
  photo_url?: string;
}

interface User {
  name: string;
  email: string;
  avatarUrl: string;
  role?: 'admin' | 'gerente' | 'concierge' | 'profissional';
}

interface AppointmentDetails {
  service: string;
  time: string;
}

interface PreRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteRegistration: () => void;
  client?: Client | null;
  appointment?: AppointmentDetails | null;
  initialData?: {
    professionalId?: number; // Added robust ID support
    professionalName: string;
    date: Date;
    time: string;
  } | null;
  isIndividualPlan?: boolean;
  currentUser?: User | null;
  availableProfessionals?: any[]; // New prop to ensure sync with parent view
  onQuickSchedule?: (payload: {
    clientName: string;
    clientPhone: string;
    serviceName: string;
    professionalName: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
  }) => void;
}

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\s\d{5})(\d)/, '$1-$2');
};

const PreRegistrationModal: React.FC<PreRegistrationModalProps> = ({
  isOpen,
  onClose,
  onCompleteRegistration,
  client,
  appointment,
  initialData,
  isIndividualPlan,
  currentUser,
  availableProfessionals, // Destructure new prop
  onQuickSchedule,
}) => {
  const { t } = useLanguage();
  const { professionals: contextProfessionals, services: contextServices } = useData();
  const [isExiting, setIsExiting] = useState(false);
  const isEditing = !!client;

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [professional, setProfessional] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const professionalsToShow = useMemo(() => {
    // Use passed prop if available (preferred for sync), otherwise fallback to context
    const sourceList = availableProfessionals || contextProfessionals;

    // Filtrar apenas profissionais com atendimento ativo (não suspensos, não arquivados e com agenda aberta)
    const activeProfessionals = sourceList.filter(p =>
      !p.suspended && !p.archived
    );

    if (isIndividualPlan && currentUser) {
      const userAsProfessional = activeProfessionals.find(p => p.email === currentUser.email);
      // Fallback for professionals not in main list (like Fernanda)
      if (userAsProfessional) return [userAsProfessional];
      return [{ id: 99, name: currentUser.name, email: currentUser.email, suspended: false, archived: false, openSchedule: true }];
    }
    return activeProfessionals;
  }, [isIndividualPlan, currentUser, contextProfessionals, availableProfessionals]);


  // Effect to pre-fill or reset form
  useEffect(() => {
    if (isOpen) {
      // Pre-fill from props
      const initialService = appointment?.service || '';
      const initialTime = appointment?.time || initialData?.time || '';
      const initialProfName = initialData?.professionalName || '';
      const initialProfId = initialData?.professionalId;

      setName(client?.name || '');
      setPhone(client?.phone || '');
      setService(initialService);

      if (professionalsToShow.length === 1) {
        setProfessional(professionalsToShow[0].name);
      } else if (initialProfId) {
        // Robust ID matching (String comparison to handle "1" vs 1)
        const found = professionalsToShow.find(p => String(p.id) === String(initialProfId));
        setProfessional(found ? found.name : initialProfName);
      } else {
        setProfessional(initialProfName);
      }

      setDate(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setTime(initialTime);
      setEndTime(''); // Will be calculated by the other effect
    } else {
      // Reset on close
      setIsExiting(false);
      setName('');
      setPhone('');
      setService('');
      setProfessional('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('');
      setEndTime('');
    }
  }, [isOpen, client, appointment, initialData, professionalsToShow]);

  // Effect to calculate end time based on service and start time
  useEffect(() => {
    if (!isOpen) return; // Only run when modal is open

    if (service && time) {
      const selectedService = contextServices.find(s => s.name === service);
      if (selectedService) {
        const duration = parseInt(String(selectedService.duration), 10);
        if (!isNaN(duration)) {
          const [hours, minutes] = time.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes)) {
            setEndTime('');
            return;
          }
          const startDateObj = new Date();
          startDateObj.setHours(hours, minutes, 0, 0);
          const endDateObj = new Date(startDateObj.getTime() + duration * 60000);
          const endHours = endDateObj.getHours().toString().padStart(2, '0');
          const endMinutes = endDateObj.getMinutes().toString().padStart(2, '0');
          setEndTime(`${endHours}:${endMinutes}`);
        }
      }
    } else {
      // If no service or time, clear end time
      setEndTime('');
    }
  }, [service, time, isOpen]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) return;
    if (!service || !professional || !date || !time || !name || !phone) {
      return;
    }

    if (onQuickSchedule) {
      onQuickSchedule({
        clientName: name,
        clientPhone: phone,
        serviceName: service,
        professionalName: professional,
        date,
        time,
      });
    }

    handleClose();
  };

  if (!isOpen && !isExiting) return null;

  const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl transform transition-all max-w-lg w-full ${animationClass}`}
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 sm:mx-0 sm:h-10 sm:w-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                  {t('preRegistrationTitle')}
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('clientName')}</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required disabled={isEditing} className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-700 disabled:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      required
                      disabled={isEditing}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-700 disabled:text-white"
                      maxLength={15}
                      placeholder="(DD) XXXXX-XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('procedure')}</label>
                    <select value={service} onChange={e => setService(e.target.value)} required disabled={isEditing} className="mt-1 w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white disabled:bg-gray-700 disabled:text-white disabled:opacity-70">
                      <option value="" style={{ backgroundColor: 'white', color: 'black' }}>Selecione...</option>
                      {contextServices.map(s => <option key={s.id} value={s.name} style={{ backgroundColor: 'white', color: 'black' }}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('professional')}</label>
                    <select value={professional} onChange={e => setProfessional(e.target.value)} required disabled={isEditing || professionalsToShow.length === 1} className="mt-1 w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white disabled:bg-gray-700 disabled:text-white disabled:opacity-70">
                      <option value="" style={{ backgroundColor: 'white', color: 'black' }}>Selecione...</option>
                      {professionalsToShow.map(p => <option key={p.id} value={p.name} style={{ backgroundColor: 'white', color: 'black' }}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('appointmentDate')}</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required disabled={isEditing} className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-700 disabled:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('appointmentTime')}</label>
                      <input type="time" value={time} onChange={e => setTime(e.target.value)} required disabled={isEditing} className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-700 disabled:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('appointmentEndTime')}</label>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required disabled={isEditing} className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-700 disabled:text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3 rounded-b-lg">
            {!isEditing && (
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark sm:w-auto sm:text-sm"
              >
                {t('scheduleButton')}
              </button>
            )}
            {isEditing && (
              <button
                type="button"
                onClick={onCompleteRegistration}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark sm:w-auto sm:text-sm"
              >
                {t('newClientRegistration')}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
            >
              {isEditing ? t('close') : t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreRegistrationModal;
