import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../lib/api';

// Interfaces
interface User {
    id: number;
    name: string;
    avatarUrl: string;
    role: string;
}

interface Message {
    id: number;
    text: string | React.ReactNode;
    senderId: number;
    timestamp: string;
    attachment?: {
        name: string;
        type: 'image' | 'file';
        url: string; // Data URL or remote URL
    };
}

interface InternalChatProps {
    onClose: () => void;
    users: User[]; // This will be replaced by API fetch inside the component or passed down
    currentUser: User;
    unreadMessages: { [key: number]: number };
    onClearUnread: (userId: number) => void;
}

const InternalChat: React.FC<InternalChatProps> = ({ onClose, currentUser, onClearUnread }) => {
    const [contactList, setContactList] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<{ [key: number]: Message[] }>({});
    const [inputValue, setInputValue] = useState('');
    const [aiActiveStatus, setAiActiveStatus] = useState<{ [key: string]: boolean }>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedUser]);

    // Fetch Contacts
    const fetchContacts = async () => {
        try {
            const contacts = await chatAPI.getContacts();
            const mappedContacts = contacts.map((c: any) => ({
                id: c.id,
                name: c.name,
                avatarUrl: c.avatar_url || 'https://i.pravatar.cc/150?u=' + c.id,
                role: c.role
            }));
            setContactList(mappedContacts);
            if (mappedContacts.length > 0 && !selectedUser) {
                setSelectedUser(mappedContacts[0]);
            }
        } catch (error) {
            console.error('Error fetching contacts', error);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    // Fetch Messages for selected user
    const fetchMessages = async (userId: number) => {
        try {
            const history = await chatAPI.getMessages(userId);
            const mappedMessages = history.map((m: any) => ({
                id: m.id,
                text: m.content,
                senderId: m.sender_id,
                timestamp: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                attachment: m.attachment_url ? {
                    name: m.attachment_url.split('/').pop() || 'file',
                    type: m.attachment_type,
                    url: m.attachment_url
                } : undefined
            }));

            setMessages(prev => ({
                ...prev,
                [userId]: mappedMessages
            }));

            // Clear unread if selected
            if (selectedUser?.id === userId) {
                onClearUnread(userId);
                // Optionally call markAsRead API here
                await chatAPI.markAsRead(userId);
            }
        } catch (error) {
            console.error('Error fetching messages', error);
        }
    };

    // Polling Mechanism
    useEffect(() => {
        if (!selectedUser) return;

        // Fetch immediately
        fetchMessages(selectedUser.id);

        // Then poll every 3 seconds
        const interval = setInterval(() => {
            fetchMessages(selectedUser.id);
            // Also refresh contacts to update unread status if needed (future implementation)
            // fetchContacts(); 
        }, 3000);

        return () => clearInterval(interval);
    }, [selectedUser?.id]);

    const handleToggleAi = () => {
        if (!selectedUser) return;
        setAiActiveStatus(prev => ({
            ...prev,
            [selectedUser.id]: !(prev[selectedUser.id] ?? true)
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachment(file);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && !attachment) || !selectedUser) return;

        const isAiActive = aiActiveStatus[selectedUser.id] ?? true;
        if (isAiActive) return;

        const currentInputValue = inputValue;

        // Optimistic Update
        const optimisticMessage: Message = {
            id: Date.now(),
            text: currentInputValue,
            senderId: currentUser.id,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => ({
            ...prev,
            [selectedUser.id]: [...(prev[selectedUser.id] || []), optimisticMessage]
        }));
        setInputValue('');

        try {
            await chatAPI.sendMessage(selectedUser.id, currentInputValue);
            // Polling will naturally fetch the real message with correct ID soon
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Falha ao enviar mensagem');
        }
    };


    return (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col animate-bounce-in">
            {/* Header */}
            <header className="flex-shrink-0 p-4 border-b flex justify-between items-center bg-light rounded-t-xl">
                <h2 className="text-lg font-bold text-secondary">Comunicação Interna</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Contact List */}
                <aside className="w-2/5 sm:w-1/3 border-r overflow-y-auto">
                    {contactList.map(user => {
                        // We need unread count logic either from parent or fetched
                        const unreadCount = 0; // Placeholder for now
                        return (
                            <button
                                key={user.id}
                                onClick={() => {
                                    setSelectedUser(user);
                                }}
                                className={`w-full text-left p-3 flex items-center gap-3 transition-colors duration-200 ${selectedUser?.id === user.id ? 'bg-primary/10' : 'hover:bg-gray-100'}`}
                            >
                                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                                <div className="hidden sm:block flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-secondary text-sm truncate">{user.name}</p>
                                        {unreadCount > 0 && (
                                            <span className="bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">{unreadCount}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{user.role}</p>
                                </div>
                            </button>
                        );
                    })}
                </aside>

                {/* Chat Area */}
                <main className="flex-1 flex flex-col">
                    {selectedUser ? (
                        <>
                            <header className="flex-shrink-0 p-3 border-b flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <h3 className="font-bold text-secondary">{selectedUser.name}</h3>
                                        <p className="text-xs text-green-500">Online</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-semibold transition-colors ${aiActiveStatus[selectedUser.id] ?? true ? 'text-primary' : 'text-gray-400'}`}>
                                        Agente IA
                                    </span>
                                    <label htmlFor={`ai-toggle-${selectedUser.id}`} className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id={`ai-toggle-${selectedUser.id}`}
                                            className="sr-only peer"
                                            checked={aiActiveStatus[selectedUser.id] ?? true}
                                            onChange={handleToggleAi}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </header>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {(messages[selectedUser.id] || []).map((msg, index) => (
                                    <div key={msg.id || index} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        {msg.senderId !== currentUser.id && <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-8 h-8 rounded-full" />}
                                        <div className={`p-3 rounded-xl max-w-sm ${msg.senderId === currentUser.id ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-secondary rounded-bl-none'}`}>
                                            {msg.attachment && (
                                                <div className="mb-2">
                                                    {msg.attachment.type === 'image' ? (
                                                        <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer">
                                                            <img src={msg.attachment.url} alt={msg.attachment.name} className="rounded-md max-w-full h-auto max-h-48 cursor-pointer" />
                                                        </a>
                                                    ) : (
                                                        <a href={msg.attachment.url} download={msg.attachment.name} className={`flex items-center gap-2 p-2 rounded-md ${msg.senderId === currentUser.id ? 'bg-black/20 hover:bg-black/30' : 'bg-gray-300 hover:bg-gray-400'}`}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            <span className="text-sm font-medium truncate">{msg.attachment.name}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {msg.text && <p className="text-sm" style={{ wordBreak: 'break-word' }}>{msg.text}</p>}
                                            <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-white/70 text-right' : 'text-gray-500 text-left'}`}>{msg.timestamp}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <footer className="p-4 border-t">
                                {attachment && (
                                    <div className="px-3 pb-3">
                                        <div className="bg-gray-100 p-2 rounded-md text-sm flex items-center justify-between">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                <span className="font-medium text-gray-700 truncate">{attachment.name}</span>
                                            </div>
                                            <button type="button" onClick={() => setAttachment(null)} className="text-red-500 hover:text-red-700 font-bold text-lg leading-none p-1">&times;</button>
                                        </div>
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                    <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={aiActiveStatus[selectedUser.id] ?? true}
                                        className="p-3 rounded-full text-gray-500 hover:bg-gray-200 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed"
                                        aria-label="Anexar arquivo"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={(aiActiveStatus[selectedUser.id] ?? true) ? "Agente IA está respondendo..." : "Digite sua mensagem..."}
                                        className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-gray-100"
                                        disabled={aiActiveStatus[selectedUser.id] ?? true}
                                    />
                                    <button type="submit" className="bg-primary hover:bg-primary-dark text-white p-3 rounded-full transition-colors disabled:bg-gray-400" disabled={(aiActiveStatus[selectedUser.id] ?? true) || (!inputValue.trim() && !attachment)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                    </button>
                                </form>
                            </footer>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <p>Selecione um contato para iniciar a conversa.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default InternalChat;