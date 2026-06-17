// Phan tich cam xuc nhe (theo tu khoa). Khong thay the LLM, chi dung de:
//  - gan nhan cam xuc cho frontend hien thi
//  - canh bao agent khi khach co dau hieu buc boi -> uu tien chuyen nguoi that
// Tang sau co the nang cap thanh model phan loai rieng.

const NEGATIVE = [
  'tệ', 'kém', 'dở', 'bực', 'tức', 'thất vọng', 'lừa', 'lừa đảo',
  'chậm', 'lâu quá', 'mãi chưa', 'quá lâu', 'khiếu nại', 'phản ánh',
  'tồi', 'thái độ', 'vô lý', 'bức xúc', 'chán', 'huỷ hết', 'hủy hết',
  'không nhận được', 'chưa nhận được', 'sai', 'hỏng', 'lỗi',
];

const POSITIVE = [
  'cảm ơn', 'tuyệt', 'tốt', 'ổn', 'hài lòng', 'nhanh', 'yêu', 'ok',
  'cám ơn', 'thanks', 'tuyệt vời', 'xịn',
];

const HANDOFF = [
  'gặp nhân viên', 'gặp người', 'nhân viên', 'tổng đài', 'người thật',
  'nói chuyện với người', 'tư vấn viên', 'nhân viên hỗ trợ',
];

export function analyzeSentiment(text = '') {
  const t = text.toLowerCase();
  let score = 0;
  for (const w of NEGATIVE) if (t.includes(w)) score -= 1;
  for (const w of POSITIVE) if (t.includes(w)) score += 1;

  const wantsHuman = HANDOFF.some((w) => t.includes(w));
  let label = 'neutral';
  if (score <= -2) label = 'angry';
  else if (score < 0) label = 'unhappy';
  else if (score > 0) label = 'happy';

  return { label, score, wantsHuman };
}
