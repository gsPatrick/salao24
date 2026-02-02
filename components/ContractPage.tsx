import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData, ContractTemplate } from '../contexts/DataContext';
import AddDocumentModal from './AddDocumentModal';

interface ContractPageProps {
    onBack?: () => void;
}

const DocumentAddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const ContractPage: React.FC<ContractPageProps> = ({ onBack }) => {
    const { t } = useLanguage();
    const {
        contractTemplates: customDocuments,
        saveContractTemplate,
        deleteContractTemplate
    } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'Contrato' | 'Termo'>('Contrato');
    const [documentToEdit, setDocumentToEdit] = useState<ContractTemplate | null>(null);

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
            logo: data.logo
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

                    <div className="space-y-3">
                        {customDocuments.map((doc) => (
                            <div key={doc.id} className="bg-light p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex-1">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${doc.type === 'Contrato' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{doc.type}</span>
                                    <p className="font-semibold text-secondary mt-1">{doc.name}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <button onClick={() => handleOpenModal(doc.type, doc)} className="text-sm text-blue-600 hover:underline font-semibold flex items-center gap-1"><EditIcon /> Editar</button>
                                    <button onClick={() => handleDeleteDocument(doc.id)} className="text-sm text-red-600 hover:underline font-semibold flex items-center gap-1"><TrashIcon /> Excluir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bloco de "Meus Contratos Assinados" removido desta tela para focar apenas nos modelos de documentos */}
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
