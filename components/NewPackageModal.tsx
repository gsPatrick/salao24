import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { NumericFormat } from 'react-number-format';
import { displayDuration, parseDurationToMinutes, parseCurrencyToNumber } from '../lib/formatUtils';

interface NewPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    itemToEdit?: any | null;
    categories: string[];
    onAddCategory: (category: string) => void;
    onUpdateCategory: (oldCategory: string, newCategory: string) => void;
    onDeleteCategory: (category: string) => void;
    usageType?: string;
}

const initialFormData = { name: '', description: '', duration: '', price: '', sessions: '', category: '', unit: '', unit_id: '' };

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const NewPackageModal: React.FC<NewPackageModalProps> = ({ isOpen, onClose, onSave, itemToEdit, categories, onAddCategory, onUpdateCategory, onDeleteCategory, usageType }) => {
    const { t } = useLanguage();
    const { units, refreshUnits } = useData();
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        if (isOpen) {
            refreshUnits();
        }
    }, [isOpen, refreshUnits]);
    const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
    const [isExiting, setIsExiting] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ index: number; name: string } | null>(null);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const validateField = (name: keyof typeof formData, value: string) => {
        let error = '';
        if (!value && name !== 'description') { // Allow empty description if needed, or keep it strict
            error = t('errorRequired');
        } else if (name === 'price' && value) {
            // Updated regex to allow "1.000,00", "1000,00", "1500" etc.
            const currencyRegex = /^(\d{1,3}(\.\d{3})*|\d+)([,.]\d{1,2})?$/;
            if (!currencyRegex.test(value)) {
                error = t('errorInvalidCurrency');
            }
        } else if (name === 'sessions' && value && (isNaN(Number(value)) || Number(value) <= 0)) {
            error = t('errorPositiveNumber');
        }
        return error;
    };

    useEffect(() => {
        if (isOpen) {
            let initialData = itemToEdit ? { ...initialFormData, ...itemToEdit } : initialFormData;

            // Null safety: prevent null values from database from triggering validation errors
            initialData.category = initialData.category || '';
            initialData.unit = initialData.unit || '';
            initialData.price = initialData.price ? String(initialData.price) : '';
            initialData.duration = initialData.duration ? displayDuration(initialData.duration) : '';
            initialData.sessions = initialData.sessions ? String(initialData.sessions) : '';

            // Robust unit resolution: if unit_id is missing but unit name is present, try to find the ID
            if (initialData.unit && !initialData.unit_id && initialData.unit !== 'Ambas' && units.length > 0) {
                const foundUnit = units.find(u => u.name === initialData.unit);
                if (foundUnit) {
                    initialData.unit_id = String(foundUnit.id);
                }
            }

            setFormData(initialData);
            setIsFavorite(itemToEdit?.isFavorite || false);
            setErrors({});
        } else {
            setIsCreatingCategory(false);
            setNewCategory('');
        }
    }, [isOpen, itemToEdit, units]);

    const handleClose = () => {
        setIsExiting(true);
        setEditingCategory(null);
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
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        if (errors.category) {
            setErrors(prev => ({ ...prev, category: '' }));
        }
    };

    const handleQuantityChange = (delta: number) => {
        if (!!itemToEdit) return; // Prevent change if read-only
        const current = Number(formData.sessions) || 0;
        const next = Math.max(1, current + delta);
        setFormData(prev => ({ ...prev, sessions: String(next) }));
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

    const handleStartEditing = (index: number, name: string) => {
        setEditingCategory({ index, name });
    };

    const handleUpdateCategory = (originalCategoryName: string) => {
        if (editingCategory) {
            onUpdateCategory(originalCategoryName, editingCategory.name);
            if (formData.category === originalCategoryName) {
                setFormData(prev => ({ ...prev, category: editingCategory.name.trim() }));
            }
            setEditingCategory(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Partial<Record<keyof typeof formData, string>> = {};
        const fieldsToValidate: (keyof typeof formData)[] = ['name', 'price', 'sessions', 'category', 'unit'];
        fieldsToValidate.forEach(key => {
            const val = key === 'unit' ? (formData.unit_id || formData.unit) : formData[key];
            const error = validateField(key, val);
            if (error) {
                newErrors[key] = error;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Clean price: remove dots (thousands) and replace comma with dot (decimal)
        const sanitizedPrice = parseCurrencyToNumber(formData.price);
        const sanitizedDuration = parseDurationToMinutes(formData.duration);
        onSave({ ...itemToEdit, ...formData, price: sanitizedPrice, duration: sanitizedDuration, sessions: Number(formData.sessions) || formData.sessions, isFavorite, usageType: itemToEdit?.usageType || usageType || 'Serviços' });
        handleClose();
    };

    const isFormValid = useMemo(() => {
        // Validation for required fields
        const required = ['name', 'price', 'sessions', 'category', 'unit'];
        const hasAllRequired = required.every(field => {
            if (field === 'unit') return !!(formData.unit_id || formData.unit);
            return !!formData[field as keyof typeof formData];
        });
        const hasNoErrors = Object.values(errors).every(error => !error);
        return hasAllRequired && hasNoErrors;
    }, [formData, errors]);

    const isReadOnly = !!itemToEdit;

    if (!isOpen && !isExiting) return null;

    const title = itemToEdit ? 'Editar Pacote' : 'Novo Pacote';

    const renderInput = (name: keyof typeof formData, placeholder: string, type = 'text', disabled = false) => (
        <div>
            <input
                name={name}
                type={type}
                value={formData[name as keyof typeof formData]}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                required
                disabled={disabled}
                className={`w-full p-2 border rounded ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'} ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
            />
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
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Descrição"
                                className="w-full p-2 border rounded border-gray-300"
                            />
                            <div>
                                <NumericFormat
                                    format="##:##"
                                    placeholder="Duração (HH:mm)"
                                    mask="_"
                                    name="duration"
                                    value={formData.duration}
                                    onValueChange={(values) => {
                                        setFormData(prev => ({ ...prev, duration: values.formattedValue }));
                                    }}
                                    className={`w-full p-2 border rounded border-gray-300 ${errors.duration ? 'border-red-500' : ''}`}
                                />
                                <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase font-bold tracking-wider">Tempo por Sessão (HH:mm)</p>
                                {errors.duration && <p className="text-xs text-red-600 mt-1">{errors.duration}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex-grow">
                                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => handleQuantityChange(-1)}
                                            disabled={isReadOnly}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="text"
                                            name="sessions"
                                            value={formData.sessions}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            placeholder="Sessões"
                                            required
                                            disabled={isReadOnly}
                                            className={`w-full p-2 text-center border-none focus:ring-0 ${isReadOnly ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleQuantityChange(1)}
                                            disabled={isReadOnly}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase font-bold tracking-wider">Quantidade de Sessões</p>
                                    {errors.sessions && <p className="text-xs text-red-600 mt-1">{errors.sessions}</p>}
                                </div>
                                <div className="w-1/3">
                                    <NumericFormat
                                        name="price"
                                        value={formData.price}
                                        onValueChange={(values) => {
                                            setFormData(prev => ({ ...prev, price: values.value }));
                                        }}
                                        placeholder="Valor R$"
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        prefix="R$ "
                                        decimalScale={2}
                                        fixedDecimalScale
                                        disabled={isReadOnly}
                                        className={`w-full p-2 border rounded ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'} ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase font-bold tracking-wider">Valor do Pacote</p>
                                </div>
                            </div>
                            <div>
                                <select
                                    name="category"
                                    value={isCreatingCategory ? '__CREATE_NEW__' : formData.category}
                                    onChange={handleCategoryChange}
                                    onBlur={handleBlur}
                                    required
                                    disabled={isReadOnly}
                                    className={`w-full p-2 border rounded ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'} ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Selecione a Categoria</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    {!isReadOnly && <option value="__CREATE_NEW__" className="font-bold text-primary">-- Criar nova categoria --</option>}
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
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Gerenciar Categorias</h4>
                                <div className="space-y-2 max-h-32 overflow-y-auto border p-2 rounded-md bg-white">
                                    {categories.map((cat, index) => (
                                        <div key={index} className="flex items-center justify-between p-1 group">
                                            {editingCategory?.index === index ? (
                                                <input
                                                    type="text"
                                                    value={editingCategory.name}
                                                    onChange={(e) => setEditingCategory({ index, name: e.target.value })}
                                                    onBlur={() => handleUpdateCategory(cat)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUpdateCategory(cat); } }}
                                                    className="text-sm p-1 border rounded w-full"
                                                    autoFocus
                                                />
                                            ) : (
                                                <>
                                                    <span className="text-sm text-gray-800">{cat}</span>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button type="button" onClick={() => handleStartEditing(index, cat)} className="text-blue-500 hover:text-blue-700"><EditIcon /></button>
                                                        <button type="button" onClick={() => onDeleteCategory(cat)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <select
                                    name="unit"
                                    value={formData.unit_id ? String(formData.unit_id) : (formData.unit || '')}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'Ambas') {
                                            setFormData(prev => ({ ...prev, unit: 'Ambas', unit_id: '' }));
                                        } else {
                                            const u = units.find(unit => String(unit.id) === val || unit.name === val);
                                            setFormData(prev => ({ ...prev, unit: u ? u.name : val, unit_id: u ? String(u.id) : '' }));
                                        }
                                    }}
                                    onBlur={handleBlur}
                                    required
                                    disabled={isReadOnly}
                                    className={`w-full p-2 border rounded ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'} ${errors.unit ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Selecione a Unidade</option>
                                    {units.map(u => (
                                        <option key={u.id} value={String(u.id)}>{u.name}</option>
                                    ))}
                                    <option value="Ambas">Ambas</option>
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
                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className={`px-4 py-2 text-white rounded-md transition-colors ${isFormValid ? 'bg-primary hover:bg-primary-dark' : 'bg-gray-400 cursor-not-allowed'}`}
                        >
                            Salvar
                        </button>
                        <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md mr-2 hover:bg-gray-50 transition-colors">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default NewPackageModal;