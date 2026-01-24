
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export interface Schedule {
  day: string;
  dayIndex: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface ScheduleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Schedule[]) => void;
  initialSchedule: Schedule[];
}

const ScheduleSettingsModal: React.FC<ScheduleSettingsModalProps> = ({ isOpen, onClose, onSave, initialSchedule }) => {
  const { t } = useLanguage();
  const [isExiting, setIsExiting] = useState(false);
  const [schedule, setSchedule] = useState<Schedule[]>([]);

  const dayNames = [
    t('daySunday'), t('dayMonday'), t('dayTuesday'), t('dayWednesday'),
    t('dayThursday'), t('dayFriday'), t('daySaturday')
  ];

  useEffect(() => {
    if (isOpen) {
      if (initialSchedule && initialSchedule.length > 0) {
        setSchedule(initialSchedule);
      } else {
        setSchedule(dayNames.map((day, index) => ({
          day: day,
          dayIndex: index,
          enabled: index >= 1 && index <= 5, // Default Mon-Fri enabled
          startTime: '09:00',
          endTime: '18:00'
        })));
      }
    }
  }, [isOpen, initialSchedule, t]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleScheduleChange = (index: number, field: keyof Schedule, value: any) => {
    const newSchedule = [...schedule];
    (newSchedule[index] as any)[field] = value;
    setSchedule(newSchedule);
  };

  const handleSave = () => {
    onSave(schedule);
    handleClose();
  };
  
  if (!isOpen && !isExiting) return null;
  const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 bg-gray-500 bg-opacity-75`} onClick={handleClose}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all w-full max-w-xl ${animationClass}`} onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-secondary">Configurar Horários de Disparo</h3>
          <p className="text-sm text-gray-500 mb-4">Defina os dias e horários em que as campanhas automáticas podem ser enviadas.</p>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {schedule.map((dayConfig, index) => (
              <div key={index} className={`p-3 rounded-lg border ${dayConfig.enabled ? 'bg-light' : 'bg-gray-100 opacity-70'}`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayConfig.enabled}
                      onChange={e => handleScheduleChange(index, 'enabled', e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="ml-3 font-medium text-gray-800">{dayConfig.day}</span>
                  </label>
                </div>
                {dayConfig.enabled && (
                  <div className="grid grid-cols-2 gap-4 mt-3 pl-7 animate-fade-in">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">De</label>
                      <input
                        type="time"
                        value={dayConfig.startTime}
                        onChange={e => handleScheduleChange(index, 'startTime', e.target.value)}
                        className="mt-1 w-full p-1 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Até</label>
                      <input
                        type="time"
                        value={dayConfig.endTime}
                        onChange={e => handleScheduleChange(index, 'endTime', e.target.value)}
                        className="mt-1 w-full p-1 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-md">Salvar Horários</button>
          <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSettingsModal;
