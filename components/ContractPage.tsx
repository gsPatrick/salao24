import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import AddDocumentModal from './AddDocumentModal';
import { contractsAPI } from '../lib/api';
// --- Interfaces ---

// Interface para os modelos de documento
interface DocumentTemplate {
    id: number;
    name: string;
    type: 'Contrato' | 'Termo';
    content: string;
    logo?: string | null;
}

interface Contract {
    planName: string;
    price: string;
    date: string;
    contractText: string;
    signatureImg: string;
    userPhoto: string;
    userName: string;
    userCpf: string;
}

interface User {
    name: string;
    email: string;
    avatarUrl: string;
    contracts?: Contract[];
}

interface ContractPageProps {
    onBack?: () => void;
    currentUser: User | null;
}

// Default document templates (previously from mockData)
export const defaultContractsAndTerms: DocumentTemplate[] = [
    {
        id: 1,
        name: 'Contrato Padrão de Serviços',
        type: 'Contrato',
        content: 'Este contrato estabelece os termos e condições para a prestação de serviços de beleza entre o salão e o cliente...',
        logo: null,
    },
    {
        id: 2,
        name: 'Termo de Responsabilidade para Procedimentos Químicos',
        type: 'Termo',
        content: 'Eu, [NOME DO CLIENTE], CPF [CPF DO CLIENTE], declaro estar ciente dos riscos associados a procedimentos químicos...',
        logo: null,
    },
];

// --- Icons ---
const DocumentAddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


const ContractPage: React.FC<ContractPageProps> = ({ onBack, currentUser }) => {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'Contrato' | 'Termo'>('Contrato');
    const [documentToEdit, setDocumentToEdit] = useState<DocumentTemplate | null>(null);
    const [customDocuments, setCustomDocuments] = useState<DocumentTemplate[]>([]);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const data = await contractsAPI.list();
            setCustomDocuments(data);
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const handleOpenModal = (type: 'Contrato' | 'Termo', doc: DocumentTemplate | null = null) => {
        setModalType(type);
        setDocumentToEdit(doc);
        setIsModalOpen(true);
    };

    const handleSaveDocument = async (data: { title: string; content: string; logo: string | null }) => {
        try {
            if (documentToEdit) { // Editing
                await contractsAPI.update(documentToEdit.id, { title: data.title, content: data.content });
            } else { // Creating new
                await contractsAPI.create({ title: data.title, type: modalType, content: data.content });
            }
            await loadTemplates();
            setIsModalOpen(false);
            setDocumentToEdit(null);
        } catch (error) {
            console.error('Error saving document:', error);
            alert('Erro ao salvar documento. Tente novamente.');
        }
    };

    const handleDeleteDocument = async (docId: number) => {
        if (window.confirm(t('confirmAction') + ' ' + t('irreversibleAction'))) {
            try {
                await contractsAPI.delete(docId);
                await loadTemplates();
            } catch (error) {
                console.error('Error deleting document:', error);
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
