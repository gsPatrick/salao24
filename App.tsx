import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';

import Header from './components/Header';
import Features from './components/Features';
import AIAssistant from './components/AIAssistant';
import AppMockup from './components/AppMockup';
import Pricing from './components/Pricing';
import ComparisonTable from './components/ComparisonTable';
import NavigationFlow from './components/NavigationFlow';
import Faq from './components/Faq';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import TrialPage from './components/TrialPage';
import AppStoreBadges from './components/AppStoreBadges';
import AboutUs from './components/AboutUs';
// FIX: Changed to a named import to resolve a module resolution error.
import { Dashboard } from './components/Dashboard';
import SchedulingPage from './components/SchedulingPage';
import MobileExperience from './components/MobileExperience';
import ClientAppPage from './components/ClientAppPage';
// FIX: Changed import to a named import as PaymentPage does not have a default export.
import { PaymentPage } from './components/PaymentPage';
import QRCodeCheckin from './components/QRCodeCheckin';
import ClientLoginPage from './components/ClientLoginPage';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import BackToTopButton from './components/BackToTopButton';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import CancellationPage from './components/CancellationPage';
import ContractSignaturePage from './components/ContractSignaturePage';
import { AnimatePresence, motion } from 'framer-motion';
import SubscriptionBlocker from './components/SubscriptionBlocker';
import TrialWelcomeModal from './components/TrialWelcomeModal';

const ComingSoonToast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 50, scale: 0.9 }}
    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-secondary border-2 border-primary text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px]"
  >
    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <div className="flex-1">
      <p className="font-bold text-primary text-sm uppercase tracking-wider">Em Breve</p>
      <p className="text-gray-200">{message}</p>
    </div>
    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  </motion.div>
);


// mockData import removed - using DataContext for all data
import { useData } from './contexts/DataContext';
import { appointmentsAPI } from './lib/api';
import { User, Client, Plan, Contract } from './types';

// ... (Rest of imports are fine)

// Removed Interfaces (User, Client, Plan, Contract) as they are now imported

const planDetailsMap: { [key: string]: Plan } = {
  'Individual': { name: 'Plano Individual', price: 'R$ 79,87' },
  'Empresa Essencial': { name: 'Plano Empresa Essencial', price: 'R$ 199,90' },
  'Empresa Pro': { name: 'Plano Empresa Pro', price: 'R$ 349,90' },
  'Empresa Premium': { name: 'Plano Empresa Premium', price: 'R$ 599,90' },
  'Vitalício': { name: 'Plano Vitalício', price: 'Gratuito' },
};

