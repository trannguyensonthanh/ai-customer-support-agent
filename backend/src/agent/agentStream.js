import { config } from '../config/env.js';
import { buildSystemInstruction, SUMMARY_PROMPT } from './systemPrompt.js';
import { functionDeclarations, executors } from './tools.js';
import { generateContentProvider, generateContentStreamProvider } from '../lib/llmProvider.js';
import { analyzeSentiment } from '../services/sentimentService.js';
import { searchByImageBuffer } from '../services/clipStore.js';
import { productStore, orderStore } from '../db/store.js';

const MAX_STEPS = 6;
const CONFIDENCE_THRESHOLD = 50; // Duoi nguong nay -> tu dong escalate

// Parse confidence score tu response
function parseConfidence(text) {
  const match = text.match(/<!--CONFIDENCE:(\d+)-->/);
  return match ? parseInt(match[1], 10) : 80; // mac dinh 80 neu khong co
}

// Parse follow-up suggestions tu response
function parseFollowUps(text) {
  const match = text.match(/<!--FOLLOWUPS:(\[.*?\])-->/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {
      return [];
    }
  }
  return [];
}

// Xoa cac tag an khoi response truoc khi gui cho khach
function cleanResponse(text) {
  return text
    .replace(/<!--CONFIDENCE:\d+-->/g, '')
    .replace(/<!--FOLLOWUPS:\[.*?\]-->/g, '')
    .trim();
}

// Tao tom tat hoi thoai khi escalation
async function generateConversationSummary(history) {
  try {
    // Lay 10 tin nhan gan nhat
    const recentMessages = history.slice(-10);
    const chatText = recentMessages
      .map((msg) => {
        const role = msg.role === 'user' ? 'Khách' : 'AI';
        const text = (msg.parts || []).map((p) => p.text || '').filter(Boolean).join(' ');
        return text ? `${role}: ${text}` : '';
      })
      .filter(Boolean)
      .join('\n');

    if (!chatText) return null;

    const response = await generateContentProvider({
      contents: [{ role: 'user', parts: [{ text: chatText }] }],
      config: {
        systemInstruction: SUMMARY_PROMPT,
        temperature: 0.3,
      },
    });

    return response.text || null;
  } catch (err) {
    console.warn('[summary] Khong tao duoc tom tat:', err.message);
    return null;
  }
}

