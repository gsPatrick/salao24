import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Mock data for the mobile views
const mobileAgendaItems = [
  { time: '09:00', client: 'Juliana Costa', service: 'Corte e Hidratação', status: 'concluido' },
  { time: '10:30', client: 'Marcos Andrade', service: 'Barba e Cabelo', status: 'concluido' },
  { time: '14:00', client: 'Renata Alves', service: 'Escova Progressiva', status: 'espera' },
  { time: '16:00', client: 'Luiza Ferreira', service: 'Luzes', status: 'agendado' },
  { time: '17:30', client: 'Beatriz Lima', service: 'Manicure', status: 'agendado' },
];

const mockClients = [
    { name: 'Juliana Costa', lastService: 'Corte e Hidratação', avatar: 'https://i.pravatar.cc/150?u=juliana' },
    { name: 'Marcos Andrade', lastService: 'Barba e Cabelo', avatar: 'https://i.pravatar.cc/150?u=marcos' },
    { name: 'Renata Alves', lastService: 'Escova Progressiva', avatar: 'https://i.pravatar.cc/150?u=renata' },
    { name: 'Luiza Ferreira', lastService: 'Luzes', avatar: 'https://i.pravatar.cc/150?u=luiza' },
];

const mockFinancials = {
    revenue: 965.00,
    expenses: 120.50,
    transactions: [
        { description: 'Corte e Hidratação', amount: 150.00 },
        { description: 'Barba e Cabelo', amount: 80.00 },
        { description: 'Compra de Shampoos', amount: -55.50 },
        { description: 'Escova Progressiva', amount: 250.00 },
        { description: 'Luzes', amount: 485.00 },
        { description: 'Café e Lanches', amount: -65.00 },
    ]
};


// Views for each tab
const AgendaView = () => (
    <div className="space-y-2 animate-fade-in">
        {mobileAgendaItems.map((item, index) => {
            const statusStyles = {
                concluido: 'border-green-500',
                espera: 'border-yellow-500 animate-pulse',
                agendado: 'border-blue-500',
            };
            return (
                <div key={index} className={`bg-white p-3 rounded-lg shadow-sm border-l-4 ${statusStyles[item.status as keyof typeof statusStyles]}`}>
                    <div className="flex justify-between items-center">
                        <p className="font-bold text-primary">{item.time}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.status === 'concluido' ? 'bg-green-100 text-green-800' : 
                          item.status === 'espera' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                    </div>
                    <p className="font-semibold text-secondary text-sm mt-1">{item.client}</p>
                    <p className="text-xs text-gray-500">{item.service}</p>
                </div>
            );
        })}
    </div>
);

const ClientesView = () => (
    <div className="space-y-2 animate-fade-in">
        <input type="text" placeholder="Buscar cliente..." className="w-full p-2 border rounded-md text-sm text-gray-700 mb-2" />
        {mockClients.map((client, index) => (
            <div key={index} className="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-3">
                <img src={client.avatar} alt={client.name} className="w-10 h-10 rounded-full" />
                <div>
                    <p className="font-semibold text-secondary text-sm">{client.name}</p>
                    <p className="text-xs text-gray-500">Último: {client.lastService}</p>
                </div>
            </div>
        ))}
    </div>
);

