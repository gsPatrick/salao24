

import React, { useState, useMemo, useRef, useEffect } from 'react';
// FIX: Changed to a named import to resolve module resolution error.
import { NewClientModal } from './NewClientModal';
import PreRegistrationModal from './PreRegistrationModal';
import BlockTimeModal from './BlockTimeModal';
import SchedulingLinkModal from './SchedulingLinkModal'; // New Import
import ReassignAppointmentModal from './ReassignAppointmentModal';
import ProfessionalColumn from './ProfessionalColumn';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';


// --- Mock Data ---

const formatDateForLookup = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Interfaces ---
interface User {
  name: string;
  email: string;
  avatarUrl: string;
  role?: 'admin' | 'gerente' | 'concierge' | 'profissional';
}
interface GeneralAgendaPageProps {
  onBack?: () => void;
  currentUser?: User | null;
  isIndividualPlan: boolean;
  professionals?: any[];
  onComingSoon?: (featureName: string) => void;
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
  [key: string]: any;
}

interface Notification {
  id: number;
  message: string;
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

const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const QRCodeIcon = () => (
  <svg className="w-full h-full text-secondary" fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <path d="M48 48h64v64H48zM64 64v32h32V64z" />
    <path d="M144 48h64v64h-64zM160 64v32h32V64z" />
    <path d="M48 144h64v64H48zM64 160v32h32v-32z" />
    <path d="M144 144h16v16h-16zM176 144h16v16h-16zM208 144h16v16h-16zM144 176h16v16h-16zM176 176h16v16h-16zM208 176h16v16h-16zM144 208h16v16h-16zM176 208h16v16h-16zM208 208h16v16h-16z" opacity="0.8" />
  </svg>
);
const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;


const GeneralAgendaPage: React.FC<GeneralAgendaPageProps> = ({ onBack, currentUser, isIndividualPlan, professionals: propProfessionals, onComingSoon }) => {
  const { t } = useLanguage();
  const { appointments: contextAppointments, professionals: contextProfessionals, services: contextServices, clients: contextClients, units: contextUnits, saveAppointment, updateAppointmentStatus, saveClient, refreshAppointments } = useData();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isPreRegModalOpen, setIsPreRegModalOpen] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('all');

