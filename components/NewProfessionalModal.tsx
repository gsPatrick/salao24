import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { uploadAPI } from '../lib/api';

interface NewProfessionalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (professionalData: any) => void;
    professionalToEdit?: any | null;
}

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274 4.057-5.064 7-9.542-7 .847 0 1.673.124 2.468.352M10.582 10.582a3 3 0 114.243 4.243M1 1l22 22" />
    </svg>
);

const InputField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<any>) => void; onBlur?: (e: React.FocusEvent<any>) => void; type?: string; required?: boolean; maxLength?: number; placeholder?: string; disabled?: boolean; error?: string; }> =
    ({ label, name, value, onChange, onBlur, type = 'text', required = false, maxLength, placeholder, disabled = false, error }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
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
                disabled={disabled}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary'}`}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            />
            {error && <p id={`${name}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );

const SelectField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<any>) => void; onBlur?: (e: React.FocusEvent<any>) => void; options: { value: string; label: string }[]; required?: boolean; error?: string; }> =
    ({ label, name, value, onChange, onBlur, options, required = false, error }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                required={required}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base rounded-md ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm'}`}
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
    name: '',
    socialName: '',
    cpf: '',
    birthdate: '',
    phone: '',
    email: '',
    maritalStatus: '',
    cep: '',
    street: '',
    number: '',
    addressComplement: '',
    neighborhood: '',
    city: '',
    state: '',
    unit: '',
    occupation: '',
    startTime: '',
    lunchStart: '',
    lunchEnd: '',
    endTime: '',
};

const NewProfessionalModal: React.FC<NewProfessionalModalProps> = ({ isOpen, onClose, onSave, professionalToEdit }) => {
    const { t } = useLanguage();
    const { units, refreshUnits, occupations, addOccupation, deleteOccupation } = useData();
    const [formData, setFormData] = useState(initialFormData);

    // Task 2: Fetch units when modal opens
    useEffect(() => {
        if (isOpen) {
            refreshUnits();
        }
    }, [isOpen, refreshUnits]);

    // Pre-select unit if only one exists
    useEffect(() => {
        if (isOpen && !professionalToEdit && units.length === 1) {
            setFormData(prev => ({ ...prev, unit: units[0].name }));
        }
    }, [isOpen, units, professionalToEdit]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [useSocialName, setUseSocialName] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const [isExiting, setIsExiting] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [allSpecialties, setAllSpecialties] = useState(['Corte', 'Coloração', 'Manicure', 'Pedicure', 'Estética Facial', 'Barba', 'Sobrancelha']);
    const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
    const [isCreatingOccupation, setIsCreatingOccupation] = useState(false);
    const [newOccupation, setNewOccupation] = useState('');
    const [openSchedule, setOpenSchedule] = useState(true);
    const [allowOvertime, setAllowOvertime] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
    const [newSpecialty, setNewSpecialty] = useState('');
    const [documents, setDocuments] = useState<{ title: string; file: File | null; fileName?: string }[]>([]);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocFile, setNewDocFile] = useState<File | null>(null);
    const docFileInputRef = useRef<HTMLInputElement>(null);


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
        if (isEditorOpen && editorCanvasRef.current) redrawCanvas();
    }, [isEditorOpen, zoom, rotation, offset, brightness, contrast]);

    useEffect(() => {
        if (isEditorOpen && imageToEdit) {
            const img = new Image();
            img.src = imageToEdit;
            img.onload = () => {
                editorImageRef.current = img;
                setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 }); setBrightness(100); setContrast(100);
                redrawCanvas();
            };
        }
    }, [isEditorOpen, imageToEdit]);

    const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => { isDragging.current = true; lastDragPos.current = { x: e.clientX, y: e.clientY }; };
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
        setIsEditorOpen(false); setImageToEdit('');
    };
    const handleCancelEdit = () => { setIsEditorOpen(false); setImageToEdit(''); };

    const validateField = useCallback((name: string, value: string) => {
        let error = '';
        switch (name) {
            case 'name': if (!value) error = t('errorRequired'); else if (value.trim().split(' ').length < 2) error = t('errorNameMinTwoWords'); break;
            case 'email': if (!value) error = t('errorRequired'); else if (!/\S+@\S+\.\S+/.test(value)) error = t('errorInvalidEmail'); break;
            case 'cpf': if (!value) error = t('errorRequired'); else if (value.replace(/\D/g, '').length !== 11) error = t('errorInvalidCPF'); break;
            case 'phone': if (!value) error = t('errorRequired'); else if (value.replace(/\D/g, '').length < 10) error = t('errorInvalidPhone'); break;
            case 'birthdate': if (!value) error = t('errorRequired'); else if (new Date(value) > new Date()) error = t('errorDateInFuture'); break;
            case 'maritalStatus': if (!value) error = t('errorRequired'); break;
            case 'cep': if (!value) error = t('errorRequired'); else if (value.replace(/\D/g, '').length !== 8) error = t('errorInvalidCEP'); break;
            case 'street': case 'number': case 'neighborhood': case 'city': case 'state': case 'unit': case 'occupation': case 'startTime': case 'lunchStart': case 'lunchEnd': case 'endTime':
                if (!value) error = t('errorRequired'); break;
        }
        return error;
    }, [t]);

    const resetForm = () => {
        setFormData(initialFormData);
        setErrors({});
        setUseSocialName(false);
        setPhoto(null);
        setSelectedSpecialties([]);
        setIsCreatingOccupation(false);
        setNewOccupation('');
        setAllowOvertime(false);
        setOpenSchedule(true);
        if (showCamera) handleStopCamera();
        setDocuments([]);
        setNewDocTitle('');
        setNewDocFile(null);
        if (docFileInputRef.current) { docFileInputRef.current.value = ''; }
    };

    useEffect(() => {
        if (isOpen) {
            if (professionalToEdit) {
                setUseSocialName(!!professionalToEdit.useSocialName);
                setFormData({
                    name: professionalToEdit.legalName || professionalToEdit.name || '',
                    socialName: professionalToEdit.socialName || '',
                    cpf: professionalToEdit.cpf || '',
                    birthdate: professionalToEdit.birthdate || '',
                    phone: professionalToEdit.phone || '',
                    email: professionalToEdit.email || '',
                    maritalStatus: professionalToEdit.maritalStatus || '',
                    cep: professionalToEdit.address?.cep || '',
                    street: professionalToEdit.address?.street || '',
                    number: professionalToEdit.address?.number || '',
                    addressComplement: professionalToEdit.address?.complement || '',
                    neighborhood: professionalToEdit.address?.neighborhood || '',
                    city: professionalToEdit.address?.city || '',
                    state: professionalToEdit.address?.state || '',
                    unit: professionalToEdit.unit || '',
                    occupation: professionalToEdit.occupation || '',
                    startTime: professionalToEdit.startTime || '',
                    lunchStart: professionalToEdit.lunchStart || '',
                    lunchEnd: professionalToEdit.lunchEnd || '',
                    endTime: professionalToEdit.endTime || '',
                });
                setPhoto(professionalToEdit.photo || null);
                setSelectedSpecialties(professionalToEdit.specialties || []);
                setAllowOvertime(professionalToEdit.allowOvertime || false);
                setOpenSchedule(professionalToEdit.openSchedule ?? true);
                if (professionalToEdit.occupation && !occupations.includes(professionalToEdit.occupation)) {
                    // This logic might need to be handled by the addOccupation/deleteOccupation from context
                    // For now, assuming occupations context handles its own state
                }
                setDocuments(professionalToEdit.documents?.map((doc: any) => ({
                    title: doc.title,
                    fileName: doc.fileName,
                    url: doc.url,
                    file: null
                })) || []);
            } else {
                resetForm();
            }
        }
    }, [isOpen, professionalToEdit, occupations]);

    const handleClose = () => { setIsExiting(true); handleStopCamera(); setTimeout(() => { onClose(); setIsExiting(false); }, 300); };
    const formatCPF = (value: string) => value.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    const formatPhone = (value: string) => value.replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\s\d{5})(\d)/, '$1-$2');
    const formatCEP = (value: string) => value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
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
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; const error = validateField(name, value); setErrors(prev => ({ ...prev, [name]: error })); if (name === 'cep' && !error) handleCepSearch(); };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (errors[name]) { const error = validateField(name, value); setErrors(prev => ({ ...prev, [name]: error })); }
        let formattedValue = value;
        if (name === 'cpf') formattedValue = formatCPF(value); else if (name === 'phone') formattedValue = formatPhone(value); else if (name === 'cep') formattedValue = formatCEP(value);
        setFormData(prev => { const newState = { ...prev, [name]: formattedValue }; return newState; });
    };
    const handleUseSocialNameChange = (e: React.ChangeEvent<HTMLInputElement>) => { const isChecked = e.target.checked; setUseSocialName(isChecked); };
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) { const reader = new FileReader(); reader.onload = (event) => { setImageToEdit(event.target?.result as string); setIsEditorOpen(true); }; reader.readAsDataURL(e.target.files[0]); }
    };
    const handleStopCamera = () => { if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop()); videoRef.current.srcObject = null; } setShowCamera(false); };
    const handleTakePhotoClick = async () => { setShowCamera(true); try { const stream = await navigator.mediaDevices.getUserMedia({ video: true }); if (videoRef.current) videoRef.current.srcObject = stream; } catch (err) { console.error("Erro na câmera: ", err); setShowCamera(false); } };
    const handleCapturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const { videoWidth, videoHeight } = videoRef.current;
            canvasRef.current.width = videoWidth; canvasRef.current.height = videoHeight;
            canvasRef.current.getContext('2d')?.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
            setImageToEdit(canvasRef.current.toDataURL('image/png'));
            setIsEditorOpen(true); handleStopCamera();
        }
    };
    const handleOccupationChange = (e: React.ChangeEvent<HTMLSelectElement>) => { if (e.target.value === '__CREATE_NEW__') setIsCreatingOccupation(true); else { setIsCreatingOccupation(false); handleChange(e); } };
    const handleCreateOccupation = async () => {
        if (newOccupation.trim()) {
            await addOccupation(newOccupation.trim());
            setFormData({ ...formData, occupation: newOccupation.trim() });
            setNewOccupation('');
            setIsCreatingOccupation(false);
        }
    };

    const handleDeleteOccupation = async (occ: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`Deseja realmente excluir o cargo "${occ}"?`)) {
            await deleteOccupation(occ);
            if (formData.occupation === occ) {
                setFormData({ ...formData, occupation: '' });
            }
        }
    };
    const handleAddSpecialty = (spec?: string | React.MouseEvent) => {
        const specToAdd = (typeof spec === 'string' ? spec : newSpecialty).trim();
        if (specToAdd && !selectedSpecialties.includes(specToAdd)) {
            setSelectedSpecialties(prev => [...prev, specToAdd]);
            if (!allSpecialties.includes(specToAdd)) setAllSpecialties(prev => [...prev, specToAdd].sort());
        }
        setNewSpecialty('');
    };
    const handleRemoveSpecialty = (specToRemove: string) => setSelectedSpecialties(selectedSpecialties.filter(s => s !== specToRemove));

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

    const handleAddDocument = () => {
        if (newDocTitle.trim() && newDocFile) {
            setDocuments(prev => [...prev, { title: newDocTitle, file: newDocFile }]);
            setNewDocTitle('');
            setNewDocFile(null);
            if (docFileInputRef.current) {
                docFileInputRef.current.value = '';
            }
        } else {
            alert('Por favor, preencha o título e selecione um arquivo PDF.');
        }
    };

    const handleRemoveDocument = (indexToRemove: number) => {
        setDocuments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { [key: string]: string } = {};
        const requiredFields: (keyof typeof initialFormData)[] = ['name', 'email', 'cpf', 'phone', 'birthdate', 'maritalStatus', 'cep', 'street', 'number', 'neighborhood', 'city', 'state', 'unit', 'occupation', 'startTime', 'lunchStart', 'lunchEnd', 'endTime'];
        requiredFields.forEach(field => { const error = validateField(field, formData[field as keyof typeof formData]); if (error) newErrors[field] = error; });
        if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

        setIsSaving(true);
        try {
            const uploadedDocs = await Promise.all(documents.map(async doc => {
                if (doc.file) {
                    const response = await uploadAPI.upload(doc.file, 'professional_docs');
                    return {
                        title: doc.title,
                        fileName: doc.file.name,
                        url: response.data.url
                    };
                }
                return {
                    title: doc.title,
                    fileName: doc.fileName,
                    url: (doc as any).url // Keep existing URL if any
                };
            }));

            const { cep, street, number, addressComplement, neighborhood, city, state, ...restOfData } = formData;

            const finalData = {
                id: professionalToEdit?.id,
                photo: photo || '',
                ...restOfData,
                address: { cep, street, number, complement: addressComplement, neighborhood, city, state },
                specialties: selectedSpecialties,
                openSchedule: openSchedule,
                documents: uploadedDocs,
                useSocialName,
            };
            onSave(finalData);
            handleClose();
        } catch (error) {
            console.error('Error saving professional:', error);
            alert('Erro ao salvar profissional. Verifique os documentos e tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen && !isExiting) return null;
    const title = professionalToEdit ? t('editProfessional') : t('newProfessional');

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
        if (showCamera) return (
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
                            {photo && !photo.includes('pravatar') ? (
                                <img className="h-20 w-20 object-cover rounded-full mx-auto" src={photo} alt="Foto" />
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
                        <InputField label={`${t('fullName')} *`} name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required error={errors.name} />
                        <InputField label={t('socialName')} name="socialName" value={formData.socialName} onChange={handleChange} />
                        <div className="md:col-span-2 flex items-center">
                            <input id="useSocialName" name="useSocialName" type="checkbox" checked={useSocialName} onChange={handleUseSocialNameChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                            <label htmlFor="useSocialName" className="ml-2 block text-sm text-gray-900">{t('useSocialNameAsPrimary')}</label>
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title={t('personalInformation')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="CPF *" name="cpf" value={formData.cpf} onChange={handleChange} onBlur={handleBlur} required maxLength={14} error={errors.cpf} />
                        <InputField label={`${t('birthDate')} *`} name="birthdate" value={formData.birthdate} onChange={handleChange} onBlur={handleBlur} type="date" required error={errors.birthdate} />
                        <SelectField
                            label={`${t('maritalStatus')} *`}
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
                            required
                            error={errors.maritalStatus}
                        />
                        <InputField label={`${t('phone')} *`} name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} type="tel" required maxLength={15} error={errors.phone} />
                        <div className="md:col-span-2">
                            <InputField label={`${t('email')} *`} name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} type="email" required error={errors.email} />
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title={t('address')}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-1">
                            <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP *</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} onBlur={handleBlur} required maxLength={9} placeholder="00000-000" className={`block w-full px-3 py-2 border rounded-md ${errors.cep ? 'border-red-500' : 'border-gray-300'}`} />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{isFetchingCep && <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}</div>
                            </div>
                            {errors.cep && <p className="mt-1 text-xs text-red-600">{errors.cep}</p>}
                        </div>
                        <div className="md:col-span-3"><InputField label="Rua *" name="street" value={formData.street} onChange={handleChange} onBlur={handleBlur} required error={errors.street} /></div>
                        <div className="md:col-span-1"><InputField label="Número *" name="number" value={formData.number} onChange={handleChange} onBlur={handleBlur} required error={errors.number} /></div>
                        <div className="md:col-span-1"><InputField label="Complemento" name="addressComplement" value={formData.addressComplement} onChange={handleChange} /></div>
                        <div className="md:col-span-2"><InputField label="Bairro *" name="neighborhood" value={formData.neighborhood} onChange={handleChange} onBlur={handleBlur} required error={errors.neighborhood} /></div>
                        <div className="md:col-span-2"><InputField label="Cidade *" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur} required error={errors.city} /></div>
                        <div className="md:col-span-2"><InputField label="Estado *" name="state" value={formData.state} onChange={handleChange} onBlur={handleBlur} required error={errors.state} /></div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title={t('workInformation')}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unidade de Atendimento *</label>
                            <select id="unit" name="unit" value={formData.unit} onChange={handleChange} onBlur={handleBlur} required className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${errors.unit ? 'border-red-500' : 'border-gray-300'}`}>
                                <option value="">Selecione...</option>
                                <option value="Ambas">Ambas as unidades</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.name}>{u.name}</option>
                                ))}
                            </select>
                            {errors.unit && <p className="text-xs text-red-600 mt-1">{errors.unit}</p>}
                        </div>
                        <div>
                            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">Cargo *</label>
                            <select id="occupation" name="occupation" value={isCreatingOccupation ? '__CREATE_NEW__' : formData.occupation} onChange={handleOccupationChange} onBlur={handleBlur} required className={`mt-1 block w-full p-2 border rounded-md shadow-sm ${errors.occupation ? 'border-red-500' : 'border-gray-300'}`}>
                                <option value="">{t('selectOccupation')}</option>
                                {occupations.map(occ => (
                                    <option key={occ} value={occ}>{occ}</option>
                                ))}
                                <option value="__CREATE_NEW__" className="font-bold text-primary">-- Criar novo cargo --</option>
                            </select>
                            {isCreatingOccupation && (
                                <div className="flex items-center gap-2 mt-2"><input type="text" value={newOccupation} onChange={(e) => setNewOccupation(e.target.value)} placeholder="Novo cargo" className="flex-grow p-2 border rounded" autoFocus /><button type="button" onClick={handleCreateOccupation} className="px-4 py-2 bg-gray-200 rounded">Criar</button></div>
                            )}

                            {/* Role management list */}
                            {!isCreatingOccupation && occupations.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {occupations.map(occ => (
                                        <span key={occ} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {occ}
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteOccupation(occ, e)}
                                                className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                title="Excluir cargo"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {errors.occupation && <p className="text-xs text-red-600 mt-1">{errors.occupation}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Especialidades</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="text" value={newSpecialty} onChange={e => setNewSpecialty(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecialty(); } }} placeholder="Digite e tecle Enter" className="flex-grow p-2 border rounded-md" />
                                <button type="button" onClick={handleAddSpecialty} className="px-4 py-2 bg-primary text-white font-bold rounded-md hover:bg-primary-dark transition-colors">Adicionar</button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {selectedSpecialties.map(spec => (<span key={spec} className="flex items-center gap-2 bg-primary/20 text-primary text-sm font-medium px-2 py-1 rounded-full">{spec}<button type="button" onClick={() => handleRemoveSpecialty(spec)} className="text-primary hover:text-red-500">&times;</button></span>))}
                            </div>
                        </div>
                    </div>
                    <CollapsibleSection title={t('workScheduleAndTimeClock')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <InputField label={`${t('startTime')} *`} name="startTime" value={formData.startTime} onChange={handleChange} onBlur={handleBlur} type="time" required error={errors.startTime} />
                                <InputField label={`${t('lunchStart')} *`} name="lunchStart" value={formData.lunchStart} onChange={handleChange} onBlur={handleBlur} type="time" required error={errors.lunchStart} />
                                <InputField label={`${t('lunchEnd')} *`} name="lunchEnd" value={formData.lunchEnd} onChange={handleChange} onBlur={handleBlur} type="time" required error={errors.lunchEnd} />
                                <InputField label={`${t('endTime')} *`} name="endTime" value={formData.endTime} onChange={handleChange} onBlur={handleBlur} type="time" required error={errors.endTime} />
                            </div>
                            <div className="md:col-span-2 mt-2">
                                <label className="flex items-center justify-between cursor-pointer p-3 bg-light rounded-lg border">
                                    <div>
                                        <span className="font-medium text-gray-700">{t('openScheduleForProfessional')}</span>
                                        <p className="text-sm text-gray-500">{t('openScheduleForProfessionalDesc')}</p>
                                    </div>
                                    <div className="relative inline-flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={openSchedule}
                                            onChange={(e) => setOpenSchedule(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </div>
                                </label>
                            </div>
                            <div className="md:col-span-2 mt-2">
                                <label className="flex items-center justify-between cursor-pointer p-3 bg-light rounded-lg border">
                                    <div><span className="font-medium text-gray-700">{t('allowOvertime')}</span><p className="text-sm text-gray-500">{t('allowOvertimeDesc')}</p></div>
                                    <div className="relative inline-flex items-center"><input type="checkbox" checked={allowOvertime} onChange={(e) => setAllowOvertime(e.target.checked)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div></div>
                                </label>
                            </div>
                        </div>
                    </CollapsibleSection>
                </CollapsibleSection>
                <CollapsibleSection title="Anexar Documentos">
                    <div className="space-y-4">
                        {documents.length > 0 && (
                            <div className="space-y-2">
                                {documents.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md text-sm">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            <div className="truncate">
                                                <p className="font-medium text-gray-800 truncate" title={doc.title}>{doc.title}</p>
                                                <p className="text-xs text-gray-500 truncate" title={doc.fileName || doc.file?.name}>{doc.fileName || doc.file?.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {(doc as any).url && (
                                                <>
                                                    <a
                                                        href={(doc as any).url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-700 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                                                        title="Visualizar documento"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </a>
                                                    <a
                                                        href={(doc as any).url}
                                                        download={doc.fileName || doc.title || 'documento.pdf'}
                                                        className="text-green-500 hover:text-green-700 p-1.5 rounded-full hover:bg-green-50 transition-colors"
                                                        title="Baixar documento"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                    </a>
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDocument(index)}
                                                className="text-red-500 hover:text-red-700 font-bold p-1 rounded-full flex-shrink-0"
                                            >
                                                &times;
                                            </button>
                                        </div>
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
                            </div>
                            <button
                                type="button"
                                onClick={handleAddDocument}
                                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary hover:text-primary transition-colors flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Adicionar Documento
                            </button>
                        </div>
                    </div>
                </CollapsibleSection>
            </>
        );
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
            <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-3xl ${isOpen && !isExiting ? 'scale-100' : 'scale-95'}`}>
                <form id="professional-form" onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900">{isEditorOpen ? 'Editar Foto' : showCamera ? t('capturePhoto') : title}</h3>
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
                                <button type="submit" form="professional-form" disabled={showCamera || isSaving} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark disabled:opacity-50">
                                    {isSaving ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Salvando...
                                        </>
                                    ) : 'Salvar'}
                                </button>
                                <button type="button" onClick={handleClose} disabled={showCamera || isSaving} className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:mr-3">{t('cancel')}</button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewProfessionalModal;