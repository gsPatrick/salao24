

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Icons for the stat cards
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 6v-1h4v1m-4 0H8v1m4-1v-1m-4 5v1m-2-4h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" /></svg>;
const ClipboardCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const CardUsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ChartPieIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;

// --- MOCK VIEWS FOR THE ANIMATED INTERFACE ---

const DashboardView = () => {
    const { t } = useLanguage();
    return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-secondary mb-6">{t('dashboard')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-light p-3 rounded-lg flex items-center gap-3"><div className="p-2 bg-green-100 rounded-full text-green-600"><DollarIcon /></div><div><h4 className="font-semibold text-gray-500 text-xs sm:text-sm">{t('mockupRevenueDay')}</h4><p className="text-lg sm:text-xl font-bold text-secondary">R$ 875,00</p></div></div>
        <div className="bg-light p-3 rounded-lg flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-full text-blue-600"><ClipboardCheckIcon /></div><div><h4 className="font-semibold text-gray-500 text-xs sm:text-sm">{t('mockupAppointments')}</h4><p className="text-lg sm:text-xl font-bold text-secondary">12 / 15</p></div></div>
        <div className="bg-light p-3 rounded-lg flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-full text-purple-600"><CardUsersIcon /></div><div><h4 className="font-semibold text-gray-500 text-xs sm:text-sm">{t('mockupNewClients')}</h4><p className="text-lg sm:text-xl font-bold text-secondary">8</p></div></div>
        <div className="bg-light p-3 rounded-lg flex items-center gap-3"><div className="p-2 bg-yellow-100 rounded-full text-yellow-600"><ChartPieIcon /></div><div><h4 className="font-semibold text-gray-500 text-xs sm:text-sm">{t('mockupOccupancy')}</h4><p className="text-lg sm:text-xl font-bold text-secondary">85%</p></div></div>
      </div>
       <div className="mt-8">
            <h2 className="text-xl font-bold text-secondary mb-4">{t('mockupNextAppointments')}</h2>
            <div className="space-y-3">
                <div className="bg-light p-3 rounded-lg flex justify-between items-center"><div className="flex items-center gap-3"><span className="font-bold text-primary">14:00</span><p className="font-semibold text-secondary">Beatriz Lima</p></div><span className="text-sm text-gray-500">{t('mockupServiceCutAndBlowdry')}</span></div>
                <div className="bg-light p-3 rounded-lg flex justify-between items-center"><div className="flex items-center gap-3"><span className="font-bold text-primary">15:00</span><p className="font-semibold text-secondary">Juliana Paes</p></div><span className="text-sm text-gray-500">{t('mockupServiceManicure')}</span></div>
            </div>
        </div>
    </div>
)};

const AgendaView = () => {
    const { t } = useLanguage();
    return (
    <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-secondary mb-6">{t('appMockupViewAgenda')}</h1>
        <div className="bg-light p-4 rounded-lg space-y-4">
            <div className="flex gap-4"><div className="w-16 text-right font-bold text-primary">09:00</div><div className="flex-1 bg-primary/20 p-2 rounded-md text-sm"><p className="font-semibold text-primary-dark">Juliana Paes</p><p className="text-xs">{t('mockupServiceCutAndHydration')}</p></div></div>
            <div className="flex gap-4"><div className="w-16 text-right font-bold text-primary">10:00</div><div className="flex-1 bg-primary/20 p-2 rounded-md text-sm"><p className="font-semibold text-primary-dark">Márcio Garcia</p><p className="text-xs">{t('mockupServiceBeardTherapy')}</p></div></div>
            <div className="flex gap-4"><div className="w-16 text-right font-bold text-gray-400">11:00</div><div className="flex-1 border-2 border-dashed border-gray-200 p-2 rounded-md text-sm text-center text-gray-400">{t('mockupEmptySlot')}</div></div>
            <div className="flex gap-4"><div className="w-16 text-right font-bold text-primary">12:00</div><div className="flex-1 bg-yellow-100 p-2 rounded-md text-sm text-center"><p className="font-semibold text-yellow-800">{t('mockupLunch')}</p></div></div>
            <div className="flex gap-4"><div className="w-16 text-right font-bold text-primary">13:00</div><div className="flex-1 bg-primary/20 p-2 rounded-md text-sm"><p className="font-semibold text-primary-dark">Beatriz Lima</p><p className="text-xs">{t('mockupServiceManicure')}</p></div></div>
        </div>
    </div>
)};

const ClientesView = () => {
    const { t } = useLanguage();
    return (
    <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-secondary mb-6">{t('appMockupViewClients')}</h1>
        <input type="text" placeholder={t('mockupSearchClient')} className="w-full p-2 border border-gray-200 rounded-md mb-4"/>
        <div className="space-y-3">
            <div className="bg-light p-3 rounded-lg flex items-center gap-4"><img src="https://i.pravatar.cc/150?u=juliana" alt={t('mockupClientPhoto', { name: 'Juliana Paes' })} className="w-10 h-10 rounded-full"/><div><p className="font-semibold text-secondary">Juliana Paes</p><p className="text-xs text-gray-500">{t('mockupLastVisit')}: 15/10</p></div></div>
            <div className="bg-light p-3 rounded-lg flex items-center gap-4"><img src="https://i.pravatar.cc/150?u=marcio" alt={t('mockupClientPhoto', { name: 'Márcio Garcia' })} className="w-10 h-10 rounded-full"/><div><p className="font-semibold text-secondary">Márcio Garcia</p><p className="text-xs text-gray-500">{t('mockupLastVisit')}: 12/10</p></div></div>
            <div className="bg-light p-3 rounded-lg flex items-center gap-4"><img src="https://i.pravatar.cc/150?u=beatriz" alt={t('mockupClientPhoto', { name: 'Beatriz Lima' })} className="w-10 h-10 rounded-full"/><div><p className="font-semibold text-secondary">Beatriz Lima</p><p className="text-xs text-gray-500">{t('mockupLastVisit')}: 18/09</p></div></div>
        </div>
    </div>
)};

const CRMView = () => {
    const { t } = useLanguage();
    return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-secondary mb-6">{t('mockupCRMTitle')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-light p-3 rounded-lg"><h3 className="font-bold text-sm text-blue-600 mb-3 text-center">{t('mockupCRMCategoryNew')} ✨</h3><div className="space-y-2"><div className="bg-white p-2 rounded-md shadow-sm flex items-center gap-2"><img src="https://i.pravatar.cc/150?u=novocliente1" alt={t('mockupClientPhoto', { name: 'Juliana Paes' })} className="w-8 h-8 rounded-full"/><span className="text-sm font-medium text-secondary">Juliana Paes</span></div><div className="bg-white p-2 rounded-md shadow-sm flex items-center gap-2"><img src="https://i.pravatar.cc/150?u=novocliente2" alt={t('mockupClientPhoto', { name: 'Márcio Garcia' })} className="w-8 h-8 rounded-full"/><span className="text-sm font-medium text-secondary">Márcio Garcia</span></div></div></div>
        <div className="bg-light p-3 rounded-lg"><h3 className="font-bold text-sm text-green-600 mb-3 text-center">{t('mockupCRMCategoryScheduled')} ✅</h3><div className="space-y-2"><div className="bg-white p-2 rounded-md shadow-sm flex items-center gap-2"><img src="https://i.pravatar.cc/150?u=agendado1" alt={t('mockupClientPhoto', { name: 'Beatriz Lima' })} className="w-8 h-8 rounded-full"/><span className="text-sm font-medium text-secondary">Beatriz Lima</span></div></div></div>
        <div className="bg-light p-3 rounded-lg"><h3 className="font-bold text-sm text-yellow-600 mb-3 text-center">{t('mockupCRMCategoryInactive')} ⏳</h3><div className="space-y-2"><div className="bg-white p-2 rounded-md shadow-sm flex items-center gap-2"><img src="https://i.pravatar.cc/150?u=inativo1" alt={t('mockupClientPhoto', { name: 'Carla Souza' })} className="w-8 h-8 rounded-full"/><span className="text-sm font-medium text-secondary">Carla Souza</span></div><div className="bg-white p-2 rounded-md shadow-sm flex items-center gap-2"><img src="https://i.pravatar.cc/150?u=inativo2" alt={t('mockupClientPhoto', { name: 'Pedro Alves' })} className="w-8 h-8 rounded-full"/><span className="text-sm font-medium text-secondary">Pedro Alves</span></div></div></div>
      </div>
    </div>
)};

const EstoqueView = () => {
    const { t } = useLanguage();
    return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-secondary mb-6">{t('appMockupViewStock')}</h1>
      <div className="bg-light p-4 rounded-lg space-y-2">
        <div className="bg-white p-2 rounded-md grid grid-cols-3 items-center text-sm"><p className="font-semibold text-secondary">{t('mockupStockProduct1')}</p><p className="text-center text-gray-600">30 un.</p><p className="text-right"><span className="font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">{t('mockupStockStatusInStock')}</span></p></div>
        <div className="bg-white p-2 rounded-md grid grid-cols-3 items-center text-sm"><p className="font-semibold text-secondary">{t('mockupStockProduct2')}</p><p className="text-center text-gray-600">5 un.</p><p className="text-right"><span className="font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">{t('mockupStockStatusLow')}</span></p></div>
        <div className="bg-white p-2 rounded-md grid grid-cols-3 items-center text-sm"><p className="font-semibold text-secondary">{t('mockupStockProduct3')}</p><p className="text-center text-gray-600">15 un.</p><p className="text-right"><span className="font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">{t('mockupStockStatusInStock')}</span></p></div>
      </div>
    </div>
)};

const FinanceiroView = () => {
    const { t } = useLanguage();
    return (
    <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-secondary mb-6">{t('appMockupViewFinancial')}</h1>
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-100 p-4 rounded-lg text-green-800"><p className="font-semibold">{t('mockupFinancialRevenueMonth')}</p><p className="text-xl sm:text-2xl font-bold">R$ 12.500,00</p></div>
            <div className="bg-red-100 p-4 rounded-lg text-red-800"><p className="font-semibold">{t('mockupFinancialExpensesMonth')}</p><p className="text-xl sm:text-2xl font-bold">R$ 4.200,00</p></div>
        </div>
        <h2 className="text-lg font-bold text-secondary mb-3">{t('mockupFinancialLatestTransactions')}</h2>
        <div className="space-y-2 text-sm"><div className="bg-light p-2 rounded-md flex justify-between items-center"><p>{t('mockupFinancialTransaction1')}</p><p className="font-semibold text-green-600">+ R$ 75,00</p></div><div className="bg-light p-2 rounded-md flex justify-between items-center"><p>{t('mockupFinancialTransaction2')}</p><p className="font-semibold text-red-600">- R$ 1.500,00</p></div><div className="bg-light p-2 rounded-md flex justify-between items-center"><p>{t('mockupFinancialTransaction3')}</p><p className="font-semibold text-green-600">+ R$ 90,00</p></div></div>
    </div>
)};

const ConfiguracoesView = () => {
    const { t } = useLanguage();
    return (
    <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-secondary mb-6">{t('appMockupViewSettings')}</h1>
        <div className="space-y-4 bg-light p-4 rounded-lg">
            <div className="bg-white p-3 rounded-md"><label className="font-semibold text-secondary text-sm">{t('mockupSettingsSalonName')}</label><input type="text" value="" disabled className="w-full bg-gray-100 p-2 rounded-md mt-1 text-sm text-gray-500"/></div>
            <div className="bg-white p-3 rounded-md"><label className="font-semibold text-secondary text-sm">{t('mockupSettingsAddress')}</label><input type="text" value="" disabled className="w-full bg-gray-100 p-2 rounded-md mt-1 text-sm text-gray-500"/></div>
            <div className="bg-white p-3 rounded-md flex justify-between items-center"><label className="font-semibold text-secondary text-sm">{t('mockupSettingsOnlineBooking')}</label><div className="w-10 h-6 bg-primary rounded-full p-1 flex items-center"><div className="w-4 h-4 bg-white rounded-full ml-auto"></div></div></div>
        </div>
    </div>
)};

interface AppMockupProps {
  navigate: (page: string) => void;
}

const AppMockup: React.FC<AppMockupProps> = ({ navigate }) => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -100px 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const [activeView, setActiveView] = useState('Dashboard');
  const sidebarItems = [
    { key: 'Dashboard', label: t('appMockupViewDashboard') },
    { key: 'Agenda', label: t('appMockupViewAgenda') },
    { key: 'Clientes', label: t('appMockupViewClients') },
    { key: 'CRM', label: t('appMockupViewCRM') },
    { key: 'Estoque', label: t('appMockupViewStock') },
    { key: 'Financeiro', label: t('appMockupViewFinancial') },
    { key: 'Configurações', label: t('appMockupViewSettings') },
  ];

  const renderContent = () => {
    switch (activeView) {
        case 'Dashboard': return <DashboardView />;
        case 'Agenda': return <AgendaView />;
        case 'Clientes': return <ClientesView />;
        case 'CRM': return <CRMView />;
        case 'Estoque': return <EstoqueView />;
        case 'Financeiro': return <FinanceiroView />;
        case 'Configurações': return <ConfiguracoesView />;
        default: return <DashboardView />;
    }
  };

  return (
    <section id="app-interface" className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary">{t('appMockupTitle')}</h2>
          <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
            {t('appMockupSubtitle')}
          </p>
        </div>

        <div ref={sectionRef} className={`max-w-5xl mx-auto bg-secondary/5 border border-gray-200 rounded-2xl shadow-2xl p-4 transition-opacity duration-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          {/* Browser Header */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>

          {/* App UI */}
          <div className="bg-white rounded-lg overflow-hidden flex h-[500px] sm:h-[600px]">
            {/* Sidebar */}
            <div className="w-1/4 lg:w-1/5 bg-light p-4 border-r border-gray-100 hidden sm:block">
              <h3 className="font-bold text-lg text-secondary mb-6">Salão24h</h3>
              <ul className="space-y-3 text-sm">
                {sidebarItems.map((item) => (
                  <li key={item.key}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveView(item.key);
                      }}
                      className={`block p-2 rounded-md cursor-pointer transition-colors ${
                        activeView === item.key
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto relative">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppMockup;