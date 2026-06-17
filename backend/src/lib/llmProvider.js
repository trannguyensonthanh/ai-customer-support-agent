import { ai } from './gemini.js';
import { config } from '../config/env.js';
import { getLlmSettings } from '../config/llmSettings.js';

// Convert Gemini history to Ollama format
function convertToOllamaMessages(contents, systemInstruction) {
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  for (const msg of contents) {
    const role = msg.role === 'model' ? 'assistant' : 'user';
    let text = '';
    
    if (msg.parts) {
      for (const p of msg.parts) {
        if (p.text) text += p.text + '\n';
        if (p.functionCall) {
          text += `[System Note: AI da goi cong cu ${p.functionCall.name}]\n`;
        }
        if (p.functionResponse) {
          text += `[System Note: Ket qua cong cu ${p.functionResponse.name}: ${JSON.stringify(p.functionResponse.response)}]\n`;
        }
      }
    } else if (msg.functionCall) {
       text += `[System Note: AI da goi cong cu ${msg.functionCall.name}]\n`;
    }
    
    if (text.trim()) {
      messages.push({ role, content: text.trim() });
    }
  }
  return messages;
}

// Convert Gemini tools to Ollama tools
function convertToOllamaTools(geminiFunctionDeclarations) {
  if (!geminiFunctionDeclarations || geminiFunctionDeclarations.length === 0) return undefined;
  return geminiFunctionDeclarations.map(fn => ({
    type: 'function',
    function: {
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters
    }
  }));
}

export async function generateContentStreamProvider({ contents, config: genConfig }) {
  const settings = getLlmSettings();

  async function callOllama() {
    const messages = convertToOllamaMessages(contents, genConfig.systemInstruction);
    const tools = genConfig.tools && genConfig.tools[0] ? convertToOllamaTools(genConfig.tools[0].functionDeclarations) : undefined;
    
    try {
      const response = await fetch(`${settings.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollamaModel,
          messages,
          tools,
          stream: true,
          options: {
            temperature: genConfig.temperature || 0.4
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      async function* parseOllamaStream() {
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        
        for await (const chunk of response.body) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); 
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.message) {
                 const out = {};
                 if (data.message.content) out.text = data.message.content;
                 if (data.message.tool_calls) {
                   out.functionCalls = data.message.tool_calls.map(tc => ({
                     name: tc.function.name,
                     args: tc.function.arguments
                   }));
                 }
                 yield out;
              }
            } catch(e) {}
          }
        }
      }

      return parseOllamaStream();
    } catch (err) {
      console.error('[Ollama] Loi goi local LLM:', err.message);
      async function* errorGen() {
        yield { text: `[HỆ THỐNG] Xin lỗi, AI hiện đang gặp sự cố kết nối. Vui lòng thử lại sau.` };
      }
      return errorGen();
    }
  }

  if (settings.provider === 'gemini') {
    try {
      return await ai.models.generateContentStream({
        model: config.model,
        contents,
        config: genConfig,
      });
    } catch (err) {
      console.warn('[Gemini] Loi goi API (co the het token):', err.message);
      console.warn('[Gemini] -> FALLBACK: Tu dong chuyen sang Local LLM (Ollama).');
      return callOllama();
    }
  } else {
    return callOllama();
  }
}

export async function generateContentProvider({ contents, config: genConfig }) {
  const settings = getLlmSettings();

  async function callOllama() {
    const messages = convertToOllamaMessages(contents, genConfig.systemInstruction);
    const tools = genConfig.tools && genConfig.tools[0] ? convertToOllamaTools(genConfig.tools[0].functionDeclarations) : undefined;
    
    try {
      const response = await fetch(`${settings.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollamaModel,
          messages,
          tools,
          stream: false,
          options: {
            temperature: genConfig.temperature || 0.4
          }
        })
      });

      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
      const data = await response.json();
      
      const out = { text: data.message.content || '' };
      if (data.message.tool_calls) {
        out.functionCalls = data.message.tool_calls.map(tc => ({
          name: tc.function.name,
          args: tc.function.arguments
        }));
      }
      return out;
    } catch (err) {
      console.error('[Ollama] Loi goi local LLM:', err.message);
      return { text: '[HỆ THỐNG] Không thể kết nối đến AI.' };
    }
  }

  if (settings.provider === 'gemini') {
    try {
      return await ai.models.generateContent({
        model: config.model,
        contents,
        config: genConfig,
      });
    } catch (err) {
      console.warn('[Gemini] Loi goi API:', err.message);
      console.warn('[Gemini] -> FALLBACK: Tu dong chuyen sang Local LLM (Ollama).');
      return callOllama();
    }
  } else {
    return callOllama();
  }
}

export async function embedContentProvider(text) {
  const settings = getLlmSettings();

  async function callOllama() {
    try {
      const response = await fetch(`${settings.ollamaUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollamaEmbedModel,
          prompt: text,
        })
      });
      if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);
      const data = await response.json();
      return data.embedding;
    } catch (err) {
      console.error('[Ollama] Loi tao embedding:', err.message);
      return Array(768).fill(0);
    }
  }

  if (settings.provider === 'gemini') {
    try {
      const result = await ai.models.embedContent({
        model: config.embedModel,
        contents: text,
      });
      return result.embeddings[0].values;
    } catch (err) {
      console.warn('[Gemini] Loi tao embedding:', err.message);
      console.warn('[Gemini] -> FALLBACK: Tu dong chuyen sang Local LLM (Ollama).');
      return callOllama();
    }
  } else {
    return callOllama();
  }
}
