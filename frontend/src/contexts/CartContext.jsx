import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCart, addToCart as apiAdd, updateCartItem as apiUpdate, clearCart as apiClear } from '../lib/customerApi.js';
import { useCustomerAuth } from './CustomerAuthContext.jsx';

const Ctx = createContext(null);

export function CartProvider({ children }) {
  const authCtx = useCustomerAuth();
  const customer = authCtx?.customer;
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!customer) { setCart({ items: [] }); return; }
    setLoading(true);
    try {
      const data = await getCart();
      setCart(data);
    } catch { setCart({ items: [] }); }
    setLoading(false);
  }, [customer]);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = useCallback(async (productId, qty = 1) => {
    try {
      const data = await apiAdd(productId, qty);
      setCart(data);
      return true;
    } catch { return false; }
  }, []);

  const updateItem = useCallback(async (productId, qty) => {
    try {
      const data = await apiUpdate(productId, qty);
      setCart(data);
    } catch {}
  }, []);

  const clear = useCallback(async () => {
    try {
      await apiClear();
      setCart({ items: [] });
    } catch {}
  }, []);

  const itemCount = (cart.items || []).reduce((s, i) => s + i.qty, 0);
  const subtotal = (cart.items || []).reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  return (
    <Ctx.Provider value={{ cart, loading, itemCount, subtotal, addItem, updateItem, clear, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);
