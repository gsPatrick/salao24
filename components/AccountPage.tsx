import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface User {
    name: string;
    email: string;
    avatarUrl: string;
    role?: 'admin';
}

interface Unit {
    id: number;
    name: string;
    // Adicione outras propriedades se necessário para o componente
}

interface AccountPageProps {
    currentUser: User;
    navigate: (page: string) => void;
    isIndividualPlan?: boolean;
    selectedUnit?: string;
    onUnitChange?: (unit: string) => void;
    units?: { id: number; name: string }[];
    promotions?: any[];
    onOpenPromoModal?: () => void;
}

// --- Mock Data (limpo) ---

const accountData: { [key: string]: { [key: string]: any } } = {
    'Unidade Matriz': {
        dia: {
            faturamento: 'R$ 0,00',
            atendimentos: '0',
            ticketMedio: 'R$ 0,00',
            clientes: '0',
            chartLabels: ['-3h', '-2h', '-1h', 'Agora'],
            chartData: {
                faturamento: [0, 0, 0, 0],
                atendimentos: [0, 0, 0, 0],
                ticketMedio: [0, 0, 0, 0],
                clientes: [0, 0, 0, 0],
            },
            receitas: 'R$ 0,00',
            despesas: 'R$ 0,00',
            lucro: 'R$ 0,00',
            cashFlowData: {
                receitas: [0, 0, 0, 0],
                despesas: [0, 0, 0, 0],
            },
            transactions: [],
        },
        semana: {
            faturamento: 'R$ 0,00',
            atendimentos: '0',
            ticketMedio: 'R$ 0,00',
            clientes: '0',
            chartLabels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            chartData: {
                faturamento: [0, 0, 0, 0, 0, 0],
                atendimentos: [0, 0, 0, 0, 0, 0],
                ticketMedio: [0, 0, 0, 0, 0, 0],
                clientes: [0, 0, 0, 0, 0, 0],
            },
            receitas: 'R$ 0,00',
            despesas: 'R$ 0,00',
            lucro: 'R$ 0,00',
            cashFlowData: {
                receitas: [0, 0, 0, 0, 0, 0],
                despesas: [0, 0, 0, 0, 0, 0],
            },
            transactions: [],
        },
        mensal: {
            faturamento: 'R$ 0,00',
            atendimentos: '0',
            ticketMedio: 'R$ 0,00',
            clientes: '0',
            chartLabels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            chartData: {
                faturamento: [0, 0, 0, 0],
                atendimentos: [0, 0, 0, 0],
                ticketMedio: [0, 0, 0, 0],
                clientes: [0, 0, 0, 0],
            },
            receitas: 'R$ 0,00',
            despesas: 'R$ 0,00',
            lucro: 'R$ 0,00',
            cashFlowData: {
                receitas: [0, 0, 0, 0],
                despesas: [0, 0, 0, 0],
            },
            transactions: [],
        },
        anual: {
            faturamento: 'R$ 0,00',
            atendimentos: '0',
            ticketMedio: 'R$ 0,00',
            clientes: '0',
            chartLabels: ['2022', '2023', '2024', '2025'],
            chartData: {
                faturamento: [0, 0, 0, 0],
                atendimentos: [0, 0, 0, 0],
                ticketMedio: [0, 0, 0, 0],
                clientes: [0, 0, 0, 0],
            },
            receitas: 'R$ 0,00',
            despesas: 'R$ 0,00',
            lucro: 'R$ 0,00',
            cashFlowData: {
                receitas: [0, 0, 0, 0],
                despesas: [0, 0, 0, 0],
            },
            transactions: [],
        },
    },
    'Unidade Filial': {
        dia: {
            faturamento: 'R$ 0,00',
            atendimentos: '0',
            ticketMedio: 'R$ 0,00',
            clientes: '0',
            chartLabels: ['-3h', '-2h', '-1h', 'Agora'],
            chartData: {
                faturamento: [0, 0, 0, 0],
                atendimentos: [0, 0, 0, 0],
                ticketMedio: [0, 0, 0, 0],
                clientes: [0, 0, 0, 0],
            },
            receitas: 'R$ 0,00',
            despesas: 'R$ 0,00',
            lucro: 'R$ 0,00',
            cashFlowData: {
                receitas: [0, 0, 0, 0],
                despesas: [0, 0, 0, 0],
            },
            transactions: [],
        },
        semana: {
            faturamento: 'R$ 0,00',
            atendimentos: '0',
            ticketMedio: 'R$ 0,00',
            clientes: '0',
            chartLabels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            chartData: {
                faturamento: [0, 0, 0, 0, 0, 0],
                atendimentos: [0, 0, 0, 0, 0, 0],
                ticketMedio: [0, 0, 0, 0, 0, 0],
                clientes: [0, 0, 0, 0, 0, 0],
            },
            receitas: 'R$ 0,00',
            despesas: 'R$ 0,00',
            lucro: 'R$ 0,00',
            cashFlowData: {
                receitas: [0, 0, 0, 0, 0, 0],
                despesas: [0, 0, 0, 0, 0, 0],
            },
            transactions: [],
        },
        mensal: {
            faturamento: 'R$ 0,00',
            atendimentos: '0',
            ticketMedio: 'R$ 0,00',
            clientes: '0',
            chartLabels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            chartData: {
                faturamento: [0, 0, 0, 0],
                atendimentos: [0, 0, 0, 0],
                ticketMedio: [0, 0, 0, 0],
                clientes: [0, 0, 0, 0],
            },
            receitas: 'R$ 0,00',
            despesas: 'R$ 0,00',
            lucro: 'R$ 0,00',
            cashFlowData: {
                receitas: [0, 0, 0, 0],
                despesas: [0, 0, 0, 0],
            },
            transactions: [],
        },
        anual: {
            faturamento: 'R$ 0,00',
            atendimentos: '0',
            ticketMedio: 'R$ 0,00',
            clientes: '0',
            chartLabels: ['2022', '2023', '2024', '2025'],
            chartData: {
                faturamento: [0, 0, 0, 0],
                atendimentos: [0, 0, 0, 0],
                ticketMedio: [0, 0, 0, 0],
                clientes: [0, 0, 0, 0],
            },
            receitas: 'R$ 0,00',
            despesas: 'R$ 0,00',
            lucro: 'R$ 0,00',
            cashFlowData: {
                receitas: [0, 0, 0, 0],
                despesas: [0, 0, 0, 0],
            },
            transactions: [],
        },
    },
};


const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex items-center space-x-4 transform transition-transform hover:-translate-y-1">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-secondary">{value}</p>
        </div>
    </div>
);

const PerformanceChart: React.FC<{ data: any, labels: string[], t: (key: string) => string }> = ({ data, labels, t }) => {
    if (!data) return null;

    const metrics = [
        { key: 'faturamento', name: t('accountRevenue'), color: 'bg-green-500' },
        { key: 'atendimentos', name: t('accountAppointments'), color: 'bg-blue-500' },
        { key: 'ticketMedio', name: t('accountAvgTicket'), color: 'bg-yellow-500' },
        { key: 'clientes', name: t('clients'), color: 'bg-purple-500' },
    ];

    // Find the overall max value across all metrics for scaling
    const maxValues = metrics.map(m => Math.max(...data[m.key]));
    const overallMax = Math.max(...maxValues, 1);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-secondary mb-4">{t('accountPerformanceChart')}</h2>
            <div className="h-72 bg-light p-4 rounded-lg flex items-end justify-around gap-2 md:gap-4">
                {labels.map((label, index) => (
                    <div key={label} className="flex-1 flex flex-col items-center h-full">
                        <div className="w-full h-full flex items-end justify-center gap-1">
                            {metrics.map(metric => (
                                <div
                                    key={metric.key}
                                    className={`w-1/4 rounded-t-md transition-all duration-300 hover:opacity-80 ${metric.color}`}
                                    style={{ height: `${(data[metric.key][index] / overallMax) * 100}%` }}
                                    title={`${metric.name}: ${data[metric.key][index]}`}
                                ></div>
                            ))}
                        </div>
                        <span className="text-xs font-semibold text-gray-500 mt-2">{label}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center flex-wrap mt-4 gap-x-4 gap-y-2">
                {metrics.map(metric => (
                    <div key={metric.key} className="flex items-center text-sm text-gray-600">
                        <span className={`w-3 h-3 rounded-full mr-2 ${metric.color}`}></span>
                        <span>{metric.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CashFlowChart: React.FC<{ data: any, labels: string[], t: (key: string) => string }> = ({ data, labels, t }) => {
    if (!data) return null;
    const maxVal = Math.max(...data.receitas, ...data.despesas, 1);
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-secondary mb-4">{t('accountCashFlowChart')}</h2>
            <div className="h-72 bg-light p-4 rounded-lg flex items-end justify-around gap-2 md:gap-4">
                {labels.map((label, index) => (
                    <div key={label} className="flex-1 flex flex-col items-center h-full">
                        <div className="w-full h-full flex items-end justify-center gap-1">
                            <div className="w-1/3 bg-green-400 rounded-t-md" style={{ height: `${(data.receitas[index] / maxVal) * 100}%` }} title={`${t('accountRevenues')}: R$ ${data.receitas[index]}`}></div>
                            <div className="w-1/3 bg-red-400 rounded-t-md" style={{ height: `${(data.despesas[index] / maxVal) * 100}%` }} title={`${t('accountExpenses')}: R$ ${data.despesas[index]}`}></div>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 mt-2">{label}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-center flex-wrap mt-4 gap-x-4 gap-y-2">
                <div className="flex items-center text-sm text-gray-600"><span className="w-3 h-3 rounded-full mr-2 bg-green-400"></span><span>{t('accountRevenues')}</span></div>
                <div className="flex items-center text-sm text-gray-600"><span className="w-3 h-3 rounded-full mr-2 bg-red-400"></span><span>{t('accountExpenses')}</span></div>
            </div>
        </div>
    );
}

// Icons
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m-4 0H8v1m4-1v-1m-4 5v1m-2-4h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" /></svg>;
const ClipboardCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const CardUsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5z" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const TrendingDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4-4-6-6" /></svg>;


const AccountPage: React.FC<AccountPageProps> = ({ currentUser, navigate, isIndividualPlan, selectedUnit, onUnitChange, units, promotions = [], onOpenPromoModal }) => {
    const { t } = useLanguage();
    const [timePeriod, setTimePeriod] = useState<'dia' | 'semana' | 'mensal' | 'anual'>('mensal');
    const [data, setData] = useState(accountData[selectedUnit]?.[timePeriod] || {});

    // Estado do carrossel de Promoções Exclusivas
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = promotions.length || 1; // Total de promoções exclusivas

    // Rotação automática a cada 10 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev === totalSlides - 1 ? 0 : prev + 1));
        }, 10000); // 10 segundos

        return () => clearInterval(interval);
    }, []);

    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    });

    useEffect(() => {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            setTimePeriod('dia');
        } else if (diffDays <= 7) {
            setTimePeriod('semana');
        } else if (diffDays <= 31) {
            setTimePeriod('mensal');
        } else {
            setTimePeriod('anual');
        }
    }, [startDate, endDate]);

    useEffect(() => {
        setData(accountData[selectedUnit]?.[timePeriod] || {});
    }, [selectedUnit, timePeriod]);

    // Funções de navegação do carrossel
    const navigateCarousel = (direction: 'prev' | 'next') => {
        setCurrentSlide(prev => {
            if (direction === 'prev') {
                return prev === 0 ? totalSlides - 1 : prev - 1;
            } else {
                return prev === totalSlides - 1 ? 0 : prev + 1;
            }
        });
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    // Atualizar posição do carrossel quando o slide mudar
    useEffect(() => {
        const carousel = document.getElementById('exclusive-carousel');
        if (carousel) {
            carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
    }, [currentSlide]);

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

    return (
        <div className="container mx-auto px-6 py-8">
            {isIndividualPlan && (
                <div className="bg-gradient-to-r from-primary to-green-400 p-6 rounded-2xl shadow-lg mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </div>
                        <div>
                            <h2 className="font-bold text-xl">{t('upgradeTitle')}</h2>
                            <p className="text-sm opacity-90">{t('upgradeDesc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('upgrade_to_empresa')}
                        className="bg-white text-primary font-bold py-3 px-6 rounded-full transition duration-300 transform hover:scale-105 shadow-md flex-shrink-0"
                    >
                        {t('upgradeButton')}
                    </button>
                </div>
            )}
            <div className="bg-white p-4 rounded-2xl shadow-lg mb-8 space-y-4">
                <div>
                    <label htmlFor="unit-filter-account" className="block text-sm font-medium text-gray-700 mb-1">{t('unit')}</label>
                    <select
                        id="unit-filter-account"
                        value={selectedUnit}
                        onChange={(e) => onUnitChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={isIndividualPlan}
                    >
                        {isIndividualPlan ? (
                            <option value="Unidade Matriz">{t('accountUnit1')}</option>
                        ) : (
                            units.map(unit => <option key={unit.id} value={unit.name}>{unit.name === 'Unidade Matriz' ? t('accountUnit1') : t('accountUnit2')}</option>)
                        )}
                    </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between flex-wrap">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label htmlFor="start-date-account" className="text-sm font-medium text-gray-700">{t('from')}:</label>
                            <input
                                id="start-date-account"
                                type="date"
                                value={startDate.toISOString().split('T')[0]}
                                onChange={(e) => setStartDate(new Date(e.target.value + 'T00:00:00'))}
                                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="end-date-account" className="text-sm font-medium text-gray-700">{t('to')}:</label>
                            <input
                                id="end-date-account"
                                type="date"
                                value={endDate.toISOString().split('T')[0]}
                                onChange={(e) => setEndDate(new Date(e.target.value + 'T23:59:59'))}
                                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex items-center bg-light p-1 rounded-full overflow-x-auto">
                        <button onClick={setToday} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${timePeriod === 'dia' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('today')}</button>
                        <button onClick={setThisWeek} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${timePeriod === 'semana' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('week')}</button>
                        <button onClick={setThisMonth} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${timePeriod === 'mensal' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('month')}</button>
                        <button onClick={setThisYear} className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 transition-colors ${timePeriod === 'anual' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/20'}`}>{t('year')}</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title={t('accountRevenue')} value={data.faturamento} icon={<DollarIcon />} color="bg-green-100 text-green-600" />
                <StatCard title={t('accountAppointments')} value={data.atendimentos} icon={<ClipboardCheckIcon />} color="bg-blue-100 text-blue-600" />
                <StatCard title={t('accountAvgTicket')} value={data.ticketMedio} icon={<TicketIcon />} color="bg-yellow-100 text-yellow-600" />
                <StatCard title={t('clients')} value={data.clientes} icon={<CardUsersIcon />} color="bg-purple-100 text-purple-600" />
            </div>

            {/* Promoções Exclusivas para Clientes */}
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Promoção Exclusiva
                    </h3>
                </div>

                {/* Carrossel de Promoções Exclusivas */}
                <div className="relative">
                    <div className="overflow-hidden rounded-lg">
                        <div className="flex transition-transform duration-300 ease-in-out" id="exclusive-carousel">
                            {promotions && promotions.length > 0 ? (
                                promotions.map((promo, index) => (
                                    <div key={promo.id || index} className="min-w-full px-2">
                                        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <img
                                                src={promo.image || "https://via.placeholder.com/400x200"}
                                                alt={promo.title}
                                                className="w-full h-32 object-cover rounded-lg mb-3"
                                            />
                                            <h4 className="font-semibold text-gray-800 text-sm mb-2">{promo.title}</h4>
                                            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{promo.description}</p>
                                            <button className="w-full bg-primary text-white text-sm py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">
                                                {promo.actionButton || 'Ver Mais'}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="min-w-full px-2 text-center py-8 text-gray-500">
                                    Nenhuma promoção exclusiva no momento.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Setas de Navegação */}
                    <button
                        onClick={() => navigateCarousel('prev')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg z-10 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => navigateCarousel('next')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg z-10 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Indicadores do Carrossel */}
                <div className="flex justify-center mt-4 space-x-2">
                    {Array.from({ length: totalSlides }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? 'bg-primary' : 'bg-gray-300'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <PerformanceChart data={data.chartData} labels={data.chartLabels} t={t} />
                <CashFlowChart data={data.cashFlowData} labels={data.chartLabels} t={t} />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold text-secondary mb-4">{t('accountLatestTransactions')} ({t(`period${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}`)})</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('description')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('value')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.transactions && data.transactions.map((t: any) => (
                                <tr key={t.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.description}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${t.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'despesa' && '- '}R$ {t.amount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default AccountPage;
