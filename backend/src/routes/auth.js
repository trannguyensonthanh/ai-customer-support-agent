import { Router } from 'express';
import { userStore, customerStore } from '../db/store.js';
import { verifyPassword, signToken, signCustomerToken } from '../services/authService.js';

export const authRouter = Router();

// POST /api/auth/login  — Unified login (admin/agent/customer)
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu.' });
  }

  // 1. Check admin/agent table first
  const user = userStore.byEmail(email);
  if (user && verifyPassword(password, user.passwordHash)) {
    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      role: user.role,
    });
  }

  // 2. Check customer table
  const customer = customerStore.byEmail(email);
  if (customer && verifyPassword(password, customer.passwordHash)) {
    const token = signCustomerToken(customer);
    return res.json({
      token,
      user: { id: customer.id, email: customer.email, name: customer.name, role: 'customer' },
      customer: { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone, address: customer.address },
      role: 'customer',
    });
  }

  return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
});
