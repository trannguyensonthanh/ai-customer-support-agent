import { Type } from '@google/genai';
import { orderStore, faqStore, productStore, voucherStore, normalizeVi } from '../db/store.js';
import { searchKnowledgeBase } from '../services/embeddingStore.js';

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
    description: 'Tim cac don hang theo email hoac so dien thoai khi khach khong nho ma don.',
    parameters: {
      type: Type.OBJECT,
      properties: { contact: { type: Type.STRING, description: 'Email hoac SDT.' } },
      required: ['contact'],
    },
  },
  {
    name: 'cancel_order',
    description:
      'Huy don hang theo ma don. Chi huy duoc don o trang thai "Cho xac nhan", "Da xac nhan", "Dang chuan bi". Don "Dang giao" hoac "Da giao" khong the huy.',
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
    name: 'search_products',
    description:
      'Tim kiem san pham trong cua hang. Dung khi khach hoi ve san pham, gia ca, ton kho, hoac can goi y mua sam.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Tu khoa tim kiem (ten, mo ta, danh muc).' },
        category: { type: Type.STRING, description: 'Loc theo danh muc (Dien tu, Gia dung, Thoi trang, Phu kien, Lam dep).' },
        max_results: { type: Type.NUMBER, description: 'So san pham tra ve (mac dinh 5).' },
      },
      required: ['query'],
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

  async lookup_order({ order_code }) {
    const order = orderStore.byCode(order_code);
    if (!order) return { found: false, message: `Khong tim thay don ${order_code}.` };
    return { found: true, order: summarizeOrder(order) };
  },

  async find_orders_by_contact({ contact }) {
    const list = orderStore.byContact(contact);
    return { found: list.length > 0, count: list.length, orders: list.map(summarizeOrder) };
  },

  async cancel_order({ order_code, reason }) {
    const result = orderStore.cancelOrder(order_code, reason || 'Khách yêu cầu hủy qua chat');
    if (result.success) {
      return {
        success: true,
        message: result.message,
        order: result.order ? summarizeOrder(result.order) : null,
      };
    }
    return { success: false, message: result.message };
  },

  async search_products({ query, category, max_results }) {
    const limit = Math.min(max_results || 5, 8);
    const results = productStore.search({
      query: query || '',
      category: category || undefined,
      inStock: true,
    });
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
