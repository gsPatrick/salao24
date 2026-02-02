import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://salao-api.rdwhjt.easypanel.host/api';
const SOCKET_URL = API_URL.replace(/\/api$/, ''); // Ensure /api is removed from end

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        const token = localStorage.getItem('token');
        socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: true,
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const updateSocketToken = (token: string) => {
    if (socket) {
        socket.auth = { token };
        socket.disconnect().connect();
    }
};
