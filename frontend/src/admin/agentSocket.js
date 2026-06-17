import { io } from 'socket.io-client';

// Tao socket nhan vien voi token xac thuc. Goi disconnect khi unmount.
export function createAgentSocket(token) {
  return io({ auth: { token } });
}
