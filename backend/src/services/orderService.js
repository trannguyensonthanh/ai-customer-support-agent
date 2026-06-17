import { orders } from '../data/orders.js';

// Tra cuu 1 don theo ma don (vd DH1024).
export function findOrderByCode(code) {
  if (!code) return null;
  const c = String(code).trim().toUpperCase();
  return orders.find((o) => o.code.toUpperCase() === c) || null;
}

// Tra cuu cac don theo email hoac so dien thoai.
export function findOrdersByContact(contact) {
  if (!contact) return [];
  const c = String(contact).trim().toLowerCase();
  return orders.filter(
    (o) => o.email.toLowerCase() === c || o.phone === c.replace(/\s/g, '')
  );
}

// Rut gon don hang de tra ve cho LLM / frontend (bo bot field thua).
export function summarizeOrder(o) {
  return {
    code: o.code,
    customerName: o.customerName,
    status: o.status,
    placedAt: o.placedAt,
    estimatedDelivery: o.estimatedDelivery,
    total: o.total,
    items: o.items,
    timeline: o.timeline,
  };
}
