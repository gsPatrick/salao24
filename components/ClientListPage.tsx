

import React, { useState, useMemo, useRef } from 'react';
// FIX: Changed to a named import to resolve module resolution error.
import { NewClientModal } from './NewClientModal';
import ClientDetailModal from './ClientDetailModal'; // Import the new component
import { Client, useData } from '../contexts/DataContext';

declare var jspdf: any;
declare var XLSX: any;

// --- Helper Functions & Mock Data ---

// Function to calculate age and check for birthday
const getClientStatus = (birthdate: string, lastVisit: string, totalVisits: number) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    const lastVisitDate = new Date(lastVisit);

    const isBirthdayToday = today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth();
    const isBirthdayMonth = today.getMonth() === birthDate.getMonth();

    const daysSinceLastVisit = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));

    let classification: 'Nova' | 'Recorrente' | 'VIP' | 'Inativa' = 'Nova';
    if (daysSinceLastVisit > 60) {
        classification = 'Inativa';
    } else if (totalVisits > 5) {
        classification = 'VIP';
    } else if (totalVisits >= 2) {
        classification = 'Recorrente';
    }

    return { isBirthdayToday, isBirthdayMonth, classification };
};

// --- Icons ---
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.434-9.889 9.89.001 2.228.651 4.39 1.849 6.22l-1.072 3.912 3.995-1.045zM9.266 8.39c-.195-.315-.315-.32-1.125-.32h-.125c-.25 0-.5.063-.75.315-.25.25-.938.938-.938 2.25s.938 2.625 1.063 2.75c.125.125.938 1.438 2.313 2.063.315.125.563.25.75.315.5.125.938.063 1.313-.19.438-.315.938-.938 1.125-1.25.19-.315.19-.563.063-.69-.125-.125-.25-.19-.5-.315s-.938-.438-1.063-.5c-.125-.063-.19-.063-.25 0-.063.063-.25.315-.313.375-.063.063-.125.063-.25 0-.125-.063-.5-.19-1-1.25C8.313 9.77 7.938 9.27 7.813 9.145c-.125-.125-.063-.19 0-.25.063-.063.25-.25.313-.313.063-.062.125-.125.19-.19.063-.062.063-.125 0-.19s-.25-.625-.313-.75z" />
    </svg>
);
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0c-.454-.303-.977-.454-1.5-.454V8a1 1 0 011-1h12a1 1 0 011 1v7.546zM12 12.5a.5.5 0 110-1 .5.5 0 010 1zM3 21h18v-1a1 1 0 00-1-1H4a1 1 0 00-1 1v1z" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;


// --- Components ---
const Confetti: React.FC = () => (
    <>
        <span className="absolute top-[15%] left-[10%] w-1 h-2 bg-red-400 rotate-45 opacity-70"></span>
        <span className="absolute top-[5%] left-[50%] w-1.5 h-1.5 bg-blue-400 rounded-full opacity-70"></span>
        <span className="absolute top-[20%] left-[85%] w-1 h-2.5 bg-green-400 -rotate-45 opacity-70"></span>
        <span className="absolute top-[50%] left-[25%] w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-70"></span>
        <span className="absolute top-[70%] left-[5%] w-1 h-1 bg-pink-400 rounded-full opacity-70"></span>
        <span className="absolute top-[85%] left-[35%] w-1.5 h-1 bg-indigo-400 rotate-12 opacity-70"></span>
        <span className="absolute top-[60%] left-[90%] w-1.5 h-1.5 bg-teal-400 rounded-full opacity-70"></span>
        <span className="absolute top-[95%] left-[70%] w-1 h-2 bg-orange-400 -rotate-12 opacity-70"></span>
        <span className="absolute top-[40%] left-[60%] w-1 h-1 bg-purple-400 rounded-full opacity-70"></span>
    </>
);

