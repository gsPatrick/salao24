import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { LanguageProvider } from './contexts/LanguageContext';
import ClientAppPage from './components/ClientAppPage';
import { clientsAPI, appointmentsAPI } from './lib/api';
import { Client, Appointment } from './types';

const ClientApp = () => {
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const clientId = new URLSearchParams(window.location.search).get('clientId') || localStorage.getItem('currentClientId');

      if (!clientId) {
        window.location.href = '/client-login.html';
        return;
      }

      try {
        // In a real app, we might have a getById or just filter the list
        const clientsResponse = await clientsAPI.getAll();
        if (clientsResponse.success) {
          const client = clientsResponse.data.find((c: Client) => c.id === parseInt(clientId));
          if (client) {
            setCurrentClient(client);
            localStorage.setItem('currentClientId', clientId);
          } else {
            window.location.href = '/client-login.html';
            return;
          }
        }

        const apptsResponse = await appointmentsAPI.getAll({ clientId });
        if (apptsResponse.success) {
          setAppointments(apptsResponse.data);
        }
      } catch (error) {
        console.error('Error loading client app data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const navigate = (page: string) => {
    if (page === 'home') {
      window.location.href = '/';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentClientId');
    localStorage.removeItem('currentClientEmail');
    localStorage.removeItem('currentClientName');
    window.location.href = '/client-login.html';
  };

  if (loading || !currentClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Carregando sua conta...</p>
        </div>
      </div>
    );
  }

  return (
    <ClientAppPage
      currentClient={currentClient}
      onLogout={handleLogout}
      navigate={navigate}
      appointments={appointments}
    />
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <LanguageProvider>
        <ClientApp />
      </LanguageProvider>
    </React.StrictMode>
  );
}
