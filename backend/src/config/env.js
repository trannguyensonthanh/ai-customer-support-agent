import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  embedModel: process.env.GEMINI_EMBED_MODEL || 'text-embedding-004',
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_doi_di',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@shopviet.vn',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  adminName: process.env.ADMIN_NAME || 'Quản trị viên',
  dataDir: process.env.DATA_DIR || '.data',
};

if (!config.geminiApiKey) {
  console.warn('[config] Chua co GEMINI_API_KEY. Hay copy .env.example thanh .env va dien key.');
}
