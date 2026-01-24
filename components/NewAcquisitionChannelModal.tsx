import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface AcquisitionChannel {
  id: number;
  name: string;
  duration: string;
  clients: number;
  investment?: number;
  suspended?: boolean;
}

interface NewAcquisitionChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; duration: string; investment: number }) => void;
  channelToEdit?: AcquisitionChannel | null;
}

const NewAcquisitionChannelModal: React.FC<NewAcquisitionChannelModalProps> = ({ isOpen, onClose, onSave, channelToEdit }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [investment, setInvestment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (channelToEdit) {
        setName(channelToEdit.name);
        setInvestment(String(channelToEdit.investment || ''));
        if (channelToEdit.duration.toLowerCase() === 'permanente') {
            setIsPermanent(true);
            setStartDate('');
            setEndDate('');
        } else {
            setIsPermanent(false);
            const parts = channelToEdit.duration.split(' a ');
            if (parts.length === 2) {
                const [startStr, endStr] = parts;
                const parseDate = (dateStr: string) => {
                    const dateParts = dateStr.split('/');
                    const day = dateParts[0];
                    const month = dateParts[1];
                    const year = dateParts.length > 2 ? dateParts[2] : new Date().getFullYear().toString();
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                };
                setStartDate(parseDate(startStr));
                setEndDate(parseDate(endStr));
            }
        }
      } else {
        setName('');
        setInvestment('');
        setStartDate('');
        setEndDate('');
        setIsPermanent(false);
      }
    }
  }, [isOpen, channelToEdit]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, preencha o nome da campanha.');
      return;
    }
    let durationString = t('permanent');
    if (!isPermanent) {
        if (!startDate || !endDate) {
            alert('Por favor, preencha as datas de início e fim.');
            return;
        }
        const formattedStartDate = new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR');
        const formattedEndDate = new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR');
        durationString = `${formattedStartDate} a ${formattedEndDate}`;
    }
    onSave({ name, duration: durationString, investment: Number(investment) || 0 });
    handleClose();
  };

  if (!isOpen && !isExiting) return null;
  const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';
  const title = channelToEdit ? 'Editar Canal de Aquisição' : t('newAcquisitionChannel');


  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`} onClick={handleClose}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all w-full max-w-lg ${animationClass}`} onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-secondary">{title}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="channel-name" className="block text-sm font-medium text-gray-700">Campanha de Aquisição</label>
                <input
                  id="channel-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Ex: Campanha de Dia das Mães no Instagram"
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  autoFocus
                />
              </div>

              <div className="flex items-center">
                <input
                    id="channel-permanent"
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => setIsPermanent(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="channel-permanent" className="ml-2 block text-sm text-gray-900">{t('permanentDuration')}</label>
              </div>

              <div>
                <label htmlFor="channel-investment" className="block text-sm font-medium text-gray-700">{t('investment')}</label>
                <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">R$</span>
                    </div>
                    <input
                        type="number"
                        name="investment"
                        id="channel-investment"
                        className="block w-full rounded-md border-gray-300 pl-7 pr-4 py-2 focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="0.00"
                        value={investment}
                        onChange={e => setInvestment(e.target.value)}
                        step="0.01"
                    />
                </div>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${isPermanent ? 'opacity-50' : 'opacity-100'}`}>
                <div>
                  <label htmlFor="channel-start-date" className="block text-sm font-medium text-gray-700">Data de Início</label>
                  <input
                    id="channel-start-date"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required={!isPermanent}
                    disabled={isPermanent}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="channel-end-date" className="block text-sm font-medium text-gray-700">Data de Fim</label>
                  <input
                    id="channel-end-date"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required={!isPermanent}
                    disabled={isPermanent}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">Salvar</button>
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAcquisitionChannelModal;