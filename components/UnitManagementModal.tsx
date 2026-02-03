
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPhone, formatCEP, formatCPFOrCNPJ } from '../lib/maskUtils';

// --- Interfaces ---
interface AdditionalPhone {
  sector: string;
  number: string;
}
interface WorkingHour {
  day: string;
  open: boolean;
  start: string;
  end: string;
  lunchStart: string;
  lunchEnd: string;
}
interface Unit {
  id: number;
  name: string;
  phone: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  additionalPhones?: AdditionalPhone[];
  logo?: string | null;
  primaryColor?: string;
  workingHours?: WorkingHour[];
  checkinMessage?: string;
}

interface UnitManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unitData: any) => void;
  unitToEdit: Unit | null;
}

const initialFormData = {
  name: '',
  shortDescription: '',
  phone: '',
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  cnpjCpf: '',
};

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-t">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-4 text-left font-bold text-lg text-secondary focus:outline-none">
        <span>{title}</span>
        <svg className={`w-5 h-5 transform transition-transform text-gray-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path></svg>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2500px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};


// --- Component ---
const UnitManagementModal: React.FC<UnitManagementModalProps> = ({ isOpen, onClose, onSave, unitToEdit }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [additionalPhones, setAdditionalPhones] = useState<AdditionalPhone[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  // New states
  const [logo, setLogo] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [checkinMessage, setCheckinMessage] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const defaultWorkingHours = useMemo(() => [
    { day: t('dayMonday'), open: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: t('dayTuesday'), open: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: t('dayWednesday'), open: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: t('dayThursday'), open: true, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: t('dayFriday'), open: true, start: '09:00', end: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: t('daySaturday'), open: true, start: '08:00', end: '16:00', lunchStart: '12:00', lunchEnd: '12:30' },
    { day: t('daySunday'), open: false, start: '09:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  ], [t]);

  const validateField = useCallback((name: keyof typeof formData, value: string) => {
    let error = '';
    if (!value) {
      error = t('errorRequired');
    } else if (name === 'phone' && value.replace(/\D/g, '').length < 10) {
      error = t('errorInvalidPhone');
    } else if (name === 'cep' && value.replace(/\D/g, '').length !== 8) {
      error = t('errorInvalidCEP');
    }
    return error;
  }, [t]);


  useEffect(() => {
    if (isOpen) {
      if (unitToEdit) {
        setFormData({
          name: unitToEdit.name,
          shortDescription: unitToEdit.shortDescription || '',
          phone: unitToEdit.phone,
          cep: unitToEdit.address.cep,
          street: unitToEdit.address.street,
          number: unitToEdit.address.number,
          neighborhood: unitToEdit.address.neighborhood,
          city: unitToEdit.address.city,
          state: unitToEdit.address.state,
        });
        setAdditionalPhones(unitToEdit.additionalPhones || []);
        setLogo(unitToEdit.logo || null);
        setPrimaryColor(unitToEdit.primaryColor || '#10b981');
        setWorkingHours(unitToEdit.workingHours || defaultWorkingHours);
        setCheckinMessage(unitToEdit.checkinMessage || 'Olá, [NOME_CLIENTE]! Bem-vindo(a). Avisamos ao [NOME_PROFISSIONAL] que você chegou.');
      } else {
        setFormData(initialFormData);
        setAdditionalPhones([]);
        setLogo(null);
        setPrimaryColor('#10b981');
        setWorkingHours(defaultWorkingHours);
        setCheckinMessage('Olá, [NOME_CLIENTE]! Bem-vindo(a). Avisamos ao [NOME_PROFISSIONAL] que você chegou.');
      }
      setErrors({});
    }
  }, [isOpen, unitToEdit, defaultWorkingHours]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\s\d{5})(\d)/, '$1-$2');
  };

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleCepSearch = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setIsFetchingCep(true);
    setErrors(prev => ({ ...prev, cep: '' }));
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      if (!response.ok) throw new Error(response.status === 404 ? 'CEP inválido ou não encontrado.' : 'Serviço de CEP indisponível.');
      const data = await response.json();
      if (data.cep) {
        setFormData(prev => ({ ...prev, street: data.street || '', neighborhood: data.neighborhood || '', city: data.city || '', state: data.state || '' }));
        setErrors(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }));
      } else throw new Error('CEP não encontrado.');
    } catch (error: any) {
      setErrors(prev => ({ ...prev, cep: error.message }));
      setFormData(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }));
    } finally { setIsFetchingCep(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name as keyof typeof formData, value) }));
    }

    let formattedValue = value;
    if (name === 'cep') formattedValue = formatCEP(value);
    if (name === 'phone') formattedValue = formatPhone(value);
    if (name === 'cnpjCpf') formattedValue = formatCPFOrCNPJ(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));

  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name as keyof typeof formData, value) }));
    if (name === 'cep' && !errors.cep) {
      handleCepSearch();
    }
  };

  const handleAdditionalPhoneChange = (index: number, field: 'sector' | 'number', value: string) => {
    const newPhones = [...additionalPhones];
    if (field === 'number') {
      newPhones[index][field] = formatPhone(value);
    } else {
      newPhones[index][field] = value;
    }
    setAdditionalPhones(newPhones);
  };

  const handleAddPhone = () => {
    setAdditionalPhones([...additionalPhones, { sector: '', number: '' }]);
  };

  const handleRemovePhone = (index: number) => {
    setAdditionalPhones(additionalPhones.filter((_, i) => i !== index));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleWorkingHourChange = (index: number, field: keyof WorkingHour, value: string | boolean) => {
    const newHours = [...workingHours];
    (newHours[index] as any)[field] = value;
    setWorkingHours(newHours);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};
    (Object.keys(formData) as Array<keyof typeof formData>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors as { [key: string]: string });
      return;
    }

    const unitData = {
      id: unitToEdit?.id,
      name: formData.name,
      shortDescription: formData.shortDescription,
      phone: formData.phone,
      address: {
        cep: formData.cep,
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
      },
      additionalPhones: additionalPhones,
      logo,
      primaryColor,
      workingHours,
      checkinMessage,
    };
    onSave(unitData);
    handleClose();
  };

  const isFormValid = useMemo(() => {
    const hasRequiredValues = Object.values(formData).every(value => !!value);
    const hasNoErrors = Object.values(errors).every(error => !error);
    return hasRequiredValues && hasNoErrors;
  }, [formData, errors]);

  if (!isOpen && !isExiting) return null;

  const title = unitToEdit ? t('unitModalTitleEdit') : t('unitModalTitleAdd');

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-2xl ${isOpen && !isExiting ? 'scale-100' : 'scale-95'}`}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-secondary">{title}</h3>
            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              <CollapsibleSection title={t('unitModalSectionData')} defaultOpen={true}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('unitModalLabelName')}</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700">{t('unitModalLabelShortDescription')}</label>
                    <input type="text" id="shortDescription" name="shortDescription" value={formData.shortDescription} onChange={handleChange} placeholder={t('unitModalPlaceholderShortDescription')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t('unitModalLabelMainPhone')}</label>
                      <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} required maxLength={15} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} />
                      {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title={t('settingsSpaceSectionVisualIdentity')}>
                <p className="text-gray-500 text-sm mb-4">{t('settingsSpaceDescVisualIdentity')}</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="block text-sm font-medium text-gray-700">{t('settingsSpaceLabelLogo')}</label>
                    {logo && <img src={logo} alt="logo preview" className="h-12 w-12 object-contain rounded-md bg-gray-100 p-1 border" />}
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">{t('settingsSpaceButtonChange')}</button>
                    <input type="file" accept="image/*" onChange={handleLogoChange} ref={logoInputRef} className="hidden" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="block text-sm font-medium text-gray-700">{t('settingsSpaceLabelPrimaryColor')}</label>
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 border-none p-0" />
                    <div className="p-2 rounded-md" style={{ backgroundColor: primaryColor, color: 'white' }}>{t('settingsSpaceExample')}</div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title={t('unitModalSectionAddress')}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="cep" className="block text-sm font-medium text-gray-700">{t('unitModalLabelCEP')}</label>
                    <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleBlur} required maxLength={9} placeholder="00000-000" className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${errors.cep ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.cep && <p className="text-xs text-red-600 mt-1">{errors.cep}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700">{t('unitModalLabelStreet')}</label>
                    <input type="text" id="street" name="street" value={formData.street} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${errors.street ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.street && <p className="text-xs text-red-600 mt-1">{errors.street}</p>}
                  </div>
                  <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700">{t('unitModalLabelNumber')}</label>
                    <input type="text" id="number" name="number" value={formData.number} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${errors.number ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.number && <p className="text-xs text-red-600 mt-1">{errors.number}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">{t('unitModalLabelNeighborhood')}</label>
                    <input type="text" id="neighborhood" name="neighborhood" value={formData.neighborhood} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${errors.neighborhood ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.neighborhood && <p className="text-xs text-red-600 mt-1">{errors.neighborhood}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">{t('unitModalLabelCity')}</label>
                    <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${errors.city ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">{t('unitModalLabelState')}</label>
                    <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} onBlur={handleBlur} required maxLength={2} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${errors.state ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state}</p>}
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title={t('unitModalSectionAdditionalPhones')}>
                <div className="space-y-3 mt-2">
                  {additionalPhones.map((phone, index) => (
                    <div key={index} className="flex items-center gap-2 bg-light p-2 rounded-md">
                      <input type="text" placeholder={t('unitModalPlaceholderSector')} value={phone.sector} onChange={(e) => handleAdditionalPhoneChange(index, 'sector', e.target.value)} className="w-1/3 p-2 border border-gray-300 rounded-md shadow-sm text-sm" />
                      <input type="tel" placeholder={t('unitModalPlaceholderNumber')} value={phone.number} maxLength={15} onChange={(e) => handleAdditionalPhoneChange(index, 'number', e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm text-sm" />
                      <button type="button" onClick={() => handleRemovePhone(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" aria-label={t('unitModalLabelRemovePhone')}><TrashIcon /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={handleAddPhone} className="mt-3 w-full flex items-center justify-center p-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors"><PlusIcon />{t('unitModalButtonAddPhone')}</button>
              </CollapsibleSection>

              <CollapsibleSection title={t('settingsSpaceSectionWorkingHours')}>
                <p className="text-gray-500 text-sm mb-4">{t('settingsSpaceDescWorkingHours')}</p>
                <div className="space-y-4">
                  {workingHours.map((wh, index) => (
                    <div key={index} className={`grid grid-cols-1 sm:grid-cols-4 gap-3 items-center p-3 rounded-lg ${wh.open ? 'bg-light' : 'bg-gray-100 opacity-70'}`}>
                      <div className="sm:col-span-1 flex items-center">
                        <input type="checkbox" checked={wh.open} onChange={e => handleWorkingHourChange(index, 'open', e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                        <label className="ml-3 font-medium text-gray-800">{wh.day}</label>
                      </div>
                      <div className="sm:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                        <input type="time" value={wh.start} onChange={e => handleWorkingHourChange(index, 'start', e.target.value)} disabled={!wh.open} className="p-1 border rounded-md disabled:bg-gray-200" />
                        <input type="time" value={wh.end} onChange={e => handleWorkingHourChange(index, 'end', e.target.value)} disabled={!wh.open} className="p-1 border rounded-md disabled:bg-gray-200" />
                        <div className="col-span-2 flex items-center gap-2">
                          <label className="text-xs text-gray-500">{t('settingsSpaceLabelLunch')}</label>
                          <input type="time" value={wh.lunchStart} onChange={e => handleWorkingHourChange(index, 'lunchStart', e.target.value)} disabled={!wh.open} className="w-full p-1 border rounded-md disabled:bg-gray-200" />
                          <input type="time" value={wh.lunchEnd} onChange={e => handleWorkingHourChange(index, 'lunchEnd', e.target.value)} disabled={!wh.open} className="w-full p-1 border rounded-md disabled:bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection title={t('settingsSpaceSectionQRCode')}>
                <p className="text-gray-500 text-sm mb-4">{t('settingsSpaceDescQRCode')}</p>
                <div>
                  <label htmlFor="checkin-message" className="block text-sm font-medium text-gray-700">{t('settingsSpaceLabelWelcomeMessage')}</label>
                  <textarea
                    id="checkin-message"
                    value={checkinMessage}
                    onChange={e => setCheckinMessage(e.target.value)}
                    rows={3}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('settingsSpaceDescWelcomeMessage')}</p>
                </div>
              </CollapsibleSection>

            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
            <button type="submit" disabled={!isFormValid} className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
              {t('save')}
            </button>
            <button type="button" onClick={handleClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnitManagementModal;
