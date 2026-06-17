// Co so tri thuc FAQ. Tang sau se chuyen sang quan ly trong DB + trang admin.
// Day la "nguon su that" cho RAG: he thong se embed roi tim doan lien quan nhat.

export const faqs = [
  {
    id: 'faq_shipping_fee',
    category: 'Vận chuyển',
    q: 'Phí vận chuyển là bao nhiêu?',
    a: 'Phí vận chuyển tiêu chuẩn là 30.000đ cho nội thành và 45.000đ cho ngoại thành/tỉnh. Đơn hàng từ 500.000đ được miễn phí vận chuyển toàn quốc.',
  },
  {
    id: 'faq_shipping_time',
    category: 'Vận chuyển',
    q: 'Bao lâu thì nhận được hàng?',
    a: 'Thời gian giao dự kiến: nội thành 1-2 ngày, các tỉnh thành khác 3-5 ngày làm việc. Đơn đặt sau 17h sẽ được xử lý vào ngày làm việc kế tiếp.',
  },
  {
    id: 'faq_return_policy',
    category: 'Đổi trả',
    q: 'Chính sách đổi trả như thế nào?',
    a: 'Bạn được đổi trả trong vòng 7 ngày kể từ khi nhận hàng, với điều kiện sản phẩm còn nguyên tem mác, chưa qua sử dụng và còn hóa đơn. Sản phẩm khuyến mãi cuối mùa không áp dụng đổi trả.',
  },
  {
    id: 'faq_refund_time',
    category: 'Đổi trả',
    q: 'Khi nào tôi được hoàn tiền?',
    a: 'Sau khi nhận được hàng hoàn về và kiểm tra đạt yêu cầu, chúng tôi hoàn tiền trong 3-5 ngày làm việc. Tiền sẽ về đúng phương thức bạn đã thanh toán.',
  },
  {
    id: 'faq_payment',
    category: 'Thanh toán',
    q: 'Có những hình thức thanh toán nào?',
    a: 'Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng, ví điện tử (Momo, ZaloPay) và thẻ tín dụng/ghi nợ.',
  },
  {
    id: 'faq_cancel_order',
    category: 'Đơn hàng',
    q: 'Làm sao để hủy đơn hàng?',
    a: 'Bạn có thể hủy đơn miễn phí khi đơn đang ở trạng thái "Chờ xác nhận" hoặc "Đang chuẩn bị". Khi đơn đã chuyển sang "Đang giao" thì không thể hủy, bạn có thể từ chối nhận hàng.',
  },
  {
    id: 'faq_track_order',
    category: 'Đơn hàng',
    q: 'Tôi muốn kiểm tra tình trạng đơn hàng?',
    a: 'Bạn vui lòng cung cấp mã đơn hàng (ví dụ DH1024) hoặc email/số điện thoại đặt hàng, hệ thống sẽ tra cứu trạng thái và thời gian giao dự kiến cho bạn.',
  },
  {
    id: 'faq_warranty',
    category: 'Bảo hành',
    q: 'Sản phẩm có được bảo hành không?',
    a: 'Các sản phẩm điện tử được bảo hành chính hãng 12 tháng. Sản phẩm thời trang, gia dụng được bảo hành lỗi nhà sản xuất trong 30 ngày.',
  },
  {
    id: 'faq_voucher',
    category: 'Khuyến mãi',
    q: 'Làm sao để dùng mã giảm giá?',
    a: 'Tại bước thanh toán, bạn nhập mã giảm giá vào ô "Mã ưu đãi" rồi bấm áp dụng. Mỗi đơn chỉ dùng được 1 mã và không cộng dồn với chương trình giảm giá khác.',
  },
  {
    id: 'faq_contact',
    category: 'Liên hệ',
    q: 'Tôi muốn gặp nhân viên hỗ trợ trực tiếp?',
    a: 'Bạn có thể yêu cầu gặp nhân viên bất cứ lúc nào, hệ thống sẽ chuyển tiếp cuộc trò chuyện. Tổng đài CSKH: 1900 1234 (8h-21h hằng ngày).',
  },
];
