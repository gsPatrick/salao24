import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI, aiAPI } from '../lib/api';
import { io, Socket } from 'socket.io-client';

// --- Interfaces ---
interface Message {
    id: number | string;
    content: string;
    sender_id?: number;
    receiver_id?: number;
    role?: 'user' | 'assistant' | 'system' | 'tool'; // For WhatsApp
    created_at: string;
    read?: boolean;
}

interface ChatContact {
    id: number;
    name: string;
    avatar_url?: string;
    role: string;
    unreadCount?: number;
    lastMessage?: string;
    lastMessageTime?: string;
    // WhatsApp specific
    customer_phone?: string;
    status?: 'active' | 'manual' | 'archived';
    history?: Message[];
}

interface ChatPageProps {
    onBack?: () => void;
    targetClientId?: number | null;
    onClearTarget?: () => void;
    onComingSoon?: (feature: string) => void;
}

// --- Icons ---
const TeamIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const WhatsAppIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16.75 13.96c.25.41.4 1 .25 1.61l-.01.01c-.13 1.14-.65 2.2-1.48 2.9l-.1.1c-.93.78-2.02 1.25-3.23 1.34l-.06.01h-3.21c-4.87 0-8.83-3.95-8.83-8.83s3.95-8.83 8.83-8.83 8.83 3.95 8.83 8.83c0 .34-.02.67-.06.99l-.01 0c-.31 1.8-.13 3.61.51 5.32l.11.29zM12 21.92c4.34 0 7.88-3.54 7.88-7.88s-3.54-7.88-7.88-7.88-7.88 3.54-7.88 7.88c0 2.05.79 3.93 2.11 5.35l.12.12c.1.09.2.18.29.27l-1.38 3.97 4.09-1.37c.37.07.74.12 1.13.15h3.04c.01-.01 0 0 0 0z" />
        <path d="M15.26 13.01c-.08-.12-.3-.2-.52-.32-.22-.12-.52-.27-.8-.37-.28-.1-.52-.16-.72-.16-.29 0-.57.1-.77.37-.2.27-.76.95-.92 1.15s-.33.22-.61.07c-.28-.15-1.18-.53-2.13-1.42s-1.58-1.95-1.63-2.05c-.05-.1-.01-.2.08-.31.09-.11.2-.27.3-.37.1-.1.15-.22.22-.37.07-.15.04-.28-.02-.42s-.72-1.72-.98-2.32c-.27-.6-.52-.52-.72-.52-.18 0-.4 0-.61 0s-.57.08-.85.37c-.28.3-.95.95-.95 2.32 0 1.38 1.03 2.7 1.18 2.87s1.8 2.92 4.49 4.18c2.69 1.26 3.3.93 3.73.85.43-.08 1.18-.52 1.38-.98.2-.47.2-.85.15-.98-.05-.12-.17-.2-.25-.32z" />
    </svg>
);

