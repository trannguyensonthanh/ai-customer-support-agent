# AI Agent hỗ trợ chăm sóc khách hàng — ShopViệt

Hệ thống **AI Agent CSKH hoàn chỉnh**: chatbot AI trả lời FAQ, hỗ trợ tra cứu đơn hàng,
tự động chuyển nhân viên, kèm **trang quản trị, phân tích số liệu và tiếp quản trực tiếp (live takeover)**.

> **Đã hoàn thành Tăng 1 + 2 + 3** — toàn bộ đã được build & test (chỉ phần gọi Gemini cần API key của bạn).

---

## ✨ Tính năng

### Đủ 4 yêu cầu đề bài + nâng cấp
| Yêu cầu | Trạng thái | Nâng cấp |
|---|---|---|
| Tạo chatbot AI | ✅ | UI đẹp, streaming thật, gửi ảnh, đa ngôn ngữ |
| Trả lời FAQ | ✅ | RAG (embedding) + quản lý FAQ ở trang admin |
| Hỗ trợ đơn hàng | ✅ | Function calling + thẻ đơn hàng có timeline |
| Chuyển tiếp nhân viên | ✅ | Tự động escalation + **live takeover realtime** |

### Các tầng nâng cấp
- **Tăng 1:** Agent với function calling, RAG, escalation.
- **Tăng 2:** Streaming (SSE), thẻ đơn hàng + timeline, gửi ảnh (multimodal), CSAT, đa ngôn ngữ VI/EN.
- **Tăng 3 (full):**
  - **CSDL bền vững** (kho JSON, tách tầng repository — đổi sang PostgreSQL dễ dàng).
  - **Đăng nhập phân quyền** (JWT + bcrypt) cho nhân viên/admin.
  - **Trang Admin:** Tổng quan (analytics + biểu đồ), Hội thoại (live takeover), Quản lý FAQ (CRUD, AI tự embed lại), Ticket.
  - **Realtime Socket.io:** nhân viên tiếp quản đúng cuộc chat AI đang xử lý; tin nhắn 2 chiều tức thì.
  - **Analytics:** tỷ lệ AI tự giải quyết, tỷ lệ escalation, CSAT trung bình, lưu lượng 7 ngày, câu hỏi hàng đầu.

---

## 🧱 Công nghệ
- **Frontend:** React 18 + Vite + Tailwind CSS v4 + React Router + Recharts + Socket.io-client
- **Backend:** Node.js + Express (ESM) + Socket.io + JWT
- **AI:** Google Gemini (`@google/genai`) — chat streaming + embedding (RAG) + multimodal
- **CSDL:** Kho JSON bền vững (mặc định, chạy ngay) · PostgreSQL + pgvector + Redis (tùy chọn production)

---

## 🚀 Cách chạy
Cần **Node.js >= 18.17** và **API key Gemini miễn phí** (https://aistudio.google.com/apikey).

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env        # dán GEMINI_API_KEY (và đổi JWT_SECRET nếu muốn)
npm run dev                 # http://localhost:4000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

- **Khách hàng:** http://localhost:5173 → bấm “Cần hỗ trợ?”
- **Quản trị:** http://localhost:5173/admin → đăng nhập `admin@shopviet.vn` / `admin123`

### Thử nghiệm live takeover (rất hay để demo)
1. Mở 2 tab: tab khách (`/`) và tab admin (`/admin/conversations`).
2. Ở tab khách, chat vài câu rồi gõ “tôi muốn gặp nhân viên”.
3. Ở tab admin, hội thoại hiện trạng thái **Chờ nhân viên** → bấm **Tiếp quản** → nhập trả lời.
4. Tab khách nhận tin nhắn nhân viên ngay lập tức (header đổi sang màu coral).

---

## 🔌 API chính
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/chat/stream` | Chat SSE: `meta · tool · order · delta · escalated · done` |
| POST | `/api/feedback` | Đánh giá CSAT |
| POST | `/api/auth/login` | Đăng nhập nhân viên |
| GET/POST/PUT/DELETE | `/api/admin/faqs` | Quản lý FAQ (cần token) |
| GET | `/api/admin/conversations` | Danh sách + chi tiết hội thoại |
| GET/PUT | `/api/admin/tickets` | Quản lý ticket |
| GET | `/api/admin/analytics` | Số liệu tổng hợp |

**Socket.io:** `customer:join`, `customer:message`, `agent:take`, `agent:message`, `agent:resolve`
→ phát `agent_takeover`, `agent_message`, `conversation_closed`, `agent:incoming`.

---

## 🗂️ Cấu trúc
```
backend/src/
  db/        jsondb.js (kho JSON) · store.js (truy cập dữ liệu + seed)
  agent/     systemPrompt · tools · agentStream (function calling + streaming)
  services/  embeddingStore (RAG) · authService
  realtime/  io.js (Socket.io: live takeover)
  routes/    chat.js · auth.js · admin.js
  middleware/auth.js
frontend/src/
  Storefront.jsx · components/ (widget khách: OrderCard, RatingCard, ChatWidget...)
  admin/     AuthContext · AdminLayout · Login · Dashboard · Conversations · Faqs · Tickets
  hooks/useChat.js · lib/ (api, adminApi, sockets)
```

---

## 🐘 Nâng cấp lên PostgreSQL (tùy chọn)
Mặc định dùng kho JSON nên **chạy ngay không cần cài gì**. Khi cần production:
```bash
docker compose up -d
psql postgresql://cskh:cskh@localhost:5432/cskh -f backend/db/postgres-schema.sql
```
Sau đó viết lại `backend/src/db/store.js` bằng thư viện `pg` (giữ nguyên API các `*Store`),
và có thể dùng Redis adapter cho Socket.io khi chạy nhiều instance. Schema có sẵn ở
`backend/db/postgres-schema.sql` (kèm cột embedding dạng `jsonb` hoặc `vector` của pgvector).
