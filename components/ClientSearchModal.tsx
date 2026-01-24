import React, { useState, useMemo } from 'react';

interface Client {
  id: number;
  name: string;
  avatar: string;
  phone: string;
  cpf: string;
}

interface ClientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

const ClientSearchModal: React.FC<ClientSearchModalProps> = ({ isOpen, onClose, clients, onSelectClient }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
      setSearchQuery('');
    }, 300);
  };

  const filteredClients = useMemo(() => {
    const query = searchQuery.toLowerCase().replace(/[.\-/() ]/g, '');
    if (!query) return []; // Only show results when searching

    return clients.filter(client => {
      const name = client.name.toLowerCase();
      const phone = client.phone.replace(/[.\-/() ]/g, '');
      const cpf = (client.cpf || '').replace(/[.\-/() ]/g, '');
      return name.includes(searchQuery.toLowerCase()) || phone.includes(query) || cpf.includes(query);
    });
  }, [searchQuery, clients]);

  if (!isOpen && !isExiting) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-gray-500 bg-opacity-75' : 'opacity-0'}`}>
      <div className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 w-full max-w-lg ${isOpen && !isExiting ? 'scale-100' : 'scale-95'}`}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-secondary">Buscar Cliente</h3>
          <p className="text-sm text-gray-500 mb-4">Busque por nome, CPF ou telefone para agendar um retorno.</p>
          
          <input
            type="text"
            placeholder="Digite para buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
            autoFocus
          />

          <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-2">
            {filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className="w-full text-left p-3 flex items-center gap-3 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <img src={client.avatar} alt={client.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-semibold text-secondary">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.phone}</p>
                  </div>
                </button>
              ))
            ) : (
              searchQuery && <p className="text-center text-gray-500 py-4">Nenhum cliente encontrado.</p>
            )}
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
          <button type="button" onClick={handleClose} className="px-4 py-2 bg-white text-gray-700 border rounded-md">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default ClientSearchModal;