const App: React.FC = () => {
  const { t } = useLanguage();
  const { user: authUser, logout: authLogout, isSuperAdmin, planFeatures, isLoading: authLoading } = useAuth();
  // DataContext Hook
  // Sync selectedUnitId
  const {
    clients, professionals, services, appointments, transactions, units, products, promotions,
    notifications: contextNotifications,
    refreshAll,
    setSelectedUnitId,
    packages,
    salonPlans
  } = useData() || {
    clients: [], professionals: [], services: [], appointments: [], transactions: [], units: [], products: [], promotions: [], notifications: [],
    packages: [], salonPlans: [],
    refreshAll: async () => { }, setSelectedUnitId: () => { }
  };

  const [page, setPage] = useState('home');
  const [history, setHistory] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [activeAIAgent, setActiveAIAgent] = useState<'Básico' | 'Avançada' | null>('Básico');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [contractForSignature, setContractForSignature] = useState<{ contractText: string; user: User; cpf: string } | null>(null);
  const [comingSoonMessage, setComingSoonMessage] = useState<string | null>(null);
  const [subscriptionBlocked, setSubscriptionBlocked] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);

  // Scroll to top on page change
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  // Listen for subscription blocked events from API interceptor
  useEffect(() => {
    const handleSubscriptionBlocked = () => setSubscriptionBlocked(true);
    window.addEventListener('subscription:blocked', handleSubscriptionBlocked);
    return () => window.removeEventListener('subscription:blocked', handleSubscriptionBlocked);
  }, []);

  // Use context notifications or fallback
  const notifications = useMemo(() => {
    // Calculate counts from contextNotifications if available, otherwise 0
    // Assuming contextNotifications is array of { read: boolean }
    const count = Array.isArray(contextNotifications) ? contextNotifications.filter((n: any) => !n.is_read).length : 0;
    return { appointments: 0, messages: count }; // TODO: Separate appointment notifications
  }, [contextNotifications]);

  const [selectedUnit, setSelectedUnit] = useState('Carregando...');
  const [systemUsers, setSystemUsers] = useState<User[]>([]);
  const [allData, setAllData] = useState<any>({});

  // Wrapper to handle unit change and sync ID
  const handleUnitChange = (unitName: string) => {
    setSelectedUnit(unitName);
    const unitObj = units.find(u => u.name === unitName);
    if (unitObj) {
      console.log('[App] Switching unit to:', unitName, 'ID:', unitObj.id);
      setSelectedUnitId(unitObj.id);
    }
  };

  // Sync selectedUnit and allData with real units from DataContext
  useEffect(() => {
    if (Array.isArray(units) && units.length > 0) {
      const unitNames = units.map(u => u.name);

      // Update selectedUnit if needed
      if (selectedUnit === 'Carregando...' || !unitNames.includes(selectedUnit)) {
        const firstUnit = units[0];
        setSelectedUnit(firstUnit.name);
        setSelectedUnitId(firstUnit.id);
      }

      // Initialize allData structure for all units (rebuild to remove stale keys)
      setAllData((prev: any) => {
        const newData: any = {};
        units.forEach(unit => {
          // Keep existing data if unit name hasn't changed, otherwise create new structure
          newData[unit.name] = prev[unit.name] || {
            clients: [], professionals: [], services: [], packages: [], plans: [], products: [],
            transactions: [], appointments: [], marketingCampaigns: [], directMailCampaigns: [],
            acquisitionChannels: [], unitDetails: unit
          };

          // Sync with latest global data
          newData[unit.name] = {
            ...newData[unit.name],
            clients: clients.filter(c => c.preferredUnit === unit.name),
            professionals: professionals.filter(p => (p.unit === unit.name) || (p.unit_id === unit.id)),
            services: services.filter(s => !s.unit_id || s.unit_id === unit.id),
            packages: packages.filter(pkg => !pkg.unit_id || pkg.unit_id === unit.id),
            salonPlans: salonPlans.filter(sp => !sp.unit_id || sp.unit_id === unit.id),
            products,
            transactions: transactions.filter(t => t.unit === unit.name),
            appointments: appointments.filter(a => a.unit === unit.name),
            unitDetails: unit
          };
        });
        return newData;
      });
    } else if (Array.isArray(units) && units.length === 0) {
      if (selectedUnit === 'Carregando...') {
        setSelectedUnit('Unidade Principal');
      }
    }
  }, [units, clients, professionals, services, products, transactions, appointments, packages, salonPlans]);

  const currentUnitData = allData[selectedUnit] || {
    clients: [], professionals: [], services: [], packages: [], plans: [], products: [],
    transactions: [], appointments: [], marketingCampaigns: [], directMailCampaigns: [],
    acquisitionChannels: []
  };

  // --- Data Handlers ---
  const {
    saveClient, saveService, saveAppointment, saveTransaction,
    saveProfessional, saveProduct, deleteProduct, toggleSuspendProduct, updateStockQuantity
  } = useData() || {
    // Fallback
    saveClient: async () => null,
    saveService: async () => null,
    saveAppointment: async () => null,
    saveTransaction: async () => null,
    saveProfessional: async () => null,
    saveProduct: async () => null,
    deleteProduct: async () => false,
    toggleSuspendProduct: async () => null,
    updateStockQuantity: async () => null
  };

  const handleSaveClient = (client: any) => saveClient(client);
  const handleSaveService = (service: any) => saveService(service);
  // Packages and Plans might not be in DataContext yet, using dummy for now or need to add
  const handleSavePackage = (pkg: any) => { console.log('Save Package', pkg); };
  const handleSavePlan = (plan: any) => { console.log('Save Plan', plan); };

  const handleSaveProduct = (product: any) => saveProduct(product);
  const handleSaveProfessional = (professional: any) => saveProfessional(professional);
  const handleSaveTransaction = (transaction: any) => saveTransaction(transaction);
  const handleSaveAppointment = (appointment: any) => saveAppointment(appointment);

  // Generic handlers replacement (mostly unused or specific)
  const handleClientsChange = (updatedItems: any[]) => { /* Handled by DataContext refresh */ };
  const handleChannelsChange = (updatedItems: any[]) => { /* ... */ };
  const handleProductsChange = (updatedItems: any[]) => { /* ... */ };
  const handleProfessionalsChange = (updatedItems: any[]) => { /* ... */ };

  const handleSuspendProfessional = async (id: number) => {
    // Need api support for suspend professional, or update
    // saveProfessional({ id, suspended: ... })
    console.log('Suspend Professional', id);
  };

  const handleArchiveProfessional = async (id: number) => {
    console.log('Archive Professional', id);
  };

  const handleCreateAppointment = async (appointmentData: any) => {
    console.log('[App] handleCreateAppointment called:', appointmentData);
    try {
      const response = await appointmentsAPI.create(appointmentData);
      console.log('[App] appointmentsAPI.create response:', response);
      if (response.success) {
        // Refresh appointments or show success message
        console.log('Agendamento criado com sucesso:', response.data);
      } else {
        console.error('Erro ao criar agendamento:', response.message);
      }
    } catch (error) {
      console.error('Erro na requisição de agendamento:', error);
    }
  };
  const handleDeleteProduct = (id: number) => deleteProduct(id);
  const handleSuspendProduct = (id: number) => toggleSuspendProduct(id);
  const handleUpdateProductQuantity = (id: number, change: number) => updateStockQuantity(id, change);

  const handleUsersChange = (updatedUsers: User[]) => {
    setSystemUsers(updatedUsers);
  };

  const handleSuspendAcquisitionChannel = (channelId: number, channelName: string, isSuspended?: boolean) => {
    const action = isSuspended ? t('actionReactivate').toLowerCase() : t('actionSuspend').toLowerCase();
    if (window.confirm(`Tem certeza que deseja ${action} o canal "${channelName}"?`)) {
      // logic
    }
  };

  const handleArchiveAcquisitionChannel = (channelId: number, channelName: string) => {
    if (window.confirm(`Tem certeza que deseja arquivar o canal "${channelName}"?`)) {
      // logic
    }
  };

  const handleUnarchiveAcquisitionChannel = (channelId: number, channelName: string) => {
    if (window.confirm(`Tem certeza que deseja desarquivar o canal "${channelName}"?`)) {
      // logic
    }
  };

  // Sync local state with AuthContext
  useEffect(() => {
    if (authUser) {
      if (authUser.role === 'admin' || authUser.role === 'gerente' || authUser.role === 'recepcao' || authUser.role === 'profissional' || authUser.role === 'Administrador' || authUser.role === 'Gerente' || authUser.role === 'Profissional') {
        setCurrentUser(authUser as any);
        setCurrentClient(null);
        if (page === 'home' || page === 'login' || page === 'signup') {
          navigate('dashboard');
        }
      } else if (authUser.role === 'cliente') {
        setCurrentClient(authUser as any);
        setCurrentUser(null);
        if (page === 'home' || page === 'login' || page === 'signup') {
          navigate('clientApp');
        }
      }
    } else if (!authLoading) {
      setCurrentUser(null);
      setCurrentClient(null);
      if (page === 'dashboard' || page === 'clientApp' || page === 'scheduling' || page === 'clientScheduling') {
        navigate('home');
      }
    }
  }, [authUser, authLoading]);

  // Dynamic Visual Identity Injection
  useEffect(() => {
    if (currentUser?.tenant?.primary_color) {
      document.documentElement.style.setProperty('--primary-color', currentUser.tenant.primary_color);

      // Calculate a darker shade for hover states provided simple logic or use the same
      // Ideally we would darken the color hex here. For simplicity, we can use the same or a fixed darken logic.
      // Let's implement a simple darken function or just use the same for now to ensure consistency.
      // A simple way to get a "dark" variant is to assume the backend sends it or we compute it.
      // For now, let's just set primary-dark to the same or slightly adjusted if we had a util.
      // We will set it to the same color to avoid breakage, or improved later.
      document.documentElement.style.setProperty('--primary-dark', currentUser.tenant.primary_color);
    }
  }, [currentUser]);

  useEffect(() => {
    // Prevent browser from trying to restore scroll position on back/forward
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);


  const [navigationParams, setNavigationParams] = useState<any>(null);

  const navigate = (pageName: string, params?: any) => {
    if (pageName === 'upgrade_to_empresa') {
      setSelectedPlan({ name: 'Empresa Pro', price: 'R$ 349,90' });
      pageName = 'payment';
    }
    if (pageName === 'updatePaymentMethod') {
      pageName = 'updatePaymentMethod';
    }
    if (page !== pageName) {
      setHistory(prev => [...prev, page]);
      setPage(pageName);
      setNavigationParams(params || null);
      // Sempre voltar para o topo ao trocar de "página" interna
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  };

  const goBack = () => {
    const lastPage = history[history.length - 1];
    if (lastPage) {
      setHistory(prev => prev.slice(0, -1));
      setPage(lastPage);
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
      navigate('home');
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  };

  const handlePlanSelection = (plan: Plan) => {
    setSelectedPlan(plan);
    navigate('trial');
  };

  const handleServicePayment = (service: { name: string, price: string }) => {
    setSelectedPlan(service);
    navigate('payment');
  };

  const handlePayInstallment = (planName: 'Individual' | 'Empresa' | 'Vitalício' | 'Empresa Essencial' | 'Empresa Pro' | 'Empresa Premium') => {
    const planToPay = planDetailsMap[planName];
    if (planToPay) {
      setSelectedPlan(planToPay);
      navigate('payment');
    }
  };

  const handleLoginSuccess = (user: User) => {
    console.log('[DEBUG] handleLoginSuccess called with user:', user);
    console.log('[DEBUG] user.role:', user.role);
    console.log('[DEBUG] user.role === cliente:', user.role === 'cliente');

    if (user.email === 'admin@salao24h.com') {
      user.plan = 'Vitalício';
    }

    // Check if user is a client and redirect accordingly
    if (user.role === 'cliente') {
      console.log('[DEBUG] Redirecting to clientApp');
      setCurrentClient(user as any);
      setCurrentUser(null);
      setHistory([]);
      navigate('clientApp');
    } else {
      console.log('[DEBUG] Redirecting to dashboard, role is:', user.role);
      setCurrentUser(user);
      setCurrentClient(null);
      setHistory([]);
      navigate('dashboard');
    }
  };

  const handleClientLoginSuccess = (client: Client) => {
    setCurrentClient(client);
    setCurrentUser(null);
    setHistory([]);
    navigate('clientApp');
  };

  const handleTrialSuccess = (user: User, contractData?: Contract) => {
    const userWithContract = contractData
      ? { ...user, contracts: [...(user.contracts || []), contractData] }
      : user;
    setCurrentUser(userWithContract);
    setCurrentClient(null);
    setHistory([]);
    navigate('dashboard');
  };

  const handleStartSignatureFlow = (data: { contractText: string; user: User; cpf: string }) => {
    setContractForSignature(data);
  };

  const handleLogout = () => {
    authLogout(); // Clear auth state via context
    setCurrentUser(null);
    setCurrentClient(null);
    navigate('home');
  };

  const handleActivateAI = (plan: 'Básico' | 'Avançada' | null) => {
    // Verificar se o usuário está no plano Essencial e bloquear agente Avançada
    if (plan === 'Avançada' && currentUser?.plan === 'Empresa Essencial') {
      // Não permitir ativar a agente Avançada no plano Essencial
      return;
    }
    setActiveAIAgent(plan);
  };

  const showComingSoon = (featureName: string) => {
    setComingSoonMessage(featureName);
    setTimeout(() => setComingSoonMessage(null), 4000);
  };

  const renderHomePage = () => (
    <>
      <Features />
      <AIAssistant />
      <AppMockup navigate={navigate} />
      <AboutUs />
      <Pricing onSelectPlan={handlePlanSelection} />
      <ComparisonTable />
      <MobileExperience />
      <QRCodeCheckin />
      <NavigationFlow />
      <Faq />
      <AppStoreBadges />
    </>
  );

  const renderPage = () => {
    const allClients = Object.values(allData).flatMap((unit: any) => unit.clients);

    if (page === 'login') {
      return <div key="login" className="animate-fade-in"><LoginPage navigate={navigate} goBack={goBack} onLoginSuccess={handleLoginSuccess} /></div>;
    }

    if (page === 'clientLogin') {
      return <div key="clientLogin" className="animate-fade-in"><ClientLoginPage navigate={navigate} goBack={goBack} onLoginSuccess={handleClientLoginSuccess} /></div>;
    }

    if (page === 'updatePaymentMethod' && currentUser) {
      const currentPlan = currentUser.plan ? planDetailsMap[currentUser.plan] : { name: t('currentPlan'), price: 'N/A' };
      return <div key="updatePayment" className="animate-fade-in"><PaymentPage selectedPlan={currentPlan} onUpdateSuccess={goBack} goBack={goBack} currentUser={currentUser} /></div>;
    }

    if (page === 'payment' && selectedPlan) {
      return <div key="payment" className="animate-fade-in"><PaymentPage selectedPlan={selectedPlan} onPaymentSuccess={handleTrialSuccess} goBack={goBack} currentUser={currentUser} /></div>;
    }

    if (page === 'signup') {
      return <div key="signup" className="animate-fade-in"><SignUpPage navigate={navigate} goBack={goBack} /></div>;
    }

    if (page === 'trial') {
      return <div key="trial" className="animate-fade-in"><TrialPage navigate={navigate} goBack={goBack} onTrialSuccess={handleTrialSuccess} selectedPlan={selectedPlan} allClients={allClients} onStartSignatureFlow={handleStartSignatureFlow} /></div>;
    }

    if (page === 'contractSignature' && contractForSignature) {
      return <div key="contractSignature" className="animate-fade-in">
        <ContractSignaturePage
          goBack={goBack}
          contractText={contractForSignature.contractText}
          onSign={(signatureData) => {
            const { user, contractText, cpf } = contractForSignature;
            const plan = planDetailsMap[user.plan!];
            const prices = {
              'Individual': { discounted: 'R$ 79,87', afterYear: 'R$ 129,87' },
              'Empresa Essencial': { discounted: 'R$ 199,90', afterYear: 'R$ 249,90' },
              'Empresa Pro': { discounted: 'R$ 349,90', afterYear: 'R$ 449,90' },
              'Empresa Premium': { discounted: 'R$ 599,90', afterYear: 'R$ 749,90' },
            };
            const planPrices = prices[user.plan! as keyof typeof prices];

            const newContract: Contract = {
              planName: plan.name,
              price: plan.price,
              discountedPrice: planPrices.discounted,
              priceAfterYear: planPrices.afterYear,
              date: new Date().toLocaleDateString('pt-BR'),
              contractText: contractText,
              signatureImg: signatureData.signature,
              userPhoto: signatureData.photo,
              userName: user.name,
              userCpf: cpf,
            };
            handleTrialSuccess(user, newContract);
          }}
        />
      </div>;
    }

    if (page === 'privacy') {
      return <div key="privacy" className="animate-fade-in"><PrivacyPolicyPage goBack={goBack} /></div>;
    }

    if (page === 'dashboard' && currentUser) {
      const userToPassToDashboard = systemUsers.find(u => u.email === currentUser.email) || currentUser;
      return (
        <div key="dashboard" className="animate-fade-in">
          <Dashboard
            goBack={() => navigate('home')}
            navigate={navigate}
            currentUser={userToPassToDashboard as any}
            onActivateAI={handleActivateAI}
            activeAIAgent={activeAIAgent}
            onLogout={handleLogout}
            onPayInstallment={handlePayInstallment}
            // Auth context data for role-based UI
            isSuperAdmin={isSuperAdmin}
            planFeatures={planFeatures}
            // Unit specific data and handlers
            selectedUnit={selectedUnit}
            onUnitChange={handleUnitChange}
            allData={allData}
            setAllData={setAllData}
            users={systemUsers}
            onUsersChange={handleUsersChange}
            onSuspendAcquisitionChannel={handleSuspendAcquisitionChannel}
            onArchiveAcquisitionChannel={handleArchiveAcquisitionChannel}
            onUnarchiveAcquisitionChannel={handleUnarchiveAcquisitionChannel}
            onChannelsChange={handleChannelsChange}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onSuspendProduct={handleSuspendProduct}
            onUpdateProductQuantity={handleUpdateProductQuantity}
            onProductsChange={handleProductsChange}
            onSuspendProfessional={handleSuspendProfessional}
            onArchiveProfessional={handleArchiveProfessional}
            onProfessionalsChange={handleProfessionalsChange}
          />
        </div>
      );
    }

    if (page === 'clientApp') {
      const isAdminView = currentUser && (currentUser.role === 'admin' || currentUser.role === 'Gerente' || isSuperAdmin || currentUser.role === 'Administrador');

      // If admin, create a temporary client object for viewing
      const clientToDisplay = currentClient || (isAdminView ? {
        id: -1,
        name: currentUser?.name || 'Administrador',
        email: currentUser?.email || '',
        photo: currentUser?.avatarUrl || 'https://i.pravatar.cc/150?u=admin',
        phone: '',
        tenant_id: currentUser?.tenant_id,
        history: [],
        packages: [],
        procedurePhotos: [],
        documents: [],
        address: {
          cep: '',
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: ''
        }
      } as any : null);

      if (clientToDisplay) {
        return (
          <div key="clientApp" className="animate-fade-in relative">
            {isAdminView && (
              <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex justify-between items-center z-[100]">
                <span className="text-xs font-bold text-primary flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.9L10 1.554L17.834 4.9c.164.07.164.33 0 .4L10 8.646L2.166 5.3c-.164-.07-.164-.33 0-.4zM1.166 8.9L9 12.246V17.5c0 .276-.224.5-.5.5h-7a.5.5 0 01-.5-.5V9.3c0-.164.1-.31.25-.374l-.084-.026zm17.668 0c.15.064.25.21.25.374V17.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5V12.246l7.834-3.346z" clipRule="evenodd" />
                  </svg>
                  MODO DEUS: Visualizando como Cliente
                </span>
                <button
                  onClick={() => navigate('dashboard')}
                  className="bg-primary text-white text-xs px-3 py-1 rounded-full font-bold hover:bg-primary-dark transition-colors"
                >
                  Voltar ao Dashboard
                </button>
              </div>
            )}
            {console.log('[DEBUG-GOD-MODE] Promotions passed to ClientAppPage:', promotions)}
            <ClientAppPage
              currentClient={clientToDisplay}
              onLogout={handleLogout}
              navigate={navigate}
              appointments={appointments}
              promotions={promotions}
            />
          </div>
        );
      }
    }

    if (page === 'scheduling') {
      return (
        <div key="scheduling" className="animate-fade-in">
          <SchedulingPage
            navigate={navigate}
            goBack={goBack}
            isIndividualPlan={currentUser?.plan === 'Individual' && !isSuperAdmin}
            onPayForService={handleServicePayment}
            services={services}
            packages={packages}
            plans={salonPlans}
            professionals={professionals}
            onCreateAppointment={(appointment) => handleSaveAppointment(appointment as any)}
            currentClientId={navigationParams?.clientId}
          />
        </div>
      );
    }

    if (page === 'clientScheduling') {
      return (
        <div key="clientScheduling" className="animate-fade-in">
          <SchedulingPage
            navigate={navigate}
            goBack={() => navigate('clientApp')}
            isClientView={true}
            onPayForService={handleServicePayment}
            services={services}
            packages={packages}
            plans={salonPlans}
            professionals={professionals}
            onCreateAppointment={(appointment) => handleSaveAppointment(appointment as any)}
            currentClientId={currentClient?.id}
          />
        </div>
      );
    }

    if (page === 'cancellation') {
      return <div key="cancellation" className="animate-fade-in"><CancellationPage onLogout={handleLogout} /></div>;
    }

    return (
      <div key="home" className="antialiased text-gray-800 animate-fade-in">
        <Header
          navigate={navigate}
          currentUser={currentUser}
          onLogout={handleLogout}
          notifications={notifications}
        />
        <main>
          {renderHomePage()}
        </main>
        <Footer navigate={navigate} />
      </div>
    );
  };

  return (
    <>
      {renderPage()}
      <BackToTopButton />

      {/* Subscription Blocker Overlay */}
      {subscriptionBlocked && (
        <SubscriptionBlocker
          onPayNow={() => {
            setSubscriptionBlocked(false);
            navigate('updatePaymentMethod');
          }}
        />
      )}

      {/* Trial Welcome Modal */}
      <TrialWelcomeModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        trialDays={14}
        trialEndsAt={currentUser?.tenant?.trial_ends_at}
      />

      <AnimatePresence>
        {comingSoonMessage && (
          <ComingSoonToast
            message={comingSoonMessage}
            onClose={() => setComingSoonMessage(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default App;