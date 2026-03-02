import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { Dashboard as DashboardComponent } from './components/Dashboard';

const DashboardShell = () => {
  const { user, logout } = useAuth();
  const {
    units,
    selectedUnitId,
    setSelectedUnitId,
    professionals,
    clients,
    services,
    appointments,
    transactions,
    notifications
  } = useData();

  const [activeAIAgent, setActiveAIAgent] = useState<'Básico' | 'Avançada' | null>('Básico');

  const handleLogout = () => {
    logout();
    window.location.href = '/login.html';
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Redirecionando para login...</div>;
  }

  return (
    <DashboardComponent
      goBack={() => window.location.href = '/'}
      navigate={(page) => console.log('Navigate to:', page)}
      currentUser={user as any}
      onActivateAI={setActiveAIAgent}
      activeAIAgent={activeAIAgent}
      onLogout={handleLogout}
      onPayInstallment={(plan) => console.log('Pay installment for:', plan)}
      selectedUnit={units.find(u => u.id === selectedUnitId)?.name || 'Unidade Matriz'}
      onUnitChange={(unitName) => {
        const unit = units.find(u => u.name === unitName);
        if (unit) setSelectedUnitId(unit.id);
      }}
      allData={{}} // Handled by context now
      setAllData={() => { }} // Handled by context now
      users={[]} // Handled by context/API now
      onUsersChange={() => { }} // Handled by context/API now
    />
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <LanguageProvider>
          <DataProvider>
            <DashboardShell />
          </DataProvider>
        </LanguageProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}