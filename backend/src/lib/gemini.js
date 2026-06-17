import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';

// Client Gemini dung chung cho toan bo backend.
export const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
