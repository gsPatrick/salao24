
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
  const {
    clients, professionals, services, appointments, transactions, units, products,
    notifications: contextNotifications,
    refreshAll
  } = useData() || { // Fallback if context is missing (should not happen if wrapped)
    clients: [], professionals: [], services: [], appointments: [], transactions: [], units: [], products: [], notifications: [], refreshAll: async () => { }
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

  const [selectedUnit, setSelectedUnit] = useState('Unidade Matriz');
  const [systemUsers, setSystemUsers] = useState<User[]>([]); // Removed usePersistentState

  // Construct allData for Dashboard compatibility
  const allData = useMemo(() => {
    // Create an object where the key is the selectedUnit (or all units)
    // For now, we map all data to the currently selected unit for simplicity, 
    // or we creates keys for each unit if we had unit IDs.
    return {
      [selectedUnit]: {
        clients: clients,
        professionals: professionals,
        services: services,
        packages: [], // Add packages to DataContext if needed
        plans: [], // Add plans to DataContext if needed
        products: products,
        transactions: transactions,
        appointments: appointments,
        marketingCampaigns: [], // Add to DataContext
        directMailCampaigns: [],
        acquisitionChannels: [],
      }
    };
  }, [selectedUnit, clients, professionals, services, products, transactions, appointments]);

  const currentUnitData = allData[selectedUnit];

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
      if (authUser.role === 'admin' || authUser.role === 'gerente' || authUser.role === 'recepcao' || authUser.role === 'profissional') {
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
      if (page === 'dashboard' || page === 'clientApp' || page === 'scheduling') {
        navigate('home');
      }
    }
  }, [authUser, authLoading]);

  useEffect(() => {
    // Prevent browser from trying to restore scroll position on back/forward
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);


  const navigate = (pageName: string) => {
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
    if (user.email === 'admin@salao24h.com') {
      user.plan = 'Vitalício';
    }
    setCurrentUser(user);
    setCurrentClient(null);
    setHistory([]);
    navigate('dashboard'); // Navigate to dashboard on login
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
            onUnitChange={setSelectedUnit}
            allData={allData}
            setAllData={() => { }}
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

    if (page === 'clientApp' && currentClient) {
      // FIX: Replaced flatMap with reduce to correctly infer the type of the flattened appointments array, resolving a complex TypeScript type inference issue.
      return <div key="clientApp" className="animate-fade-in"><ClientAppPage currentClient={currentClient} onLogout={handleLogout} navigate={navigate} appointments={appointments} /></div>;
    }

    if (page === 'scheduling') {
      return (
        <div key="scheduling" className="animate-fade-in">
          <SchedulingPage
            navigate={navigate}
            goBack={goBack}
            isIndividualPlan={currentUser?.plan === 'Individual'}
            onPayForService={handleServicePayment}
            services={currentUnitData.services}
            professionals={currentUnitData.professionals}
            onCreateAppointment={(appointment) => handleSaveAppointment(appointment as any)}
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
            services={currentUnitData.services}
            professionals={currentUnitData.professionals}
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