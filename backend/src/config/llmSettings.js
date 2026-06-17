import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join('.data', 'llm_settings.json');

const defaultSettings = {
  provider: 'gemini', // 'gemini' | 'ollama'
  ollamaUrl: 'http://127.0.0.1:11434',
  ollamaModel: 'qwen3:8b', // Model chat tieng Viet tot
  ollamaEmbedModel: 'nomic-embed-text', // Model embedding
};

export function getLlmSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Loi doc llm_settings:', e.message);
  }
  return defaultSettings;
}

export function saveLlmSettings(newSettings) {
  const current = getLlmSettings();
  const merged = { ...current, ...newSettings };
  if (!fs.existsSync('.data')) fs.mkdirSync('.data', { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2));
  return merged;
}
