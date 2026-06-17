import { Type } from '@google/genai';
import { orderStore, faqStore, productStore, voucherStore, normalizeVi } from '../db/store.js';
import { searchKnowledgeBase, searchProductsSemantic } from '../services/embeddingStore.js';

const cancelTokens = new Map();

export const functionDeclarations = [
  {
    name: 'search_knowledge_base',
    description:
      'Tim cau tra loi trong co so tri thuc FAQ (van chuyen, doi tra, thanh toan, bao hanh, khuyen mai...). Dung khi khach hoi thong tin/chinh sach chung.',
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING, description: 'Noi dung cau hoi cua khach.' } },
      required: ['query'],
    },
  },
  {
    name: 'lookup_order',
    description: 'Tra cuu chi tiet 1 don hang theo MA DON (vi du DH1024).',
    parameters: {
      type: Type.OBJECT,
      properties: { order_code: { type: Type.STRING, description: 'Ma don, vd DH1024.' } },
      required: ['order_code'],
    },
  },
  {
    name: 'find_orders_by_contact',
    description: 'Tra cuu danh sach tat ca don hang cua khach hang hien tai. (Luu y: phai dang nhap moi xem duoc, neu khach chua dang nhap thi phai yeu cau dang nhap. Khong tra cuu duoc bang email/sdt cua nguoi khac).',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    },
  },
  {
    name: 'request_cancel',
    description:
      'Yeu cau huy don hang theo ma don. Chi huy duoc don o trang thai "Cho xac nhan", "Da xac nhan", "Dang chuan bi". Server se tra ve mot MA XAC NHAN. Ban phai huong dan khach doc ma xac nhan do. Sau do dung tool confirm_cancel.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        order_code: { type: Type.STRING, description: 'Ma don can huy, vd DH1024.' },
        reason: { type: Type.STRING, description: 'Ly do huy don.' },
      },
      required: ['order_code'],
    },
  },
  {
    name: 'confirm_cancel',
    description: 'Xac nhan huy don hang bang MA XAC NHAN da nhan duoc tu request_cancel.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        token: { type: Type.STRING, description: 'Ma xac nhan huy don (vd: 123456).' },
      },
      required: ['token'],
    },
  },
  {
    name: 'find_cancellable_orders',
    description: 'Tim cac don hang co the huy duoc cua khach hang hien tai (cho xac nhan, da xac nhan, dang chuan bi). (Luu y: phai dang nhap moi xem duoc, neu khach chua dang nhap thi phai yeu cau dang nhap).',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'search_products',
    description:
      'Tim kiem san pham trong cua hang. Dung khi khach hoi ve san pham, gia ca, ton kho, hoac can goi y mua sam.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Tu khoa tim kiem (ten, mo ta, danh muc). Nen de trong neu chi can tim theo category.' },
        category: { type: Type.STRING, description: 'Loc theo danh muc (Điện tử, Gia dụng, Thời trang, Phụ kiện, Làm đẹp).' },
        max_results: { type: Type.NUMBER, description: 'So san pham tra ve (mac dinh 5).' },
        in_stock_only: { type: Type.BOOLEAN, description: 'Chi tra ve san pham con hang (mac dinh la false).' },
      },
    },
  },
  {
    name: 'check_stock',
    description: 'Kiem tra ton kho cua 1 san pham cu the theo ten hoac ma san pham.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        product_name: { type: Type.STRING, description: 'Ten hoac ma san pham can kiem tra.' },
      },
      required: ['product_name'],
    },
  },
  {
    name: 'check_voucher',
    description: 'Kiem tra ma giam gia co hop le khong va giam bao nhieu.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        voucher_code: { type: Type.STRING, description: 'Ma giam gia, vd GIAM10.' },
        order_total: { type: Type.NUMBER, description: 'Tong gia tri don hang de tinh giam.' },
      },
      required: ['voucher_code'],
    },
  },
  {
    name: 'escalate_to_human',
    description:
      'Chuyen tiep cho nhan vien CSKH khi khach yeu cau gap nguoi, khach buc boi, hoac van de vuot kha nang (khieu nai, hoan tien phuc tap, su co).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: { type: Type.STRING, description: 'Ly do can chuyen nhan vien.' },
        summary: { type: Type.STRING, description: 'Tom tat ngan van de cua khach.' },
      },
      required: ['reason'],
    },
  },
];

