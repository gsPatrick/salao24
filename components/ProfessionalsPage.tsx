import React, { useState } from 'react';
import NewProfessionalModal from './NewProfessionalModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

interface Professional {
    id: number;
    name: string;
    photo: string;
    occupation: string;
    specialties: string[];
    cpf: string;
    birthdate: string;
    phone: string;
    email: string;
    address: any;
    unit: string;
    suspended?: boolean;
    archived?: boolean;
    socialName?: string;
    startTime?: string;
    lunchStart?: string;
    lunchEnd?: string;
    endTime?: string;
    allowOvertime?: boolean;
    openSchedule?: boolean;
}

interface ProfessionalsPageProps {
    onBack?: () => void;
    isIndividualPlan: boolean;
}

const ProfessionalCard: React.FC<{
    professional: Professional,
    onEdit: () => void,
    onSuspend: () => void,
    onArchive: () => void,
    isArchiving: boolean;
}> = ({ professional, onEdit, onSuspend, onArchive, isArchiving }) => {
    const { t } = useLanguage();
    return (
        <div className={`relative bg-white p-4 rounded-lg shadow-md flex flex-col text-center items-center space-y-3 transition-all duration-300 transform hover:-translate-y-1 ${professional.suspended && !professional.archived ? 'opacity-60 bg-gray-50' : ''} ${isArchiving ? 'animate-fade-out' : ''}`}>
            {(professional.suspended && !professional.archived) && (
                <span className="absolute top-2 right-2 text-xs font-bold bg-gray-500 text-white px-2 py-1 rounded-full z-10">{t('statusSuspended')}</span>
            )}
            {professional.archived && (
                <span className="absolute top-2 right-2 text-xs font-bold bg-gray-800 text-white px-2 py-1 rounded-full z-10">{t('statusArchived')}</span>
            )}
            <img src={professional.photo} alt={professional.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20" />
            <div className="flex-1">
                <h3 className="font-bold text-lg text-secondary">{professional.name}</h3>
                <p className="text-sm text-primary font-semibold">{professional.occupation}</p>
                <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {professional.specialties.slice(0, 3).map(spec => (
                        <span key={spec} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{spec}</span>
                    ))}
                    {professional.specialties.length > 3 && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">+{professional.specialties.length - 3}</span>}
                </div>
            </div>
            <div className="w-full mt-4 pt-2 border-t">
                {professional.archived ? (
                    <button onClick={onArchive} className="w-full bg-green-100 hover:bg-green-200 text-green-800 font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                        {t('unarchive')}
                    </button>
                ) : (
                    <div className="space-y-2">
                        <button onClick={onEdit} className="w-full bg-light hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
                            {t('edit')}
                        </button>
                        <div className="flex gap-2">
                            <button onClick={onSuspend} className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors text-sm ${professional.suspended ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                                {professional.suspended ? t('actionReactivate') : t('actionSuspend')}
                            </button>
                            <button onClick={onArchive} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                                {t('archive')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProfessionalsPage: React.FC<ProfessionalsPageProps> = ({ onBack, isIndividualPlan }) => {
    const {
        professionals,
        saveProfessional: onSaveProfessional,
        suspendProfessional: onSuspendProfessional,
        archiveProfessional: onArchiveProfessional,
    } = useData();
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [professionalToEdit, setProfessionalToEdit] = useState<Professional | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [archivingId, setArchivingId] = useState<number | null>(null);

    const professionalsToFilter = isIndividualPlan ? professionals.slice(0, 1) : professionals;
    const activeProfessionals = professionalsToFilter.filter(p => !p.archived);
    const archivedProfessionals = professionalsToFilter.filter(p => p.archived);

    const professionalsToDisplay = showArchived ? archivedProfessionals : activeProfessionals;

    const canAddProfessional = !isIndividualPlan || professionals.length < 1;

    const handleOpenModal = () => {
        setProfessionalToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (professional: Professional) => {
        setProfessionalToEdit(professional);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setProfessionalToEdit(null);
    };

    const handleSuspend = (professionalId: number, professionalName: string, isSuspended?: boolean) => {
        const action = isSuspended ? t('actionReactivate').toLowerCase() : t('actionSuspend').toLowerCase();
        if (window.confirm(t('confirmSuspendProfessional', { action: action, name: professionalName }))) {
            onSuspendProfessional(professionalId);
        }
    };

    const handleArchive = (professionalId: number, professionalName: string, isArchived?: boolean) => {
        const action = isArchived ? t('unarchive').toLowerCase() : t('archive').toLowerCase();
        if (window.confirm(t('confirmArchiveProfessional', { action, name: professionalName }))) {
            if (!isArchived) {
                setArchivingId(professionalId);
                setTimeout(() => {
                    onArchiveProfessional(professionalId);
                    setArchivingId(null);
                }, 500); // Match animation duration
            } else {
                onArchiveProfessional(professionalId);
                setShowArchived(false);
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
                        {t('back')}
                    </button>
                )}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-secondary">{t('professionals')}</h1>
                        <p className="text-gray-600 mt-1">{t('professionalsPageSubtitle')}</p>
                    </div>
                    <div className="relative mt-4 sm:mt-0 group">
                        <button onClick={handleOpenModal} disabled={!canAddProfessional} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors duration-300 transform hover:scale-105 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {t('newProfessional')}
                        </button>
                        {!canAddProfessional && (
                            <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-x-1/2 left-1/2 z-10">
                                {t('professionalsIndividualPlanTooltip')}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        {showArchived ? t('viewActive') : t('viewArchived')} ({showArchived ? activeProfessionals.length : archivedProfessionals.length})
                    </button>
                </div>

                {professionalsToDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {professionalsToDisplay.map(prof => (
                            <ProfessionalCard
                                key={prof.id}
                                professional={prof}
                                onEdit={() => handleEdit(prof)}
                                onSuspend={() => handleSuspend(prof.id, prof.name, prof.suspended)}
                                onArchive={() => handleArchive(prof.id, prof.name, prof.archived)}
                                isArchiving={archivingId === prof.id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md col-span-full">
                        <h3 className="text-xl font-semibold text-gray-700">
                            {showArchived ? t('noArchivedProfessionalsFound') : t('noProfessionalsFoundTitle')}
                        </h3>
                        <p className="text-gray-500 mt-2">
                            {showArchived ? '' : t('noProfessionalsFoundSubtitle')}
                        </p>
                    </div>
                )}
            </div>
            <NewProfessionalModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={onSaveProfessional}
                professionalToEdit={professionalToEdit}
            />
        </>
    );
};

export default ProfessionalsPage;