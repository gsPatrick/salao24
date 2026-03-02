import React from 'react';
import ClientListPage from './ClientListPage';
import { useClients } from '../hooks/useClients';
import { supabase } from '../lib/supabaseClient';

interface ClientsContainerProps {
  selectedUnitId: number | null;
  onBack?: () => void;
  navigate: (page: string) => void;
  acquisitionChannels: any[];
  isIndividualPlan?: boolean;
}

export const ClientsContainer: React.FC<ClientsContainerProps> = ({
  selectedUnitId,
  onBack,
  navigate,
  acquisitionChannels,
  isIndividualPlan,
}) => {
  const { clients, setClients, loading, error } = useClients(selectedUnitId);

  const handleSaveClient = async (clientData: any) => {
    if (!selectedUnitId) return;

    const payload = {
      unit_id: selectedUnitId,
      name: clientData.name,
      social_name: clientData.socialName || null,
      email: clientData.email,
      phone: clientData.phone,
      photo_url: clientData.photo,
      cpf: clientData.cpf,
      birthdate: clientData.birthdate || null,
      marital_status: clientData.maritalStatus || null,
      last_visit: clientData.lastVisit || null,
      total_visits: clientData.totalVisits || 0,
      how_found_us: clientData.howTheyFoundUs || null,
      indicated_by: clientData.indicatedBy || null,
      observation: clientData.observations || null,
      registration_at: clientData.registrationDate || new Date().toISOString(),
    };

    let result;
    if (clientData.id) {
      result = await supabase
        .from('clients')
        .update(payload)
        .eq('id', clientData.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('clients')
        .insert(payload)
        .select()
        .single();
    }

    const { data, error } = result;

    if (!error && data) {
      if (clientData.id) {
        setClients(prev => prev.map(c => c.id === clientData.id ? (data as any) : c));
      } else {
        setClients(prev => [data as any, ...prev]);
      }
    } else if (error) {
      console.error('Erro ao salvar cliente no Supabase:', error.message);
      alert('Erro ao salvar cliente, verifique o console.');
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (!error) {
      setClients(prev => prev.filter(c => c.id !== clientId));
    } else {
      console.error('Erro ao excluir cliente no Supabase:', error.message);
      alert('Erro ao excluir cliente, verifique o console.');
    }
  };

  const handleBlockClient = async (clientId: number, reason: string) => {
    const { error } = await supabase
      .from('clients')
      .update({ blocked: true, blocked_reason: reason })
      .eq('id', clientId);

    if (!error) {
      setClients(prev => prev.map(c => (c.id === clientId ? { ...c, blocked: true } : c)));
    } else {
      console.error('Erro ao bloquear cliente no Supabase:', error.message);
      alert('Erro ao bloquear cliente, verifique o console.');
    }
  };

  const handleUnblockClient = async (clientId: number) => {
    const { error } = await supabase
      .from('clients')
      .update({ blocked: false, blocked_reason: null })
      .eq('id', clientId);

    if (!error) {
      setClients(prev => prev.map(c => (c.id === clientId ? { ...c, blocked: false } : c)));
    } else {
      console.error('Erro ao desbloquear cliente no Supabase:', error.message);
      alert('Erro ao desbloquear cliente, verifique o console.');
    }
  };

  if (loading) {
    return <div className="p-4">Carregando clientes...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Erro ao carregar clientes: {error}</div>;
  }

  return (
    <ClientListPage
      onBack={onBack}
      navigate={navigate}
      clients={clients as any}
      onAddNewClient={handleSaveClient}
      acquisitionChannels={acquisitionChannels}
      onOpenChat={undefined}
      onDeleteClient={handleDeleteClient}
      onBlockClient={handleBlockClient}
      onUnblockClient={handleUnblockClient}
      isIndividualPlan={isIndividualPlan}
    />
  );
};
