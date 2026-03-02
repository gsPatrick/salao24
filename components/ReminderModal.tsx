import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: { subject: string; text: string; dateTime: string }) => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSave }) => {
  const { t } = useLanguage();
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setSubject('');
      setText('');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for timezone for datetime-local
      setDateTime(now.toISOString().slice(0, 16));
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
    if (!subject || !text || !dateTime) {
      alert(t('fillAllFields'));
      return;
    }
    onSave({ subject, text, dateTime });
    handleClose();
  };

  if (!isOpen && !isExiting) return null;

  const animationClass = isOpen && !isExiting ? 'animate-bounce-in' : 'opacity-0 scale-95';

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}
      aria-labelledby="reminder-modal-title"
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
            <h3 className="text-xl font-bold text-secondary" id="reminder-modal-title">{t('createReminder')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('createReminderDesc')}</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="reminder-subject" className="block text-sm font-medium text-gray-700">{t('reminderSubject')}</label>
                <input
                  type="text"
                  id="reminder-subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="reminder-text" className="block text-sm font-medium text-gray-700">{t('reminderText')}</label>
                <textarea
                  id="reminder-text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  required
                  rows={4}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="reminder-datetime" className="block text-sm font-medium text-gray-700">{t('reminderDateTime')}</label>
                <input
                  type="datetime-local"
                  id="reminder-datetime"
                  value={dateTime}
                  onChange={e => setDateTime(e.target.value)}
                  required
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">{t('saveReminder')}</button>
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2">{t('cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;