  // State for blocking time
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blocks, setBlocks] = useState<TimeBlock[]>([
    { id: 101, professionalId: 2, date: '2024-10-28', startTime: '12:00', endTime: '13:00', reason: 'Almoço', unit: 'all' },
    { id: 102, professionalId: 1, date: '2024-10-28', startTime: '15:00', endTime: '16:00', reason: 'Médico', unit: 'Unidade Matriz' },
  ]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false); // New State
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isQrGenerated, setIsQrGenerated] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // State for reassigning appointment
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [appointmentToReassign, setAppointmentToReassign] = useState<Appointment | null>(null);

  // State for drag and drop
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<number | null>(null);
  const [dragOverProfessionalId, setDragOverProfessionalId] = useState<number | null>(null);

  // State for client modals
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);

  // New states for calendar picker and new appointments
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarPickerMonth, setCalendarPickerMonth] = useState(currentDate);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [preRegInitialData, setPreRegInitialData] = useState<any>(null);

  const canDragAndDrop = currentUser && ['admin', 'gerente', 'concierge'].includes(currentUser.role || '');

  useEffect(() => {
    setCalendarPickerMonth(currentDate);
  }, [currentDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [calendarRef]);

  const professionalsToDisplay = useMemo(() => {
    // Usar os profissionais passados como prop, ou fallback para contextProfessionals
    const availableProfessionals = propProfessionals || contextProfessionals;

    // Filtrar apenas profissionais ativos (não suspensos e não arquivados)
    const activeProfessionals = availableProfessionals.filter(p =>
      !p.suspended && !p.archived
    );

    let baseProfessionals;
    if (isIndividualPlan && currentUser) {
      const userProfessional = activeProfessionals.find(p => p.email === currentUser.email);
      baseProfessionals = userProfessional ? activeProfessionals.filter(p => p.id === userProfessional.id) : [];
    } else {
      baseProfessionals = activeProfessionals;
    }

    if (selectedProfessionalId === 'all') {
      return baseProfessionals;
    }

    return baseProfessionals.filter(p => String(p.id) === selectedProfessionalId);
  }, [isIndividualPlan, currentUser, selectedProfessionalId, propProfessionals, contextProfessionals]);


  const handleDragStart = (e: React.DragEvent, appointmentId: number) => {
    e.dataTransfer.setData('appointmentId', String(appointmentId));
    setDraggedAppointmentId(appointmentId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, professionalId: number) => {
    e.preventDefault();
    const appointment = contextAppointments.find(a => a.id === draggedAppointmentId);
    if (appointment && appointment.professionalId !== professionalId) {
      setDragOverProfessionalId(professionalId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverProfessionalId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetProfessionalId: number) => {
    e.preventDefault();
    const appointmentId = Number(e.dataTransfer.getData('appointmentId'));
    const appointment = contextAppointments.find(a => a.id === appointmentId);

    if (appointment && appointment.professionalId !== targetProfessionalId) {
      await saveAppointment({ ...appointment, professionalId: targetProfessionalId });
    }
    handleDragEnd();
  };

  const handleDragEnd = () => {
    setDraggedAppointmentId(null);
    setDragOverProfessionalId(null);
  };

  const handleStatusChange = async (appointmentId: number, newStatus: AppointmentStatus) => {
    const targetAppointment = contextAppointments.find(appt => appt.id === appointmentId);

    if (targetAppointment && newStatus === 'Em Espera') {
      const client = contextClients.find(c => c.id === targetAppointment.clientId);
      const professional = contextProfessionals.find(p => p.id === targetAppointment.professionalId);
      if (client && professional) {
        const newNotification: Notification = {
          id: Date.now(),
          message: `${client.name} está aguardando por ${professional.name}.`,
        };
        setNotifications(prev => [...prev, newNotification]);
      }
    }

    await updateAppointmentStatus(appointmentId, newStatus);
  };

  const handleSaveBlock = (blockData: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = {
      id: Date.now(),
      ...blockData,
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const handleDeleteBlock = (blockId: number) => {
    if (window.confirm('Tem certeza que deseja remover este bloqueio?')) {
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    }
  };

  const handleOpenReassignModal = (appointment: Appointment) => {
    setAppointmentToReassign(appointment);
    setIsReassignModalOpen(true);
  };

  const handleSaveReassignment = async (appointmentId: number, newProfessionalId: number, newDate: string, newTime: string) => {
    const appt = contextAppointments.find(a => a.id === appointmentId);
    if (appt) {
      await saveAppointment({ ...appt, professionalId: newProfessionalId, date: newDate, time: newTime });
    }
    setIsReassignModalOpen(false);
  };

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleCardClick = (appointment: Appointment) => {
    setPreRegInitialData(null);
    setSelectedAppointment(appointment);
    setIsPreRegModalOpen(true);
  };

  const handleOpenNewAppointment = (professional: any, time: string) => {
    setSelectedAppointment(null);
    setPreRegInitialData({
      professionalId: professional.id,
      professionalName: professional.name,
      date: currentDate,
      time: time,
    });
    setIsPreRegModalOpen(true);
  };

  const handleQuickSchedule = async (payload: {
    clientName: string;
    clientPhone: string;
    serviceName: string;
    professionalName: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
  }) => {
    const professional = contextProfessionals.find(p => p.name === payload.professionalName);
    const targetProfessionalId = professional ? professional.id : contextProfessionals[0]?.id || 1;

    // 1) Find or Create Client
    let client = contextClients.find(c => c.name === payload.clientName || c.phone === payload.clientPhone);
    if (!client) {
      client = await saveClient({
        name: payload.clientName,
        phone: payload.clientPhone,
        howTheyFoundUs: 'Agendamento Rápido',
        registrationDate: new Date().toISOString(),
      }) as any;
    }

    if (client && client.id) {
      // 2) Create Appointment
      await saveAppointment({
        clientId: client.id,
        professionalId: targetProfessionalId,
        date: payload.date,
        time: payload.time,
        service: payload.serviceName,
        status: 'Agendado',
      });
    }
  };


  const handleOpenFullRegistration = () => {
    const client = selectedAppointment ? contextClients.find(c => c.id === selectedAppointment.clientId) : undefined;
    if (client) {
      setClientToEdit(client);
      setIsPreRegModalOpen(false);
      setIsNewClientModalOpen(true);
    }
  };

  const handleSaveNewClient = async (clientData: any) => {
    await saveClient({
      ...clientData,
      registrationDate: clientData.registrationDate || new Date().toISOString(),
    });
    setIsNewClientModalOpen(false);
    setClientToEdit(null);
  };

  const handleNav = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const amount = direction === 'prev' ? -1 : 1;
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + amount);
    if (viewMode === 'week') newDate.setDate(newDate.getDate() + (amount * 7));
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + amount);
    setCurrentDate(newDate);
  };

  const handleCloseCheckinModal = () => {
    setIsCheckinModalOpen(false);
    setIsQrGenerated(false);
  };

  const handleDownloadQRCode = () => {
    const svgElement = qrCodeRef.current?.querySelector('svg');
    if (!svgElement) {
      alert('Não foi possível encontrar o QR Code para download.');
      return;
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'QRCode_Checkin_Salao24h.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const getHeaderText = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    }
    if (viewMode === 'week') {
      const start = new Date(currentDate);
      const dayOfWeek = start.getDay();
      const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('pt-BR', { day: '2-digit' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`;
    }
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    return '';
  };

  const renderCalendarPicker = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = calendarPickerMonth.getFullYear();
    const month = calendarPickerMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    const calendarDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = currentDate.toDateString() === date.toDateString();
      const isToday = today.toDateString() === date.toDateString();

      let buttonClasses = "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50";
      if (isSelected) {
        buttonClasses += " bg-primary text-white font-bold shadow-lg";
      } else if (isToday) {
        buttonClasses += " bg-primary/10 text-primary font-bold";
      } else {
        buttonClasses += " hover:bg-gray-100 text-secondary";
      }

      calendarDays.push(
        <button
          type="button"
          key={day}
          onClick={() => {
            setCurrentDate(date);
            setIsCalendarOpen(false);
          }}
          className={buttonClasses}
        >
          {day}
        </button>
      );
    }

    const monthName = calendarPickerMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border">
        <div className="flex justify-between items-center mb-4">
          <button type="button" onClick={() => setCalendarPickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-secondary">&larr;</button>
          <h3 className="font-bold capitalize text-secondary">{monthName}</h3>
          <button type="button" onClick={() => setCalendarPickerMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-secondary">&rarr;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2 font-semibold">
          <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
        </div>
        <div className="grid grid-cols-7 gap-1 justify-items-center">
          {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {calendarDays}
        </div>
      </div>
    )
  };

  const renderAgendaContent = () => {
    const dateKey = formatDateForLookup(currentDate);
    const appointmentsForDay = contextAppointments.filter(a => {
      const apptDate = a.date.includes('T') ? a.date.split('T')[0] : a.date;
      return apptDate === dateKey;
    }); // Using contextAppointments
    const blocksForDay = blocks.filter(b => b.date === dateKey);

    if (viewMode === 'day') {
      return (
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {professionalsToDisplay.map(prof => (
            <ProfessionalColumn
              key={prof.id}
              professional={prof}
              appointments={appointmentsForDay.filter(a => a.professionalId === prof.id)}
              blocks={blocksForDay.filter(b => b.professionalId === prof.id && (b.unit === 'all' || b.unit === prof.unit))}
              onStatusChange={handleStatusChange}
              onCardClick={handleCardClick}
              onDeleteBlock={handleDeleteBlock}
              currentUser={currentUser || null}
              onReassignClick={handleOpenReassignModal}
              isDropTarget={dragOverProfessionalId === prof.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, prof.id)}
              onDragEnter={(e) => handleDragEnter(e, prof.id)}
              onDragLeave={handleDragLeave}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              isDraggable={canDragAndDrop}
              draggedAppointmentId={draggedAppointmentId}
              onOpenNewAppointment={handleOpenNewAppointment}
            />
          ))}
        </div>
      );
    }
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      return (
        <div className="overflow-x-auto pb-4">
          <div className="grid grid-cols-7 gap-2 min-w-[70rem]">
            {Array.from({ length: 7 }).map((_, i) => {
              const day = new Date(startOfWeek);
              day.setDate(startOfWeek.getDate() + i);
              const dayDateKey = formatDateForLookup(day);
              const appointmentsForDay = contextAppointments.filter(a => a.date === dayDateKey); // Using contextAppointments
              return (
                <div key={i} className="bg-light p-3 rounded-lg w-full">
                  <p className="font-bold text-center text-secondary">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                  <p className="text-sm text-center text-gray-500 mb-3">{day.getDate()}</p>
                  <div className="space-y-3">
                    {appointmentsForDay.length > 0 ? (
                      appointmentsForDay.sort((a, b) => a.time.localeCompare(b.time)).map((appt) => {
                        const prof = contextProfessionals.find(p => p.id === appt.professionalId);
                        return (
                          <div key={appt.id} className="bg-white p-2 rounded shadow text-xs" title={`${appt.service} com ${prof?.name}`}>
                            <p className="font-semibold text-primary">{appt.time}</p>
                            <p className="text-gray-600 truncate">{contextClients.find(c => c.id === appt.clientId)?.name}</p>
                            <p className="text-gray-400 truncate text-[10px]">{prof?.name.split(' ')[0]}</p>
                          </div>
                        );
                      })
                    ) : <p className="text-xs text-center text-gray-400 pt-4">Vazio</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      return (
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-7 gap-1 bg-light p-2 rounded-lg min-w-[320px]">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="text-center font-bold text-secondary text-sm">{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
            {Array.from({ length: daysInMonth }).map((_, day) => {
              const date = new Date(year, month, day + 1);
              const dayDateKey = formatDateForLookup(date);
              const appointmentsForDay = contextAppointments.filter(a => a.date === dayDateKey); // Using contextAppointments
              return (
                <div key={day} className="bg-white p-2 rounded h-28 overflow-y-auto">
                  <p className="font-bold text-gray-700">{day + 1}</p>
                  {appointmentsForDay.map((appt) => {
                    const prof = contextProfessionals.find(p => p.id === appt.professionalId);
                    return (
                      <div key={appt.id} className="bg-primary/10 text-primary text-xs p-1 rounded mt-1 truncate" title={`${appt.time} - ${contextClients.find(c => c.id === appt.clientId)?.name} com ${prof?.name}`}>
                        {appt.time}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  const selectedClient = selectedAppointment ? contextClients.find(c => c.id === selectedAppointment.clientId) : undefined;

  const mockAcquisitionChannels = [
    { id: 1, name: 'Indicação' },
    { id: 2, name: 'Instagram' },
    { id: 3, name: 'Facebook' },
    { id: 4, name: 'Google' },
    { id: 5, name: 'Passou em frente' },
  ];

  return (
    <>
      <div className="container mx-auto px-6 py-8">
        {onBack && (
          <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Voltar ao Dashboard
          </button>
        )}

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-2">Agenda Geral</h1>
              <p className="text-gray-500">Visão completa dos agendamentos de todos os profissionais.</p>
            </div>
            {!isIndividualPlan && (
              <div className="mt-4 sm:mt-0">
                <label htmlFor="professional-filter" className="block text-sm font-medium text-gray-700">Filtrar por Profissional</label>
                <select
                  id="professional-filter"
                  value={selectedProfessionalId}
                  onChange={(e) => setSelectedProfessionalId(e.target.value)}
                  className="mt-1 block w-full max-w-xs p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="all">Todos os Profissionais</option>
                  {(propProfessionals || contextProfessionals).filter(p => !p.suspended && !p.archived).map(prof => <option key={prof.id} value={prof.id}>{prof.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Header with Toggles and Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 p-4 bg-light rounded-lg mb-6">
            <div className="flex items-center bg-gray-200 p-1 rounded-full overflow-x-auto">
              {(['day', 'week', 'month'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-1 text-sm font-semibold rounded-full capitalize transition-colors duration-200 flex-shrink-0 ${viewMode === mode ? 'bg-primary text-white shadow' : 'text-gray-600'}`}>
                  {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
            <div className="flex items-center">
              <button onClick={() => handleNav('prev')} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="relative" ref={calendarRef}>
                <button type="button" onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="text-lg font-bold text-secondary text-center w-48 sm:w-64 capitalize px-2 py-1 rounded-md hover:bg-gray-200 transition-colors" title="Clique para abrir o calendário">
                  {getHeaderText()}
                </button>
                {isCalendarOpen && (
                  <div className="absolute top-full mt-2 z-20 left-1/2 -translate-x-1/2">
                    {renderCalendarPicker()}
                  </div>
                )}
              </div>
              <button onClick={() => handleNav('next')} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="ml-2 px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                Hoje
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="relative group">
                <button onClick={() => { setSelectedAppointment(null); setPreRegInitialData(null); setIsPreRegModalOpen(true); }} className="p-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow transition-all flex items-center transform hover:scale-110">
                  <UserPlusIcon />
                </button>
                <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                  {t('preRegistration')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                </div>
              </div>
              <div className="relative group">
                <button onClick={() => setIsBlockModalOpen(true)} className="p-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow transition-all flex items-center transform hover:scale-110">
                  <LockIcon />
                </button>
                <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                  Bloquear Horário
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                </div>
              </div>
              <div className="relative group">
                <button onClick={() => setIsLinkModalOpen(true)} className="p-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow transition-all flex items-center transform hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367-2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
                </button>
                <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                  Compartilhar Link
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                </div>
              </div>
              <div className="relative group">
                <button onClick={() => setIsCheckinModalOpen(true)} className="p-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow transition-all flex items-center transform hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 5h3v3H5V5zm0 7h3v3H5v-3zM12 5h3v3h-3V5zm0 7h3v3h-3v-3z" />
                    <path fillRule="evenodd" d="M2 3a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm2 2v1h2V5H4zM2 13a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H3a1 1 0 01-1-1v-4zm2 2v1h2v-1H4zm10-12a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V3a1 1 0 00-1-1h-4zm-1 2v1h2V5h-2zm-1 8a1 1 0 011-1h4a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                  {t('checkinButton')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {renderAgendaContent()}
        </div>

      </div>
      {/* Modals */}
      <PreRegistrationModal
        isOpen={isPreRegModalOpen}
        onClose={() => { setIsPreRegModalOpen(false); setSelectedAppointment(null); setPreRegInitialData(null); }}
        onCompleteRegistration={handleOpenFullRegistration}
        client={selectedClient}
        appointment={selectedAppointment ? { service: selectedAppointment.service, time: selectedAppointment.time } : undefined}
        initialData={preRegInitialData}
        isIndividualPlan={isIndividualPlan}
        currentUser={currentUser}
        onQuickSchedule={handleQuickSchedule}
        availableProfessionals={propProfessionals || contextProfessionals}
      />
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => { setIsNewClientModalOpen(false); setClientToEdit(null); }}
        onSave={handleSaveNewClient}
        existingClients={contextClients}
        clientToEdit={clientToEdit}
        acquisitionChannels={mockAcquisitionChannels}
        onComingSoon={onComingSoon}
      />
      <BlockTimeModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        onSave={handleSaveBlock}
        professionals={propProfessionals || contextProfessionals}
        currentDate={currentDate}
        units={contextUnits}
      />
      <SchedulingLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
      />
      <ReassignAppointmentModal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        onSave={handleSaveReassignment}
        appointment={appointmentToReassign}
        professionals={propProfessionals || contextProfessionals}
        clients={contextClients}
        appointments={contextAppointments}
      />
      {isCheckinModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 bg-gray-500 bg-opacity-75"
          onClick={handleCloseCheckinModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl transform transition-all max-w-lg w-full p-6 text-center animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-secondary">{t('checkinTitle')}</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">{t('checkinDesc')}</p>

            <div className="min-h-[256px] flex items-center justify-center">
              {isQrGenerated ? (
                <div ref={qrCodeRef} className="w-64 h-64 mx-auto bg-white p-4 rounded-lg shadow-inner border animate-fade-in">
                  <QRCodeIcon />
                </div>
              ) : (
                <button
                  onClick={() => setIsQrGenerated(true)}
                  className="py-3 px-8 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-transform transform hover:scale-105"
                >
                  {t('generateQRCode')}
                </button>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              {isQrGenerated && (
                <button
                  onClick={handleDownloadQRCode}
                  className="py-2 px-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 animate-fade-in"
                >
                  {t('downloadPNG')}
                </button>
              )}
              <button
                onClick={handleCloseCheckinModal}
                className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
        {notifications.map(notification => (
          <div
            key={notification.id}
            onClick={() => dismissNotification(notification.id)}
            className="bg-yellow-400 text-black p-4 rounded-lg shadow-xl cursor-pointer flex items-center animate-bounce-in max-w-sm"
            role="alert"
            aria-live="assertive"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="font-semibold">{notification.message}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default GeneralAgendaPage;
