import http from 'http';
import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { chatRouter } from './routes/chat.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { customerRouter } from './routes/customer.js';
import { productRouter } from './routes/products.js';
import { seed } from './db/store.js';
import { syncEmbeddings } from './services/embeddingStore.js';
import { initIo } from './realtime/io.js';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '12mb' }));

// Routes
app.use('/api', chatRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/customer', customerRouter);
app.use('/api/products', productRouter);

app.get('/', (_req, res) => res.json({ name: 'AI Agent CSKH - Backend', status: 'running' }));

const server = http.createServer(app);
initIo(server, config.corsOrigin);

async function start() {
  seed();
  await syncEmbeddings();

  server.listen(config.port, () => {
    console.log(`\n  AI Agent CSKH backend dang chay`);
    console.log(`  http://localhost:${config.port}`);
    console.log(`  Model: ${config.model} · Realtime: Socket.io`);
    console.log(`  Admin: ${config.adminEmail}`);
    console.log(`  Demo customer: an.nguyen@example.com / 123456\n`);
  });
}

start();

// ====== Xử lý triệt để lỗi EADDRINUSE khi Nodemon restart (Đặc biệt trên Windows) ======
function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Đang đóng server để giải phóng cổng 4000...`);
  server.close(() => {
    console.log('Server đã đóng hoàn toàn.');
    process.exit(0);
  });

  // Bắt buộc thoát sau 2s nếu có connection nào bị kẹt
  setTimeout(() => {
    console.log('Ép buộc thoát do vượt quá thời gian chờ.');
    process.exit(1);
  }, 2000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGUSR2', () => {
  // Nodemon gửi SIGUSR2 khi restart
  server.close(() => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

// touch