function summarizeOrder(o) {
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

function summarizeProduct(p) {
  return {
    code: p.code,
    name: p.name,
    category: p.category,
    price: p.price,
    originalPrice: p.originalPrice,
    description: p.description,
    stock: p.stock,
    sold: p.sold,
    rating: p.rating,
    reviews: p.reviews,
    image: p.image,
    tags: p.tags,
  };
}

export const executors = {
  async search_knowledge_base({ query }) {
    const results = await searchKnowledgeBase(query, 3);
    if (results[0]) faqStore.incrementHit(results[0].id);
    return {
      found: results.length > 0,
      results: results.map((r) => ({ question: r.question, answer: r.answer, category: r.category })),
    };
  },

  async lookup_order({ order_code }, customerContext) {
    if (!customerContext) {
      return { found: false, message: `[BAO MAT] Vui long dang nhap vao he thong de xem chi tiet don hang cua ban.` };
    }
    const order = orderStore.byCode(order_code);
    if (!order) return { found: false, message: `Khong tim thay don ${order_code}.` };
    
    const isOwner = order.customerId === customerContext.id || (order.email && order.email.toLowerCase() === customerContext.email.toLowerCase());
    if (!isOwner) {
      return { found: false, message: `[BAO MAT] Don hang ${order_code} khong thuoc tai khoan cua ban. Ban khong duoc phep xem.` };
    }
    
    return { found: true, order: summarizeOrder(order) };
  },

  async find_orders_by_contact({}, customerContext) {
    if (!customerContext) {
      return { found: false, message: `[BAO MAT] Vui long dang nhap vao he thong de tra cuu danh sach don hang.` };
    }
    // Chi tra ve don hang cua chinh tai khoan dang dang nhap, bao gom ca fallback qua email cho data seed
    let list = orderStore.byCustomer(customerContext.id);
    const byEmail = orderStore.byCustomerEmail(customerContext.email);
    const existingIds = new Set(list.map(o => o.id));
    for (const o of byEmail) {
      if (!existingIds.has(o.id)) list.push(o);
    }
    return { found: list.length > 0, count: list.length, orders: list.map(summarizeOrder) };
  },

  async request_cancel({ order_code, reason }, customerContext) {
    if (!customerContext) {
      return { success: false, message: `[BAO MAT] Vui long dang nhap de huy don hang.` };
    }
    const order = orderStore.byCode(order_code);
    if (!order) return { success: false, message: `Khong tim thay don ${order_code}.` };
    
    const isOwner = order.customerId === customerContext.id || (order.email && order.email.toLowerCase() === customerContext.email.toLowerCase());
    if (!isOwner) {
      return { success: false, message: `[BAO MAT] Ban khong co quyen huy don hang cua nguoi khac.` };
    }

    const cancellable = ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'];
    if (!cancellable.includes(order.status)) {
      return { success: false, message: `Đơn đang ở trạng thái "${order.status}", không thể hủy.` };
    }

    // Generate token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    cancelTokens.set(token, { order_code, reason, customerId: customerContext.id });
    
    // Auto expire token after 5 minutes
    setTimeout(() => cancelTokens.delete(token), 5 * 60 * 1000);

    return { 
      success: true, 
      token, 
      message: `He thong da tao ma xac nhan: ${token}. Hay hien thi ma nay va yeu cau khach hang tra loi chinh xac ma de xac nhan viec huy don hang.` 
    };
  },

  async confirm_cancel({ token }, customerContext) {
    if (!customerContext) return { success: false, message: '[BAO MAT] Chua dang nhap.' };
    
    const pending = cancelTokens.get(token);
    if (!pending) {
      return { success: false, message: 'Ma xac nhan khong hop le hoac da het han.' };
    }
    if (pending.customerId !== customerContext.id) {
      return { success: false, message: 'Ma xac nhan khong thuoc ve tai khoan nay.' };
    }

    const result = orderStore.cancelOrder(pending.order_code, pending.reason || 'Khách yêu cầu hủy qua chat');
    cancelTokens.delete(token);

    if (result.success) {
      return {
        success: true,
        message: `Huy thanh cong don hang ${pending.order_code}. So tien (neu co) va ton kho da duoc hoan lai.`,
      };
    }
    return { success: false, message: result.message };
  },

  async find_cancellable_orders({}, customerContext) {
    if (!customerContext) {
      return { found: false, message: '[BAO MAT] Vui long dang nhap de xem cac don hang co the huy.' };
    }
    // Chi tra ve cac don hang cua KH dang dang nhap
    let allOrders = orderStore.byCustomer(customerContext.id);
    const byEmail = orderStore.byCustomerEmail(customerContext.email);
    const existingIds = new Set(allOrders.map(o => o.id));
    for (const o of byEmail) {
      if (!existingIds.has(o.id)) allOrders.push(o);
    }
    const list = allOrders.filter(o => ['Chờ xác nhận', 'Đã xác nhận', 'Đang chuẩn bị'].includes(o.status));
    return { found: list.length > 0, count: list.length, orders: list.map(summarizeOrder) };
  },

  async search_products({ query, category, max_results, in_stock_only }) {
    const limit = Math.min(max_results || 5, 8);
    const results = await searchProductsSemantic({
      query: query || '',
      category: category || undefined,
      inStock: in_stock_only === true,
    }, limit);
    return {
      found: results.length > 0,
      count: results.length,
      products: results.slice(0, limit).map(summarizeProduct),
    };
  },

  async check_stock({ product_name }) {
    const qRaw = (product_name || '').toLowerCase();
    const qNorm = normalizeVi(product_name);
    const allProducts = productStore.all();
    const match = allProducts.find(
      (p) =>
        p.name.toLowerCase().includes(qRaw) ||
        normalizeVi(p.name).includes(qNorm) ||
        p.code.toLowerCase() === qRaw
    );
    if (!match) return { found: false, message: `Khong tim thay san pham "${product_name}".` };
    return {
      found: true,
      product: match.name,
      code: match.code,
      stock: match.stock,
      available: match.stock > 0,
      message: match.stock > 0
        ? `${match.name} con ${match.stock} san pham trong kho.`
        : `${match.name} hien da het hang.`,
    };
  },

  async check_voucher({ voucher_code, order_total }) {
    const result = voucherStore.apply(voucher_code, order_total || 0);
    if (result.valid) {
      return {
        valid: true,
        code: voucher_code,
        discount: result.discount,
        description: result.description,
        message: `Ma ${voucher_code} hop le. ${result.description}. Giam ${result.discount.toLocaleString('vi-VN')}d.`,
      };
    }
    return { valid: false, message: result.message };
  },

  async escalate_to_human({ reason, summary }) {
    return {
      escalated: true,
      reason: reason || 'Khach yeu cau ho tro tu nhan vien',
      summary: summary || '',
      message: 'Da ghi nhan. He thong se chuyen cuoc tro chuyen cho nhan vien CSKH.',
    };
  },
};
