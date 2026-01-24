import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Product {
    id: number;
    name: string;
    category: string;
    purchaseValue: string;
    quantity: number;
    lowStockAlert: number;
    suspended?: boolean;
    isFavorite?: boolean;
    [key: string]: any;
}

interface StockPageProps {
    onBack?: () => void;
    products: Product[];
    onSaveProduct: (product: Partial<Product>) => void;
    onDeleteProduct: (id: number) => void;
    onSuspendProduct: (id: number) => void;
    onUpdateQuantity: (id: number, change: number) => void;
    onToggleFavorite?: (id: number) => void;
    onComingSoon?: (featureName: string) => void;
}

const StockPage: React.FC<StockPageProps> = ({
    onBack,
    products,
    onSaveProduct,
    onDeleteProduct,
    onSuspendProduct,
    onUpdateQuantity,
    onToggleFavorite,
    onComingSoon
}) => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [view, setView] = useState<'all' | 'lowStock' | 'suspended'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category).filter(Boolean));
        return Array.from(cats);
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

            if (view === 'all') return matchesSearch && matchesCategory && !product.suspended;
            if (view === 'lowStock') return matchesSearch && matchesCategory && !product.suspended && product.quantity <= product.lowStockAlert;
            if (view === 'suspended') return matchesSearch && matchesCategory && product.suspended;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, view, selectedCategory]);

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const product: Partial<Product> = {
            id: productToEdit?.id,
            name: formData.get('name') as string,
            category: formData.get('category') as string,
            purchaseValue: formData.get('purchaseValue') as string,
            quantity: parseInt(formData.get('quantity') as string) || 0,
            lowStockAlert: parseInt(formData.get('lowStockAlert') as string) || 5,
        };
        onSaveProduct(product);
        setIsModalOpen(false);
        setProductToEdit(null);
    };

    const handleEdit = (product: Product) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
            onDeleteProduct(id);
        }
    };

    const formatPrice = (price: string | number) => {
        const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.')) : price;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numPrice || 0);
    };

    const totalProducts = products.filter(p => !p.suspended).length;
    const lowStockCount = products.filter(p => !p.suspended && p.quantity <= p.lowStockAlert).length;
    const suspendedCount = products.filter(p => p.suspended).length;
    const totalValue = products.filter(p => !p.suspended).reduce((sum, p) => {
        const price = typeof p.purchaseValue === 'string'
            ? parseFloat(p.purchaseValue.replace(/[^\d.,]/g, '').replace(',', '.'))
            : p.purchaseValue;
        return sum + (price * p.quantity || 0);
    }, 0);

    return (
        <div className="container mx-auto px-6 py-8">
            {onBack && (
                <button onClick={onBack} className="mb-6 flex items-center text-primary hover:text-primary-dark font-semibold transition-colors">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar ao Dashboard
                </button>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-lg">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">Estoque</h1>
                        <p className="text-gray-500 mt-1">Gerencie seus produtos e controle de estoque</p>
                    </div>
                    <button
                        onClick={() => { setProductToEdit(null); setIsModalOpen(true); }}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Novo Produto
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-primary">{totalProducts}</p>
                        <p className="text-sm text-gray-600">Produtos Ativos</p>
                    </div>
                    <div className={`bg-gradient-to-br ${lowStockCount > 0 ? 'from-red-100 to-red-50' : 'from-green-100 to-green-50'} p-4 rounded-xl text-center`}>
                        <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{lowStockCount}</p>
                        <p className="text-sm text-gray-600">Estoque Baixo</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-blue-600">{formatPrice(totalValue)}</p>
                        <p className="text-sm text-gray-600">Valor Total</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-100 to-gray-50 p-4 rounded-xl text-center">
                        <p className="text-2xl font-bold text-gray-600">{suspendedCount}</p>
                        <p className="text-sm text-gray-600">Suspensos</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por nome ou categoria..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    {categories.length > 0 && (
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        >
                            <option value="all">Todas as Categorias</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setView('all')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'all' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Todos ({totalProducts})
                        </button>
                        <button
                            onClick={() => setView('lowStock')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${view === 'lowStock' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {lowStockCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                            Estoque Baixo ({lowStockCount})
                        </button>
                        <button
                            onClick={() => setView('suspended')}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${view === 'suspended' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Suspensos ({suspendedCount})
                        </button>
                    </nav>
                </div>

                {/* Products Grid */}
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                className={`bg-light p-5 rounded-xl border-2 transition-all group ${product.quantity <= product.lowStockAlert && !product.suspended
                                        ? 'border-red-200 bg-red-50/50'
                                        : 'border-transparent hover:border-primary'
                                    } ${product.suspended ? 'opacity-60' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-secondary">{product.name}</h3>
                                            {product.isFavorite && (
                                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            )}
                                        </div>
                                        {product.category && (
                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                                {product.category}
                                            </span>
                                        )}
                                    </div>
                                    {onToggleFavorite && (
                                        <button
                                            onClick={() => onToggleFavorite(product.id)}
                                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill={product.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-bold text-primary">{formatPrice(product.purchaseValue)}</span>
                                    <div className={`text-sm font-bold px-3 py-1 rounded-full ${product.quantity <= product.lowStockAlert
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                        {product.quantity} un
                                    </div>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center justify-center gap-3 mb-4 bg-white p-2 rounded-lg">
                                    <button
                                        onClick={() => onUpdateQuantity(product.id, -1)}
                                        disabled={product.quantity <= 0}
                                        className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <span className="font-bold text-lg text-secondary w-12 text-center">{product.quantity}</span>
                                    <button
                                        onClick={() => onUpdateQuantity(product.id, 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </button>
                                </div>

                                {product.quantity <= product.lowStockAlert && !product.suspended && (
                                    <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded text-center mb-3">
                                        ⚠️ Estoque baixo! Mínimo: {product.lowStockAlert}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="flex-1 py-1 px-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => onSuspendProduct(product.id)}
                                        className={`flex-1 py-1 px-2 text-xs rounded ${product.suspended ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                                    >
                                        {product.suspended ? 'Ativar' : 'Suspender'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteConfirm(product.id)}
                                        className="flex-1 py-1 px-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-light rounded-lg">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-gray-500 font-medium">Nenhum produto encontrado</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {searchQuery ? 'Tente ajustar sua busca' : 'Adicione seu primeiro produto ao estoque'}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {productToEdit ? 'Editar Produto' : 'Novo Produto'}
                                </h2>
                                <button onClick={() => { setIsModalOpen(false); setProductToEdit(null); }} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto*</label>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        defaultValue={productToEdit?.name || ''}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        placeholder="Ex: Shampoo Profissional"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <input
                                        name="category"
                                        type="text"
                                        defaultValue={productToEdit?.category || ''}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        placeholder="Ex: Cabelo, Maquiagem, Unhas"
                                        list="categories"
                                    />
                                    <datalist id="categories">
                                        {categories.map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor de Compra*</label>
                                        <input
                                            name="purchaseValue"
                                            type="text"
                                            required
                                            defaultValue={productToEdit?.purchaseValue || ''}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                            placeholder="Ex: R$ 25,00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade*</label>
                                        <input
                                            name="quantity"
                                            type="number"
                                            min="0"
                                            required
                                            defaultValue={productToEdit?.quantity || 0}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alerta de Estoque Baixo</label>
                                    <input
                                        name="lowStockAlert"
                                        type="number"
                                        min="0"
                                        defaultValue={productToEdit?.lowStockAlert || 5}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        placeholder="Alerta quando quantidade for menor ou igual"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Você será alertado quando a quantidade estiver igual ou abaixo deste valor</p>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsModalOpen(false); setProductToEdit(null); }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                                    >
                                        {productToEdit ? 'Salvar Alterações' : 'Criar Produto'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockPage;
