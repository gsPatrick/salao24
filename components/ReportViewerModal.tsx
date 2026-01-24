import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

declare var jspdf: any;

// --- Interfaces ---
interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  reportDescription: string;
  reportData: any;
  initialFilters?: {
    professional: string;
    unit: string;
    startDate: string;
    endDate: string;
  };
}

// --- Icons ---
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-8a1 1 0 11-2 0 1 1 0 012 0z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;


// --- Helper Functions ---
const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const escapeCsvField = (field: any): string => {
    if (field == null) return '';
    const stringField = String(field);
    if (/[",\n\r]/.test(stringField)) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
};

// --- Main Component ---
const ReportViewerModal: React.FC<ReportViewerModalProps> = ({ isOpen, onClose, reportTitle, reportDescription, reportData, initialFilters }) => {
    const { t } = useLanguage();
    const [isExiting, setIsExiting] = useState(false);
    const reportContentRef = useRef<HTMLDivElement>(null);

    // State for interactivity
    const [filterText, setFilterText] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Reset filters on new report
    useEffect(() => {
        if (isOpen) {
            setFilterText('');
            setSortConfig(null);
            setStartDate(initialFilters?.startDate || '');
            setEndDate(initialFilters?.endDate || '');
        } else {
             setIsExiting(false);
        }
    }, [isOpen, initialFilters]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(), 300);
    };
    
    const handlePrint = () => {
        window.print();
    };
    
    const initiallyFilteredData = useMemo(() => {
        if (!reportData?.details) return [];
        let items = [...reportData.details];

        if (initialFilters) {
            items = items.filter(item => {
                const profMatch = !initialFilters.professional || initialFilters.professional === 'todos' ||
                                  !item[t('reportHeaderProfessional')] || (item[t('reportHeaderProfessional')] && item[t('reportHeaderProfessional')] === initialFilters.professional);
                
                const unitMatch = !initialFilters.unit || initialFilters.unit === 'todas' ||
                                !item[t('unit')] || (item[t('unit')] && item[t('unit')] === initialFilters.unit);

                return profMatch && unitMatch;
            });
        }
        return items;
    }, [reportData, initialFilters, t]);
    
    const sortedFilteredData = useMemo(() => {
        if (!initiallyFilteredData) return [];

        let items = [...initiallyFilteredData];

        // Date Filtering (within modal)
        if (startDate || endDate) {
            items = items.filter(item => {
                const dateKey = t('reportHeaderDate');
                if (!item[dateKey]) return true; // Keep items without a date column
                const itemDate = new Date(item[dateKey].split('/').reverse().join('-') + 'T00:00:00');
                if (startDate) {
                    const start = new Date(startDate + 'T00:00:00');
                    if (itemDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate + 'T23:59:59');
                    if (itemDate > end) return false;
                }
                return true;
            });
        }

        // Text Filtering
        if (filterText) {
            items = items.filter(item =>
                Object.values(item).some(value =>
                    String(value).toLowerCase().includes(filterText.toLowerCase())
                )
            );
        }

        // Sorting
        if (sortConfig !== null) {
            items.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];

                const isNumeric = !isNaN(parseFloat(valA)) && isFinite(valA) && !isNaN(parseFloat(valB)) && isFinite(valB);

                if (isNumeric) {
                     if (parseFloat(valA) < parseFloat(valB)) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (parseFloat(valA) > parseFloat(valB)) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                } else {
                    if (String(valA).localeCompare(String(valB)) < 0) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (String(valA).localeCompare(String(valB)) > 0) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                }
                return 0;
            });
        }

        return items;
    }, [initiallyFilteredData, filterText, sortConfig, startDate, endDate, t]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const currencyKeys = ['faturamento', 'receita', 'despesas', 'lucro', 'gasto', 'valor', 'saldo', 'revenue', 'expense', 'profit', 'investment', 'cost', 'cac'];

    const handleExport = () => {
        if (!sortedFilteredData || sortedFilteredData.length === 0) return;
    
        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF();
            
            const tableColumns = Object.keys(sortedFilteredData[0]);
            const tableRows: string[][] = [];
    
            sortedFilteredData.forEach((item: any) => {
                const rowData = tableColumns.map(header => {
                    const value = item[header];
                    const shouldFormat = typeof value === 'number' && currencyKeys.some(k => header.toLowerCase().includes(k));
                    return shouldFormat ? formatCurrency(value) : String(value);
                });
                tableRows.push(rowData);
            });
    
            doc.setFontSize(18);
            doc.text(reportTitle, 14, 22);
            
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
            
            (doc as any).autoTable({
                startY: 35,
                head: [tableColumns],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }, // primary color
            });
            
            const filename = `${reportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Não foi possível gerar o PDF. A biblioteca 'jspdf' pode não estar carregada.");
        }
    };

    if (!isOpen && !isExiting) return null;

    const headers = (reportData?.details?.length > 0) ? Object.keys(reportData.details[0]) : [];

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 report-modal-wrapper ${isOpen ? 'opacity-100' : 'opacity-0'}`} aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <style>
                {`
                    @media print {
                        body > *:not(.report-modal-wrapper) {
                            display: none !important;
                        }
                        .report-modal-wrapper, .report-modal-panel {
                            position: static !important;
                            width: 100% !important;
                            height: auto !important;
                            max-width: 100% !important;
                            max-height: 100% !important;
                            overflow: visible !important;
                            box-shadow: none !important;
                            border: none !important;
                            background: white !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                        .report-modal-backdrop {
                            display: none !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        #print-section {
                            overflow: visible !important;
                            height: auto !important;
                            max-height: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                        @page {
                            size: A4;
                            margin: 20mm;
                        }
                        body {
                            background: white !important;
                            color: black !important;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        thead {
                            display: table-header-group;
                        }
                        tr {
                            page-break-inside: avoid;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    }
                `}
            </style>
            <div className={`fixed inset-0 bg-gray-500 bg-opacity-75 report-modal-backdrop`} onClick={handleClose}></div>
            <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-4xl flex flex-col report-modal-panel ${isOpen && !isExiting ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} style={{maxHeight: '90vh'}}>
                <div className="p-6 border-b no-print">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold text-secondary" id="modal-title">{reportTitle}</h3>
                            <p className="text-sm text-gray-500 mt-1">{reportDescription}</p>
                        </div>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
                    </div>
                </div>
                
                <div id="print-section" ref={reportContentRef} className="p-6 flex-grow overflow-y-auto">
                    {reportData?.summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {Object.entries(reportData.summary).map(([key, value]) => {
                                const shouldFormatAsCurrency = typeof value === 'number' && currencyKeys.some(k => key.toLowerCase().includes(k));
                                return (
                                    <div key={key} className="bg-light p-3 rounded-lg text-center">
                                        <p className="text-sm text-gray-500 font-medium capitalize">{key}</p>
                                        <p className="text-xl font-bold text-secondary">{shouldFormatAsCurrency ? formatCurrency(value as number) : String(value)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="my-4 flex flex-col sm:flex-row gap-4 justify-between items-center no-print">
                        <div className="relative w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder={t('filterTableData')}
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                                className="w-full sm:w-80 p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <label htmlFor="start-date-report" className="text-sm font-medium text-gray-700">{t('from')}:</label>
                                <input id="start-date-report" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md text-sm" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="end-date-report" className="text-sm font-medium text-gray-700">{t('to')}:</label>
                                <input id="end-date-report" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md text-sm" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {headers.map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <button onClick={() => requestSort(header)} className="flex items-center gap-2 uppercase font-medium">
                                                {header}
                                                {sortConfig?.key === header && (
                                                    <span>{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                                                )}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                               {sortedFilteredData.length > 0 ? (
                                    sortedFilteredData.map((row, index) => (
                                        <tr key={index}>
                                            {headers.map(header => (
                                                <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{String(row[header])}</td>
                                            ))}
                                        </tr>
                                    ))
                               ) : (
                                   <tr>
                                       <td colSpan={headers.length} className="text-center py-10 text-gray-500">
                                           {filterText ? `Nenhum resultado encontrado para "${filterText}".` : 'Nenhum dado para este relatório.'}
                                       </td>
                                   </tr>
                               )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 flex flex-col sm:flex-row justify-between items-center rounded-b-lg no-print flex-shrink-0">
                    <button type="button" onClick={handleClose} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50">
                        {t('close')}
                    </button>
                    <div className="flex items-center gap-3 mt-3 sm:mt-0">
                        <button onClick={handlePrint} className="flex items-center py-2 px-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <PrintIcon /> {t('printReport')}
                        </button>
                        <button onClick={handleExport} className="flex items-center py-2 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-lg transform hover:scale-105 transition-transform duration-300">
                            <DownloadIcon /> {t('exportPDF')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportViewerModal;