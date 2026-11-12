// Hàm định dạng dùng chung cho các trang tin tuyển dụng và đơn ứng tuyển

// Ngành nghề khớp với dữ liệu mẫu ở backend (DataSeeder)
export const CATEGORIES = ['F&B', 'Bán hàng', 'Gia sư', 'Nhập liệu', 'Sự kiện – PG', 'Giao hàng', 'Khác'];
export const LOCATIONS = ['Bình Thạnh', 'Gò Vấp', 'Quận 1', 'Quận 3', 'Quận 7', 'Phú Nhuận', 'Thủ Đức', 'Làm từ xa'];
export const UNIT = { HOUR: 'giờ', DAY: 'ngày', MONTH: 'tháng', PROJECT: 'dự án' };

export const JOB_STATUS = {
  OPEN: ['Đang tuyển', 'open'],
  FILLED: ['Đã đủ người', 'filled'],
  COMPLETED: ['Đã hoàn thành', 'done'],
  CLOSED: ['Đã đóng', 'closed'],
};
export const APP_STATUS = {
  PENDING: ['Đang chờ duyệt', 'pending'],
  ACCEPTED: ['Đã được nhận', 'accepted'],
  REJECTED: ['Chưa phù hợp', 'rejected'],
};

const money = (n) => Number(n).toLocaleString('vi-VN');

export function salaryText(j) {
  const unit = UNIT[j.salaryUnit] || '';
  if (j.salaryMin && j.salaryMax && Number(j.salaryMin) !== Number(j.salaryMax)) return `${money(j.salaryMin)} – ${money(j.salaryMax)}đ/${unit}`;
  if (j.salaryMin || j.salaryMax) return `${money(j.salaryMin || j.salaryMax)}đ/${unit}`;
  return 'Thỏa thuận';
}

export function daysAgo(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? 'Đăng hôm nay' : `Đăng ${d} ngày trước`;
}

export function dateText(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
