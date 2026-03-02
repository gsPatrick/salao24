import { supabase } from './lib/supabaseClient';

async function testConnection() {
  console.log('Testando conexão com o Supabase...');
  
  // Verifica se as variáveis de ambiente estão configuradas
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('ERRO: Variáveis de ambiente não configuradas.');
    console.log('Por favor, verifique se o arquivo .env.local contém:');
    console.log('VITE_SUPABASE_URL=sua-url-do-supabase');
    console.log('VITE_SUPABASE_ANON_KEY=sua-chave-anonima');
    return;
  }

  console.log('Variáveis de ambiente encontradas.');
  
  try {
    // Tenta buscar dados de uma tabela para testar a conexão
    const { data, error } = await supabase
      .from('clients')  // Substitua por uma tabela existente no seu banco de dados
      .select('*')
      .limit(1);

    if (error) {
      console.error('Erro ao conectar ao Supabase:');
      console.error(error);
      
      if (error.message.includes('JWT expired')) {
        console.error('ERRO: Token JWT expirado. Verifique suas credenciais.');
      } else if (error.message.includes('Invalid API key')) {
        console.error('ERRO: Chave de API inválida. Verifique sua VITE_SUPABASE_ANON_KEY.');
      } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
        console.error('ERRO: Não foi possível resolver o endereço do Supabase. Verifique sua VITE_SUPABASE_URL.');
      }
      
      return;
    }

    console.log('✅ Conexão com o Supabase bem-sucedida!');
    console.log('Dados recebidos:', data);
    
  } catch (error) {
    console.error('Erro inesperado ao testar conexão com o Supabase:');
    console.error(error);
  }
}

// Executa o teste
testConnection();
