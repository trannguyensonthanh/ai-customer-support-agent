<div align="center">
  <img src="https://raw.githubusercontent.com/tandp53/3T-Edu-Tech/main/logo.png" alt="Logo" width="120" style="border-radius: 12px" />
  <h1>🤖 3T Store - AI Customer Service Agent</h1>
  <p><em>Hệ thống trợ lý ảo chăm sóc khách hàng thông minh tích hợp ReAct Agent, RAG và Local LLM Fallback</em></p>
</div>

---

## ✨ Điểm nổi bật (Key Features)

Hệ thống được thiết kế theo cấu trúc **Agentic Workflow** hiện đại, kết hợp sức mạnh của Cloud AI và Local AI để đảm bảo tính sẵn sàng cao nhất:

- 🧠 **Cơ chế ReAct (Reasoning & Acting)**: AI không chỉ trả lời theo văn bản mà còn biết "suy nghĩ" để chọn gọi các công cụ (Tools) phù hợp như: *Tra cứu đơn hàng*, *Hủy đơn hàng*, *Tìm kiếm sản phẩm bằng Hình ảnh (CLIP Vector)*.
- 🔄 **Double Fallback Architecture**: Hoạt động mặc định với **Google Gemini API** (tốc độ cao). Nếu Gemini hết token hoặc lỗi mạng, hệ thống tự động fallback sang **Local LLMs (Ollama - Qwen2.5/Llama3)** một cách mượt mà mà không làm sập ứng dụng.
- 📚 **RAG (Retrieval-Augmented Generation)**: Admin có thể tải lên file PDF chính sách/FAQ. Hệ thống tự động trích xuất, tạo Vector Embedding và lưu trữ. Khi khách hàng hỏi, AI sẽ dùng RAG để trả lời chính xác dựa trên tài liệu nội bộ.
- 👁️ **Visual Search (Image to Text)**: Khách hàng có thể gửi hình ảnh sản phẩm. Hệ thống sử dụng mô hình AI (CLIP) để phân tích ảnh và tìm ra các sản phẩm tương đồng nhất trong kho.
- 🛡️ **Bảo mật dữ liệu (Data Isolation)**: Công cụ của Agent chỉ cho phép tra cứu đơn hàng của chính user đang đăng nhập (Customer Context). Các hành vi cố tình tra cứu mã đơn hàng của người khác sẽ bị AI từ chối.
- 📊 **Admin Dashboard Cao Cấp**: Giao diện quản trị hiện đại, cho phép quản lý Sản phẩm, Đơn hàng, FAQ, cấu hình AI trực tiếp (chuyển đổi Online/Offline) và xem biểu đồ phân tích tin nhắn.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

### Frontend (Giao diện Khách & Quản trị)
- **Framework**: React.js (Vite)
- **Styling**: Vanilla CSS (kết hợp các hiệu ứng Glassmorphism, Mesh Gradient hiện đại) + TailwindCSS.
- **State Management & Routing**: React Router, Context API.
- **Icons**: Lucide React.

### Backend (Xử lý Logic & AI)
- **Core**: Node.js & Express.js
- **AI Integration**: `@google/genai` (Gemini) + Node `fetch` (Ollama REST API).
- **Realtime**: Socket.IO & SSE (Server-Sent Events) cho hiệu ứng gõ phím của AI.
- **Data Storage**: Local JSON (Phù hợp cho đồ án, dễ dàng migrate sang MongoDB/PostgreSQL).
- **PDF Processing**: `pdf-parse`.

---

## 🚀 Hướng dẫn cài đặt (Getting Started)

### 1. Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/en/) (phiên bản 18+).
- [Ollama](https://ollama.com/) (Dành cho tính năng chạy Offline).

### 2. Cấu hình môi trường (Environment Variables)
Tạo file `.env` trong thư mục `backend/` với nội dung sau:

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=super_secret_key_3t
GEMINI_API_KEY=dien_api_key_cua_ban_vao_day
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=text-embedding-004

# Tài khoản Admin mặc định
ADMIN_EMAIL=admin@shopviet.vn
ADMIN_PASSWORD=admin123
ADMIN_NAME=Quản trị viên
```

### 3. Cài đặt Dependencies
Bạn cần mở 2 Terminal để cài đặt cho cả Frontend và Backend.

**Terminal 1 (Backend):**
```bash
cd backend
npm install
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
```

---

## 💻 Hướng dẫn chạy dự án

### Chạy hệ thống cơ bản (Sử dụng Gemini)
Khởi động Backend và Frontend cùng lúc:

**Terminal 1 (Backend):**
```bash
npm run dev
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Truy cập trang web tại: `http://localhost:5173/`

### Kích hoạt tính năng Offline Fallback (Local LLMs)
Nếu bạn muốn chạy AI hoàn toàn Offline hoặc test tính năng Fallback khi Gemini lỗi:

1. Tải và cài đặt **Ollama**.
2. Mở Terminal / CMD và tải các model cần thiết (Khuyên dùng Qwen2.5 14B cho Tiếng Việt và Nomic cho Embedding):
   ```bash
   ollama pull qwen2.5:14b
   ollama pull nomic-embed-text
   ```
3. Đăng nhập vào trang Admin của dự án (`http://localhost:5173/admin/login`).
4. Chuyển đến mục **⚙️ Cài đặt AI**.
5. Chọn **"Offline (Local LLMs)"**, kiểm tra cổng `11434` và nhấn **Lưu cấu hình**.
6. Lúc này, mọi hội thoại của khách hàng sẽ được xử lý tại máy tính của bạn thông qua Ollama mà không tốn Token.

---

## 🔑 Tài khoản Demo (Demo Credentials)

**Tài khoản Quản trị (Admin Panel)**
- **URL**: `http://localhost:5173/admin/login`
- **Email**: `admin@shopviet.vn`
- **Password**: `admin123`

**Tài khoản Khách hàng (Customer)**
- **URL**: `http://localhost:5173/login`
- **Email**: `an@example.com`
- **Password**: `123456`

---

## 📂 Cấu trúc thư mục lõi (Core Architecture)

```text
ai-cskh-agent/
├── backend/
│   ├── src/
│   │   ├── agent/
│   │   │   ├── agentStream.js   # Luồng xử lý AI ReAct (Gọi tool, trả lời Stream)
│   │   │   ├── systemPrompt.js  # "Bộ não" tính cách và vai trò của AI
│   │   │   └── tools.js         # Các công cụ AI có thể dùng (Tra đơn, Hủy đơn...)
│   │   ├── lib/
│   │   │   └── llmProvider.js   # Lớp trừu tượng (Adapter) xử lý chuyển đổi Gemini <-> Ollama
│   │   ├── services/
│   │   │   ├── embeddingStore.js # Dịch vụ RAG tạo và tìm kiếm Vector FAQ
│   │   │   └── clipStore.js      # Phân tích hình ảnh sản phẩm
├── frontend/
│   ├── src/
│   │   ├── admin/
│   │   │   └── Settings.jsx     # Giao diện quản lý cấu hình AI Model (Online/Offline)
│   │   ├── components/
│   │   │   └── ChatWidget.jsx   # Khung chat nổi cho Khách hàng
│   │   └── index.css            # Design System (Mesh Gradients, Glassmorphism)
```

## 📜 Các kịch bản có thể test (Test Cases)
1. **RAG & FAQ:** Hỏi về "Chính sách đổi trả" -> AI tự lục file PDF/CSDL để trả lời.
2. **Vision:** Gửi 1 ảnh sản phẩm -> AI dùng công cụ quét ảnh và báo có sản phẩm nào giống.
3. **Bảo mật:** Đăng nhập tài khoản An -> Hỏi "Mã đơn hàng ORD-123456 của tôi đâu?" -> Xem AI tra cứu. Sau đó hỏi mã đơn của người khác -> Xem AI từ chối khéo léo.
4. **Fallback:** Trong Admin, đổi cấu hình sang Offline -> Chat với bot -> Bot sẽ gọi Ollama để trả lời (Có thể dùng CMD gõ `ollama serve` để quan sát log máy chủ Local).

---
*Phát triển bởi đội ngũ đam mê AI Agent.*
