import { ai } from '../lib/gemini.js';
import { config } from '../config/env.js';
import { faqStore, productStore } from '../db/store.js';
import { embedContentProvider } from '../lib/llmProvider.js';

// RAG dua tren FAQ luu trong CSDL. Embedding duoc luu kem moi FAQ.
// Khi admin them/sua FAQ -> embedding bi xoa -> tu dong embed lai o lan tim toi.

let ready = false;

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

async function embed(text) {
  return await embedContentProvider(text);
}

// Embed nhung FAQ chua co vector (goi luc khoi dong + sau khi admin sua).
export async function syncEmbeddings() {
  try {
    const faqs = faqStore.list();
    let embedded = 0;
    for (const f of faqs) {
      if (!f.embedding) {
        const v = await embed(`${f.question}\n${f.answer}`);
        faqStore.setEmbedding(f.id, v);
        embedded++;
      }
    }
    ready = true;
    if (embedded) console.log(`[rag] Da embed them ${embedded} FAQ. Tim ngu nghia: BAT.`);
    else console.log('[rag] FAQ da co embedding. Tim ngu nghia: BAT.');
  } catch (err) {
    ready = false;
    console.warn(`[rag] Khong embed duoc (${err.message}). Dung tim tu khoa.`);
  }
}

// Tokenize & normalize
function tokenize(text) {
  const t = String(text).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // bo dau TV
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return t;
}

// BM25 implementation
function calculateBM25Scores(queryTokens, docs) {
  const N = docs.length;
  const k1 = 1.2;
  const b = 0.75;
  
  // Compute doc lengths and frequencies
  let totalLen = 0;
  const docTokens = docs.map(d => {
    const tokens = tokenize(`${d.question} ${d.answer} ${d.category}`);
    totalLen += tokens.length;
    
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    return { id: d.id, tokens, tf, len: tokens.length };
  });
  
  const avgdl = totalLen / (N || 1);
  
  // Document frequency for each query term
  const df = {};
  queryTokens.forEach(qt => {
    df[qt] = docTokens.filter(dt => dt.tf[qt]).length;
  });
  
  // IDF
  const idf = {};
  queryTokens.forEach(qt => {
    const n = df[qt] || 0;
    idf[qt] = Math.log((N - n + 0.5) / (n + 0.5) + 1);
  });
  
  // Score
  return docTokens.map(dt => {
    let score = 0;
    queryTokens.forEach(qt => {
      const f = dt.tf[qt] || 0;
      if (f > 0) {
        score += idf[qt] * (f * (k1 + 1)) / (f + k1 * (1 - b + b * (dt.len / avgdl)));
      }
    });
    return { doc: docs.find(d => d.id === dt.id), bm25Score: score };
  });
}

function bm25Search(query, topK) {
  const faqs = faqStore.list();
  const tokens = tokenize(query);
  const scored = calculateBM25Scores(tokens, faqs);
  return scored
    .filter(s => s.bm25Score > 0)
    .sort((a, b) => b.bm25Score - a.bm25Score)
    .slice(0, topK)
    .map(s => s.doc);
}

