
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Professional {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
}

interface BlockTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blockData: { professionalId: number; date: string; startTime: string; endTime: string; reason: string; unit: string }) => void;
  professionals: Professional[];
  currentDate: Date;
  units: Unit[];
}

const BlockTimeModal: React.FC<BlockTimeModalProps> = ({ isOpen, onClose, onSave, professionals, currentDate, units }) => {
  const { t } = useLanguage();
  const [professionalId, setProfessionalId] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [unit, setUnit] = useState<string>('all');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal is closed
      setProfessionalId('');
      setStartTime('');
      setEndTime('');
      setReason('');
      setUnit('all');
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalId || !startTime || !endTime || !reason) {
        alert(t('fillAllFields'));
        return;
    }
    if (startTime >= endTime) {
        alert(t('endTimeAfterStartTime'));
        return;
    }
    onSave({
      professionalId: Number(professionalId),
      date: currentDate.toISOString().split('T')[0],
      startTime,
      endTime,
      reason,
      unit,
    });
    handleClose();
  };

  if (!isOpen && !isExiting) return null;
  const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl transform transition-all max-w-lg w-full ${animationClass}`}
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-secondary">{t('blockTimeTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('blockTimeSubtitle')}</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="professional" className="block text-sm font-medium text-gray-700">{t('professional')}</label>
                <select id="professional" value={professionalId} onChange={e => setProfessionalId(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                  <option value="">{t('select')}...</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">{t('blockTimeApplyTo')}</label>
                <select id="unit" value={unit} onChange={e => setUnit(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                  <option value="all">{t('allUnits')}</option>
                  {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">{t('startTime')}</label>
                  <input type="time" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">{t('endTime')}</label>
                  <input type="time" id="endTime" value={endTime} onChange={e => setEndTime(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                </div>
              </div>
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">{t('reason')}</label>
                <input type="text" id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder={t('reasonPlaceholder')} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">{t('saveBlock')}</button>
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2">{t('cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlockTimeModal;
