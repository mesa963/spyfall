import { io } from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : (window.location.port === '5173' ? 'http://localhost:3001' : window.location.origin);

export const socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});
