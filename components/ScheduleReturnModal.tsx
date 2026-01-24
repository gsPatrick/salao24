
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';

const generateTimeSlots = (duration: number) => {
  const slots = [];
  let currentTime = new Date();
  currentTime.setHours(9, 0, 0, 0);
  const endTime = new Date();
  endTime.setHours(18, 0, 0, 0);
  const busySlots = ['10:30', '14:00', '16:30'];

  while (currentTime.getTime() + duration * 60000 <= endTime.getTime()) {
    const timeString = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (!busySlots.includes(timeString)) {
      slots.push(timeString);
    }
    currentTime = new Date(currentTime.getTime() + 30 * 60000);
  }
  return slots;
};

interface ScheduleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any | null;
  professional: any | null;
  onSchedule: (appointment: { service: string; date: Date; time: string; }) => void;
}

const ScheduleReturnModal: React.FC<ScheduleReturnModalProps> = ({ isOpen, onClose, client, professional, onSchedule }) => {
  const { services: contextServices } = useData();
  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedServiceId(null);
      setSelectedDate(new Date());
      setSelectedTime(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleSave = () => {
    const service = contextServices.find(s => s.id === selectedServiceId);
    if (service && selectedTime) {
      onSchedule({
        service: service.name,
        date: selectedDate,
        time: selectedTime,
      });
    }
  };

  const selectedService = contextServices.find(s => s.id === selectedServiceId);
  const timeSlots = selectedService ? generateTimeSlots(parseInt(selectedService.duration, 10)) : [];

  if (!isOpen && !isExiting) return null;
  if (!client || !professional) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-xl ${isOpen && !isExiting ? 'scale-100' : 'scale-95'}`}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-secondary">Agendar Retorno</h3>
          <div className="flex items-center gap-4 p-3 my-4 bg-light rounded-lg">
            <img src={client.avatar} alt={client.name} className="w-12 h-12 rounded-full" />
            <div>
              <p className="font-semibold text-secondary">{client.name}</p>
              <p className="text-sm text-gray-500">Agendando com: <span className="font-medium text-primary">{professional.name}</span></p>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <h4 className="font-semibold text-gray-700">1. Selecione o serviço</h4>
              {contextServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedServiceId(service.id);
                    setStep(2);
                  }}
                  className="w-full text-left p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  {service.name} <span className="text-sm text-gray-500">({service.duration} min)</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="text-sm font-semibold text-primary">&larr; Voltar para serviços</button>
              <h4 className="font-semibold text-gray-700">2. Selecione a data e hora para <span className="text-primary">{selectedService?.name}</span></h4>

              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                className="w-full p-2 border rounded-md"
              />

              <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-light rounded-lg">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 rounded-lg font-semibold transition-colors ${selectedTime === time ? 'bg-primary text-white' : 'bg-white hover:bg-gray-200 text-primary'}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
          {step === 2 && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedTime}
              className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400"
            >
              Confirmar Agendamento
            </button>
          )}
          <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleReturnModal;
