
import React, { useState, useEffect } from 'react';

// Interfaces
interface Professional { id: number; name: string; workingDays?: number[] }
interface Appointment { id: number; professionalId: number; clientId: number; service: string; time: string; date: string; }
interface Client { id: number; name: string; }

interface ReassignAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointmentId: number, newProfessionalId: number, newDate: string, newTime: string) => void;
  appointment: Appointment | null;
  professionals: Professional[];
  clients: Client[];
  appointments: Appointment[];
}

const generateTimeSlots = (duration: number, date: Date, professionalId: string, allAppointments: Appointment[]) => {
    const slots = [];
    if (!professionalId) return slots; // Return empty if no professional is selected

    let currentTime = new Date(date);
    currentTime.setHours(9, 0, 0, 0); 
    const endTime = new Date(date);
    endTime.setHours(18, 0, 0, 0); 
    
    const dateKey = date.toISOString().split('T')[0];
    const busySlots = allAppointments
        .filter(a => String(a.professionalId) === professionalId && a.date === dateKey)
        .map(a => a.time);
    
    // Don't show past time slots for today
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        while (currentTime.getHours() < now.getHours() || (currentTime.getHours() === now.getHours() && currentTime.getMinutes() < now.getMinutes())) {
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
    }

    while (currentTime.getTime() + duration * 60000 <= endTime.getTime()) {
        const timeString = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        if (!busySlots.includes(timeString)) {
           slots.push(timeString);
        }
        currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }
    return slots;
};


const ReassignAppointmentModal: React.FC<ReassignAppointmentModalProps> = ({ isOpen, onClose, onSave, appointment, professionals, clients, appointments }) => {
  const [newProfessionalId, setNewProfessionalId] = useState<string>('');
  const [isExiting, setIsExiting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);


  useEffect(() => {
    if (isOpen && appointment) {
      const initialDate = new Date(appointment.date + 'T00:00:00');
      setNewProfessionalId('');
      setSelectedDate(initialDate);
      setSelectedTime(null);
    }
  }, [isOpen, appointment]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (appointment && newProfessionalId && selectedTime) {
      onSave(appointment.id, Number(newProfessionalId), selectedDate.toISOString().split('T')[0], selectedTime);
    }
  };
  
  if (!isOpen && !isExiting) return null;
  if (!appointment) return null;
  
  const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';

  const client = clients.find(c => c.id === appointment.clientId);
  const currentProfessional = professionals.find(p => p.id === appointment.professionalId);
  const availableProfessionals = professionals.filter(p => p.id !== appointment.professionalId);
  const timeSlots = newProfessionalId ? generateTimeSlots(60, selectedDate, newProfessionalId, appointments) : [];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl transform transition-all max-w-xl w-full flex flex-col max-h-[90vh] ${animationClass}`}
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b flex-shrink-0">
                <h3 className="text-xl font-bold text-secondary">Reatribuir Agendamento</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">Mova o agendamento para outro profissional, data e hora.</p>
                <div className="space-y-3 bg-light p-4 rounded-lg">
                    <p><span className="font-semibold text-gray-600">Cliente:</span> <span className="font-medium text-gray-600">{client?.name}</span></p>
                    <p><span className="font-semibold text-gray-600">Serviço:</span> <span className="font-medium text-gray-600">{appointment.service}</span></p>
                    <p><span className="font-semibold text-gray-600">Horário Atual:</span> <span className="font-medium text-gray-600">{new Date(appointment.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {appointment.time}</span></p>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 flex-grow overflow-y-auto">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">De:</label>
                            <input type="text" value={currentProfessional?.name || ''} disabled className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600" />
                        </div>
                        <div>
                            <label htmlFor="newProfessional" className="block text-sm font-medium text-gray-700">Para:</label>
                            <select id="newProfessional" value={newProfessionalId} onChange={e => { setNewProfessionalId(e.target.value); setSelectedTime(null); }} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            <option value="">Selecione um novo profissional...</option>
                            {availableProfessionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {newProfessionalId && (
                    <div className="mt-4 pt-4 border-t animate-fade-in space-y-4">
                        <h4 className="font-semibold text-gray-700">2. Selecione a nova data e hora</h4>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="new-date-reassign" className="block text-sm font-medium text-gray-700">Nova Data</label>
                                <input
                                    type="date"
                                    id="new-date-reassign"
                                    value={selectedDate.toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        // Using T00:00:00 to avoid timezone issues where it might become the previous day
                                        setSelectedDate(new Date(e.target.value + 'T00:00:00'));
                                        setSelectedTime(null);
                                    }}
                                    required
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                />
                            </div>
                            <div>
                                <h3 className="text-md font-bold text-center text-secondary mb-2">
                                    Horários para <span className="text-primary">{selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-light rounded-lg">
                                    {timeSlots.length > 0 ? (
                                        timeSlots.map(time => (
                                            <button 
                                                key={time} 
                                                type="button"
                                                onClick={() => setSelectedTime(time)} 
                                                className={`p-2 rounded-lg font-semibold transition-colors ${selectedTime === time ? 'bg-primary text-white' : 'bg-white hover:bg-gray-200 text-primary'}`}
                                            >
                                                {time}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="col-span-full text-center text-gray-500 py-4">Nenhum horário disponível para este dia.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selectedTime && (
                            <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                                <p className="font-semibold text-green-800">Novo Agendamento:</p>
                                <p className="text-sm text-green-700">
                                    {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às <strong>{selectedTime}</strong> com <strong>{professionals.find(p => p.id === Number(newProfessionalId))?.name}</strong>
                                </p>
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg border-t flex-shrink-0">
                <button type="submit" disabled={!newProfessionalId || !selectedTime} className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                Confirmar Reatribuição
                </button>
                <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2">Cancelar</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ReassignAppointmentModal;
