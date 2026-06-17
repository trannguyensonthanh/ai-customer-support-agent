import { ai } from '../lib/gemini.js';
import { config } from '../config/env.js';
import { systemInstruction } from './systemPrompt.js';
import { functionDeclarations, executors } from './tools.js';
import { analyzeSentiment } from '../services/sentimentService.js';

const MAX_STEPS = 5; // tranh vong lap goi tool vo han

// Chay 1 luot hoi-dap cua Agent.
// `history` la mang content theo dinh dang Gemini (duoc luu o session store).
export async function runAgent({ history, userMessage }) {
  const sentiment = analyzeSentiment(userMessage);

  // Them tin nhan moi cua khach vao lich su.
  history.push({ role: 'user', parts: [{ text: userMessage }] });

  let escalated = false;
  let escalationInfo = null;
  let reply = '';
  const toolsUsed = [];

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await ai.models.generateContent({
      model: config.model,
      contents: history,
      config: {
        systemInstruction,
        temperature: 0.4,
        tools: [{ functionDeclarations }],
      },
    });

    const calls = response.functionCalls || [];
    const modelContent = response.candidates?.[0]?.content;

    // Luu luot tra loi cua model (co the chua text hoac functionCall).
    if (modelContent) history.push(modelContent);

    if (calls.length > 0) {
      const responseParts = [];
      for (const call of calls) {
        toolsUsed.push(call.name);
        const exec = executors[call.name];
        let result;
        try {
          result = exec
            ? await exec(call.args || {})
            : { error: `Khong co cong cu ten ${call.name}` };
        } catch (err) {
          result = { error: err.message };
        }
        if (call.name === 'escalate_to_human' && result.escalated) {
          escalated = true;
          escalationInfo = { reason: result.reason, summary: result.summary };
        }
        responseParts.push({
          functionResponse: { name: call.name, response: result },
        });
      }
      // Gui ket qua tool lai cho model de no viet cau tra loi cuoi.
      history.push({ role: 'user', parts: responseParts });
      continue;
    }

    // Khong goi tool nua -> day la cau tra loi cuoi cung.
    reply = response.text || '';
    break;
  }

  if (!reply) {
    reply =
      'Xin lỗi bạn, mình chưa xử lý được yêu cầu này. Mình sẽ kết nối bạn với nhân viên hỗ trợ nhé.';
    escalated = true;
  }

  return { reply, escalated, escalationInfo, sentiment, toolsUsed };
}
