import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import SignatureModal from './SignatureModal';
import HairStyleTestModal from './HairStyleTestModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useData, Service, ContractTemplate } from '../contexts/DataContext';

interface ClientDocument {
  id: number;
  name: string;
  type: string;
  content?: string;
  signed?: boolean;
  signatureImg?: string;
  userPhoto?: string;
  fileName?: string;
  [key: string]: any;
}

interface Campaign {
  id: number;
  name: string;
}

interface Relationship {
  type: string;
  clientId: number;
}


interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: any) => void;
  existingClients: any[];
  clientToEdit?: any | null;
  // FIX: Using Campaign type from data/mockData instead of Campaign from local re-declaration.
  acquisitionChannels: any[];
  isIndividualPlan?: boolean;
  onComingSoon?: (featureName: string) => void;
}

const InputField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<any>) => void; onBlur?: (e: React.FocusEvent<any>) => void; type?: string; required?: boolean; maxLength?: number; placeholder?: string; error?: string; autoComplete?: string; }> =
  ({ label, name, value, onChange, onBlur, type = 'text', required = false, maxLength, placeholder, error, autoComplete = 'on' }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && <p id={`${name}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );

const SelectField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<any>) => void; onBlur?: (e: React.FocusEvent<any>) => void; options: { value: string, label: string }[]; required?: boolean; error?: string; disabled?: boolean; }> =
  ({ label, name, value, onChange, onBlur, options, required = false, error, disabled = false }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm'} disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <option value="">Selecione...</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {error && <p id={`${name}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-t">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-4 text-left font-bold text-lg text-secondary focus:outline-none">
        <span>{title}</span>
        <svg className={`w-5 h-5 transform transition-transform text-gray-500 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[2500px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const initialFormData = {
  fullName: '',
  socialName: '',
  birthdate: '',
  cpf: '',
  rg: '',
  phone: '',
  email: '',
  maritalStatus: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  team: '',
  preferredUnit: '',
  howTheyFoundUs: '',
  indicatedBy: '',
  observations: '',
  gender: '',
  reminders: [] as any[],
  blocked: { status: false, reason: '' },
};

export const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSave, existingClients, clientToEdit, acquisitionChannels, isIndividualPlan, onComingSoon }) => {
  const { t } = useLanguage();
  const { services: contextServices, contractTemplates, units, refreshUnits, salonPlans, packages } = useData();
  const [formData, setFormData] = useState(initialFormData);

  // State for dynamically fetched acquisition channels
  const [dynamicChannels, setDynamicChannels] = useState<any[]>([]);

  // Task 2: Fetch units and acquisition channels when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshUnits();
      // Fetch acquisition channels from API
      const fetchChannels = async () => {
        try {
          const { marketingAPI } = await import('../lib/api');
          const channels = await marketingAPI.listChannels();
          setDynamicChannels(channels || []);
        } catch (error) {
          console.error('Error fetching acquisition channels:', error);
          setDynamicChannels([]);
        }
      };
      fetchChannels();
    }
  }, [isOpen, refreshUnits]);

  // Use dynamic channels if available, otherwise fallback to prop channels
  const effectiveChannels = dynamicChannels.length > 0 ? dynamicChannels : acquisitionChannels;

  const [errors, setErrors] = useState<{ [key: string]: any }>({});

  const [useSocialName, setUseSocialName] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const [photo, setPhoto] = useState<string | null>(null);
  const [procedurePhotos, setProcedurePhotos] = useState<string[]>([]);

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [documentToSign, setDocumentToSign] = useState<ClientDocument | null>(null);
  const [viewingSignedDoc, setViewingSignedDoc] = useState<ClientDocument | null>(null);
  const [isHairStyleTestModalOpen, setIsHairStyleTestModalOpen] = useState(false);

  const [indicationResults, setIndicationResults] = useState<any[]>([]);
  const [isIndicationDropdownOpen, setIsIndicationDropdownOpen] = useState(false);
  const [indicatedByClient, setIndicatedByClient] = useState<any | null>(null);

  // Relationship state
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [relationshipType, setRelationshipType] = useState('');
  const [relationshipSearch, setRelationshipSearch] = useState('');
  const [relationshipSearchResults, setRelationshipSearchResults] = useState<any[]>([]);
  const [selectedRelationshipClient, setSelectedRelationshipClient] = useState<any | null>(null);
  const [isRelationshipDropdownOpen, setIsRelationshipDropdownOpen] = useState(false);

  const [additionalPhones, setAdditionalPhones] = useState<{ sector: string; number: string; }[]>([]);

  // Contract state
  const [stagedDocuments, setStagedDocuments] = useState<ClientDocument[]>([]);
  const [documentSearch, setDocumentSearch] = useState('');
  const [documentSearchResults, setDocumentSearchResults] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);

  // Attached Documents State
  const [attachedDocuments, setAttachedDocuments] = useState<{ title: string; file: File | null; fileName?: string }[]>([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Service state
  const [servicesOfInterest, setServicesOfInterest] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceSearchResults, setServiceSearchResults] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const procedureFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const indicationSearchRef = useRef<HTMLDivElement>(null);
  const relationshipSearchRef = useRef<HTMLDivElement>(null);

  const [isExiting, setIsExiting] = useState(false);
  const [showCameraView, setShowCameraView] = useState(false);

  // --- START: Image Editor State & Logic ---
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const editorImageRef = useRef<HTMLImageElement | null>(null);
  const isDragging = useRef(false);
  const lastDragPos = useRef({ x: 0, y: 0 });

  const [isNestedNewClientModalOpen, setIsNestedNewClientModalOpen] = useState(false);

  const handleSaveNestedClient = (newClientData: any) => {
    onSave(newClientData); // Propagate save to parent
    setFormData(prev => ({ ...prev, indicatedBy: newClientData.name }));
    setIndicatedByClient(newClientData);
    setIsIndicationDropdownOpen(false); // Close dropdown if it was open
    setIsNestedNewClientModalOpen(false);
  };


  const redrawCanvas = () => {
    const canvas = editorCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    const image = editorImageRef.current;
    if (!canvas || !ctx || !image || !image.src) return;

    const canvasSize = Math.min(canvas.parentElement?.clientWidth || 300, 300);
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.save();

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    ctx.translate(canvasSize / 2, canvasSize / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(zoom, zoom);

    ctx.translate(offset.x, offset.y);

    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();
  };

  useEffect(() => {
    if (isEditorOpen && editorCanvasRef.current) {
      redrawCanvas();
    }
  }, [isEditorOpen, zoom, rotation, offset, brightness, contrast]);

  useEffect(() => {
    if (isEditorOpen && imageToEdit) {
      const img = new Image();
      img.src = imageToEdit;
      img.onload = () => {
        editorImageRef.current = img;
        setZoom(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
        setBrightness(100);
        setContrast(100);
        redrawCanvas();
      };
    }
  }, [isEditorOpen, imageToEdit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (indicationSearchRef.current && !indicationSearchRef.current.contains(event.target as Node)) {
        setIsIndicationDropdownOpen(false);
      }
      if (relationshipSearchRef.current && !relationshipSearchRef.current.contains(event.target as Node)) {
        setIsRelationshipDropdownOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastDragPos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const dx = (e.clientX - lastDragPos.current.x) / zoom;
    const dy = (e.clientY - lastDragPos.current.y) / zoom;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastDragPos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => { isDragging.current = false; };

  const handleConfirmEdit = () => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;
    setPhoto(canvas.toDataURL('image/png'));
    setIsEditorOpen(false);
    setImageToEdit('');
  };

  const handleCancelEdit = () => {
    setIsEditorOpen(false);
    setImageToEdit('');
  };
  // --- END: Image Editor Logic ---

  const validateField = useCallback((name: keyof typeof initialFormData, value: string) => {
    let error = '';
    switch (name) {
      case 'fullName': if (!value) error = t('errorRequired'); else if (value.trim().split(' ').length < 2) error = t('errorNameMinTwoWords'); break;
      case 'email': if (!value) error = t('errorRequired'); else if (!/\S+@\S+\.\S+/.test(value)) error = t('errorInvalidEmail'); break;
      case 'cpf': if (!value) error = t('errorRequired'); else if (value.replace(/\D/g, '').length !== 11) error = t('errorInvalidCPF'); break;
      case 'phone': if (!value) error = t('errorRequired'); else if (value.replace(/\D/g, '').length < 10) error = t('errorInvalidPhone'); break;
      case 'birthdate': if (!value) error = t('errorRequired'); else if (new Date(value) > new Date()) error = t('errorDateInFuture'); break;
      case 'cep': if (!value) error = t('errorRequired'); else if (value.replace(/\D/g, '').length !== 8) error = t('errorInvalidCEP'); break;
    }
    return error;
  }, [t]);

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setUseSocialName(false);
    setPhoto(null);
    setProcedurePhotos([]);
    setRelationships([]);
    setAdditionalPhones([]);
    setStagedDocuments([]);
    setAttachedDocuments([]);
    setNewDocTitle('');
    setNewDocFile(null);
    setServicesOfInterest([]);
    setServiceSearch('');
    setSelectedService(null);
    setServiceSearchResults([]);
    setIndicatedByClient(null);
    if (docFileInputRef.current) { docFileInputRef.current.value = ''; }
    if (showCameraView) handleStopCamera();
  };

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setFormData({
          fullName: clientToEdit.legalName || clientToEdit.name || '',
          socialName: clientToEdit.socialName || '',
          birthdate: clientToEdit.birthdate ? clientToEdit.birthdate.split('T')[0] : '',
          cpf: clientToEdit.cpf || '',
          rg: clientToEdit.rg || '',
          phone: clientToEdit.phone || '',
          email: clientToEdit.email || '',
          maritalStatus: clientToEdit.maritalStatus || '',
          cep: clientToEdit.address?.cep || '',
          street: clientToEdit.address?.street || '',
          number: clientToEdit.address?.number || '',
          complement: clientToEdit.address?.complement || '',
          neighborhood: clientToEdit.address?.neighborhood || '',
          city: clientToEdit.address?.city || '',
          state: clientToEdit.address?.state || '',
          team: clientToEdit.team || '',
          preferredUnit: clientToEdit.preferredUnit || '',
          observations: clientToEdit.observations || '',
          gender: clientToEdit.gender || '',
          indicatedBy: clientToEdit.indicatedBy || '',
          howTheyFoundUs: clientToEdit.howTheyFoundUs || '',
          instagram: clientToEdit.instagram || '',
          kinship: clientToEdit.kinship || '',
          isCompleteRegistration: clientToEdit.isCompleteRegistration || false,
          reminders: clientToEdit.reminders || [],
          blocked: clientToEdit.blocked || { status: false, reason: '' },
          packageId: clientToEdit.packageId || null,
        });

        const clientPhoto = clientToEdit.photo || clientToEdit.photoUrl || clientToEdit.photo_url;
        if (clientPhoto) setPhoto(clientPhoto);
        if (clientToEdit.procedurePhotos) setProcedurePhotos(clientToEdit.procedurePhotos);
        if (clientToEdit.additionalPhones) setAdditionalPhones(clientToEdit.additionalPhones);

        // Use the explicit flag from mapping
        setUseSocialName(!!clientToEdit.useSocialName);
        setRelationships(clientToEdit.relationships || []);
        setStagedDocuments(clientToEdit.documents?.filter((d: any) => d.id !== undefined && d.type !== 'Anexo') || []);
        setAttachedDocuments(clientToEdit.documents?.filter((d: any) => d.type === 'Anexo').map((doc: any) => ({
          title: doc.name,
          fileName: doc.fileName || doc.name,
          file: null,
          content: doc.content // Map content back
        })) || []);
        setServicesOfInterest(clientToEdit.servicesOfInterest || []);
        setUseSocialName(!!clientToEdit.socialName && clientToEdit.name === clientToEdit.socialName);
        if (clientToEdit.indicatedBy) {
          const indicator = existingClients.find(c => c.name === clientToEdit.indicatedBy);
          if (indicator) {
            setIndicatedByClient(indicator);
          }
        } else {
          setIndicatedByClient(null);
        }
      } else {
        resetForm();
        // If not editing and there is only one unit, auto-select it
        if (units.length === 1) {
          setFormData(prev => ({ ...prev, preferredUnit: units[0].name }));
        }
      }
    }
  }, [isOpen, clientToEdit, existingClients, units]);

  const handleClose = () => {
    setIsExiting(true);
    handleStopCamera();
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const formatCPF = (value: string) => (value || '').replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  const formatPhone = (value: string) => (value || '').replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\s\d{5})(\d)/, '$1-$2');
  const formatCEP = (value: string) => (value || '').replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

  const handleCepSearch = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setIsFetchingCep(true);
    setErrors(prev => ({ ...prev, cep: '' }));
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
      if (!response.ok) throw new Error('CEP não encontrado');
      const data = await response.json();
      if (data.cep) {
        setFormData(prev => ({
          ...prev,
          street: data.street || '',
          neighborhood: data.neighborhood || '',
          city: data.city || '',
          state: data.state || '',
        }));
        setErrors(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, cep: 'CEP não encontrado ou inválido.' }));
    } finally {
      setIsFetchingCep(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name as keyof typeof initialFormData, value) }));
    }
    let formattedValue = value;
    if (name === 'cpf') formattedValue = formatCPF(value);
    else if (name === 'phone') formattedValue = formatPhone(value);
    else if (name === 'cep') formattedValue = formatCEP(value);
    setFormData(prev => {
      const newState = { ...prev, [name]: formattedValue };
      return newState;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof typeof initialFormData, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    if (name === 'cep' && !error) {
      handleCepSearch();
    }
  };

  const handleUseSocialNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setUseSocialName(isChecked);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setImageToEdit(event.target.result);
          setIsEditorOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCameraView(false);
  };

  const handleTakePhotoClick = async () => {
    setShowCameraView(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera Error:", err);
      setShowCameraView(false);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      canvasRef.current.getContext('2d')?.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setImageToEdit(dataUrl);
      setIsEditorOpen(true);
      handleStopCamera();
    }
  };

  const handleProcedurePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // FIX: Add explicit type annotation to resolve potential type inference issue with FileList items.
      files.forEach((file: Blob) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setProcedurePhotos(prev => [...prev, event.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
      e.target.value = ''; // Reset file input
    }
  };

  const handleRemoveProcedurePhoto = (indexToRemove: number) => {
    setProcedurePhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleIndicationSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setFormData(prev => ({ ...prev, indicatedBy: query }));
    setIndicatedByClient(null);

    if (query.length > 1) {
      setIsIndicationDropdownOpen(true);
      setIndicationResults(
        existingClients.filter(client =>
          (clientToEdit ? client.id !== clientToEdit.id : true) &&
          client.name.toLowerCase().includes(query.toLowerCase())
        )
      );
    } else {
      setIsIndicationDropdownOpen(false);
      setIndicationResults([]);
    }
  };

  const handleSelectIndication = (client: any) => {
    setFormData(prev => ({ ...prev, indicatedBy: client.name }));
    setIndicatedByClient(client);
    setIsIndicationDropdownOpen(false);
    setIndicationResults([]);
  };

  const handleRemoveIndicator = () => {
    setIndicatedByClient(null);
    setFormData(prev => ({ ...prev, indicatedBy: '' }));
  };

  const handleRelationshipSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setRelationshipSearch(query);
    setSelectedRelationshipClient(null);
    if (query.length > 1) {
      setIsRelationshipDropdownOpen(true);
      setRelationshipSearchResults(
        existingClients.filter(
          c => c.id !== clientToEdit?.id && c.name.toLowerCase().includes(query.toLowerCase())
        )
      );
    } else {
      setIsRelationshipDropdownOpen(false);
      setRelationshipSearchResults([]);
    }
  };

  const handleSelectRelationship = (client: any) => {
    setSelectedRelationshipClient(client);
    setRelationshipSearch(client.name);
    setIsRelationshipDropdownOpen(false);
    setRelationshipSearchResults([]);
  };

  const handleAddRelationship = () => {
    if (relationshipType && selectedRelationshipClient) {
      if (!relationships.some(r => r.clientId === selectedRelationshipClient.id)) {
        setRelationships(prevRelationships => [
          ...prevRelationships,
          { type: relationshipType, clientId: selectedRelationshipClient.id },
        ]);
        // Reset fields
        setRelationshipType('');
        setRelationshipSearch('');
        setSelectedRelationshipClient(null);
        setRelationshipSearchResults([]);
      } else {
        alert('Este cliente já foi adicionado.');
      }
    }
  };

  const handleRemoveRelationship = (clientIdToRemove: number) => {
    setRelationships(prevRelationships => prevRelationships.filter(r => r.clientId !== clientIdToRemove));
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

  const handleDocumentSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setDocumentSearch(query);
    setSelectedDocument(null);
    if (query.length > 1) {
      // Find selected unit ID
      const selectedUnitObj = units.find(u => u.name === formData.preferredUnit);
      const selectedUnitId = selectedUnitObj ? selectedUnitObj.id : null;

      setDocumentSearchResults(
        contractTemplates.filter(
          doc => {
            const matchesName = doc.name.toLowerCase().includes(query);
            // Filter by unit if selected. Allow if doc has no unit_id (global) or matches selected unit
            const matchesUnit = !doc.unit_id || (selectedUnitId && doc.unit_id === selectedUnitId);
            return matchesName && matchesUnit;
          }
        )
      );
    } else {
      setDocumentSearchResults([]);
    }
  };

  const handleAddDocument = () => {
    if (selectedDocument) {
      // Allow multiple versions of the same template by using a timestamp in the unique ID for the staged list
      const newStagedDoc = {
        ...selectedDocument,
        stagedId: Date.now(), // Unique ID for the UI list
        signed: false
      };

      setStagedDocuments([
        ...stagedDocuments,
        newStagedDoc,
      ]);
      setDocumentSearch('');
      setSelectedDocument(null);
      setDocumentSearchResults([]);
    }
  };

  const handleRemoveDocument = (stagedIdToRemove: number) => {
    setStagedDocuments(stagedDocuments.filter(d => d.stagedId !== stagedIdToRemove));
  };

  const handleOpenSignatureModal = (doc: ClientDocument) => {
    setDocumentToSign(doc);
    setIsSignatureModalOpen(true);
  };

  const handleSign = (signatureData: { photo: string; signature: string }) => {
    if (!documentToSign) return;

    setStagedDocuments(prevDocs =>
      prevDocs.map(doc => {
        // Match by stagedId (for newly added template documents) OR by id (for existing documents from database)
        const isMatch = (doc.stagedId && doc.stagedId === documentToSign.stagedId) ||
          (doc.id && doc.id === documentToSign.id);
        return isMatch
          ? { ...doc, signed: true, signatureImg: signatureData.signature, userPhoto: signatureData.photo }
          : doc;
      })
    );
    setDocumentToSign(null);
  };

  const handleNewDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type !== 'application/pdf') {
        alert('Por favor, anexe apenas arquivos PDF.');
        e.target.value = '';
        return;
      }
      setNewDocFile(e.target.files[0]);
    }
  };

  const handleAddAttachedDocument = () => {
    if (newDocTitle.trim() && newDocFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setAttachedDocuments(prev => [...prev, {
          title: newDocTitle,
          file: newDocFile,
          fileName: newDocFile.name,
          content: base64 // Store base64 content
        }]);
        setNewDocTitle('');
        setNewDocFile(null);
        if (docFileInputRef.current) {
          docFileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(newDocFile);
    } else {
      alert('Por favor, preencha o título e selecione um arquivo PDF.');
    }
  };

  const handleRemoveAttachedDocument = (indexToRemove: number) => {
    setAttachedDocuments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleServiceSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setServiceSearch(query);
    setSelectedService(null); // Clear selection when user types
    if (query.length > 1) {
      // Find selected unit ID
      const selectedUnitObj = units.find(u => u.name === formData.preferredUnit);
      const selectedUnitId = selectedUnitObj ? selectedUnitObj.id : null;

      const combined = [
        ...contextServices.map(s => ({ ...s, type: 'service' as const })),
        ...packages.map(p => ({ ...p, type: 'package' as const })),
        ...salonPlans.map(p => ({ ...p, type: 'plan' as const }))
      ];
      setServiceSearchResults(
        combined.filter(item => {
          const matchesName = item.name.toLowerCase().includes(query);
          // Filter by unit if selected. Allow if item has no unit_id (global) or matches selected unit
          // Some items might not have unit_id property typed yet, assume flexible check
          const itemUnitId = (item as any).unit_id || (item as any).unitId;
          const matchesUnit = !itemUnitId || (selectedUnitId && itemUnitId === selectedUnitId);
          return matchesName && matchesUnit;
        })
      );
    } else {
      setServiceSearchResults([]);
    }
  };

  const handleAddService = () => {
    if (selectedService) {
      const typedService = selectedService as any;
      if (typedService.type === 'package') {
        setFormData(prev => ({ ...prev, packageId: typedService.id }));
      } else if (typedService.type === 'plan') {
        setFormData(prev => ({ ...prev, planId: typedService.id }));
      }

      if (!servicesOfInterest.includes(selectedService.name)) {
        setServicesOfInterest([...servicesOfInterest, selectedService.name]);
      }
      // Reset fields
      setServiceSearch('');
      setSelectedService(null);
      setServiceSearchResults([]);
    }
  };

  const handleRemoveService = (serviceNameToRemove: string) => {
    setServicesOfInterest(servicesOfInterest.filter(serviceName => serviceName !== serviceNameToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<keyof typeof initialFormData, string>> = {};
    const requiredFields: (keyof typeof initialFormData)[] = ['fullName', 'phone'];
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const { cep, street, number, complement, neighborhood, city, state, fullName, socialName, planId, packageId, reminders, blocked, ...restOfData } = formData;

    const attachedDocsToSave = attachedDocuments.map(doc => ({
      name: doc.title,
      fileName: doc.fileName || doc.file?.name,
      type: 'Anexo',
      signed: false,
      content: doc.content // Ensure content is saved
    }));

    const existingHistory = clientToEdit?.history || [];
    const newHistoryItems = servicesOfInterest
      .filter(serviceName => !existingHistory.some(h => h.name === serviceName && (h.status === 'a realizar' || h.status === 'Agendado')))
      .map(serviceName => {
        const serviceDetails = contextServices.find(s => s.name === serviceName);
        return {
          id: Date.now() + Math.random(),
          name: serviceName,
          date: 'Pendente',
          time: '--:--',
          professional: 'A definir',
          status: 'a realizar' as const,
          reviewed: false,
          price: serviceDetails?.price || '0,00',
        };
      });

    const finalHistory = [...existingHistory, ...newHistoryItems];

    const finalData = {
      id: clientToEdit?.id,
      name: fullName,
      socialName,
      ...restOfData,
      photo,
      procedurePhotos,
      relationships,
      additionalPhones,
      history: finalHistory,
      status: clientToEdit?.status || null,
      lastVisit: clientToEdit?.lastVisit || '',
      totalVisits: clientToEdit?.totalVisits || 0,
      packages: clientToEdit?.packages || [],
      registrationDate: clientToEdit?.registrationDate || new Date().toISOString(),
      password: clientToEdit?.password || '123', // Default password
      address: {
        cep, street, number, complement, neighborhood, city, state
      },
      tags: clientToEdit?.tags || [],
      documents: [...stagedDocuments, ...attachedDocsToSave],
      servicesOfInterest: servicesOfInterest,
      reminders: reminders,
      blocked: blocked,
      packageId,
      is_complete_registration: true,
      useSocialName,
    };

    try {
      const result = await onSave(finalData);
      // Check if onSave returns a promise that resolves to null/false indicating failure
      // or if it throws.
      // If result is strictly null (and not undefined/void), it might indicate failure from DataContext
      if (result === null || result === false) {
        alert(t('errorSavingClient') || 'Erro ao salvar cliente. Verifique os dados e tente novamente.');
        return;
      }

      if (clientToEdit) {
        onClose();
      } else {
        handleClose();
      }
    } catch (error) {
      console.error("Error saving client:", error);
      alert(t('errorSavingClient') || 'Erro ao salvar cliente.');
    }
  };

  if (!isOpen && !isExiting) return null;
  const title = clientToEdit ? 'Cadastro Completo' : t('newClientRegistration');

  const mainContent = () => {
    if (isEditorOpen) return (
      <div className="space-y-4">
        <canvas ref={editorCanvasRef} className="mx-auto cursor-grab active:cursor-grabbing border-2 border-dashed rounded-lg" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} />
        <div className="grid grid-cols-2 gap-4 items-center">
          <label className="text-sm font-medium">Zoom:</label><input type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} />
          <label className="text-sm font-medium">Brilho:</label><input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} />
          <label className="text-sm font-medium">Contraste:</label><input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} />
        </div>
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={() => setRotation(r => r - 90)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Girar para Esquerda"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7.109 7.109a8.953 8.953 0 101.439 12.724M8.547 4.547L4.5 8.59l4.047 4.043" /></svg></button>
          <button type="button" onClick={() => setRotation(r => r + 90)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" title="Girar para Direita"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.891 7.109a8.953 8.953 0 11-1.439 12.724M15.453 4.547L19.5 8.59l-4.047 4.043" /></svg></button>
        </div>
      </div>
    );
    if (showCameraView) return (
      <div className="space-y-4 text-center">
        <video ref={videoRef} autoPlay playsInline className="w-full rounded-md bg-gray-900 aspect-video object-cover"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
        <button type="button" onClick={handleCapturePhoto} className="px-4 py-2 bg-primary text-white rounded-md">{t('capture')}</button>
        <button type="button" onClick={handleStopCamera} className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md">{t('back')}</button>
      </div>
    );
    return (
      <>
        <CollapsibleSection title={t('identificationAndAccess')} defaultOpen={true}>
          <div className="flex items-start space-x-6 pb-4">
            <div className="shrink-0 text-center">
              {photo ? (
                <img className="h-20 w-20 object-cover rounded-full mx-auto" src={photo} alt="Foto do Cliente" />
              ) : (
                <div className="h-20 w-20 rounded-full mx-auto bg-gray-100 flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-grow self-start">
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={handleTakePhotoClick} className="py-2 px-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">{t('capturePhoto')}</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="py-2 px-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">{t('uploadPhoto')}</button>
              </div>
              <input ref={fileInputRef} type="file" onChange={handlePhotoChange} accept="image/*" className="hidden" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label={`${t('fullName')} *`} name="fullName" value={formData.fullName} onChange={handleChange} onBlur={handleBlur} required error={errors.fullName} />
            <InputField label={t('socialName')} name="socialName" value={formData.socialName} onChange={handleChange} />
            <div className="md:col-span-2 flex items-center">
              <input id="useSocialName" name="useSocialName" type="checkbox" checked={useSocialName} onChange={handleUseSocialNameChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
              <label htmlFor="useSocialName" className="ml-2 block text-sm text-gray-900">{t('useSocialNameAsPrimary')}</label>
            </div>
            <InputField label={`${t('contactPhone')} *`} name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} type="tel" required maxLength={15} error={errors.phone} />
            <InputField label={t('email')} name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} type="email" error={errors.email} />
            <div className="md:col-span-2 mt-4 pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('additionalContacts')}</label>
              <div className="space-y-3">
                {additionalPhones.map((phone, index) => (
                  <div key={index} className="flex items-center gap-2 bg-light p-2 rounded-md">
                    <input
                      type="text"
                      placeholder="Setor (Ex: Trabalho, Mãe)"
                      value={phone.sector}
                      onChange={(e) => handleAdditionalPhoneChange(index, 'sector', e.target.value)}
                      className="w-1/3 p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    />
                    <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone.number}
                      maxLength={15}
                      onChange={(e) => handleAdditionalPhoneChange(index, 'number', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(index)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                      aria-label="Remover telefone"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddPhone}
                className="mt-3 w-full flex items-center justify-center p-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('addContact')}
              </button>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Documentos Pessoais">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="CPF" name="cpf" value={formData.cpf} onChange={handleChange} onBlur={handleBlur} maxLength={14} error={errors.cpf} />
            <InputField label="RG" name="rg" value={formData.rg} onChange={handleChange} />
            <InputField label={t('birthDate')} name="birthdate" value={formData.birthdate} onChange={handleChange} onBlur={handleBlur} type="date" error={errors.birthdate} />
            <SelectField
              label={t('maritalStatus')}
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              onBlur={handleBlur}
              options={[
                { value: 'Solteiro(a)', label: t('maritalStatusSingle') },
                { value: 'Casado(a)', label: t('maritalStatusMarried') },
                { value: 'Divorciado(a)', label: t('maritalStatusDivorced') },
                { value: 'Viúvo(a)', label: t('maritalStatusWidowed') },
              ]}
              error={errors.maritalStatus}
            />
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Sexo</label>
              <div className="flex items-center space-x-6 h-10">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    value="masculino"
                    checked={formData.gender === 'masculino'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 transition-colors cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-700 group-hover:text-primary transition-colors font-medium">Masculino</span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    value="feminino"
                    checked={formData.gender === 'feminino'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 transition-colors cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-gray-700 group-hover:text-primary transition-colors font-medium">Feminino</span>
                </label>
              </div>
            </div>
            <div className="md:col-span-2 mt-4 pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('relationshipSectionTitle')}</label>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-1">
                    <label htmlFor="relationshipType" className="block text-xs font-medium text-gray-600">{t('relationshipType')}</label>
                    <input
                      type="text"
                      id="relationshipType"
                      value={relationshipType}
                      onChange={(e) => setRelationshipType(e.target.value)}
                      placeholder="Ex: Mãe, Filho(a)"
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 relative" ref={relationshipSearchRef}>
                    <label htmlFor="relationshipSearch" className="block text-xs font-medium text-gray-600">{t('relationshipPerson')}</label>
                    <input
                      type="text"
                      id="relationshipSearch"
                      value={relationshipSearch}
                      onChange={handleRelationshipSearch}
                      placeholder={t('relationshipSearchClient')}
                      autoComplete="off"
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    />
                    {isRelationshipDropdownOpen && relationshipSearchResults.length > 0 && (
                      <div className="absolute top-full z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        <ul>
                          {relationshipSearchResults.map(client => (
                            <li key={client.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectRelationship(client)}
                                className="w-full text-left flex items-center p-2 hover:bg-gray-100"
                              >
                                <img src={client.photo} alt={client.name} className="w-8 h-8 rounded-full mr-3" />
                                <span className="text-sm font-medium text-gray-800">{client.name}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddRelationship}
                  disabled={!relationshipType.trim() || !selectedRelationshipClient}
                  className="w-full flex items-center justify-center p-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('addRelationship')}
                </button>

                {relationships.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700">{t('addedRelationships')}:</h4>
                    <div className="mt-2 space-y-2">
                      {relationships.map(rel => {
                        const relatedClient = existingClients.find(c => c.id === rel.clientId);
                        if (!relatedClient) return null;
                        return (
                          <div key={rel.clientId} className="flex items-center justify-between bg-gray-100 p-2 rounded-md text-sm">
                            <div className="flex items-center gap-3">
                              <img src={relatedClient.photo} alt={relatedClient.name} className="w-10 h-10 rounded-full" />
                              <div>
                                <p className="font-medium text-gray-800">{relatedClient.name}</p>
                                <p className="text-xs text-primary font-semibold">{rel.type}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveRelationship(rel.clientId)}
                              className="text-red-500 hover:text-red-700 font-bold p-1 rounded-full flex-shrink-0"
                              aria-label="Remover parentesco"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Endereço">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleBlur} maxLength={9} placeholder="00000-000" className={`block w-full px-3 py-2 border rounded-md ${errors.cep ? 'border-red-500' : 'border-gray-300'}`} />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{isFetchingCep && <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}</div>
              </div>
              {errors.cep && <p className="mt-1 text-xs text-red-600">{errors.cep}</p>}
            </div>
            <div className="md:col-span-2"><InputField label="Rua" name="street" value={formData.street} onChange={handleChange} onBlur={handleBlur} error={errors.street} /></div>
            <div className="md:col-span-1"><InputField label="Número" name="number" value={formData.number} onChange={handleChange} onBlur={handleBlur} error={errors.number} /></div>
            <div className="md:col-span-2"><InputField label="Complemento" name="complement" value={formData.complement} onChange={handleChange} /></div>
            <div className="md:col-span-1"><InputField label="Bairro" name="neighborhood" value={formData.neighborhood} onChange={handleChange} onBlur={handleBlur} error={errors.neighborhood} /></div>
            <div className="md:col-span-1"><InputField label="Cidade" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur} error={errors.city} /></div>
            <div className="md:col-span-1"><InputField label="Estado" name="state" value={formData.state} onChange={handleChange} onBlur={handleBlur} error={errors.state} /></div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={t('preferencesAndMarketing')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Time do Coração" name="team" value={formData.team} onChange={handleChange} />
            {units.length > 1 && (
              <SelectField
                label="Unidade de Preferência"
                name="preferredUnit"
                value={formData.preferredUnit}
                onChange={handleChange}
                onBlur={handleBlur}
                options={units.map(u => ({ value: u.name, label: u.name }))}
                error={errors.preferredUnit}
              />
            )}
            <SelectField
              label={t('acquisitionChannelLabel')}
              name="howTheyFoundUs"
              value={formData.howTheyFoundUs}
              onChange={handleChange}
              onBlur={handleBlur}
              options={effectiveChannels.map(c => ({ value: c.name, label: c.name }))}
              error={errors.howTheyFoundUs}
            />
            {formData.howTheyFoundUs === 'Indicação' && (
              <div className="md:col-span-2">
                <label htmlFor="indicatedBy" className="block text-sm font-medium text-gray-700">Indicado por</label>
                {indicatedByClient ? (
                  <div className="mt-2 p-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                    <div className="flex items-center gap-3">
                      <img src={indicatedByClient.photo} alt={indicatedByClient.name} className="w-10 h-10 rounded-full" />
                      <span className="font-semibold text-gray-800">{indicatedByClient.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveIndicator}
                      className="text-sm font-semibold text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="relative flex-grow" ref={indicationSearchRef}>
                      <input
                        id="indicatedBy"
                        name="indicatedBy"
                        value={formData.indicatedBy}
                        onChange={handleIndicationSearch}
                        autoComplete="off"
                        placeholder="Digite o nome para buscar..."
                        className="block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm border-gray-300 focus:ring-primary focus:border-primary"
                      />
                      {isIndicationDropdownOpen && indicationResults.length > 0 && (
                        <div className="absolute top-full z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                          <ul>
                            {indicationResults.map(client => (
                              <li key={client.id}>
                                <button
                                  type="button"
                                  onClick={() => handleSelectIndication(client)}
                                  className="w-full text-left flex items-center p-2 hover:bg-gray-100"
                                >
                                  <img src={client.photo} alt={client.name} className="w-8 h-8 rounded-full mr-3" />
                                  <span className="text-sm font-medium text-gray-800">{client.name}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNestedNewClientModalOpen(true)}
                      className="py-2 px-3 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors flex-shrink-0 flex items-center text-sm"
                      aria-label="Adicionar Indicador"
                      title="Adicionar Indicador"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Adicionar Indicador
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Observações e Preferências</label>
              <textarea id="observations" name="observations" value={formData.observations} onChange={handleChange} rows={4} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title={t('contract')}>
          <div className="p-4 border rounded-lg bg-light space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <input
                type="text"
                placeholder={t('findContractAndTerm')}
                value={documentSearch}
                onChange={handleDocumentSearch}
                className="sm:col-span-2 w-full p-2 border rounded-md"
              />
              <button
                type="button"
                onClick={handleAddDocument}
                className="w-full py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark disabled:opacity-50"
                disabled={!selectedDocument}
              >
                {t('add')}
              </button>
            </div>
            {documentSearchResults.length > 0 && (
              <div className="max-h-32 overflow-y-auto border bg-gray-100 rounded-md">
                {documentSearchResults.map(doc => (
                  <button
                    type="button"
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocument(doc);
                      setDocumentSearch(doc.name);
                      setDocumentSearchResults([]);
                    }}
                    className={`w-full text-left p-2 hover:bg-gray-200 ${doc.type === 'Termo' ? 'text-black' : ''}`}
                  >
                    {doc.name} ({doc.type})
                  </button>
                ))}
              </div>
            )}
          </div>
          {stagedDocuments.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">{t('addedContracts')}:</h4>
              {stagedDocuments.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
                  <p className="text-sm font-semibold text-gray-800">{doc.name}</p>
                  <div className="flex items-center gap-4">
                    {doc.signed ? (
                      <button
                        type="button"
                        onClick={() => setViewingSignedDoc(doc)}
                        className="text-sm font-semibold text-green-600 flex items-center gap-1 hover:underline"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Ver Assinatura
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenSignatureModal(doc)}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Assinar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(doc.id!)}
                      className="text-red-500 font-bold p-2 rounded-full hover:bg-red-100 transition-colors"
                      aria-label="Remover documento"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Anexar Documentos</h4>
            {attachedDocuments.length > 0 && (
              <div className="space-y-2 mb-4">
                {attachedDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <div className="truncate">
                        <p className="font-medium text-gray-800 truncate" title={doc.title}>{doc.title}</p>
                        <p className="text-xs text-gray-500 truncate" title={doc.fileName || doc.file?.name}>{doc.fileName || doc.file?.name}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleRemoveAttachedDocument(index)} className="text-red-500 hover:text-red-700 font-bold p-1 rounded-full flex-shrink-0">&times;</button>
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 border rounded-lg bg-light space-y-3">
              <InputField
                label="Título do Documento"
                name="newDocTitle"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Ex: Certificado de Conclusão"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700">Buscar Documento (PDF)</label>
                <input
                  ref={docFileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleNewDocFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {newDocFile ? null : <span className="text-xs text-gray-500">Nenhum arquivo escolhido</span>}
              </div>
              <button
                type="button"
                onClick={handleAddAttachedDocument}
                className="w-full flex items-center justify-center p-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Adicionar Documento
              </button>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Fotos de Procedimentos</h4>
            {procedurePhotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                {procedurePhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img src={photo} alt={`${t('procedure')} ${index + 1}`} className="w-full h-24 object-cover rounded-lg shadow-md" />
                    <button
                      type="button"
                      onClick={() => handleRemoveProcedurePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={procedureFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleProcedurePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => procedureFileInputRef.current?.click()}
              className="w-full flex items-center justify-center p-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Adicionar Fotos
            </button>
          </div>
        </CollapsibleSection>

      </>
    );
  }

  return (
    <>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
        <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-2xl ${isOpen && !isExiting ? 'scale-100' : 'scale-95'}`}>
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">{isEditorOpen ? 'Editar Foto' : showCameraView ? 'Capturar Foto' : title}</h3>
              <div className="mt-4 max-h-[70vh] overflow-y-auto pr-4">
                {mainContent()}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
              {isEditorOpen ? (
                <>
                  <button type="button" onClick={handleConfirmEdit} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark sm:ml-3">Confirmar</button>
                  <button type="button" onClick={handleCancelEdit} className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                </>
              ) : (
                <>
                  <button type="submit" disabled={showCameraView} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark sm:ml-3">Salvar</button>
                  <button type="button" onClick={handleClose} disabled={showCameraView} className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                </>
              )}
            </div>
          </form>
        </div>
        {/* Signature Viewer Modal */}
        {viewingSignedDoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-60 animate-fade-in" onClick={() => setViewingSignedDoc(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full animate-bounce-in" onClick={e => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-xl font-bold text-secondary text-center mb-4">
                  Assinatura do Contrato
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">{viewingSignedDoc.name}</p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Photo */}
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-700 mb-2">Foto do Cliente</h4>
                    {viewingSignedDoc.userPhoto ? (
                      <div className="space-y-2">
                        <img
                          src={viewingSignedDoc.userPhoto}
                          alt="Foto do cliente"
                          className="w-32 h-32 object-cover rounded-full mx-auto shadow-md border-2 border-primary"
                        />
                        <a
                          href={viewingSignedDoc.userPhoto}
                          download={`foto_${formData.fullName?.replace(/\s+/g, '_') || 'cliente'}.png`}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          ⬇ Baixar Foto
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Foto não disponível</p>
                    )}
                  </div>

                  {/* Signature */}
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-700 mb-2">Assinatura</h4>
                    {viewingSignedDoc.signatureImg ? (
                      <div className="space-y-2">
                        <img
                          src={viewingSignedDoc.signatureImg}
                          alt="Assinatura"
                          className="w-full max-w-[200px] h-auto mx-auto border rounded-lg bg-gray-50 p-2"
                        />
                        <a
                          href={viewingSignedDoc.signatureImg}
                          download={`assinatura_${formData.fullName?.replace(/\s+/g, '_') || 'cliente'}.png`}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          ⬇ Baixar Assinatura
                        </a>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Assinatura não disponível</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex justify-end rounded-b-lg">
                <button
                  onClick={() => setViewingSignedDoc(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onSign={handleSign}
          contractText={documentToSign?.content || ''}
        />
        <HairStyleTestModal
          isOpen={isHairStyleTestModalOpen}
          onClose={() => setIsHairStyleTestModalOpen(false)}
          onComingSoon={onComingSoon}
        />
      </div>
      {isNestedNewClientModalOpen && (
        <NewClientModal
          isOpen={isNestedNewClientModalOpen}
          onClose={() => setIsNestedNewClientModalOpen(false)}
          onSave={handleSaveNestedClient}
          existingClients={existingClients}
          acquisitionChannels={acquisitionChannels}
          isIndividualPlan={isIndividualPlan}
          onComingSoon={onComingSoon}
        />
      )}
    </>
  );
};