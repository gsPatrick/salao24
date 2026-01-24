import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Props for the modal
interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  itemToEdit?: any | null;
  categories: string[];
  onAddCategory: (category: string) => void;
  onUpdateCategory: (oldCategory: string, newCategory: string) => void;
  onDeleteCategory: (category: string) => void;
}

const initialFormData = { name: '', description: '', duration: '', price: '', category: '', unit: '' };

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

export const NewServiceModal: React.FC<NewServiceModalProps> = ({ isOpen, onClose, onSave, itemToEdit, categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState(initialFormData);
    // FIX: Broaden the type of the 'errors' state to 'any' for its values to resolve a TypeScript type error on assignment.
    const [errors, setErrors] = useState<{ [key: string]: any }>({});
    const [isExiting, setIsExiting] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ index: number; name: string } | null>(null);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

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
            setIsFavorite(itemToEdit?.isFavorite || false);
            setErrors({});
        }
    }, [isOpen, itemToEdit]);

    const handleClose = () => {
        setIsExiting(true);
        setEditingCategory(null);
        setIsCreatingCategory(false);
        setTimeout(() => {
            onClose();
            setIsExiting(false);
        }, 300);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: validateField(name as keyof typeof formData, value) }));
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
            setNewCategory('');
            setIsCreatingCategory(false);
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
        // FIX: Replaced an unsafe for...in loop with a strongly-typed array to iterate over formData properties, preventing type errors.
        const newErrors: Partial<Record<keyof typeof formData, string>> = {};
        const fieldsToValidate: (keyof typeof formData)[] = ['name', 'description', 'duration', 'price', 'category', 'unit'];
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

        onSave({ ...itemToEdit, ...formData, isFavorite });
        handleClose();
    };
    
    const isFormValid = useMemo(() => {
        return Object.values(formData).every(value => !!value) && Object.values(errors).every(error => !error);
    }, [formData, errors]);

    if (!isOpen && !isExiting) return null;
    
    const title = itemToEdit ? 'Editar Serviço' : 'Novo Serviço';

    const renderInput = (name: keyof typeof formData, placeholder: string, type = 'text') => (
        <div>
            <input name={name} value={formData[name as keyof typeof formData]} onChange={handleChange} onBlur={handleBlur} placeholder={placeholder} required className={`w-full p-2 border rounded ${errors[name] ? 'border-red-500' : 'border-gray-300'}`} />
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
                            {renderInput('name', 'Nome do Serviço')}
                            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" required className="w-full p-2 border rounded" />
                            {renderInput('duration', 'Duração (em minutos)')}
                            {renderInput('price', 'Preço (ex: 100,00)')}
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
                                                    onKeyDown={(e) => { if(e.key === 'Enter') handleUpdateCategory(cat); }}
                                                    className="text-sm p-1 border rounded w-full"
                                                    autoFocus
                                                />
                                            ) : (
                                                <>
                                                    <span className="text-sm text-gray-800">{cat}</span>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button type="button" onClick={() => handleStartEditing(index, cat)} className="text-blue-500 hover:text-blue-700"><EditIcon/></button>
                                                        <button type="button" onClick={() => onDeleteCategory(cat)} className="text-red-500 hover:text-red-700"><TrashIcon/></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <select name="unit" value={formData.unit} onChange={handleChange} onBlur={handleBlur} required className={`w-full p-2 border rounded ${errors.unit ? 'border-red-500' : 'border-gray-300'}`}>
                                    <option value="">Selecione a Unidade</option>
                                    <option>Unidade Matriz</option>
                                    <option>Unidade Filial</option>
                                    <option>Ambas</option>
                                </select>
                                {errors.unit && <p className="text-xs text-red-600 mt-1">{errors.unit}</p>}
                            </div>
                            <div className="flex items-center pt-2">
                                <input
                                    id="isFavoriteService"
                                    name="isFavoriteService"
                                    type="checkbox"
                                    checked={isFavorite}
                                    onChange={(e) => setIsFavorite(e.target.checked)}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <label htmlFor="isFavoriteService" className="ml-2 block text-sm text-gray-900">
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
