import { Router } from 'express';
import { requireCustomer, optionalCustomer } from '../middleware/auth.js';
import {
  customerStore,
  cartStore,
  orderStore,
  productStore,
  voucherStore,
  notificationStore,
} from '../db/store.js';
import {
  hashPassword,
  verifyPassword,
  signCustomerToken,
} from '../services/authService.js';

export const customerRouter = Router();

// ====== Auth ======

// POST /api/customer/register
customerRouter.post('/register', (req, res) => {
  const { email, password, name, phone } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ email, mật khẩu và tên.' });
  }
  if (customerStore.byEmail(email)) {
    return res.status(409).json({ error: 'Email đã được sử dụng.' });
  }
  const customer = customerStore.create({
    email: email.toLowerCase().trim(),
    name: name.trim(),
    phone: (phone || '').trim(),
    address: '',
    passwordHash: hashPassword(password),
  });
  const token = signCustomerToken(customer);
  res.json({
    token,
    customer: { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone, address: customer.address },
  });
});

// POST /api/customer/login
customerRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const customer = email ? customerStore.byEmail(email) : null;
  if (!customer || !verifyPassword(password || '', customer.passwordHash)) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
  }
  const token = signCustomerToken(customer);
  res.json({
    token,
    customer: { id: customer.id, email: customer.email, name: customer.name, phone: customer.phone, address: customer.address },
  });
});

// ====== Profile ======

// GET /api/customer/profile
customerRouter.get('/profile', requireCustomer, (req, res) => {
  const c = customerStore.getById(req.customer.sub);
  if (!c) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  res.json({ id: c.id, email: c.email, name: c.name, phone: c.phone, address: c.address });
});

// PUT /api/customer/profile
customerRouter.put('/profile', requireCustomer, (req, res) => {
  const { name, phone, address } = req.body || {};
  const updated = customerStore.update(req.customer.sub, {
    ...(name && { name }),
    ...(phone != null && { phone }),
    ...(address != null && { address }),
  });
  if (!updated) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  res.json({ id: updated.id, email: updated.email, name: updated.name, phone: updated.phone, address: updated.address });
});

// ====== Gio hang ======

// GET /api/customer/cart
customerRouter.get('/cart', requireCustomer, (req, res) => {
  const cart = cartStore.getDetailed(req.customer.sub);
  res.json(cart);
});

// POST /api/customer/cart/add
customerRouter.post('/cart/add', requireCustomer, (req, res) => {
  const { productId, qty } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'Thiếu productId.' });
  const product = productStore.getById(productId);
  if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại.' });
  if (product.stock <= 0) return res.status(400).json({ error: 'Sản phẩm hết hàng.' });
  cartStore.addItem(req.customer.sub, productId, qty || 1);
  res.json(cartStore.getDetailed(req.customer.sub));
});

// PUT /api/customer/cart/update
customerRouter.put('/cart/update', requireCustomer, (req, res) => {
  const { productId, qty } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'Thiếu productId.' });
  cartStore.updateItem(req.customer.sub, productId, qty || 0);
  res.json(cartStore.getDetailed(req.customer.sub));
});

// DELETE /api/customer/cart
customerRouter.delete('/cart', requireCustomer, (req, res) => {
  cartStore.clear(req.customer.sub);
  res.json({ ok: true });
});

// ====== Checkout ======

