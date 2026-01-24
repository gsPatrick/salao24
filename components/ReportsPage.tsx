
import React, { useState } from 'react';
import ReportViewerModal from './ReportViewerModal';
import {
    generateMyAgendaReport,
    generateSchedulingReport,
    generateClientReport,
    generateCrmReport,
    generateTimeClockReport,
    generateFinancialReport,
    generateContractReport,
    generateReferralReport,
    generateConversionRateReport,
    generateSalesReport,
    generatePaymentReport,
    generateMarketingReport,
    generateServiceReport
} from '../utils/reportGenerators';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';


// --- Icons ---
const MyAgendaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11a3 3 0 11-6 0 3 3 0 016 0zM12 17a6 6 0 00-4.5 1.9" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CrmIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FinanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
const PaymentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const ContractIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367-2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
const PercentageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19L19 5M9.5 9.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19.5 19.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>;
const SalesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0 8l-8-8-4 4-6-6" /></svg>;
const MarketingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 00-1.564.317z" />
    </svg>
);
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;
const ServicesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879a5 5 0 01-7.071-7.071L12 5z" /></svg>;

const ReportCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onGenerate: () => void; isDisabled: boolean; }> = ({ icon, title, description, onGenerate, isDisabled }) => {
    const { t } = useLanguage();
    return (
        <div className={`relative bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center text-center transition-all duration-300 group ${isDisabled ? 'opacity-60 bg-gray-50' : 'transform hover:-translate-y-1 hover:shadow-xl'}`}>
            {isDisabled && (
                <div className="absolute inset-0 bg-gray-200 bg-opacity-50 rounded-2xl z-10 flex items-center justify-center">
                    <span className="bg-yellow-400 text-yellow-900 font-bold text-xs px-3 py-1 rounded-full shadow-md flex items-center">
                        <LockIcon />
                        <span className="ml-1">{t('planEnterprise')}</span>
                    </span>
                </div>
            )}
            <div className="bg-primary/10 text-primary p-4 rounded-full mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-secondary mb-2">{title}</h3>
            <p className="text-sm text-gray-600 flex-grow">{description}</p>
            <button
                onClick={onGenerate}
                disabled={isDisabled}
                className="mt-6 w-full bg-light hover:bg-gray-200 text-primary font-semibold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
                {t('generateReport')}
            </button>
        </div>
    );
};


interface ReportsPageProps {
    onBack?: () => void;
    isIndividualPlan: boolean;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ onBack, isIndividualPlan }) => {
    const { t } = useLanguage();
    const { clients, professionals, services, appointments, transactions } = useData();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [currentReport, setCurrentReport] = useState<{ title: string; description: string; data: any, initialFilters?: any } | null>(null);

    const [filters, setFilters] = useState({
        professional: 'todos',
        unit: 'todas',
        startDate: '',
        endDate: '',
    });

    const reportOptions = [
        { key: 'MyAgenda', icon: <MyAgendaIcon />, generate: (t: any) => generateMyAgendaReport(t, appointments, professionals) },
        { key: 'Scheduling', icon: <CalendarIcon />, generate: (t: any) => generateSchedulingReport(t, appointments) },
        { key: 'Clients', icon: <UsersIcon />, generate: (t: any) => generateClientReport(t, clients) },
        { key: 'Crm', icon: <CrmIcon />, generate: (t: any) => generateCrmReport(t, clients) },
        { key: 'Service', icon: <ServicesIcon />, generate: (t: any) => generateServiceReport(t, appointments, services, clients, professionals) },
        { key: 'Sales', icon: <SalesIcon />, generate: (t: any) => generateSalesReport(t) },
        { key: 'Marketing', icon: <MarketingIcon />, generate: (t: any) => generateMarketingReport(t) },
        { key: 'Referrals', icon: <ShareIcon />, generate: (t: any) => generateReferralReport(t) },
        { key: 'ConversionRate', icon: <PercentageIcon />, generate: (t: any) => generateConversionRateReport(t) },
        { key: 'TimeClock', icon: <ClockIcon />, generate: (t: any) => generateTimeClockReport(t) },
        { key: 'Financial', icon: <FinanceIcon />, generate: (t: any) => generateFinancialReport(t, transactions) },
        { key: 'Payment', icon: <PaymentIcon />, generate: (t: any) => generatePaymentReport(t) },
        { key: 'Contracts', icon: <ContractIcon />, generate: (t: any) => generateContractReport(t, clients) },
    ];

    // Use hardcoded units for now as we assumed single tenant context
    const mockUnits = [
        { id: 1, name: 'Sede' }
    ];

    const advancedReports = [
        'Relatório Financeiro',
        'Relatório de Vendas',
        'Relatório de Marketing',
        'Relatório de Indicações',
        'Relatório de Taxa de Conversão',
        'Relatório de Contratos',
        'Relatório de Ponto',
    ];


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({
            professional: 'todos',
            unit: 'todas',
            startDate: '',
            endDate: '',
        });
    };

    const handleGenerateReport = (reportKey: string) => {
        const reportOption = reportOptions.find(opt => opt.key === reportKey);
        if (!reportOption) return;

        const title = t(`reportTitle${reportKey}`);
        const description = t(`reportDesc${reportKey}`);
        const data = reportOption.generate(t);

        setCurrentReport({ title, description, data, initialFilters: filters });
        setIsReportModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsReportModalOpen(false);
        setCurrentReport(null);
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

                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-secondary">{t('reportsCenterTitle')}</h1>
                    <p className="text-gray-600 mt-2">{t('reportsCenterSubtitle')}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                    <h2 className="text-xl font-bold text-secondary mb-4">{t('reportFiltersTitle')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">{t('filterStartDate')}</label>
                            <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">{t('filterEndDate')}</label>
                            <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label htmlFor="professional" className="block text-sm font-medium text-gray-700">{t('filterProfessional')}</label>
                            <select name="professional" id="professional" value={filters.professional} onChange={handleFilterChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                <option value="todos">{t('all')}</option>
                                {professionals && professionals.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">{t('unit')}</label>
                            <select name="unit" id="unit" value={filters.unit} onChange={handleFilterChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                <option value="todas">{t('allUnits')}</option>
                                {mockUnits.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                            </select>
                        </div>
                        <button onClick={clearFilters} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            {t('clearFilters')}
                        </button>
                    </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reportOptions.map((report, index) => (
                        <ReportCard
                            key={index}
                            icon={report.icon}
                            title={t(`reportTitle${report.key}`)}
                            description={t(`reportDesc${report.key}`)}
                            onGenerate={() => handleGenerateReport(report.key)}
                            isDisabled={isIndividualPlan && advancedReports.includes(t(`reportTitle${report.key}`))}
                        />
                    ))}
                </div>
            </div>
            {currentReport && (
                <ReportViewerModal
                    isOpen={isReportModalOpen}
                    onClose={handleCloseModal}
                    reportTitle={currentReport.title}
                    reportDescription={currentReport.description}
                    reportData={currentReport.data}
                    initialFilters={currentReport.initialFilters}
                />
            )}
        </>
    );
};

export default ReportsPage;
