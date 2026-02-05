import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: any) => void;
  transactionType: 'receita' | 'despesa';
  currentUnit: string;
  transactionToEdit?: any | null;
}

const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ isOpen, onClose, onSave, transactionType, currentUnit, transactionToEdit }) => {
  const { t } = useLanguage();
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Pago' | 'Pendente'>('Pago');
  const [billAttachment, setBillAttachment] = useState<File | null>(null);
  const [receiptAttachment, setReceiptAttachment] = useState<File | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!description.trim()) {
      newErrors.description = t('errorRequired');
    }
    if (!value.trim()) {
      newErrors.value = t('errorRequired');
    } else if (!/^\d+([,.]\d{1,2})?$/.test(value)) {
      newErrors.value = t('errorInvalidCurrency');
    }
    return newErrors;
  };

  const isFormValid = useMemo(() => {
    return description.trim() && value.trim() && /^\d+([,.]\d{1,2})?$/.test(value);
  }, [description, value]);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setDescription(transactionToEdit.description || '');
        setValue(transactionToEdit.amount ? transactionToEdit.amount.toString().replace('.', ',') : '');
        setDate(transactionToEdit.date ? new Date(transactionToEdit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setStatus(transactionToEdit.status || 'Pago');
        // Attachments cannot be pre-filled as File objects from URL easily, so we leave them null or handle differently if needed.
        // For now, user re-uploads if they want to change.
        setBillAttachment(null);
        setReceiptAttachment(null);
      } else {
        setDescription('');
        setValue('');
        setDate(new Date().toISOString().split('T')[0]);
        setStatus('Pago');
        setBillAttachment(null);
        setReceiptAttachment(null);
      }
      setErrors({});
    }
  }, [isOpen, transactionToEdit]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'bill' | 'receipt') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const alertMessage = 'Por favor, anexe um PDF, JPG ou PNG.';

      if (allowedTypes.includes(file.type)) {
        if (fileType === 'bill') setBillAttachment(file);
        if (fileType === 'receipt') setReceiptAttachment(file);
      } else {
        alert(alertMessage);
        e.target.value = '';
        if (fileType === 'bill') setBillAttachment(null);
        if (fileType === 'receipt') setReceiptAttachment(null);
      }
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const saveData: any = {
      id: transactionToEdit?.id,
      description,
      amount: parseFloat(value.replace(',', '.')) || 0,
      date,
      type: transactionType,
      status,
      billAttachment: billAttachment ? billAttachment.name : undefined,
      receiptAttachment: receiptAttachment ? receiptAttachment.name : undefined,
      unit: currentUnit,
    };

    onSave(saveData);
    handleClose();
  };

  if (!isOpen && !isExiting) return null;

  const title = transactionType === 'receita' ? 'Nova Receita' : 'Nova Despesa';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-lg ${isOpen && !isExiting ? 'scale-100' : 'scale-95'}`}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-secondary">{title}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" required className={`w-full p-2 border rounded ${errors.description ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
              </div>
              <div>
                <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Valor (ex: 50,00)" required className={`w-full p-2 border rounded ${errors.value ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.value && <p className="text-xs text-red-600 mt-1">{errors.value}</p>}
              </div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full p-2 border rounded" />
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} required className="w-full p-2 border rounded">
                <option value="Pago">Pago</option>
                <option value="Pendente">Pendente</option>
              </select>

              <div className="space-y-4 pt-2 border-t">
                <div>
                  <label htmlFor="billAttachment" className="block text-sm font-medium text-gray-700">Anexar Conta (PDF, JPG, PNG)</label>
                  <div className="mt-1 flex items-center">
                    <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                      <span>Selecionar arquivo</span>
                      <input id="billAttachment" name="billAttachment" type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png" onChange={(e) => handleFileChange(e, 'bill')} />
                    </label>
                    {billAttachment && <span className="ml-3 text-sm text-gray-500 truncate">{billAttachment.name}</span>}
                  </div>
                </div>
                <div>
                  <label htmlFor="receiptAttachment" className="block text-sm font-medium text-gray-700">Anexar Recibo (PDF, JPG, PNG)</label>
                  <div className="mt-1 flex items-center">
                    <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                      <span>Selecionar arquivo</span>
                      <input id="receiptAttachment" name="receiptAttachment" type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png" onChange={(e) => handleFileChange(e, 'receipt')} />
                    </label>
                    {receiptAttachment && <span className="ml-3 text-sm text-gray-500 truncate">{receiptAttachment.name}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
            <button type="submit" disabled={!isFormValid} className="px-4 py-2 bg-primary text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed">Salvar</button>
            <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTransactionModal;