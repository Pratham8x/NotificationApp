import {io} from 'socket.io-client';
import {SERVER_URL} from './config';

let socket;
export const getSocket = token => {
  if (!socket) socket = io(SERVER_URL, {autoConnect: false, transports: ['websocket'], reconnection: true});
  if (socket.auth?.token !== token) {
    if (socket.connected) socket.disconnect();
    socket.auth = {token};
  }
  return socket;
};

export const disconnectSocket = () => socket?.disconnect();
