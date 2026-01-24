import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  itemToEdit?: any | null;
  categories: string[];
  onAddCategory: (category: string) => void;
}

const initialFormData = { name: '', description: '', duration: '', price: '', sessions: '', category: '', unit: '' };

const NewPlanModal: React.FC<NewPlanModalProps> = ({ isOpen, onClose, onSave, itemToEdit, categories, onAddCategory }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState(initialFormData);
    // FIX: Broaden the type of the 'errors' state to 'any' for its values to resolve a TypeScript type error on assignment.
    const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
    const [isExiting, setIsExiting] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    
    // FIX: Changed 'name' type from string to keyof typeof formData to prevent type errors when indexing.
    const validateField = (name: keyof typeof formData, value: string) => {
        let error = '';
        if (!value) {
            error = t('errorRequired');
        } else if (name === 'price' && !/^\d+([,.]\d{1,2})?$/.test(value)) {
            error = t('errorInvalidCurrency');
        }
        return error;
    };


    useEffect(() => {
        if (isOpen) {
            setFormData(itemToEdit ? { ...initialFormData, ...itemToEdit } : initialFormData);
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
            setErrors(prev => ({ ...prev, category: ''}));
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
        // FIX: Refactored to iterate over a defined list of keys instead of using a for...in loop for improved type safety.
        const newErrors: Partial<Record<keyof typeof formData, string>> = {};
        const fieldsToValidate: (keyof typeof formData)[] = ['name', 'description', 'duration', 'price', 'sessions', 'category', 'unit'];
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
        onSave({ ...itemToEdit, ...formData });
        handleClose();
    };
    
    const isFormValid = useMemo(() => {
        return Object.values(formData).every(value => !!value) && Object.values(errors).every(error => !error);
    }, [formData, errors]);
    
    if (!isOpen && !isExiting) return null;
    
    const title = itemToEdit ? 'Editar Plano' : 'Novo Plano';
    
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
                            {renderInput('name', 'Nome do Plano')}
                            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" required className="w-full p-2 border rounded" />
                            {renderInput('duration', 'Duração/Validade (ex: 15 dias)')}
                            {renderInput('price', 'Preço Mensal (ex: 180,00)')}
                            {renderInput('sessions', 'Quantidade de Sessões (ex: Ilimitadas)')}
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
                                    <option>Unidade Matriz</option>
                                    <option>Unidade Filial</option>
                                    <option>Ambas</option>
                                </select>
                                {errors.unit && <p className="text-xs text-red-600 mt-1">{errors.unit}</p>}
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
export default NewPlanModal;