const FinanceiroView = () => (
    <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-100 p-3 rounded-lg text-center">
                <p className="text-xs font-semibold text-green-800">Faturamento (Dia)</p>
                <p className="text-lg font-bold text-green-900">R$ {mockFinancials.revenue.toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg text-center">
                <p className="text-xs font-semibold text-red-800">Despesas (Dia)</p>
                <p className="text-lg font-bold text-red-900">R$ {mockFinancials.expenses.toFixed(2).replace('.', ',')}</p>
            </div>
        </div>
        <div>
            <h3 className="font-bold text-secondary text-sm mb-2">Últimas Transações</h3>
            <div className="space-y-2">
                {mockFinancials.transactions.map((t, i) => (
                    <div key={i} className="bg-white p-2 rounded-lg shadow-sm flex justify-between items-center text-sm">
                        <p className="text-gray-700">{t.description}</p>
                        <p className={`font-semibold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {t.amount > 0 ? '+' : '-'} R$ {Math.abs(t.amount).toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const MobileExperience: React.FC = () => {
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

    const [activeTab, setActiveTab] = useState('agenda');

  return (
    <section id="mobile-experience" className="py-16 sm:py-20 bg-secondary text-white">
      <div className="container mx-auto px-6">
        <div ref={sectionRef} className={`grid md:grid-cols-2 gap-12 items-center transition-opacity duration-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          {/* Phone Mockup */}
          <div className="flex justify-center items-center">
            <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
              <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
              <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
                {/* App Screen Content */}
                <div className="flex flex-col h-full">
                  {/* App Header */}
                  <header className="bg-white p-3 border-b flex justify-between items-center flex-shrink-0">
                    <div>
                      <p className="text-xs text-gray-500">
                        {activeTab === 'agenda' && t('myAgenda')}
                        {activeTab === 'clientes' && t('clients')}
                        {activeTab === 'financeiro' && t('financial')}
                      </p>
                      <p className="font-bold text-secondary">
                        {activeTab === 'agenda' && 'Fernanda Lima'}
                        {activeTab === 'clientes' && 'Lista de Clientes'}
                        {activeTab === 'financeiro' && 'Resumo do Dia'}
                      </p>
                    </div>
                    <img src="https://i.pravatar.cc/150?u=fernanda" alt="Fernanda Lima" className="w-10 h-10 rounded-full" />
                  </header>

                  {/* Date Header for Agenda */}
                  {activeTab === 'agenda' && (
                      <div className="bg-light p-2 text-center flex-shrink-0">
                        <p className="font-bold text-sm text-secondary">Hoje, 28 de Outubro</p>
                      </div>
                  )}

                  {/* Main Content Area */}
                  <main className="flex-1 overflow-y-auto p-2 bg-light">
                      {activeTab === 'agenda' && <AgendaView />}
                      {activeTab === 'clientes' && <ClientesView />}
                      {activeTab === 'financeiro' && <FinanceiroView />}
                  </main>
                  
                  {/* App Footer/Nav */}
                  <footer className="bg-white border-t p-2 flex justify-around items-center flex-shrink-0">
                     <button onClick={() => setActiveTab('agenda')} className={`flex flex-col items-center transition-colors duration-200 ${activeTab === 'agenda' ? 'text-primary' : 'text-gray-500'}`}>
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zM6 3a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V4a1 1 0 00-1-1H6z"></path></svg>
                       <span className="text-xs font-semibold">{t('scheduling')}</span>
                     </button>
                      <button onClick={() => setActiveTab('clientes')} className={`flex flex-col items-center transition-colors duration-200 ${activeTab === 'clientes' ? 'text-primary' : 'text-gray-500'}`}>
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                       <span className="text-xs font-semibold">{t('clients')}</span>
                     </button>
                      <button onClick={() => setActiveTab('financeiro')} className={`flex flex-col items-center transition-colors duration-200 ${activeTab === 'financeiro' ? 'text-primary' : 'text-gray-500'}`}>
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                       <span className="text-xs font-semibold">{t('financial')}</span>
                     </button>
                  </footer>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center md:text-left flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold">{t('mobileTitle')}</h2>
            <p className="text-lg text-gray-300 mt-4 max-w-lg mx-auto md:mx-0">
              {t('mobileSubtitle')}
            </p>
            <ul className="mt-6 text-left space-y-3 inline-block mx-auto md:mx-0">
                <li className="flex items-center">
                    <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                    <span dangerouslySetInnerHTML={{ __html: t('mobileFeature1') }} />
                </li>
                <li className="flex items-center">
                    <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                     <span dangerouslySetInnerHTML={{ __html: t('mobileFeature2') }} />
                </li>
                 <li className="flex items-center">
                    <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                     <span dangerouslySetInnerHTML={{ __html: t('mobileFeature3') }} />
                </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileExperience;