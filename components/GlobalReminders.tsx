import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Using AuthContext directly for socket if available, or just fetch
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface Reminder {
    id: string;
    text: string;
    date: string;
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

    // Fetch reminders
    const fetchReminders = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/clients/reminders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setReminders(data.data);
            }
        } catch (error) {
            console.error('Error fetching reminders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReminders();

        // Setup socket listener if possible
        // We might need to access the global socket instance.
        // If it's not easily accessible, we'll rely on periodic polling or just init fetch. 
        // But the plan was to listen to 'reminder:update'.
        // Assuming window.socket or similar if global, OR if we can import the socket instance from somewhere.
        // Since we don't have a direct socket context hook visible yet (except Auth maybe?), let's rely on event listener pattern if implemented, 
        // OR just polling every minute for robustness in this "safe" implementation.

        const interval = setInterval(fetchReminders, 60000); // Poll every minute
        return () => clearInterval(interval);

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

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/clients/${clientId}`, {
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
                                reminders.map(client => (
                                    client.reminders.filter(r => !r.completed).map((reminder, idx) => (
                                        <div key={`${client.id}-${idx}`} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 group">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{reminder.text}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{new Date(reminder.date).toLocaleDateString()} - {new Date(reminder.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleMarkAsDone(client.id, reminder.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-green-500 hover:text-green-700 p-1"
                                                    title="Marcar como concluído"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GlobalReminders;
