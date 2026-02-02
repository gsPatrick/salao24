import React, { useState, useEffect } from 'react';
import NewProductModal from './NewProductModal';
import { useData, Product } from '../contexts/DataContext';

interface StockPageProps {
    onBack?: () => void;
}

const StarIconOutline = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const StarIconSolid = ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const StockPage: React.FC<StockPageProps> = ({
    onBack,
}) => {
    const {
        products,
        saveProduct: onSaveProduct,
        deleteProduct: onDeleteProduct,
        toggleSuspendProduct: onSuspendProduct,
        updateStockQuantity: onUpdateQuantity,
        toggleFavoriteProduct: onToggleFavorite,
    } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [filterQuery, setFilterQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

    const [productCategories, setProductCategories] = useState<string[]>([]);

    useEffect(() => {
        const uniqueCategories = [...new Set(products.map(p => p.category))];
        setProductCategories(uniqueCategories.sort());
    }, [products]);

    const handleAddCategory = (newCategory: string) => {
        const trimmedCategory = newCategory.trim();
        if (trimmedCategory && !productCategories.includes(trimmedCategory)) {
            setProductCategories(prev => [...prev, trimmedCategory].sort());
        }
    };

    const handleOpenModal = () => {
        setProductToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setProductToEdit(null);
    };

    const handleDelete = (id: number, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
            onDeleteProduct(id);
        }
    };

    const getStatus = (product: Product) => {
        if (product.suspended) {
            return { text: 'Suspenso', color: 'bg-gray-200 text-gray-800' };
        }
        if (product.quantity <= product.lowStockAlert) {
            return { text: 'Estoque Baixo', color: 'bg-red-100 text-red-800' };
        }
        return { text: 'Ativo', color: 'bg-green-100 text-green-800' };
    };

    const alertProducts = products.filter(p => !p.suspended && p.quantity <= p.lowStockAlert);
    const otherProducts = products.filter(p => p.suspended || p.quantity > p.lowStockAlert);

    const filteredProducts = otherProducts.filter(product => {
        const matchesQuery = !filterQuery || product.name.toLowerCase().includes(filterQuery.toLowerCase());
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesFavorite = !showOnlyFavorites || product.isFavorite;

        return matchesQuery && matchesCategory && matchesFavorite;
    });

    return (
        <>
            <div className="container mx-auto px-6 py-8">
                {onBack && (
                    <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold">
                        &larr; Voltar ao Dashboard
                    </button>
                )}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-secondary">Estoque</h1>
                        <p className="text-gray-600 mt-1">Gerencie os produtos do seu salão.</p>
                    </div>
                    <button onClick={handleOpenModal} className="mt-4 sm:mt-0 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors transform hover:scale-105 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Novo Produto
                    </button>
                </div>

                {alertProducts.length > 0 && (
                    <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-lg animate-fade-in">
                        <div className="flex items-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 mr-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-xl font-bold text-red-800">Alerta de Reposição</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-red-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Produto</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Qtd. Atual</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Alerta Mínimo</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {alertProducts.map(product => (
                                        <tr key={product.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{product.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.lowStockAlert}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900">Ver / Editar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-secondary mb-4">Todos os Produtos</h2>
                    <div className="mb-6 p-4 bg-light rounded-lg">
                        <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap">
                            <div className="flex flex-col sm:flex-row gap-4 items-center flex-wrap w-full sm:w-auto flex-grow">
                                <div className="relative flex-grow w-full sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome..."
                                        value={filterQuery}
                                        onChange={(e) => setFilterQuery(e.target.value)}
                                        className="w-full p-2 pl-3 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                    />
                                </div>

                                <div className="relative w-full sm:w-48">
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white"
                                    >
                                        <option value="">Todas Categorias</option>
                                        {productCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-colors ${showOnlyFavorites ? 'bg-yellow-400 text-white shadow' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                            >
                                {showOnlyFavorites ? <StarIconSolid /> : <StarIconOutline />}
                                Favoritos
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Compra</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                                        Qtd.
                                        <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                                            Use os botões para ajustar o estoque.
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.map(product => {
                                    const status = getStatus(product);
                                    return (
                                        <tr key={product.id} className={product.suspended ? 'opacity-60' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">R$ {product.purchaseValue}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => onUpdateQuantity(product.id, -1)}
                                                        disabled={product.quantity <= 0}
                                                        className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        aria-label="Diminuir quantidade"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                                                    </button>
                                                    <span className="text-sm font-semibold text-gray-900 w-8 text-center">{product.quantity}</span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(product.id, 1)}
                                                        className="p-1 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                                                        aria-label="Aumentar quantidade"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => onToggleFavorite(product.id)} className="p-2 rounded-full text-gray-400 hover:bg-yellow-100 transition-colors" title={product.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
                                                        {product.isFavorite ? <StarIconSolid className="text-yellow-500" /> : <StarIconOutline />}
                                                    </button>
                                                    <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900">Editar</button>
                                                    <button onClick={() => onSuspendProduct(product.id)} className={product.suspended ? "text-green-600 hover:text-green-900" : "text-yellow-600 hover:text-yellow-900"}>
                                                        {product.suspended ? 'Reativar' : 'Suspender'}
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id, product.name)} className="text-red-600 hover:text-red-900">Excluir</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {otherProducts.length > 0 && filteredProducts.length === 0 && (
                            <p className="text-center py-10 text-gray-500">Nenhum produto encontrado com o filtro atual.</p>
                        )}
                        {otherProducts.length === 0 && (
                            <p className="text-center py-10 text-gray-500">Nenhum produto cadastrado nesta lista.</p>
                        )}
                    </div>
                </div>
            </div>
            <NewProductModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={onSaveProduct}
                itemToEdit={productToEdit}
                categories={productCategories}
                onAddCategory={handleAddCategory}
            />
        </>
    );
};

export default StockPage;
