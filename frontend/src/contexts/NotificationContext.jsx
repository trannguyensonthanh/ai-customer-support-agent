import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/customerApi.js';
import { useCustomerAuth } from './CustomerAuthContext.jsx';
import { getCustomerSocket } from '../lib/customerSocket.js';

const Ctx = createContext(null);

export function NotificationProvider({ children }) {
  const { customer, token } = useCustomerAuth();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  // Fetch notifications khi login
  useEffect(() => {
    if (!customer) { setNotifications([]); setUnread(0); return; }
    getNotifications()
      .then((data) => { setNotifications(data.notifications || []); setUnread(data.unread || 0); })
      .catch(() => {});
  }, [customer]);

  // Socket realtime
  useEffect(() => {
    if (!customer || !token) return;
    const socket = getCustomerSocket();
    const onOrderStatus = (data) => {
      addToast(`Đơn ${data.orderCode}: ${data.newStatus}`, 'order');
      setUnread((u) => u + 1);
      // Refresh notifications
      getNotifications()
        .then((d) => { setNotifications(d.notifications || []); setUnread(d.unread || 0); })
        .catch(() => {});
    };
    const onNotification = (data) => {
      addToast(data.title || data.message, data.type || 'info');
      setUnread((u) => u + 1);
    };
    socket.on('order_status_changed', onOrderStatus);
    socket.on('notification', onNotification);
    return () => {
      socket.off('order_status_changed', onOrderStatus);
      socket.off('notification', onNotification);
    };
  }, [customer, token]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type, at: Date.now() }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ notifications, unread, toasts, addToast, markRead, markAllRead, removeToast }}>
      {children}
    </Ctx.Provider>
  );
}

export const useNotifications = () => useContext(Ctx);
