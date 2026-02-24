import React, { useState, useEffect } from 'react';
import CurrencyInput from './common/CurrencyInput';
import { parseCurrencyToNumber } from '../lib/formatUtils';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  itemToEdit?: any | null;
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

const initialFormData = {
  name: '',
  category: '',
  purchaseValue: '',
  quantity: '',
  lowStockAlert: '',
  status: 'Ativo',
};

const NewProductModal: React.FC<NewProductModalProps> = ({ isOpen, onClose, onSave, itemToEdit, categories, onAddCategory, onDeleteCategory }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isExiting, setIsExiting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setFormData({
          name: itemToEdit.name || '',
          category: itemToEdit.category || '',
          purchaseValue: itemToEdit.purchaseValue || '',
          quantity: String(itemToEdit.quantity || ''),
          lowStockAlert: String(itemToEdit.lowStockAlert || ''),
          status: itemToEdit.suspended ? 'Suspenso' : 'Ativo'
        });
      } else {
        setFormData(initialFormData);
      }
    } else {
      setIsCreatingCategory(false);
      setNewCategory('');
    }
  }, [isOpen, itemToEdit]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__CREATE_NEW__') {
      setIsCreatingCategory(true);
    } else {
      setIsCreatingCategory(false);
      handleChange(e);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...itemToEdit,
      ...formData,
      purchaseValue: parseFloat(parseCurrencyToNumber(formData.purchaseValue)) || 0,
      quantity: Number(formData.quantity) || 0,
      lowStockAlert: Number(formData.lowStockAlert) || 0,
      suspended: formData.status === 'Suspenso'
    });
    handleClose();
  };

  if (!isOpen && !isExiting) return null;

  const title = itemToEdit ? 'Editar Produto' : 'Novo Produto';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-lg ${isOpen && !isExiting ? 'scale-100' : 'scale-95'}`}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-secondary">{title}</h3>
            <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Produto" required className="w-full p-2 border rounded" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <div className="relative">
                  <div
                    onClick={() => !isExiting && setShowCategoryManager(!showCategoryManager)}
                    className="w-full p-2 border rounded bg-white text-gray-900 cursor-pointer flex justify-between items-center"
                  >
                    <span>{formData.category || "Selecione a Categoria"}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${showCategoryManager ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {showCategoryManager && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase">Gerenciar Categorias</span>
                        <button
                          type="button"
                          onClick={() => { setIsCreatingCategory(true); setShowCategoryManager(false); }}
                          className="text-xs text-primary font-bold hover:underline"
                        >
                          + Nova
                        </button>
                      </div>
                      {categories.map((cat) => (
                        <div
                          key={cat}
                          className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer group"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, category: cat }));
                            setShowCategoryManager(false);
                          }}
                        >
                          <span className="text-sm text-gray-700">{cat}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Excluir categoria "${cat}"?`)) {
                                onDeleteCategory(cat);
                                if (formData.category === cat) setFormData(prev => ({ ...prev, category: '' }));
                              }
                            }}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Excluir categoria"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {categories.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-400">Nenhuma categoria encontrada.</div>
                      )}
                    </div>
                  )}
                </div>
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
              <CurrencyInput
                value={formData.purchaseValue}
                onChange={(val) => setFormData(prev => ({ ...prev, purchaseValue: val }))}
                label="Valor da Compra"
                placeholder="R$ 0,00"
              />
              <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} placeholder="Quantidade" required className="w-full p-2 border rounded" />
              <input name="lowStockAlert" type="number" value={formData.lowStockAlert} onChange={handleChange} placeholder="Alerta de Estoque Baixo (Qtd.)" required className="w-full p-2 border rounded" />
              <select name="status" value={formData.status} onChange={handleChange} required className="w-full p-2 border rounded bg-white text-gray-900">
                <option value="Ativo">Ativo</option>
                <option value="Suspenso">Suspenso</option>
              </select>
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

export default NewProductModal;