const ChatPage: React.FC<ChatPageProps> = ({ onBack, targetClientId, onClearTarget, onComingSoon }) => {
    const { user: currentUser } = useAuth();
    const [viewMode, setViewMode] = useState<'interno' | 'whatsapp'>('interno');

    // Internal Chat State
    const [internalContacts, setInternalContacts] = useState<ChatContact[]>([]);
    const [selectedInternalContact, setSelectedInternalContact] = useState<ChatContact | null>(null);
    const [internalMessages, setInternalMessages] = useState<Message[]>([]);

    // WhatsApp (AI) State
    const [whatsappChats, setWhatsappChats] = useState<ChatContact[]>([]);
    const [selectedWhatsappChat, setSelectedWhatsappChat] = useState<ChatContact | null>(null);

    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // --- Socket Initialization ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Backend URL (Production)
        const socketUrl = 'https://salao-api.rdwhjt.easypanel.host';

        socketRef.current = io(socketUrl, {
            auth: { token },
            transports: ['websocket'] // Force WebSocket to avoid polling issues
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Connected to WebSocket');
        });

        socketRef.current.on('receive_message', (payload: any) => {
            console.log('📩 New message received:', payload);

            if (payload.senderId === selectedInternalContact?.id || payload.receiverId === selectedInternalContact?.id) {
                setInternalMessages(prev => {
                    if (prev.some(m => m.id === payload.id)) return prev;
                    return [...prev, {
                        id: payload.id,
                        content: payload.text,
                        sender_id: payload.senderId,
                        created_at: payload.timestamp
                    }];
                });
            }
            fetchInternal();
        });

        socketRef.current.on('message_sent', (payload: any) => {
            console.log('📤 Message sent confirmation:', payload);
            setInternalMessages(prev => {
                if (prev.some(m => m.id === payload.id)) return prev;
                return [...prev, {
                    id: payload.id,
                    content: payload.text,
                    sender_id: payload.senderId,
                    created_at: payload.timestamp
                }];
            });
            fetchInternal();
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [selectedInternalContact, currentUser]);

    // --- Data Fetching ---

    const fetchInternal = useCallback(async () => {
        try {
            const data = await chatAPI.getContacts();
            setInternalContacts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching internal contacts:', error);
        }
    }, []);

    const fetchInternalMessages = useCallback(async () => {
        if (!selectedInternalContact) return;
        try {
            const data = await chatAPI.getMessages(selectedInternalContact.id);
            setInternalMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching internal history:', error);
        }
    }, [selectedInternalContact]);

    const fetchWhatsapp = useCallback(async () => {
        try {
            const data = await aiAPI.getChats();
            const mapped = (data || []).map((chat: any) => ({
                id: chat.id,
                name: chat.customer_name || chat.customer_phone,
                customer_phone: chat.customer_phone,
                role: 'whatsapp',
                status: chat.status,
                lastMessage: chat.last_message,
                lastMessageTime: chat.updated_at,
                history: chat.history || []
            }));
            setWhatsappChats(mapped);

            setSelectedWhatsappChat(currentSelected => {
                if (!currentSelected) return null;
                const refreshed = mapped.find((c: any) => c.id === currentSelected.id);
                if (refreshed) {
                    return {
                        ...currentSelected,
                        ...refreshed,
                        history: refreshed.history
                    };
                }
                return currentSelected;
            });
        } catch (error) {
            console.error('Error fetching WhatsApp chats:', error);
        }
    }, []);

    // Polling only for WhatsApp
    useEffect(() => {
        fetchInternal();
        fetchWhatsapp();
        const interval = setInterval(() => {
            fetchWhatsapp();
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchWhatsapp]);

    useEffect(() => {
        if (viewMode === 'interno' && selectedInternalContact) {
            fetchInternalMessages();
        }
    }, [viewMode, selectedInternalContact, fetchInternalMessages]);

    // --- Handlers ---

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        try {
            if (viewMode === 'interno' && selectedInternalContact) {
                if (socketRef.current?.connected) {
                    socketRef.current.emit('send_message', {
                        receiverId: selectedInternalContact.id,
                        text: inputValue
                    });
                } else {
                    await chatAPI.sendMessage(selectedInternalContact.id, inputValue);
                }
                setInputValue('');
            } else if (viewMode === 'whatsapp' && selectedWhatsappChat) {
                // In manual mode, we send a real WhatsApp message via Z-API
                if (selectedWhatsappChat.status === 'manual') {
                    await aiAPI.sendMessage(selectedWhatsappChat.id, inputValue);

                    // Optimistic update for UI responsiveness
                    setSelectedWhatsappChat(prev => {
                        if (!prev) return null;
                        const newHistory = [...(prev.history || [])];
                        newHistory.push({
                            id: Date.now(),
                            role: 'assistant', // Or 'system' to denote manual
                            content: inputValue,
                            created_at: new Date().toISOString()
                        });
                        return { ...prev, history: newHistory, lastMessage: inputValue, lastMessageTime: new Date().toISOString() };
                    });

                    setInputValue('');
                } else {
                    alert("Pause a IA para enviar mensagens manuais.");
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const toggleAiStatus = async (chatId: number, currentStatus: string) => {
        try {
            const nextStatus = currentStatus === 'active' ? 'manual' : 'active';

            // Optimistic Update
            setWhatsappChats(prev => prev.map(c =>
                c.id === chatId ? { ...c, status: nextStatus as 'active' | 'manual' } : c
            ));

            if (selectedWhatsappChat && selectedWhatsappChat.id === chatId) {
                setSelectedWhatsappChat(prev => prev ? { ...prev, status: nextStatus as 'active' | 'manual' } : null);
            }

            await aiAPI.toggleChatStatus(chatId, nextStatus as 'active' | 'manual');

            // Re-fetch to confirm
            fetchWhatsapp();
        } catch (error) {
            console.error('Error toggling AI status:', error);
            // Revert on error (could implement revert logic here)
            fetchWhatsapp();
        }
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [internalMessages, selectedWhatsappChat?.history]);

    const activeContacts = viewMode === 'interno' ? internalContacts : whatsappChats;
    const activeSelected = viewMode === 'interno' ? selectedInternalContact : selectedWhatsappChat;
    const activeMessages = viewMode === 'interno'
        ? internalMessages
        : (selectedWhatsappChat?.history || []).map((m, idx) => ({
            id: idx,
            content: m.content,
            role: m.role,
            created_at: m.created_at || new Date().toISOString()
        }));

    return (
        <div className="container mx-auto px-6 py-8 h-full flex flex-col">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-200" style={{ height: 'calc(100vh - 120px)' }}>
                {/* Header / Tabs */}
                <header className="flex-shrink-0 border-b flex items-center justify-between px-6 py-4 bg-gray-50">
                    <div className="flex items-center gap-6">
                        {onBack && (
                            <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <h1 className="text-xl font-bold text-secondary">Centro de Mensagens</h1>
                    </div>

                    <div className="flex bg-white border rounded-lg p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode('interno')}
                            className={`px-4 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${viewMode === 'interno' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <TeamIcon /> Interno
                        </button>
                        <button
                            onClick={() => setViewMode('whatsapp')}
                            className={`px-4 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${viewMode === 'whatsapp' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            <WhatsAppIcon /> WhatsApp Monitor
                        </button>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Contact List */}
                    <aside className="w-1/3 border-r overflow-y-auto bg-white flex flex-col">
                        {activeContacts.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </div>
                                <p className="text-gray-500 text-sm">Nenhuma conversa encontrada.</p>
                            </div>
                        ) : (
                            activeContacts.map(contact => (
                                <button
                                    key={contact.id}
                                    onClick={() => viewMode === 'interno' ? setSelectedInternalContact(contact) : setSelectedWhatsappChat(contact)}
                                    className={`w-full text-left p-4 flex items-center gap-3 transition-all border-b border-gray-50 hover:bg-gray-50 ${activeSelected?.id === contact.id ? 'bg-blue-50/50 border-r-4 border-r-primary' : 'border-r-4 border-r-transparent'}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <img src={contact.avatar_url || `https://ui-avatars.com/api/?name=${contact.name}&background=random`} alt={contact.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                                        {viewMode === 'whatsapp' && (
                                            <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                                                <span className={`${contact.status === 'active' ? 'text-green-500' : 'text-orange-500'}`}><WhatsAppIcon /></span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-baseline">
                                            <p className="font-bold text-secondary truncate">{contact.name}</p>
                                            <p className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(contact.lastMessageTime)}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-xs text-gray-500 truncate pr-2">{contact.lastMessage || 'Toque para iniciar'}</p>
                                            {contact.unreadCount! > 0 && (
                                                <span className="bg-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{contact.unreadCount}</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </aside>

                    {/* Main Content: Chat Window */}
                    <main className="flex-1 flex flex-col bg-[#F0F2F5]">
                        {activeSelected ? (
                            <>
                                <header className="flex-shrink-0 p-4 border-b bg-white flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <img src={activeSelected.avatar_url || `https://ui-avatars.com/api/?name=${activeSelected.name}&background=random`} alt={activeSelected.name} className="w-10 h-10 rounded-full shadow-sm" />
                                        <div>
                                            <h3 className="font-bold text-secondary leading-tight">{activeSelected.name}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                {viewMode === 'interno' ? (
                                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Online no Time</span>
                                                ) : (
                                                    <>via WhatsApp • {activeSelected.status === 'active' ? '🤖 Agente Ativo' : '🧑‍💻 Intervenção Humana'}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {viewMode === 'whatsapp' && (
                                        <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-full px-3">
                                            <span className={`text-xs font-bold ${activeSelected.status === 'active' ? 'text-primary' : 'text-gray-400'}`}>🤖 Agente IA</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={activeSelected.status === 'active'}
                                                    onChange={() => toggleAiStatus(activeSelected.id, activeSelected.status!)}
                                                />
                                                <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    )}
                                </header>

                                {/* Message List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {activeMessages.map((msg, idx) => {
                                        const isFromMe = viewMode === 'interno'
                                            ? msg.sender_id === currentUser?.id
                                            : (msg.role === 'assistant' || msg.role === 'system');

                                        return (
                                            <div key={msg.id || idx} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-md p-3 rounded-2xl shadow-sm text-sm ${isFromMe
                                                    ? 'bg-[#D9FDD3] text-secondary rounded-tr-none border border-green-200'
                                                    : 'bg-white text-secondary rounded-tl-none border border-gray-200'
                                                    }`}>
                                                    {viewMode === 'whatsapp' && msg.role === 'assistant' && (
                                                        <span className="text-[10px] font-bold text-primary block mb-1">🤖 AGENTE IA</span>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    <p className={`text-[10px] mt-1 text-right ${isFromMe ? 'text-green-700/60' : 'text-gray-400'}`}>
                                                        {formatTime(msg.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <footer className="p-4 bg-white border-t">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder={viewMode === 'whatsapp' && activeSelected.status === 'active' ? '🤖 Agente está cuidando disso...' : 'Digite sua mensagem...'}
                                            className="flex-1 p-3 px-5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50 disabled:opacity-50"
                                            disabled={viewMode === 'whatsapp' && activeSelected.status === 'active'}
                                        />
                                        <button
                                            type="submit"
                                            className="bg-primary hover:bg-primary-dark text-white p-3 rounded-full transition-all shadow-md active:scale-95 disabled:bg-gray-300"
                                            disabled={!inputValue.trim() || (viewMode === 'whatsapp' && activeSelected.status === 'active')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                            </svg>
                                        </button>
                                    </form>
                                    {viewMode === 'whatsapp' && activeSelected.status === 'active' && (
                                        <p className="text-[10px] text-center text-orange-600 font-semibold mt-2">⚠️ Pause o Agente IA acima para enviar mensagens manuais.</p>
                                    )}
                                </footer>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                                </div>
                                <h2 className="text-lg font-bold text-secondary">Nenhuma conversa selecionada</h2>
                                <p className="text-sm max-w-xs text-center mt-2">Selecione um contato na lista à esquerda para carregar o histórico de mensagens.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
