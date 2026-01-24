import React, { useState, useEffect } from 'react';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  itemToEdit?: any | null;
  categories: string[];
  onAddCategory: (category: string) => void;
}

const initialFormData = {
  name: '',
  category: '',
  purchaseValue: '',
  quantity: '',
  lowStockAlert: '',
  status: 'Ativo',
};

const NewProductModal: React.FC<NewProductModalProps> = ({ isOpen, onClose, onSave, itemToEdit, categories, onAddCategory }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isExiting, setIsExiting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

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
                <select name="category" value={isCreatingCategory ? '__CREATE_NEW__' : formData.category} onChange={handleCategoryChange} required className="w-full p-2 border rounded bg-white text-gray-900">
                  <option value="">Selecione a Categoria</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="__CREATE_NEW__" className="font-bold text-primary">-- Criar nova categoria --</option>
                </select>
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
              <input name="purchaseValue" value={formData.purchaseValue} onChange={handleChange} placeholder="Valor da Compra (ex: 25,00)" required className="w-full p-2 border rounded" />
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