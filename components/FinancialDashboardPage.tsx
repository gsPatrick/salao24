import React, { useState, useMemo, useEffect } from 'react';
import NewTransactionModal from './NewTransactionModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

// --- Interfaces ---
interface Transaction {
    id: number;
    description: string;
    amount: number;
    date: string;
    type: 'receita' | 'despesa';
    status: 'Pago' | 'Pendente' | 'Vencida';
    billAttachment?: string;
    receiptAttachment?: string;
    [key: string]: any;
}

interface FinancialDashboardPageProps {
    onBack?: () => void;
    // Props are optional now as we use DataContext, kept for compatibility if needed
    clients?: any[];
    transactions?: Transaction[];
    onSaveTransaction?: (transaction: any) => void;
    onUpdateTransaction?: (transaction: Transaction) => void;
    unitName?: string;
    onComingSoon?: (feature: string) => void;
}

// --- Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const AttachmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;


const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
);

const FinancialDashboardPage: React.FC<FinancialDashboardPageProps> = ({ onBack, unitName }) => {
    const { t } = useLanguage();
    const { transactions, saveTransaction, tenant } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'receita' | 'despesa'>('receita');

    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    });

    const [timePeriod, setTimePeriod] = useState<'hoje' | 'semana' | 'mes' | 'anual'>('mes');

    useEffect(() => {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            setTimePeriod('hoje');
        } else if (diffDays <= 7) {
            setTimePeriod('semana');
        } else if (diffDays <= 31) {
            setTimePeriod('mes');
        } else {
            setTimePeriod('anual');
        }
    }, [startDate, endDate]);

    const handleOpenModal = (type: 'receita' | 'despesa') => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleSaveLocal = async (transactionData: any) => {
        // Adapt modal data to Transaction type if needed
        const newTransaction = {
            ...transactionData,
            type: modalType,
            unit: unitName
        };
        await saveTransaction(newTransaction);
        setIsModalOpen(false);
    };

    const filteredTransactions = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return transactions.filter(t => {
            const transactionDate = new Date(t.date + 'T00:00:00');
            return transactionDate >= start && transactionDate <= end;
        });
    }, [transactions, startDate, endDate]);

    const upcomingBills = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        return transactions
            .filter(t => {
                const dueDate = new Date(t.date + 'T00:00:00');
                return t.type === 'despesa' && t.status === 'Pendente' && dueDate >= today && dueDate <= nextWeek;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions]);

    const handleMarkAsPaid = async (transactionId: number) => {
        const transactionToUpdate = transactions.find(t => t.id === transactionId);
        if (transactionToUpdate) {
            await saveTransaction({ ...transactionToUpdate, status: 'Pago' });
        }
    };

    const handleStatusUpdate = async (transactionId: number, newStatus: 'Pago' | 'Pendente' | 'Vencida') => {
        const transactionToUpdate = transactions.find(t => t.id === transactionId);
        if (transactionToUpdate) {
            await saveTransaction({ ...transactionToUpdate, status: newStatus });
        }
    };

    const financialSummary = useMemo(() => {
        const totalReceitas = filteredTransactions
            .filter(t => t.type === 'receita' && t.status === 'Pago')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalDespesas = filteredTransactions
            .filter(t => t.type === 'despesa' && t.status === 'Pago')
            .reduce((sum, t) => sum + t.amount, 0);

        const saldo = totalReceitas - totalDespesas;

        return { totalReceitas, totalDespesas, saldo };
    }, [filteredTransactions]);

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleExport = () => {
        const headers = ["Data", "Descrição", "Tipo", "Status", "Valor"];

        const escapeCsvField = (field: any): string => {
            if (field == null) return '';
            const stringField = String(field);
            if (/[",\n\r]/.test(stringField)) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        const rows = filteredTransactions.map(t =>
            [
                new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR'),
                t.description,
                t.type,
                t.status,
                t.amount.toFixed(2).replace('.', ',')
            ].map(escapeCsvField).join(',')
        );

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `transacoes_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    const SubscriptionAlert = () => {
        if (!tenant) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const billingDate = tenant.nextBillingDate || tenant.trialEndsAt;
        if (!billingDate && tenant.subscriptionStatus !== 'OVERDUE') return null;

        const dueDate = billingDate ? new Date(billingDate + 'T00:00:00') : null;
        const diffDays = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : -1;

        const isOverdue = tenant.subscriptionStatus === 'OVERDUE' || (diffDays < 0 && billingDate);
        const isNearExpiry = diffDays <= 7 && diffDays >= 0;

        if (!isOverdue && !isNearExpiry) return null;

        return (
            <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between transition-all duration-500 animate-pulse-subtle ${isOverdue ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isOverdue ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold text-sm">
                            {isOverdue ? 'Sua fatura está vencida!' : `Sua fatura vence em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}.`}
                        </p>
                        <p className="text-xs opacity-90">
                            {isOverdue ? 'Regularize seu pagamento para evitar a suspensão dos serviços.' : 'Mantenha seus pagamentos em dia para garantir o acesso total ao sistema.'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => onBack && onBack()} // In this context, it might be better to navigate to settings or payment
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${isOverdue ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                >
                    Pagar Agora
                </button>
            </div>
        );
    };

    // Date Filter Component and helpers
    const setDateRange = (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
    };
    const setToday = () => {
        const now = new Date();
        setDateRange(new Date(now.setHours(0, 0, 0, 0)), new Date(now.setHours(23, 59, 59, 999)));
    };
    const setThisWeek = () => {
        const now = new Date();
        const first = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
        const firstDay = new Date(now.setDate(first));
        firstDay.setHours(0, 0, 0, 0);
        const lastDay = new Date(firstDay);
        lastDay.setDate(lastDay.getDate() + 6);
        lastDay.setHours(23, 59, 59, 999);
        setDateRange(firstDay, lastDay);
    };
    const setThisMonth = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        lastDay.setHours(23, 59, 59, 999);
        setDateRange(firstDay, lastDay);
    };
    const setThisYear = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31);
        lastDay.setHours(23, 59, 59, 999);
        setDateRange(firstDay, lastDay);
    };

    const DateFilterComponent = () => (
        <div className="bg-white p-4 rounded-2xl shadow-lg mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <label htmlFor="start-date-fin" className="text-sm font-medium text-gray-700">De:</label>
                    <input
                        id="start-date-fin"
                        type="date"
                        value={startDate.toISOString().split('T')[0]}
                        onChange={(e) => setStartDate(new Date(e.target.value + 'T00:00:00'))}
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="end-date-fin" className="text-sm font-medium text-gray-700">Até:</label>
                    <input
                        id="end-date-fin"
                        type="date"
                        value={endDate.toISOString().split('T')[0]}
                        onChange={(e) => setEndDate(new Date(e.target.value + 'T23:59:59'))}
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                    />
                </div>
            </div>
            <div className="flex items-center bg-light p-1 rounded-full overflow-x-auto">
                <button onClick={setToday} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${timePeriod === 'hoje' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('today')}</button>
                <button onClick={setThisWeek} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${timePeriod === 'semana' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('week')}</button>
                <button onClick={setThisMonth} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${timePeriod === 'mes' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('month')}</button>
                <button onClick={setThisYear} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${timePeriod === 'anual' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('year')}</button>
            </div>
        </div>
    );

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

                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-secondary">Financeiro</h1>
                        <p className="text-gray-600 mt-1">Controle suas receitas, despesas e saldo.</p>
                    </div>
                    <div className="flex items-center flex-wrap justify-center gap-3 mt-4 sm:mt-0">
                        <button onClick={() => handleOpenModal('receita')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                            <PlusIcon />
                            Nova Receita
                        </button>
                        <button onClick={() => handleOpenModal('despesa')} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                            <MinusIcon />
                            Nova Despesa
                        </button>
                        <button onClick={handleExport} title="Exportar Excel" className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold p-3 rounded-lg flex items-center transition-colors">
                            <DownloadIcon />
                        </button>
                    </div>
                </div>

                {upcomingBills.length > 0 && (
                    <div className="mb-8 p-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-lg animate-fade-in">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 mr-3">
                                <AlertIcon />
                            </div>
                            <p className="text-red-700 text-sm font-semibold">Atenção! As seguintes contas têm vencimento para os próximos 7 dias. Organize-se para evitar juros.</p>
                        </div>
                        <div className="space-y-3 mt-4">
                            {upcomingBills.map(bill => (
                                <div key={bill.id} className="bg-white p-3 rounded-md shadow-sm flex flex-col sm:flex-row justify-between items-center gap-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{bill.description}</p>
                                        <p className="text-sm text-gray-600">Vencimento: <span className="font-medium">{new Date(bill.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span></p>
                                    </div>
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <p className="font-bold text-lg text-red-600">{formatCurrency(bill.amount)}</p>
                                        <button onClick={() => handleMarkAsPaid(bill.id)} className="py-1 px-3 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-md transition-colors">
                                            Marcar como Paga
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                <SubscriptionAlert />
                <DateFilterComponent />

                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Receita Total (Paga)" value={formatCurrency(financialSummary.totalReceitas)} color="text-green-600" />
                    <StatCard title="Despesas Totais (Pagas)" value={formatCurrency(financialSummary.totalDespesas)} color="text-red-600" />
                    <StatCard title="Saldo" value={formatCurrency(financialSummary.saldo)} color={financialSummary.saldo >= 0 ? "text-blue-600" : "text-red-600"} />
                </div>

                {/* Transactions Table */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold text-secondary mb-4">Últimas Transações</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.map(t => {
                                    const statusStyles = {
                                        Pago: 'bg-blue-100 text-blue-800 border-blue-300 focus:ring-blue-500 focus:border-blue-500',
                                        Pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500',
                                        Vencida: 'bg-red-100 text-red-800 border-red-300 focus:ring-red-500 focus:border-red-500',
                                    };

                                    return (
                                        <tr key={t.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <div className="flex items-center">
                                                    <span>{t.description}</span>
                                                    {(t.billAttachment || t.receiptAttachment) && <AttachmentIcon />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <select
                                                    value={t.status}
                                                    onChange={(e) => handleStatusUpdate(t.id, e.target.value as any)}
                                                    className={`capitalize px-2 py-1 text-xs font-semibold rounded-full border appearance-none text-center cursor-pointer ${statusStyles[t.status]}`}
                                                >
                                                    <option value="Pago">Pago</option>
                                                    <option value="Pendente">Pendente</option>
                                                    <option value="Vencida">Vencida</option>
                                                </select>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(t.amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && <p className="text-center py-10 text-gray-500">Nenhuma transação registrada para este período.</p>}
                    </div>
                </div>
            </div>
            <NewTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveLocal}
                transactionType={modalType}
                currentUnit={unitName || ''}
            />
        </>
    );
};

export default FinancialDashboardPage;