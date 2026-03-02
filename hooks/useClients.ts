import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface ClientRow {
  id: number;
  unit_id: number | null;
  name: string;
  social_name: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  status: string | null;
  last_visit: string | null;
  total_visits: number;
  birthdate: string | null;
  cpf: string | null;
  how_found_us: string | null;
  indicated_by: string | null;
  observation: string | null;
}

interface UseClientsResult {
  clients: ClientRow[];
  setClients: React.Dispatch<React.SetStateAction<ClientRow[]>>;
  loading: boolean;
  error: string | null;
}

export function useClients(unitId: number | null): UseClientsResult {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!unitId) {
        setClients([]);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('clients')
        .select('id, unit_id, name, social_name, email, phone, photo_url, status, last_visit, total_visits, birthdate, cpf, how_found_us, indicated_by, observation')
        .eq('unit_id', unitId)
        .order('name', { ascending: true });

      if (error) {
        setError(error.message);
        setClients([]);
      } else {
        setClients((data || []) as ClientRow[]);
      }

      setLoading(false);
    };

    load();
  }, [unitId]);

  return { clients, setClients, loading, error };
}
