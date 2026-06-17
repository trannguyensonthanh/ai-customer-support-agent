import { verifyToken } from '../services/authService.js';

// Xac thuc admin/agent
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return res.status(401).json({ error: 'Cần đăng nhập.' });
  }
  req.user = payload;
  next();
}

// Xac thuc khach hang
export function requireCustomer(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'customer') {
    return res.status(401).json({ error: 'Cần đăng nhập tài khoản khách hàng.' });
  }
  req.customer = payload;
  next();
}

// Tuy chon: neu co token thi parse, khong co thi bo qua
export function optionalCustomer(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  req.customer = token ? verifyToken(token) : null;
  next();
}