// Hybrid Search using Reciprocal Rank Fusion (RRF)
export async function searchKnowledgeBase(query, topK = 3) {
  const faqs = faqStore.list();
  if (faqs.length === 0) return [];

  const haveVectors = ready && faqs.every((f) => f.embedding);
  if (!haveVectors) {
    console.log('[rag] Thieu vectors, dung BM25 thuan tuy');
    return bm25Search(query, topK);
  }

  try {
    const tokens = tokenize(query);
    // 1. Diem BM25
    let bm25Results = calculateBM25Scores(tokens, faqs);
    bm25Results.sort((a, b) => b.bm25Score - a.bm25Score);
    
    // 2. Diem Embedding (Cosine Similarity)
    const qv = await embed(query);
    let vectorResults = faqs.map((f) => ({ doc: f, vectorScore: cosine(qv, f.embedding) }));
    vectorResults.sort((a, b) => b.vectorScore - a.vectorScore);

    // 3. Reciprocal Rank Fusion (RRF)
    const k = 60;
    const scores = new Map(); // docId -> rrf score

    bm25Results.forEach((r, rank) => {
      scores.set(r.doc.id, (scores.get(r.doc.id) || 0) + 1 / (k + rank + 1));
    });

    vectorResults.forEach((r, rank) => {
      scores.set(r.doc.id, (scores.get(r.doc.id) || 0) + 1 / (k + rank + 1));
    });

    // Sort by RRF score
    return faqs
      .map(f => ({ f, score: scores.get(f.id) || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.f);

  } catch (err) {
    console.warn(`[rag] Loi hybrid search, chuyen sang BM25: ${err.message}`);
    return bm25Search(query, topK);
  }
}

export function isKnowledgeBaseReady() {
  return ready;
}

// ====== SEMANTIC PRODUCT SEARCH ======
export async function syncProductEmbeddings() {
  try {
    const products = productStore.all();
    let embedded = 0;
    for (const p of products) {
      if (!p.embedding) {
        const text = `${p.name}\n${p.description}\n${p.specs || ''}\n${(p.tags || []).join(', ')}`;
        const v = await embed(text);
        productStore.update(p.id, { embedding: v });
        embedded++;
      }
    }
    if (embedded) console.log(`[rag] Da embed them ${embedded} san pham. RAG San pham: BAT.`);
  } catch (err) {
    console.warn(`[rag] Loi embed san pham: ${err.message}`);
  }
}

export async function searchProductsSemantic({ query, category, minPrice, maxPrice, inStock }, topK = 5) {
  let products = productStore.all();
  
  // 1. Áp dụng các filter cứng trước
  // 1. Áp dụng các filter cứng trước
  if (category) {
    const validCategories = ['điện tử', 'gia dụng', 'thời trang', 'phụ kiện', 'làm đẹp'];
    const normalizeCat = (c) => c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const catNorm = normalizeCat(category);
    
    // Tìm category chuẩn tương ứng
    const matchedCategory = validCategories.find(c => normalizeCat(c) === catNorm);
    
    if (matchedCategory) {
      products = products.filter(p => normalizeCat(p.category) === catNorm);
    } else {
      query = (query ? query + ' ' : '') + category; // Nếu AI bịa category, gom chung vào query để tìm ngữ nghĩa
    }
  }
  if (minPrice != null) products = products.filter(p => p.price >= minPrice);
  if (maxPrice != null) products = products.filter(p => p.price <= maxPrice);
  if (inStock) products = products.filter(p => p.stock > 0);

  if (!query || !query.trim()) {
    // Nếu không có query ngữ nghĩa, chỉ trả về theo filter (sort ngẫu nhiên hoặc mặc định)
    return products.slice(0, topK);
  }

  // 2. Nếu có query, nhúng câu query và tính Cosine Similarity
  try {
    const qv = await embed(query);
    const scored = products.map(p => {
      let score = 0;
      if (p.embedding) {
        score = cosine(qv, p.embedding);
      } else {
        // Fallback BM25/keyword nếu sản phẩm lỡ mất embedding
        const tokens = tokenize(query);
        const nameDesc = (p.name + " " + p.description).toLowerCase();
        score = tokens.filter(t => nameDesc.includes(t)).length * 0.1; 
      }
      return { p, score };
    });

    // Lọc bỏ kết quả quá rác (score < 0.2)
    return scored
      .filter(s => s.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.p);
  } catch (err) {
    console.warn(`[rag] Lỗi semantic search sản phẩm, fallback keyword: ${err.message}`);
    // Fallback sang keyword search
    return productStore.search({ query, category, minPrice, maxPrice, inStock }).slice(0, topK);
  }
}
