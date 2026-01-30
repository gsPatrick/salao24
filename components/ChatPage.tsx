import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

// --- Interfaces ---
interface Message {
    id: number | string;
    content: string;
    role?: 'user' | 'assistant' | 'system' | 'tool';
    created_at: string;
}

interface ChatContact {
    id: number;
    name: string;
    avatar_url?: string;
    customer_phone?: string;
    status: 'active' | 'manual' | 'archived';
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
    channelOrigin?: string;
    history: Message[];
}

interface ChatPageProps {
    onBack?: () => void;
    targetClientId?: number | null;
    onClearTarget?: () => void;
    onComingSoon?: (feature: string) => void;
}

// Add type declaration for jspdf from CDN
declare var jspdf: any;

// --- Icons ---
const InstagramIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

const WhatsAppIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.75 13.96c.25.41.4 1 .25 1.61l-.01.01c-.13 1.14-.65 2.2-1.48 2.9l-.1.1c-.93.78-2.02 1.25-3.23 1.34l-.06.01h-3.21c-4.87 0-8.83-3.95-8.83-8.83s3.95-8.83 8.83-8.83 8.83 3.95 8.83 8.83c0 .34-.02.67-.06.99l-.01 0c-.31 1.8-.13 3.61.51 5.32l.11.29zM12 21.92c4.34 0 7.88-3.54 7.88-7.88s-3.54-7.88-7.88-7.88-7.88 3.54-7.88-7.88c0 2.05.79 3.93 2.11 5.35l.12.12c.1.09.2.18.29.27l-1.38 3.97 4.09-1.37c.37.07.74.12 1.13.15h3.04c.01-.01 0 0 0 0z" /><path d="M15.26 13.01c-.08-.12-.3-.2-.52-.32-.22-.12-.52-.27-.8-.37-.28-.1-.52-.16-.72-.16-.29 0-.57.1-.77.37-.2.27-.76.95-.92 1.15s-.33.22-.61.07c-.28-.15-1.18-.53-2.13-1.42s-1.58-1.95-1.63-2.05c-.05-.1-.01-.2.08-.31.09-.11.2-.27.3-.37.1-.1.15-.22.22-.37.07-.15.04-.28-.02-.42s-.72-1.72-.98-2.32c-.27-.6-.52-.52-.72-.52-.18 0-.4 0-.61 0s-.57.08-.85.37c-.28.3-.95.95-.95 2.32 0 1.38 1.03 2.7 1.18 2.87s1.8 2.92 4.49 4.18c2.69 1.26 3.3.93 3.73.85.43-.08 1.18-.52 1.38-.98.2-.47.2-.85.15-.98-.05-.12-.17-.2-.25-.32z" /></svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ChatPage: React.FC<ChatPageProps> = ({ onBack, targetClientId, onClearTarget, onComingSoon }) => {
    const { t } = useLanguage();
    const { clients } = useData();
    const [chats, setChats] = useState<ChatContact[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatContact | null>(null);
    const [activeTab, setActiveTab] = useState<'clientes' | 'leads'>('clientes');
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- Data Fetching ---
    const loadChats = useCallback(async () => {
        try {
            const data = await aiAPI.getChats();
            const mapped = (data || []).map((chat: any) => ({
                id: chat.id,
                name: chat.customer_name || chat.customer_phone,
                customer_phone: chat.customer_phone,
                avatar_url: chat.avatar_url || `https://ui-avatars.com/api/?name=${chat.customer_name || chat.customer_phone}&background=random`,
                status: chat.status || 'active',
                lastMessage: chat.last_message,
                lastMessageTime: chat.updated_at,
                unreadCount: chat.unreadCount || 0,
                channelOrigin: chat.channel_origin || chat.channelOrigin,
                history: chat.history || []
            }));
            setChats(mapped);

            if (selectedChat) {
                const refreshed = mapped.find((c: any) => c.id === selectedChat.id);
                if (refreshed) {
                    setSelectedChat(prev => ({
                        ...prev!,
                        ...refreshed
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    }, [selectedChat]);

    useEffect(() => {
        loadChats();
        const interval = setInterval(loadChats, 5000);
        return () => clearInterval(interval);
    }, [loadChats]);

    // Split chats into Clientes and Leads
    const { clientChats, leadChats } = useMemo(() => {
        const cChats: ChatContact[] = [];
        const lChats: ChatContact[] = [];

        chats.forEach(chat => {
            const cleanPhone = chat.customer_phone?.replace(/\D/g, '') || '';
            // Match with clients by phone (suffix match for safety with international codes)
            const isKnownClient = clients.some(c => {
                const cPhone = c.phone.replace(/\D/g, '');
                return cPhone.length > 0 && cleanPhone.length > 0 && (cPhone.endsWith(cleanPhone) || cleanPhone.endsWith(cPhone));
            });

            // Rule: If it comes from Marketing OR is not a known client, it's a lead.
            if (chat.channelOrigin === 'Marketing' || !isKnownClient) {
                lChats.push(chat);
            } else { // Rule: If it's NOT from marketing AND is a known client, it's a client.
                cChats.push(chat);
            }
        });

        return { clientChats: cChats, leadChats: lChats };
    }, [chats, clients]);

    const displayedConversations = activeTab === 'clientes' ? clientChats : leadChats;

    useEffect(() => {
        if (!selectedChat && displayedConversations.length > 0) {
            setSelectedChat(displayedConversations[0]);
        }
    }, [activeTab, displayedConversations, selectedChat]);

    // Handle target client from props
    useEffect(() => {
        if (targetClientId && onClearTarget) {
            const targetClient = clients.find(c => c.id === targetClientId);
            if (targetClient) {
                const cleanPhone = targetClient.phone.replace(/\D/g, '');
                const targetConvo = chats.find(c => (c.customer_phone?.replace(/\D/g, '') || '').endsWith(cleanPhone));
                if (targetConvo) {
                    setActiveTab('clientes');
                    setSelectedChat(targetConvo);
                }
            }
            onClearTarget();
        }
    }, [targetClientId, onClearTarget, chats, clients]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedChat?.history]);

    // Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            setInputValue(transcript);
        };

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognitionRef.current = recognition;
        return () => recognition.stop();
    }, []);

    const handleToggleListen = () => {
        if (!recognitionRef.current) return;
        if (isListening) recognitionRef.current.stop();
        else recognitionRef.current.start();
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !selectedChat) return;

        if (selectedChat.status !== 'manual') {
            alert("Pause o Agente IA para enviar mensagens manuais.");
            return;
        }

        try {
            await aiAPI.sendMessage(selectedChat.id, inputValue);
            setInputValue('');
            loadChats();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleToggleAi = async () => {
        if (!selectedChat) return;
        const newStatus = selectedChat.status === 'active' ? 'manual' : 'active';
        try {
            await aiAPI.toggleChatStatus(selectedChat.id, newStatus);
            setSelectedChat({ ...selectedChat, status: newStatus });
            loadChats();
        } catch (error) {
            console.error('Error toggling AI status:', error);
        }
    };

    const handleDownloadChat = () => {
        if (!selectedChat) return;
        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF();
            let y = 20;
            doc.setFontSize(16);
            doc.text(`Conversa com ${selectedChat.name}`, 10, y);
            y += 10;
            doc.setFontSize(10);
            doc.text(`Telefone: ${selectedChat.customer_phone}`, 10, y);
            y += 10;
            doc.line(10, y, 200, y);
            y += 10;

            selectedChat.history.forEach((msg) => {
                if (y > 280) { doc.addPage(); y = 20; }
                const sender = msg.role === 'user' ? selectedChat.name : 'Salão24h (IA)';
                const date = new Date(msg.created_at).toLocaleTimeString();
                doc.setFont('helvetica', 'bold');
                doc.text(`[${date}] ${sender}:`, 10, y);
                y += 5;
                doc.setFont('helvetica', 'normal');
                const splitText = doc.splitTextToSize(msg.content, 180);
                doc.text(splitText, 10, y);
                y += (splitText.length * 5) + 5;
            });
            doc.save(`conversa_${selectedChat.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Erro ao gerar PDF. Verifique se o jsPDF está carregado.");
        }
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const TabButton: React.FC<{ tabId: 'clientes' | 'leads', count: number, children: React.ReactNode }> = ({ tabId, count, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`flex-1 flex justify-center items-center gap-2 p-3 font-semibold transition-colors border-b-2 ${activeTab === tabId ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'}`}
        >
            {children}
            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tabId ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>{count}</span>
        </button>
    );

    return (
        <div className="container mx-auto px-6 py-8 h-full flex flex-col">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                <header className="flex-shrink-0 p-4 border-b flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="text-primary hover:text-primary-dark font-semibold">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-secondary">Caixa de Entrada</h1>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Conversation List */}
                    <aside className="w-1/3 border-r overflow-y-auto bg-light flex flex-col">
                        <div className="flex border-b sticky top-0 bg-light z-10">
                            <TabButton tabId="clientes" count={clientChats.length}>Clientes</TabButton>
                            <TabButton tabId="leads" count={leadChats.length}>Leads</TabButton>
                        </div>
                        {displayedConversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 italic">Nenhuma conversa nesta aba.</div>
                        ) : (
                            displayedConversations.map(convo => (
                                <button
                                    key={convo.id}
                                    onClick={() => setSelectedChat(convo)}
                                    className={`w-full text-left p-4 flex items-center gap-3 transition-colors duration-200 border-l-4 ${selectedChat?.id === convo.id ? 'bg-white border-primary' : 'border-transparent hover:bg-gray-200'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <img src={convo.avatar_url} alt={convo.name} className="w-12 h-12 rounded-full object-cover" />
                                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                                            <span className="text-green-500"><WhatsAppIcon /></span>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-baseline">
                                            <p className="font-bold text-secondary truncate">{convo.name}</p>
                                            <p className="text-xs text-gray-400 flex-shrink-0">{formatTime(convo.lastMessageTime)}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-sm text-gray-500 truncate">{convo.lastMessage || 'Sem mensagens'}</p>
                                            {(convo.unreadCount || 0) > 0 && (
                                                <span className="bg-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{convo.unreadCount}</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </aside>

                    {/* Active Chat Panel */}
                    <main className="flex-1 flex flex-col bg-[#F0F2F5]">
                        {selectedChat ? (
                            <>
                                <header className="flex-shrink-0 p-3 border-b flex justify-between items-center bg-white shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <img src={selectedChat.avatar_url} alt={selectedChat.name} className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <h3 className="font-bold text-secondary">{selectedChat.name}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                via <span className="text-green-500"><WhatsAppIcon /></span>
                                                WhatsApp {activeTab === 'clientes' ? '(Atendimento)' : '(Leads)'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-semibold transition-colors ${selectedChat.status === 'active' ? 'text-primary' : 'text-gray-400'}`}>Agente IA</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={selectedChat.status === 'active'}
                                                    onChange={handleToggleAi}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <button onClick={handleDownloadChat} className="text-gray-500 hover:text-primary transition-colors" title="Baixar histórico">
                                            <DownloadIcon />
                                        </button>
                                    </div>
                                </header>

                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {selectedChat.history.filter(m => m.role !== 'system' && m.role !== 'tool').map((msg, idx) => {
                                        const isAssistant = msg.role === 'assistant';
                                        return (
                                            <div key={idx} className={`flex ${isAssistant ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-lg p-3 rounded-2xl shadow-sm text-sm ${isAssistant
                                                    ? 'bg-[#D9FDD3] text-secondary rounded-tr-none'
                                                    : 'bg-white text-secondary rounded-tl-none'
                                                    }`}>
                                                    {isAssistant && msg.role === 'assistant' && selectedChat.status === 'active' && (
                                                        <span className="text-[10px] font-bold text-primary block mb-1 uppercase tracking-tighter">🤖 Agente IA</span>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isAssistant ? 'text-green-700/60' : 'text-gray-400'}`}>
                                                        {formatTime(msg.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <footer className="p-4 bg-white border-t">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder={selectedChat.status === 'active' ? "Agente IA está respondendo..." : (isListening ? "Ouvindo..." : "Escreva sua mensagem...")}
                                            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-gray-100"
                                            disabled={selectedChat.status === 'active'}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleToggleListen}
                                            disabled={selectedChat.status === 'active'}
                                            className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50`}
                                        >
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 11-2 0v-2.07A5 5 0 014 10V8a1 1 0 012 0v2a3 3 0 006 0V8a1 1 0 012 0v2a5 5 0 01-5 4.93z" clipRule="evenodd"></path></svg>
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-primary hover:bg-primary-dark text-white p-3 rounded-full transition-colors disabled:bg-gray-300 shadow-md"
                                            disabled={selectedChat.status === 'active' || !inputValue.trim()}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                            </svg>
                                        </button>
                                    </form>
                                    {selectedChat.status === 'active' && (
                                        <p className="text-[10px] text-center text-orange-600 font-semibold mt-2">⚠️ Pause o Agente IA acima para enviar mensagens manuais.</p>
                                    )}
                                </footer>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </div>
                                <h2 className="text-xl font-bold text-secondary">Nenhuma conversa selecionada</h2>
                                <p className="text-sm">Selecione um contato para carregar o histórico.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
