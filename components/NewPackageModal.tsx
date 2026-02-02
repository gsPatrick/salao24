import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

interface NewPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    itemToEdit?: any | null;
    categories: string[];
    onAddCategory: (category: string) => void;
    usageType?: string;
}

const initialFormData = { name: '', description: '', duration: '', price: '', sessions: '', category: '', unit: '' };

const NewPackageModal: React.FC<NewPackageModalProps> = ({ isOpen, onClose, onSave, itemToEdit, categories, onAddCategory, usageType }) => {
    const { t } = useLanguage();
    const { units } = useData();
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
    const [isExiting, setIsExiting] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const validateField = (name: keyof typeof formData, value: string) => {
        let error = '';
        if (!value && name !== 'description') { // Allow empty description if needed, or keep it strict
            error = t('errorRequired');
        } else if (name === 'price' && value && !/^\d+([,.]\d{1,2})?$/.test(value)) {
            error = t('errorInvalidCurrency');
        } else if (name === 'sessions' && value && (isNaN(Number(value)) || Number(value) <= 0)) {
            error = t('errorPositiveNumber');
        }
        return error;
    };

    useEffect(() => {
        if (isOpen) {
            setFormData(itemToEdit ? { ...initialFormData, ...itemToEdit } : initialFormData);
            setIsFavorite(itemToEdit?.isFavorite || false);
            setErrors({});
        } else {
            setIsCreatingCategory(false);
            setNewCategory('');
        }
    }, [isOpen, itemToEdit]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => { onClose(); setIsExiting(false); }, 300);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const name = e.target.name as keyof typeof formData;
        const { value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setErrors(prev => ({ ...prev, [name]: validateField(name as keyof typeof formData, value) }));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === '__CREATE_NEW__') {
            setIsCreatingCategory(true);
        } else {
            setIsCreatingCategory(false);
            handleChange(e);
        }
        if (errors.category) {
            setErrors(prev => ({ ...prev, category: '' }));
        }
    };

    const handleCreateCategory = () => {
        const trimmedCategory = newCategory.trim();
        if (trimmedCategory) {
            onAddCategory(trimmedCategory);
            setFormData(prev => ({ ...prev, category: trimmedCategory }));
            setIsCreatingCategory(false);
            setNewCategory('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Partial<Record<keyof typeof formData, string>> = {};
        const fieldsToValidate: (keyof typeof formData)[] = ['name', 'price', 'sessions', 'category', 'unit'];
        fieldsToValidate.forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const sanitizedPrice = formData.price.replace(',', '.');
        onSave({ ...itemToEdit, ...formData, price: sanitizedPrice, sessions: Number(formData.sessions) || formData.sessions, isFavorite, usageType: itemToEdit?.usageType || usageType || 'Serviços' });
        handleClose();
    };

    const isFormValid = useMemo(() => {
        // Validation for required fields
        const required = ['name', 'price', 'sessions', 'category', 'unit'];
        const hasAllRequired = required.every(field => !!formData[field as keyof typeof formData]);
        const hasNoErrors = Object.values(errors).every(error => !error);
        return hasAllRequired && hasNoErrors;
    }, [formData, errors]);

    if (!isOpen && !isExiting) return null;

    const title = itemToEdit ? 'Editar Pacote' : 'Novo Pacote';

    const renderInput = (name: keyof typeof formData, placeholder: string, type = 'text') => (
        <div>
            <input name={name} type={type} value={formData[name as keyof typeof formData]} onChange={handleChange} onBlur={handleBlur} placeholder={placeholder} required className={`w-full p-2 border rounded ${errors[name] ? 'border-red-500' : 'border-gray-300'}`} />
            {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name]}</p>}
        </div>
    );

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
            <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-lg ${isOpen && !isExiting ? 'scale-100' : 'scale-95'}`}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-secondary">{title}</h3>
                        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            {renderInput('name', 'Nome do Pacote')}
                            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" className="w-full p-2 border rounded" />
                            {renderInput('duration', 'Duração (por sessão)')}
                            {renderInput('price', 'Preço do Pacote (ex: 100,00)')}
                            {renderInput('sessions', 'Quantidade de Sessões', 'number')}
                            <div>
                                <select name="category" value={isCreatingCategory ? '__CREATE_NEW__' : formData.category} onChange={handleCategoryChange} onBlur={handleBlur} required className={`w-full p-2 border rounded ${errors.category ? 'border-red-500' : 'border-gray-300'}`}>
                                    <option value="">Selecione a Categoria</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    <option value="__CREATE_NEW__" className="font-bold text-primary">-- Criar nova categoria --</option>
                                </select>
                                {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
                            </div>
                            {isCreatingCategory && (
                                <div className="flex items-center gap-2 mt-2 p-3 bg-light rounded-md border animate-fade-in">
                                    <input
                                        type="text"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }}
                                        placeholder="Nome da nova categoria"
                                        className="flex-grow p-2 border rounded"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCreateCategory}
                                        disabled={!newCategory.trim()}
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
                                    >
                                        Criar
                                    </button>
                                </div>
                            )}
                            <div>
                                <select name="unit" value={formData.unit} onChange={handleChange} onBlur={handleBlur} required className={`w-full p-2 border rounded ${errors.unit ? 'border-red-500' : 'border-gray-300'}`}>
                                    <option value="">Selecione a Unidade</option>
                                    <option value="Ambas">Ambas as unidades</option>
                                    {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                </select>
                                {errors.unit && <p className="text-xs text-red-600 mt-1">{errors.unit}</p>}
                            </div>
                            <div className="flex items-center pt-2">
                                <input
                                    id="isFavoritePackage"
                                    name="isFavoritePackage"
                                    type="checkbox"
                                    checked={isFavorite}
                                    onChange={(e) => setIsFavorite(e.target.checked)}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <label htmlFor="isFavoritePackage" className="ml-2 block text-sm text-gray-900">
                                    Marcar como favorito
                                </label>
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
export default NewPackageModal;