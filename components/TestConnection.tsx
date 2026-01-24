import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState('Testando conexão...');
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Verifica se as variáveis de ambiente estão configuradas
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Variáveis de ambiente não configuradas. Verifique seu arquivo .env.local');
        }

        // Tenta buscar as tabelas disponíveis
        const { data, error } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');

        if (error) throw error;

        setTables(data.map((t: { tablename: string }) => t.tablename));
        setConnectionStatus('✅ Conexão bem-sucedida!');
      } catch (err: any) {
        console.error('Erro ao conectar ao Supabase:', err);
        setError(err.message);
        setConnectionStatus('❌ Falha na conexão');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
      maxWidth: '600px',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: '50px'
    }}>
      <h2>Teste de Conexão com o Supabase</h2>
      <p><strong>Status:</strong> {connectionStatus}</p>
      
      {error && (
        <div style={{ 
          color: 'red', 
          margin: '10px 0',
          padding: '10px',
          backgroundColor: '#ffebee',
          borderRadius: '4px'
        }}>
          <p><strong>Erro:</strong> {error}</p>
          <p>Verifique se:</p>
          <ul>
            <li>O arquivo <code>.env.local</code> existe na raiz do projeto</li>
            <li>As variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> estão corretas</li>
            <li>O projeto no Supabase está ativo e acessível</li>
          </ul>
        </div>
      )}

      {tables.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Tabelas encontradas no banco de dados:</h3>
          <ul>
            {tables.map((table) => (
              <li key={table}>{table}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
        <p>Se estiver com problemas, verifique se:</p>
        <ol>
          <li>O arquivo <code>.env.local</code> existe na raiz do projeto</li>
          <li>As credenciais do Supabase estão corretas</li>
          <li>O serviço do Supabase está ativo</li>
          <li>As permissões do banco de dados estão configuradas corretamente</li>
        </ol>
      </div>
    </div>
  );
}
