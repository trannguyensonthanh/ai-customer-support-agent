import { io } from 'socket.io-client';

// Socket cho khach. Ket noi same-origin (qua proxy Vite).
// Truyen token de backend nhan dien khach hang.
let socket = null;

export function getCustomerSocket() {
  if (!socket) {
    let token = null;
    try {
      const raw = localStorage.getItem('sv_customer');
      if (raw) token = JSON.parse(raw).token;
    } catch {}
    socket = io({ autoConnect: true, auth: { token } });
  }
  return socket;
}

// Reconnect voi token moi khi login/logout
export function reconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getCustomerSocket();
}