const ClassificationBadge: React.FC<{ classification: string }> = ({ classification }) => {
    const colors: { [key: string]: string } = {
        'Nova': 'bg-blue-100 text-blue-800',
        'Recorrente': 'bg-green-100 text-green-800',
        'VIP': 'bg-purple-100 text-purple-800',
        'Inativa': 'bg-yellow-100 text-yellow-800',
    };
    const icons: { [key: string]: string } = { 'Nova': '👤', 'Recorrente': '💎', 'VIP': '👑', 'Inativa': '⏳' };
    return <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full ${colors[classification]}`}>{icons[classification]} {classification}</span>;
};

const ClientCard: React.FC<{ client: any, onClick: () => void, onOpenChat?: (clientId: number) => void }> = ({ client, onClick, onOpenChat }) => {
    const { isBirthdayMonth, classification } = getClientStatus(client.birthdate, client.lastVisit, client.totalVisits);

    const cardClasses = `p-4 rounded-lg shadow-md border-l-4 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-lg w-full text-left cursor-pointer relative overflow-hidden ${isBirthdayMonth ? 'bg-yellow-300 border-pink-400' : 'bg-white border-gray-200'
        }`;
    const formattedBirthdate = new Date(client.birthdate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

    const handleDownloadDocument = (doc: any) => {
        try {
            const { jsPDF } = jspdf;
            const pdf = new jsPDF();
            const margin = 10;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const usableWidth = pageWidth - margin * 2;
            let y = 20;

            const addText = (text: string, options: any = {}) => {
                const lines = pdf.splitTextToSize(text, usableWidth);
                const textHeight = lines.length * (options.fontSize || 10) * 0.35;
                if (y + textHeight > pdf.internal.pageSize.getHeight() - margin) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.text(lines, margin, y, options);
                y += textHeight + 2;
            };

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            addText(`DOCUMENTO: ${doc.name}`, { fontSize: 16 });
            y += 5;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            addText(`Cliente: ${client.name}`, { fontSize: 12 });
            addText(`CPF: ${client.cpf}`, { fontSize: 12 });
            y += 10;

            pdf.setFontSize(10);
            addText(doc.content.replace(/\[NOME DO CLIENTE\]/g, client.name).replace(/\[CPF DO CLIENTE\]/g, client.cpf), { fontSize: 10 });
            y += 20;

            if (doc.signed) {
                addText('Assinado Digitalmente', { fontSize: 10 });
                if (doc.signatureImg) {
                    pdf.addImage(doc.signatureImg, 'PNG', margin, y, 100, 50);
                }
            }

            const filename = `${doc.type}_${client.name.replace(/ /g, '_')}.pdf`;
            pdf.save(filename);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Could not generate PDF. The 'jspdf' library might not be loaded correctly.");
        }
    };

    return (
        <div onClick={onClick} className={cardClasses}>
            {isBirthdayMonth && <Confetti />}
            <div className="flex items-start space-x-4 relative z-10">
                <div className="relative flex-shrink-0">
                    <img src={client.photo} alt={client.name} className="w-16 h-16 rounded-full object-cover" />
                    {isBirthdayMonth && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl transform -rotate-[15deg]" role="img" aria-label="Rosto festivo">🥳</span>
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className={`font-bold ${isBirthdayMonth ? 'text-black' : 'text-secondary'}`}>{client.name}</h3>
                        <ClassificationBadge classification={classification} />
                    </div>
                    <div className={`text-xs space-y-2 mt-2 ${isBirthdayMonth ? 'text-gray-700' : 'text-gray-500'}`}>
                        <div className="flex items-center justify-between">
                            <a href={`tel:${client.phone.replace(/\D/g, '')}`} title="Ligar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-current hover:text-primary transition-colors">
                                <PhoneIcon />
                                <span>{client.phone}</span>
                            </a>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenChat?.(client.id);
                                }}
                                title="WhatsApp"
                                className="text-current hover:text-green-500 transition-colors"
                            >
                                <WhatsAppIcon />
                            </button>
                        </div>
                        <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-current hover:text-primary transition-colors">
                            <MailIcon /><span>{client.email}</span>
                        </a>
                        <p className="flex items-center gap-2"><CakeIcon /><span>{formattedBirthdate}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface ClientListPageProps {
    onBack?: () => void;
    navigate: (page: string) => void;
    clients: Client[];
    onAddNewClient: (clientData: any) => void;
    acquisitionChannels: any[];
    onOpenChat?: (clientId: number) => void;
    onDeleteClient: (clientId: number) => void;
    onBlockClient: (clientId: number, reason: string) => void;
    onUnblockClient: (clientId: number) => void;
    isIndividualPlan?: boolean;
}

const ClientListPage: React.FC<ClientListPageProps> = ({ onBack, navigate, clients, onAddNewClient, acquisitionChannels, onOpenChat, onDeleteClient, onBlockClient, onUnblockClient, isIndividualPlan }) => {
    const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredClients = useMemo(() => {
        let filtered = clients;

        // Date Filter (by visit history)
        if (startDate || endDate) {
            filtered = filtered.filter(client => {
                if (!client.history || client.history.length === 0) {
                    return false;
                }
                const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
                const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

                return client.history.some(h => {
                    const historyDate = new Date(`${h.date}T00:00:00`);
                    if (start && end) return historyDate >= start && historyDate <= end;
                    if (start) return historyDate >= start;
                    if (end) return historyDate <= end;
                    return false;
                });
            });
        }

        // Search Query Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase().replace(/[.\-/() ]/g, '');
            filtered = filtered.filter(client => {
                const searchStr = (
                    client.name +
                    client.phone.replace(/[.\-/() ]/g, '') +
                    (client.cpf ? client.cpf.replace(/[.\-/() ]/g, '') : '') +
                    (client.planName || '') +
                    (client.packageNames ? client.packageNames.join(' ') : '')
                ).toLowerCase();
                return searchStr.includes(query);
            });
        }

        return filtered;
    }, [clients, startDate, endDate, searchQuery]);


    const handleOpenDetailModal = (client: Client) => {
        setSelectedClient(client);
        setIsDetailModalOpen(true);
    };

    const handleEditClient = (client: Client) => {
        setClientToEdit(client);
        setIsNewClientModalOpen(true);
    };

    const handleAddNewClient = () => {
        setClientToEdit(null);
        setIsNewClientModalOpen(true);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    alert('O arquivo Excel está vazio ou em um formato incorreto.');
                    return;
                }

                let importedCount = 0;
                json.forEach((row: any) => {
                    // Basic mapping - this can be made more robust
                    const newClient = {
                        name: row['Nome Completo'] || row['Nome'] || '',
                        socialName: row['Nome Social'] || '',
                        photo: row['Foto URL'] || `https://i.pravatar.cc/150?u=${Date.now() + Math.random()}`,
                        phone: String(row['Telefone'] || ''),
                        email: row['E-mail'] || row['Email'] || '',
                        cpf: String(row['CPF'] || ''),
                        birthdate: row['Data de Nascimento'] instanceof Date ? row['Data de Nascimento'].toISOString().split('T')[0] : '',
                        maritalStatus: row['Estado Civil'] || '',
                        history: [],
                        preferences: [],
                        status: null,
                        lastVisit: '',
                        totalVisits: 0,
                        packages: [],
                        procedurePhotos: [],
                        documents: [],
                        howTheyFoundUs: row['Como nos conheceu'] || 'Importado',
                        registrationDate: new Date().toISOString(),
                        password: '123', // default password
                        address: {
                            cep: String(row['CEP'] || ''),
                            street: row['Rua'] || '',
                            number: String(row['Número'] || ''),
                            neighborhood: row['Bairro'] || '',
                            city: row['Cidade'] || '',
                            state: row['Estado'] || '',
                        }
                    };

                    if (newClient.name && newClient.phone) {
                        onAddNewClient(newClient);
                        importedCount++;
                    }
                });

                alert(`${importedCount} clientes importados com sucesso!`);
            } catch (error) {
                console.error("Erro ao importar arquivo:", error);
                alert("Ocorreu um erro ao processar o arquivo. Verifique se o formato e as colunas (Ex: Nome, Telefone) estão corretos.");
            }
        };

        reader.onerror = (error) => {
            console.error("Erro ao ler o arquivo:", error);
            alert("Ocorreu um erro ao ler o arquivo.");
        };

        reader.readAsArrayBuffer(file);

        // Reset file input to allow re-uploading the same file
        event.target.value = '';
    };

    const handleDownloadPdf = () => {
        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF();

            const tableColumns = ["Nome", "Telefone", "E-mail", "Última Visita", "Total de Visitas"];
            const tableRows: (string | number)[][] = [];

            clients.forEach(client => {
                const clientData = [
                    client.name,
                    client.phone,
                    client.email,
                    client.lastVisit ? new Date(client.lastVisit + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A',
                    client.totalVisits
                ];
                tableRows.push(clientData);
            });

            doc.setFontSize(18);
            doc.text("Lista de Clientes", 14, 22);

            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

            (doc as any).autoTable({
                startY: 35,
                head: [tableColumns],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] } // primary color #10b981
            });

            const dateStr = new Date().toISOString().split('T')[0];
            doc.save(`lista_de_clientes_${dateStr}.pdf`);

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Não foi possível gerar o PDF. A biblioteca 'jspdf' ou 'jspdf-autotable' pode não estar carregada corretamente.");
        }
    };

    return (
        <>
            <div className="container mx-auto px-6 py-8">
                {onBack && (
                    <button onClick={onBack} className="mb-8 flex items-center text-primary hover:text-primary-dark font-semibold transition-colors duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Voltar ao Dashboard
                    </button>
                )}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-secondary">Clientes</h1>
                        <p className="text-gray-600 mt-1">Gerencie seus clientes e acesse o histórico de cada um.</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <button onClick={handleAddNewClient} className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg flex items-center transition-colors duration-300 transform hover:scale-105 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Novo Cadastro
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        />
                        <button onClick={handleUploadClick} title="Importar clientes de um arquivo Excel" className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold p-3 rounded-lg flex items-center transition-colors">
                            <UploadIcon />
                        </button>
                        <button onClick={handleDownloadPdf} title="Baixar lista de clientes em PDF" className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold p-3 rounded-lg flex items-center transition-colors">
                            <DownloadIcon />
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row gap-4 items-center flex-wrap">
                    <div className="relative flex-grow w-full sm:w-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nome, telefone ou CPF..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-40 p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="start-date-clients" className="text-sm font-medium text-gray-700">Visita de:</label>
                        <input
                            id="start-date-clients"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
                            aria-label="Filtrar por data de início da visita"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="end-date-clients" className="text-sm font-medium text-gray-700">até:</label>
                        <input
                            id="end-date-clients"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-sm"
                            aria-label="Filtrar por data final da visita"
                        />
                    </div>
                    {(startDate || endDate || searchQuery) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); setSearchQuery(''); }}
                            className="text-sm text-primary hover:underline font-semibold"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                            <ClientCard key={client.id} client={client} onClick={() => handleOpenDetailModal(client)} onOpenChat={onOpenChat} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 bg-light rounded-lg">
                            <p className="text-gray-500">Nenhum cliente encontrado com os filtros aplicados.</p>
                        </div>
                    )}
                </div>
            </div>

            <NewClientModal
                isOpen={isNewClientModalOpen}
                onClose={() => setIsNewClientModalOpen(false)}
                onSave={onAddNewClient}
                existingClients={clients}
                clientToEdit={clientToEdit}
                acquisitionChannels={acquisitionChannels}
                isIndividualPlan={isIndividualPlan}
            />

            <ClientDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                client={selectedClient}
                navigate={navigate}
                onEdit={handleEditClient}
                onSave={onAddNewClient}
                existingClients={clients}
                onDelete={onDeleteClient}
                onBlock={onBlockClient}
                onUnblock={onUnblockClient}
            />
        </>
    );
};

export default ClientListPage;