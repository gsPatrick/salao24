
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
  is_complete_registration?: boolean;
}

interface User {
  name: string;
  email: string;
  avatarUrl: string;
  role?: 'admin' | 'gerente' | 'concierge' | 'profissional';
}

interface AppointmentDetails {
  id?: number;
  service: string;
  time: string;
  professionalId?: number;
  endTime?: string;
  service_id?: number;
  package_id?: number;
  salon_plan_id?: number;
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
    serviceId?: number;
    packageId?: number;
    salonPlanId?: number;
    professionalId: number;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
  }) => void;
  onCancelAppointment?: (id: number) => Promise<boolean>;
  selectedUnitId?: number | null;
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
  onCancelAppointment,
  selectedUnitId,
}) => {
  const { t } = useLanguage();
  const { professionals: contextProfessionals, services: contextServices, packages: contextPackages, salonPlans: contextSalonPlans, clients: contextClients } = useData();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<'name' | 'phone' | null>(null);
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
      !p.suspended && !p.archived && p.openSchedule !== false
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
      let initialServiceValue = '';
      if (appointment?.service_id) initialServiceValue = `service-${appointment.service_id}`;
      else if (appointment?.package_id) initialServiceValue = `package-${appointment.package_id}`;
      else if (appointment?.salon_plan_id) initialServiceValue = `plan-${appointment.salon_plan_id}`;
      else initialServiceValue = appointment?.service || '';

      const initialTime = appointment?.time || initialData?.time || '';
      const initialDate = initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] :
        appointment?.date ? (appointment.date.includes('T') ? appointment.date.split('T')[0] : appointment.date) :
          new Date().toISOString().split('T')[0];

      setName(client?.name || '');
      setPhone(client?.phone || '');
      setService(initialServiceValue);

      const profIdToSelect = appointment?.professionalId || initialData?.professionalId;
      const initialProfName = initialData?.professionalName || '';

      if (professionalsToShow.length === 1) {
        setProfessional(professionalsToShow[0].name);
      } else if (profIdToSelect) {
        const found = professionalsToShow.find(p => String(p.id) === String(profIdToSelect));
        setProfessional(found ? found.name : initialProfName);
      } else {
        setProfessional(initialProfName);
      }

      setDate(initialDate);
      setTime(initialTime);
      setEndTime(appointment?.endTime || '');
    } else {
      // Reset on close
      setIsExiting(false);
      setName('');
      setPhone('');
      setSuggestions([]);
      setShowSuggestions(null);
      setService('');
      setProfessional('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('');
      setEndTime('');
    }
  }, [isOpen, client, appointment, initialData, professionalsToShow]);

  // Effect to calculate end time based on service and start time
  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && (appointment?.endTime || appointment?.end_time || (appointment as any)?.end_time)) {
      setEndTime(appointment?.endTime || (appointment as any)?.end_time);
      return;
    }

    if (service && time) {
      const [type, idStr] = service.split('-');
      const id = parseInt(idStr, 10);

      let selectedItem: any;
      if (type === 'service') selectedItem = contextServices.find(s => s.id === id);
      else if (type === 'package') selectedItem = contextPackages.find(p => p.id === id);
      else if (type === 'plan') selectedItem = contextSalonPlans.find(p => p.id === id);

      if (selectedItem) {
        const duration = parseInt(String(selectedItem.duration), 10) || 60;
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
    } else {
      setEndTime('');
    }
  }, [service, time, isOpen, isEditing, appointment]);

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
      const selectedProf = professionalsToShow.find(p => p.name === professional);
      if (!selectedProf) return;

      const [type, idStr] = service.split('-');
      const id = parseInt(idStr, 10);

      const payload: any = {
        clientName: name,
        clientPhone: phone,
        professionalId: selectedProf.id,
        date,
        time,
        endTime,
        is_complete_registration: false,
      };

      if (type === 'service') payload.serviceId = id;
      else if (type === 'package') payload.packageId = id;
      else if (type === 'plan') payload.salonPlanId = id;

      onQuickSchedule(payload);
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
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">{t('clientName')}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => {
                        const val = e.target.value;
                        setName(val);
                        if (val.length >= 2) {
                          const matches = contextClients.filter(c =>
                            (c.name || '').toLowerCase().includes(val.toLowerCase())
                          ).slice(0, 10); // More results
                          setSuggestions(matches);
                          setShowSuggestions('name');
                        } else {
                          setSuggestions([]);
                          setShowSuggestions(null);
                        }
                      }}
                      required
                      disabled={isEditing}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-700 disabled:text-white bg-white text-gray-900"
                      autoComplete="off"
                    />
                    {showSuggestions === 'name' && suggestions.length > 0 && (
                      <ul className="absolute z-[100] w-full bg-white border border-gray-200 rounded-md shadow-2xl mt-1 max-h-60 overflow-auto border-t-0 ring-1 ring-black ring-opacity-5">
                        {suggestions.map(c => (
                          <li
                            key={c.id}
                            className="p-2 hover:bg-primary/10 cursor-pointer text-gray-900 flex items-center gap-3"
                            onClick={() => {
                              setName(c.name);
                              setPhone(formatPhone(c.phone || ''));
                              setSuggestions([]);
                              setShowSuggestions(null);
                            }}
                          >
                            <img
                              src={c.photo_url || c.avatar || c.photo || 'https://via.placeholder.com/40?text=' + (c.name?.charAt(0) || 'C')}
                              alt={c.name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'Cliente')}&background=10b981&color=fff`;
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block truncate">{c.name}</span>
                              <span className="text-xs text-gray-500">{formatPhone(c.phone || '')}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => {
                        const val = formatPhone(e.target.value);
                        setPhone(val);
                        const cleanVal = val.replace(/\D/g, '');
                        if (cleanVal.length >= 3) {
                          const matches = contextClients.filter(c =>
                            (c.phone || '').replace(/\D/g, '').includes(cleanVal)
                          ).slice(0, 5);
                          setSuggestions(matches);
                          setShowSuggestions('phone');
                        } else {
                          setSuggestions([]);
                          setShowSuggestions(null);
                        }
                      }}
                      required
                      disabled={isEditing}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-700 disabled:text-white bg-white text-gray-900"
                      placeholder="(DD) XXXXX-XXXX"
                      autoComplete="off"
                    />
                    {showSuggestions === 'phone' && suggestions.length > 0 && (
                      <ul className="absolute z-[100] w-full bg-white border border-gray-200 rounded-md shadow-2xl mt-1 max-h-60 overflow-auto border-t-0 ring-1 ring-black ring-opacity-5">
                        {suggestions.map(c => (
                          <li
                            key={c.id}
                            className="p-2 hover:bg-primary/10 cursor-pointer text-gray-900 flex items-center gap-3"
                            onClick={() => {
                              setName(c.name);
                              setPhone(formatPhone(c.phone || ''));
                              setSuggestions([]);
                              setShowSuggestions(null);
                            }}
                          >
                            <img
                              src={c.photo_url || c.avatar || c.photo || 'https://via.placeholder.com/40?text=' + (c.name?.charAt(0) || 'C')}
                              alt={c.name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'Cliente')}&background=10b981&color=fff`;
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block truncate">{formatPhone(c.phone || '')}</span>
                              <span className="text-xs text-gray-500">{c.name}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('procedure')}</label>
                    <select value={service} onChange={e => setService(e.target.value)} required disabled={isEditing} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 disabled:bg-gray-100 disabled:opacity-70">
                      <option value="">Selecione...</option>

                      <optgroup label={t('services')}>
                        {contextServices
                          .filter(s =>
                            (!selectedUnitId || !s.unit_id || Number(s.unit_id) === Number(selectedUnitId)) &&
                            !s.suspended && s.active !== false
                          )
                          .map(s => (
                            <option key={`service-${s.id}`} value={`service-${s.id}`}>{s.name}</option>))}
                      </optgroup>

                      <optgroup label={t('packages')}>
                        {contextPackages
                          .filter(p =>
                            (!selectedUnitId || !p.unit_id || Number(p.unit_id) === Number(selectedUnitId)) &&
                            !p.suspended && p.active !== false && p.isActive !== false &&
                            (!p.usageType || p.usageType === 'Serviços')
                          )
                          .map(p => (
                            <option key={`package-${p.id}`} value={`package-${p.id}`}>{p.name}</option>))}
                      </optgroup>

                      <optgroup label={t('plans')}>
                        {contextSalonPlans
                          .filter(pl =>
                            (!selectedUnitId || !pl.unit_id || Number(pl.unit_id) === Number(selectedUnitId)) &&
                            !pl.suspended &&
                            (!pl.usageType || pl.usageType === 'Serviços')
                          )
                          .map(pl => (
                            <option key={`plan-${pl.id}`} value={`plan-${pl.id}`}>
                              {pl.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('professional')}</label>
                    <select value={professional} onChange={e => setProfessional(e.target.value)} required disabled={isEditing || professionalsToShow.length === 1} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 disabled:bg-gray-100 disabled:opacity-70">
                      <option value="">Selecione...</option>
                      {professionalsToShow.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name} {p.occupation ? `(${p.occupation})` : ''}
                        </option>
                      ))}
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
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:w-auto sm:text-sm ${client?.is_complete_registration === false
                    ? 'bg-orange-500 hover:bg-orange-600 animate-pulse'
                    : 'bg-primary hover:bg-primary-dark'
                  }`}
              >
                {client?.is_complete_registration === false
                  ? 'Finalizar Cadastro'
                  : (t('newClientRegistration') || 'Ver Cadastro')}
              </button>
            )}
            {isEditing && appointment?.id && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
                    if (onCancelAppointment) {
                      const success = await onCancelAppointment(appointment.id!);
                      if (success) {
                        handleClose();
                      } else {
                        alert('Erro ao cancelar agendamento.');
                      }
                    }
                  }
                }}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:w-auto sm:text-sm"
              >
                Cancelar Agendamento
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
