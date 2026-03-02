// scripts/listUnidades.ts

import { supabase } from "./lib/supabaseClient";


async function listUnidades() {
  console.log('Buscando unidades...');
  
  try {
    const { data, error } = await supabase
      .from('unidades')  // Substitua pelo nome correto da tabela se for diferente
      .select('*')
      .order('nome');  // Ordena pelo nome da unidade
    

    if (error) {
      console.error('Erro ao buscar unidades:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('Nenhuma unidade encontrada.');
      return;
    }

    console.log('\n=== Unidades Encontradas ===');
    console.table(data, ['id', 'nome', 'endereco', 'telefone', 'email', 'ativo']);
    console.log(`\nTotal: ${data.length} unidade(s) encontrada(s).`);

  } catch (error) {
    console.error('Erro inesperado:', error);
  }
}

// Executa a função
listUnidades();