// POST /api/customer/checkout
customerRouter.post('/checkout', requireCustomer, (req, res) => {
  const { address, paymentMethod, note, voucherCode } = req.body || {};
  const customer = customerStore.getById(req.customer.sub);
  if (!customer) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });

  const cart = cartStore.getDetailed(req.customer.sub);
  if (!cart.items || cart.items.length === 0) {
    return res.status(400).json({ error: 'Giỏ hàng trống.' });
  }

  // Kiem tra ton kho
  for (const item of cart.items) {
    if (item.stock < item.qty) {
      return res.status(400).json({ error: `Sản phẩm "${item.name}" chỉ còn ${item.stock} sản phẩm.` });
    }
  }

  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  let discount = 0;
  let voucherInfo = null;

  if (voucherCode) {
    const result = voucherStore.apply(voucherCode, subtotal);
    if (result.valid) {
      discount = result.discount;
      voucherInfo = result;
      if (result.type === 'shipping') discount = shippingFee; // mien phi ship
    }
  }

  const total = subtotal + shippingFee - discount;
  const orderCode = orderStore.nextCode();

  const order = orderStore.create({
    code: orderCode,
    customerId: customer.id,
    customerName: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: address || customer.address,
    paymentMethod: paymentMethod || 'COD',
    note: note || '',
    status: 'Chờ xác nhận',
    subtotal,
    shippingFee,
    discount,
    total,
    voucherCode: voucherCode || null,
    placedAt: new Date().toISOString().split('T')[0],
    estimatedDelivery: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    items: cart.items.map((i) => ({ productId: i.productId, name: i.name, qty: i.qty, price: i.price, image: i.image })),
    timeline: [
      { step: 'Đặt hàng', at: new Date().toLocaleString('vi-VN'), done: true },
      { step: 'Đã xác nhận', at: null, done: false },
      { step: 'Đang chuẩn bị', at: null, done: false },
      { step: 'Đang giao', at: null, done: false },
      { step: 'Đã giao', at: null, done: false },
    ],
  });

  // Giam ton kho
  for (const item of cart.items) {
    productStore.updateStock(item.productId, -item.qty);
  }

  // Xoa gio hang
  cartStore.clear(customer.id);

  // Thong bao
  notificationStore.create(customer.id, {
    type: 'order',
    title: `Đơn ${orderCode} đã đặt thành công`,
    message: `Đơn hàng ${orderCode} trị giá ${total.toLocaleString('vi-VN')}đ đang chờ xác nhận.`,
    orderId: order.id,
    orderCode,
  });

  res.json({ order });
});

// ====== Don hang cua khach ======

// GET /api/customer/orders
customerRouter.get('/orders', requireCustomer, (req, res) => {
  const { status } = req.query;
  let orders = orderStore.byCustomer(req.customer.sub);
  // Cung lay don theo email (don cu seed san)
  const customer = customerStore.getById(req.customer.sub);
  if (customer) {
    const byEmail = orderStore.byCustomerEmail(customer.email);
    const existingIds = new Set(orders.map((o) => o.id));
    for (const o of byEmail) {
      if (!existingIds.has(o.id)) orders.push(o);
    }
  }
  if (status && status !== 'all') {
    orders = orders.filter((o) => o.status === status);
  }
  orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json(orders);
});

// GET /api/customer/orders/:code
customerRouter.get('/orders/:code', requireCustomer, (req, res) => {
  const order = orderStore.byCode(req.params.code);
  if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  res.json(order);
});

// POST /api/customer/orders/:code/cancel
customerRouter.post('/orders/:code/cancel', requireCustomer, (req, res) => {
  const { reason } = req.body || {};
  const result = orderStore.cancelOrder(req.params.code, reason || 'Khách tự hủy');
  if (!result.success) return res.status(400).json({ error: result.message });
  // Thong bao
  const customer = customerStore.getById(req.customer.sub);
  if (customer) {
    notificationStore.create(customer.id, {
      type: 'order',
      title: `Đơn ${req.params.code} đã hủy`,
      message: result.message,
      orderCode: req.params.code,
    });
  }
  res.json(result);
});

// ====== Thong bao ======

// GET /api/customer/notifications
customerRouter.get('/notifications', requireCustomer, (req, res) => {
  const list = notificationStore.byCustomer(req.customer.sub);
  const unread = notificationStore.unreadCount(req.customer.sub);
  res.json({ notifications: list, unread });
});

// POST /api/customer/notifications/:id/read
customerRouter.post('/notifications/:id/read', requireCustomer, (req, res) => {
  notificationStore.markRead(req.params.id);
  res.json({ ok: true });
});

// POST /api/customer/notifications/read-all
customerRouter.post('/notifications/read-all', requireCustomer, (req, res) => {
  notificationStore.markAllRead(req.customer.sub);
  res.json({ ok: true });
});

// ====== Voucher ======

// POST /api/customer/voucher/check
customerRouter.post('/voucher/check', requireCustomer, (req, res) => {
  const { code, orderTotal } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Thiếu mã giảm giá.' });
  const result = voucherStore.apply(code, orderTotal || 0);
  res.json(result);
});
