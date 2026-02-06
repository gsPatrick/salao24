import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData, ContractTemplate } from '../contexts/DataContext';
import AddDocumentModal from './AddDocumentModal';

interface ContractPageProps {
    onBack?: () => void;
}

const DocumentAddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

const ContractPage: React.FC<ContractPageProps> = ({ onBack }) => {
    const { t } = useLanguage();
    const {
        contractTemplates: customDocuments,
        saveContractTemplate,
        deleteContractTemplate,
        selectedUnitId
    } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'Contrato' | 'Termo'>('Contrato');
    const [documentToEdit, setDocumentToEdit] = useState<ContractTemplate | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenModal = (type: 'Contrato' | 'Termo', doc: ContractTemplate | null = null) => {
        setModalType(type);
        setDocumentToEdit(doc);
        setIsModalOpen(true);
    };

    const handleSaveDocument = async (data: { title: string; content: string; logo: string | null }) => {
        const success = await saveContractTemplate({
            id: documentToEdit?.id,
            name: data.title,
            type: modalType,
            content: data.content,
            logo: data.logo,
            unit_id: selectedUnitId // Ensure new templates are bound to current unit
        });

        if (success) {
            setIsModalOpen(false);
            setDocumentToEdit(null);
        } else {
            alert('Erro ao salvar documento. Tente novamente.');
        }
    };

    const handleDeleteDocument = async (docId: number) => {
        if (window.confirm(t('confirmAction') + ' ' + t('irreversibleAction'))) {
            const success = await deleteContractTemplate(docId);
            if (!success) {
                alert('Erro ao excluir documento.');
            }
        }
    };

    const handleDownloadDocument = (doc: ContractTemplate) => {
        // Create a text file with the document content
        const content = `${doc.name}\n\nTipo: ${doc.type}\n\n${doc.content}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.name.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const filteredDocuments = useMemo(() => {
        let docs = customDocuments;

        // Strict Unit Filtering
        if (selectedUnitId) {
            docs = docs.filter(doc => !doc.unit_id || doc.unit_id === selectedUnitId);
        }

        if (!searchTerm.trim()) return docs;
        const lowerSearch = searchTerm.toLowerCase();
        return docs.filter(doc =>
            doc.name.toLowerCase().includes(lowerSearch) ||
            doc.type.toLowerCase().includes(lowerSearch)
        );
    }, [customDocuments, searchTerm, selectedUnitId]);

    return (
        <>
            <div className="container mx-auto px-6 py-8">
                {onBack && (
                    <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold transition-colors duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Voltar ao Dashboard
                    </button>
                )}

                <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                    <h2 className="text-2xl font-bold text-secondary">Modelos de Documentos</h2>
                    <p className="text-gray-600 mt-1 mb-6">Crie e gerencie seus modelos de contratos e termos para usar com seus clientes.</p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <button onClick={() => handleOpenModal('Contrato')} className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-300 transform hover:scale-105 shadow-lg">
                            <DocumentAddIcon />
                            Novo Contrato
                        </button>
                        <button onClick={() => handleOpenModal('Termo')} className="flex-1 bg-secondary hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors duration-300 transform hover:scale-105 shadow-lg">
                            <DocumentAddIcon />
                            Novo Termo
                        </button>
                    </div>

                    {/* Search Filter */}
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-3">
                        {filteredDocuments.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhum modelo encontrado.</p>
                        ) : (
                            filteredDocuments.map((doc) => (
                                <div key={doc.id} className="bg-light p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="flex-1">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${doc.type === 'Contrato' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{doc.type}</span>
                                        <p className="font-semibold text-secondary mt-1">{doc.name}</p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <button onClick={() => handleDownloadDocument(doc)} className="text-sm text-green-600 hover:underline font-semibold flex items-center gap-1" title="Baixar modelo"><DownloadIcon /> Baixar</button>
                                        <button onClick={() => handleOpenModal(doc.type, doc)} className="text-sm text-blue-600 hover:underline font-semibold flex items-center gap-1"><EditIcon /> Editar</button>
                                        <button onClick={() => handleDeleteDocument(doc.id)} className="text-sm text-red-600 hover:underline font-semibold flex items-center gap-1"><TrashIcon /> Excluir</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <AddDocumentModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setDocumentToEdit(null); }}
                onSave={handleSaveDocument}
                documentType={modalType}
                documentToEdit={documentToEdit ? { title: documentToEdit.name, content: documentToEdit.content, logo: documentToEdit.logo || null } : null}
            />
        </>
    );
};

export default ContractPage;

