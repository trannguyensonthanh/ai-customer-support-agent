import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { adminApi } from '../lib/adminApi.js';

export default function Faqs() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const api = adminApi(auth.token);
  const [faqs, setFaqs] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [uploading, setUploading] = useState(false);
  const [pdfCategory, setPdfCategory] = useState('Vận chuyển & Giao hàng');

  const load = () =>
    api.getFaqs().then(setFaqs).catch((e) => {
      if (e.message === 'UNAUTHORIZED') {
        logout();
        navigate('/admin/login');
      }
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadPdf(file, pdfCategory.trim());
      alert(`Nhập thành công! Đã tạo ${res.chunksAdded} mục FAQ từ ${res.pages} trang PDF.`);
      await load();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
    setUploading(false);
    e.target.value = ''; // Reset input
  };

  const remove = async (id) => {
    if (!confirm('Xóa đoạn văn bản này?')) return;
    await api.deleteFaq(id);
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
    await load();
  };

  const removeCategory = async (catName) => {
    if (!confirm(`Xóa toàn bộ dữ liệu của danh mục "${catName}"? Hành động này không thể hoàn tác.`)) return;
    await api.deleteFaqCategory(catName);
    await load();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Xóa ${selectedIds.size} đoạn văn bản đã chọn?`)) return;
    await api.bulkDeleteFaqs(Array.from(selectedIds));
    setSelectedIds(new Set());
    await load();
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectCategory = (chunks) => {
    const newSet = new Set(selectedIds);
    const allSelected = chunks.every(c => newSet.has(c.id));
    if (allSelected) {
      chunks.forEach(c => newSet.delete(c.id));
    } else {
      chunks.forEach(c => newSet.add(c.id));
    }
    setSelectedIds(newSet);
  };

  // Group by category
  const pdfCategories = {};
  for (const f of faqs) {
    if (!pdfCategories[f.category]) pdfCategories[f.category] = [];
    pdfCategories[f.category].push(f);
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Kho tri thức PDF (Knowledge Base)</h1>
          <p className="text-sm text-muted">Tải lên các file PDF chính sách để AI tự động học và trả lời khách hàng</p>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={bulkDelete}
            className="rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:bg-danger-600 transition shadow-sm"
          >
            🗑️ Xóa {selectedIds.size} mục đã chọn
          </button>
        )}
      </div>

      <div className="mb-6 flex justify-end">
        <div className="flex items-center gap-3 bg-surface p-2 rounded-2xl border border-line shadow-sm">
          <select
            value={pdfCategory}
            onChange={(e) => setPdfCategory(e.target.value)}
            className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-medium outline-none focus:border-brand min-w-48 appearance-none"
            disabled={uploading}
          >
            <option value="Vận chuyển & Giao hàng">Vận chuyển & Giao hàng</option>
            <option value="Đổi trả & Hoàn tiền">Đổi trả & Hoàn tiền</option>
            <option value="Thanh toán">Thanh toán</option>
            <option value="Bảo hành">Bảo hành</option>
            <option value="Đặt hàng & Đơn hàng">Đặt hàng & Đơn hàng</option>
            <option value="Khuyến mãi">Khuyến mãi</option>
            <option value="Bảo mật thông tin">Bảo mật thông tin</option>
            <option value="Liên hệ & Hỗ trợ">Liên hệ & Hỗ trợ</option>
          </select>
          <input
            type="file"
            accept="application/pdf"
            id="pdf-upload"
            className="hidden"
            onChange={handlePdfUpload}
            disabled={uploading}
          />
          <label
            htmlFor="pdf-upload"
            className={`cursor-pointer rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 flex items-center shadow-sm ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? 'Đang xử lý PDF...' : '📄 Nhập điều khoản từ PDF'}
          </label>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(pdfCategories).map(([catName, chunks]) => {
          const allSelected = chunks.length > 0 && chunks.every(c => selectedIds.has(c.id));
          const someSelected = chunks.some(c => selectedIds.has(c.id));
          
          return (
            <div key={catName} className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
              <div className="bg-paper px-5 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-line gap-4">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={() => toggleSelectCategory(chunks)}
                    className="w-4 h-4 text-brand rounded border-line focus:ring-brand cursor-pointer"
                  />
                  <div>
                    <h3 className="font-display font-bold text-ink text-lg">{catName}</h3>
                    <p className="text-sm text-muted mt-0.5">Bao gồm {chunks.length} đoạn văn bản đã được AI bóc tách.</p>
                  </div>
                </div>
                <button
                  onClick={() => removeCategory(catName)}
                  className="rounded-xl bg-danger/10 text-danger px-4 py-2 text-sm font-semibold hover:bg-danger hover:text-white transition w-fit"
                >
                  Xóa toàn bộ thư mục
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {chunks.map((f, i) => (
                  <div key={f.id} className={`group flex items-start gap-4 px-5 py-3 hover:bg-paper transition ${i > 0 ? 'border-t border-line' : ''}`}>
                    <div className="pt-1 shrink-0">
                      <input 
                        type="checkbox"
                        checked={selectedIds.has(f.id)}
                        onChange={() => toggleSelect(f.id)}
                        className="w-4 h-4 text-brand rounded border-line focus:ring-brand cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => toggleSelect(f.id)}>
                      <div className="text-sm font-medium text-ink mb-1 line-clamp-1">{f.question}</div>
                      <div className="text-xs text-muted line-clamp-2">{f.answer}</div>
                    </div>
                    <button
                      onClick={() => remove(f.id)}
                      className="opacity-0 group-hover:opacity-100 rounded-lg border border-agent-50 px-3 py-1.5 text-xs text-agent-600 hover:bg-agent-50 transition shrink-0"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {Object.keys(pdfCategories).length === 0 && (
          <div className="px-5 py-12 text-center bg-surface rounded-2xl border border-line flex flex-col items-center justify-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-bold text-ink mb-2">Kho tri thức đang trống</h3>
            <p className="text-sm text-muted max-w-md">Hãy chọn một danh mục chính sách và tải lên file PDF của cửa hàng. AI Agent sẽ tự động phân tích và học nội dung để trả lời khách hàng.</p>
          </div>
        )}
      </div>
    </div>
  );
}
