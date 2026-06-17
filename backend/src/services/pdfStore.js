import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
import { faqStore } from '../db/store.js';
import { syncEmbeddings } from './embeddingStore.js';

// Chunk text by paragraphs/sentences (roughly 200-400 chars)
function chunkText(text, maxLen = 300) {
  const chunks = [];
  let currentChunk = '';
  const sentences = text.replace(/\n/g, ' ').split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > maxLen) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

export async function processPdfToFaqs(filePath, category = 'Chính sách (PDF)') {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    await parser.destroy();
    
    // Chunk the extracted text
    const textChunks = chunkText(data.text);
    const addedFaqs = [];

    // Map each chunk to a FAQ entry (pseudo QA format for RAG)
    for (let i = 0; i < textChunks.length; i++) {
      const content = textChunks[i];
      if (content.length < 20) continue; // Skip very small chunks

      // We use the first few words as a "question" summary for the UI
      const shortDesc = content.split(' ').slice(0, 10).join(' ') + '...';
      
      const newFaq = faqStore.create({
        category,
        question: `Chi tiết chính sách (Mục ${i + 1}): ${shortDesc}`,
        answer: content
      });
      addedFaqs.push(newFaq);
    }

    // Sync embeddings so the AI can immediately search the new chunks
    if (addedFaqs.length > 0) {
      syncEmbeddings();
    }

    return {
      success: true,
      pages: data.total || 1,
      chunksAdded: addedFaqs.length
    };
  } catch (error) {
    console.error('[pdfStore] Error parsing PDF:', error);
    return { success: false, error: error.message };
  }
}
