import { env, pipeline, AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@xenova/transformers';
import { productStore } from '../db/store.js';

// Cau hinh model chay local thay vi goi API
env.allowLocalModels = false; // Van tai tu HuggingFace xuong cache local
env.useBrowserCache = false; // Node.js k xai browser cache

let visionModel = null;
let processor = null;
let isReady = false;

// Ham tinh khoang cach Cosine
function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export async function initClipStore() {
  try {
    console.log('[clip] Đang tải mô hình CLIP-ViT-Base-Patch32 (có thể mất vài phút lần đầu)...');
    const model_id = 'Xenova/clip-vit-base-patch32';
    
    // Load processor va model
    processor = await AutoProcessor.from_pretrained(model_id);
    visionModel = await CLIPVisionModelWithProjection.from_pretrained(model_id);
    
    console.log('[clip] Tải mô hình thành công. Bắt đầu embedding các ảnh sản phẩm...');
    
    // Embed toan bo san pham
    const products = productStore.all();
    let embeddedCount = 0;

    for (const p of products) {
      if (!p.image) continue;
      try {
        // Doc anh tu URL (do du an dang xai link Unsplash)
        const image = await RawImage.fromURL(p.image);
        const inputs = await processor(image);
        const { image_embeds } = await visionModel(inputs);
        
        // Luu vector embedding (array 512 chieu) vao product
        p.clipEmbedding = Array.from(image_embeds.data);
        embeddedCount++;
      } catch (err) {
        console.warn(`[clip] Lỗi khi embed ảnh sản phẩm ${p.code}:`, err.message);
      }
    }

    isReady = true;
    console.log(`[clip] Đã embed thành công ${embeddedCount} ảnh sản phẩm. Hệ thống Image Vector Search: BẬT.`);
  } catch (error) {
    console.error('[clip] Khởi tạo CLIP thất bại:', error);
  }
}

export async function searchByImageBuffer(base64Buffer, topK = 3) {
  if (!isReady) return [];
  try {
    // base64Buffer la Buffer chua du lieu anh
    // RawImage.fromBlob(new Blob([buffer])) hoac dung thu vien jimp, 
    // nhung Xenova co the doc thang tu canvas hoac blob. 
    // Trong Node.js, RawImage co the kho doc Buffer thang, nen ta convert base64 thanh data uri.
    
    const base64Str = base64Buffer.toString('base64');
    // Binh thuong nen nhan ca mimeType, o day hardcode cho lẹ neu cần
    // Nhung de an toan nhat, truyen thang image Data URI vao:
    const dataUri = `data:image/jpeg;base64,${base64Str}`;
    
    const image = await RawImage.fromURL(dataUri);
    const inputs = await processor(image);
    const { image_embeds } = await visionModel(inputs);
    
    const queryVector = Array.from(image_embeds.data);
    
    // Quet qua vector database (mang products)
    const results = [];
    const products = productStore.all();
    for (const p of products) {
      if (p.clipEmbedding) {
        const score = cosineSimilarity(queryVector, p.clipEmbedding);
        results.push({ ...p, score });
      }
    }
    
    // Sort giam dan theo do tuong dong
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  } catch (error) {
    console.error('[clip] Lỗi khi tìm kiếm ảnh:', error);
    return [];
  }
}