export async function runAgentStream({
  history,
  userMessage,
  images = [],
  language = 'vi',
  customerContext = null,
  emit,
}) {
  const sentiment = analyzeSentiment(userMessage);

  // Tin nhan cua khach
  const userParts = [{ text: userMessage }];
  let visualSearchResults = null;

  for (const img of images) {
    if (img?.data && img?.mimeType) {
      try {
        const buffer = Buffer.from(img.data, 'base64');
        visualSearchResults = await searchByImageBuffer(buffer, 3);
      } catch (err) {
        console.error('[vision] Loi khi search by image:', err.message);
      }
      userParts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    }
  }

  if (visualSearchResults && visualSearchResults.length > 0) {
    const productsInfo = visualSearchResults.map(p => `- ${p.code} | ${p.name} (Độ tương đồng: ${Math.round(p.score * 100)}%) | Giá: ${p.price} | Tồn kho: ${p.stock}`).join('\n');
    userParts.push({ text: `[SYSTEM: Công cụ CLIP Vector Search đã quét ảnh của khách và tìm thấy các sản phẩm tương đồng nhất trong Database:\n${productsInfo}\nHãy dựa vào danh sách này để giới thiệu cho khách.]` });
    emit('products', { products: visualSearchResults }); // Phat luon cho UI
  }

  history.push({ role: 'user', parts: userParts });

  let escalated = false;
  let escalationInfo = null;
  let conversationSummary = null;
  const toolsUsed = [];

  for (let step = 0; step < MAX_STEPS; step++) {
    const stream = await generateContentStreamProvider({
      contents: history,
      config: {
        systemInstruction: buildSystemInstruction(language, customerContext),
        temperature: 0.4,
        tools: [{ functionDeclarations }],
      },
    });

    const calls = [];
    const callParts = [];
    let fullText = '';

    for await (const chunk of stream) {
      // Trích xuất thủ công từ parts để tránh cảnh báo "there are non-text parts" của Gemini SDK
      let delta = '';
      if (chunk.candidates?.[0]?.content?.parts) {
        for (const p of chunk.candidates[0].content.parts) {
          if (p.text) {
            delta += p.text;
          }
          if (p.functionCall) {
            calls.push(p.functionCall);
            callParts.push(p);
          }
        }
      }

      if (delta) {
        fullText += delta;
        // Stream text nhung bo cac tag an
        const cleanDelta = delta
          .replace(/<!--CONFIDENCE:\d+-->/g, '')
          .replace(/<!--FOLLOWUPS:\[.*?\]-->/g, '');
        if (cleanDelta) {
          emit('delta', { text: cleanDelta });
        }
      }
    }

    if (calls.length > 0) {
      history.push({
        role: 'model',
        parts: callParts,
      });

      const responseParts = [];
      for (const call of calls) {
        console.log(`[agentStream] Tool call: ${call.name}`, JSON.stringify(call.args));
        toolsUsed.push(call.name);
        emit('tool', { name: call.name });

        const exec = executors[call.name];
        let result;
        try {
          result = exec
            ? await exec(call.args || {}, customerContext)
            : { error: `Khong co cong cu ${call.name}` };
        } catch (err) {
          result = { error: err.message };
        }

        // Phat du lieu don hang
        if (call.name === 'lookup_order' && result.found && result.order) {
          emit('order', { orders: [result.order] });
        }
        if ((call.name === 'find_orders_by_contact' || call.name === 'find_cancellable_orders') && result.found && Array.isArray(result.orders) && result.orders.length) {
          emit('order', { orders: result.orders });
        }
        // Phat du lieu san pham
        if (call.name === 'search_products' && result.found && Array.isArray(result.products)) {
          emit('products', { products: result.products });
        }
        // Cancel order result
        if (call.name === 'cancel_order') {
          emit('action_result', { action: 'cancel_order', ...result });
        }
        // Escalation
        if (call.name === 'escalate_to_human' && result.escalated) {
          escalated = true;
          escalationInfo = { reason: result.reason, summary: result.summary };
          emit('escalated', escalationInfo);
        }

        responseParts.push({
          functionResponse: { name: call.name, response: result },
        });
      }

      history.push({ role: 'user', parts: responseParts });
      continue;
    }

    // Parse confidence va follow-ups tu response
    const confidence = parseConfidence(fullText);
    const followUps = parseFollowUps(fullText);
    const cleanText = cleanResponse(fullText);

    // --- GROUNDING SELF-CHECK ---
    let correctionText = '';
    const codeRegex = /\b(?:SP|PK|GD|TT|LD|DH)\d{3,}\b/g;
    const matches = cleanText.match(codeRegex);
    if (matches) {
      for (const code of new Set(matches)) {
        if (code.startsWith('DH')) {
          if (!orderStore.byCode(code)) correctionText += `\n- Mã đơn hàng ${code} không tồn tại trong hệ thống.`;
        } else {
          if (!productStore.byCode(code)) correctionText += `\n- Mã sản phẩm ${code} không tồn tại trong hệ thống.`;
        }
      }
    }

    let finalText = cleanText;
    if (correctionText) {
      const msg = `\n\n[Hệ thống tự động kiểm chứng]: Trợ lý AI vừa đề cập đến thông tin chưa chính xác:${correctionText}\nXin lỗi quý khách vì sự nhầm lẫn này.`;
      emit('delta', { text: msg });
      finalText += msg;
    }

    // Luu vao history (text da lam sach + dinh chinh neu co)
    history.push({ role: 'model', parts: [{ text: finalText }] });

    // Gui follow-ups cho frontend
    if (followUps.length > 0) {
      emit('follow_ups', { suggestions: followUps });
    }

    // Gui confidence cho frontend (de hien thi indicator neu can)
    emit('confidence', { score: confidence });

    // Proactive Escalation fallback (ngoài việc AI tự gọi tool)
    if (!escalated && (confidence < CONFIDENCE_THRESHOLD || sentiment.wantsHuman || sentiment.label === 'angry')) {
      escalated = true;
      escalationInfo = { 
        reason: sentiment.wantsHuman ? 'Khách yêu cầu gặp nhân viên' : 
               (sentiment.label === 'angry' ? 'Khách hàng bức xúc' : 'AI độ tự tin thấp') 
      };
      emit('delta', { text: '\n\n[Hệ thống] Nhận thấy vấn đề cần hỗ trợ chuyên sâu, hệ thống đang kết nối bạn với nhân viên CSKH...' });
      emit('escalated', escalationInfo);
    }

    // Tao summary khi escalation
    if (escalated) {
      conversationSummary = await generateConversationSummary(history);
    }

    emit('done', { sentiment, toolsUsed, escalated, confidence });
    return { escalated, escalationInfo, sentiment, toolsUsed, conversationSummary };
  }

  // Vuot so buoc xu ly
  emit('delta', {
    text: '\nMình sẽ kết nối bạn với nhân viên hỗ trợ để được giúp tốt hơn nhé.',
  });
  escalated = true;
  escalationInfo = { reason: 'Vượt số bước xử lý tự động' };
  conversationSummary = await generateConversationSummary(history);
  emit('escalated', { reason: 'Vượt số bước xử lý tự động' });
  emit('done', { sentiment, toolsUsed, escalated: true });
  return { escalated: true, escalationInfo, sentiment, toolsUsed, conversationSummary };
}
