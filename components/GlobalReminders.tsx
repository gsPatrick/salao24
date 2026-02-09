import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Using AuthContext directly for socket if available, or just fetch
import { getSocket } from '../lib/socket';
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface Reminder {
    id: number | string;
    subject?: string;
    text: string;
    date: string;
    dateTime?: string; // Support both for robustness
    completed: boolean;
}

interface ClientReminder {
    id: number;
    name: string;
    reminders: Reminder[];
}

const GlobalReminders: React.FC = () => {
    const { token, user } = useAuth(); // Need token for fetch
    const [reminders, setReminders] = useState<ClientReminder[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

    // Clear toast after 5s
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Fetch reminders
    const fetchReminders = async (showToast = false) => {
        if (!token) return;
        setIsLoading(true);
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${baseUrl}${baseUrl.endsWith('/api') ? '' : '/api'}/clients/reminders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                const newReminders = data.data;
                const totalNewPending = newReminders.reduce((acc: number, c: any) => acc + (c.reminders?.filter((r: any) => !r.completed).length || 0), 0);
                const currentPending = reminders.reduce((acc, c) => acc + (c.reminders?.filter(r => !r.completed).length || 0), 0);

                // If showToast is true OR we detected a numeric increase in pending reminders
                if (showToast || totalNewPending > currentPending) {
                    setToast({ message: `Você tem ${totalNewPending} lembrete(s) pendente(s)`, type: 'info' });
                    // Try to play a subtle sound if possible (optional)
                }

                setReminders(newReminders);
            }
        } catch (error) {
            console.error('Error fetching reminders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchReminders();

        // 60s polling fallback (requested by user)
        const pollingInterval = setInterval(() => {
            console.log('GlobalReminders: Polling check...');
            fetchReminders();
        }, 60000);

        const socket = getSocket();

        const onConnect = () => {
            console.log('GlobalReminders: Socket connected');
        };

        if (socket) {
            console.log('GlobalReminders: Setting up socket listeners...');
            socket.on('connect', onConnect);

            const handleReminderUpdate = (data: any) => {
                console.log('GlobalReminders: Received update', data);
                fetchReminders(true);
            };

            socket.on('reminder:update', handleReminderUpdate);
            socket.on('client:update', handleReminderUpdate);

            return () => {
                clearInterval(pollingInterval);
                socket.off('connect', onConnect);
                socket.off('reminder:update', handleReminderUpdate);
                socket.off('client:update', handleReminderUpdate);
            };
        }

        return () => clearInterval(pollingInterval);
    }, [token]);

    // Calculate pending reminders
    const pendingCount = reminders.reduce((acc, client) => {
        return acc + (client.reminders?.filter(r => !r.completed).length || 0);
    }, 0);

    if (!user) return null;

    const handleMarkAsDone = async (clientId: number, reminderId: string) => {
        if (!token) return;

        try {
            const client = reminders.find(c => c.id === clientId);
            if (!client) return;

            // Create updated reminders list
            const updatedReminders = client.reminders.map(r =>
                r.id === reminderId ? { ...r, completed: true } : r
            ); // Logic to mark locally first could be good but we rely on refresh

            // We need to update the client's reminders in the backend.
            // Since we don't have a specific endpoint for just this, we might need to send the whole array
            // via the client update endpoint which is typically PUT /api/clients/:id

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${baseUrl}${baseUrl.endsWith('/api') ? '' : '/api'}/clients/${clientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reminders: updatedReminders
                })
            });

            const data = await response.json();
            if (data.success) {
                // Refresh list locally to reflect change immediately
                setReminders(prev => prev.map(c =>
                    c.id === clientId
                        ? { ...c, reminders: updatedReminders }
                        : c
                ));
            }
        } catch (error) {
            console.error('Error marking reminder as done:', error);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
                <span className="sr-only">View notifications</span>
                <ClockIcon />
                {pendingCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white bg-red-500 text-xs text-white text-center leading-4 font-bold">
                        {pendingCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10 cursor-default"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 max-h-96 overflow-y-auto">
                        <div className="py-2 px-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-sm font-medium text-gray-700">Lembretes de Clientes</h3>
                            <button onClick={fetchReminders} className="text-xs text-blue-500 hover:text-blue-700">Atualizar</button>
                        </div>
                        <div className="py-1">
                            {isLoading && reminders.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-gray-500 text-center">Carregando...</p>
                            ) : reminders.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-gray-500 text-center">Nenhum lembrete ativo.</p>
                            ) : (
                                reminders.flatMap(client =>
                                    client.reminders.filter(r => !r.completed).map(r => ({ ...r, clientName: client.name, clientId: client.id }))
                                ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .map((reminder, idx) => {
                                        const isOverdue = new Date(reminder.date) < new Date();
                                        return (
                                            <div key={`${reminder.clientId}-${reminder.id}-${idx}`} className={`px-4 py-3 border-b border-gray-100 last:border-0 group ${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-gray-900">{reminder.clientName}</p>
                                                            {isOverdue && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-200 text-red-800">
                                                                    ATRASADO
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-sm mt-1 font-bold ${isOverdue ? 'text-red-800' : 'text-gray-800'}`}>
                                                            {reminder.subject || 'Lembrete'}
                                                        </p>
                                                        <p className={`text-sm mt-0.5 ${isOverdue ? 'text-red-700' : 'text-gray-600'}`}>{reminder.text}</p>
                                                        <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                                            {new Date(reminder.date || reminder.dateTime || '').toLocaleDateString()} - {new Date(reminder.date || reminder.dateTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleMarkAsDone(reminder.clientId, reminder.id)}
                                                        className={`opacity-0 group-hover:opacity-100 p-1 transition-opacity ${isOverdue ? 'text-red-600 hover:text-red-800' : 'text-green-500 hover:text-green-700'}`}
                                                        title="Marcar como concluído"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>
                </>
            )}
            {/* Local Toast Notification */}
            {toast && (
                <div className="fixed bottom-4 right-4 z-[9999] animate-bounce">
                    <div className="bg-primary text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border-2 border-white/20 backdrop-blur-sm">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <ClockIcon />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Novo Lembrete!</p>
                            <p className="text-xs opacity-90">{toast.message}</p>
                        </div>
                        <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalReminders;
