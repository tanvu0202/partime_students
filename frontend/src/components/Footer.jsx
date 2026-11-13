import { Link } from 'react-router-dom';

// Thông tin liên hệ hiển thị ở chân trang.
// Mục nào để trống ('') sẽ tự ẩn, điền sau khi có thông tin.
const CONTACT = {
  facebook: 'https://www.facebook.com/tan.vu.698079',
  email: 'nhom7@gmail.com',
  phone: '0123 456 789', // số minh họa, thay bằng số thật của nhóm
  address: '69/68 Đặng Thùy Trâm, P. Bình Lợi Trung, TP. Hồ Chí Minh',
};

const COLUMNS = [
  {
    title: 'Sinh viên',
    links: [['Tìm việc làm', '/'], ['Đơn ứng tuyển của tôi', '/student/applications'], ['Tạo tài khoản', '/register']],
  },
  {
    title: 'Nhà tuyển dụng',
    links: [['Đăng tin tuyển dụng', '/employer/jobs/new'], ['Quản lý tin đã đăng', '/employer/jobs'], ['Tạo tài khoản', '/register']],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="foot">
      <div className="foot-inner">
        <div className="foot-brand">
          <Link to="/" className="foot-logo">PartTime<span>SV</span></Link>
          <p>Nền tảng kết nối sinh viên với việc làm bán thời gian gần trường, lương rõ ràng, ca linh hoạt.</p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} className="foot-col">
            <h4>{col.title}</h4>
            {col.links.map(([label, to]) => (
              <Link key={label} to={to}>{label}</Link>
            ))}
          </nav>
        ))}

        <div className="foot-col">
          <h4>Liên hệ</h4>
          {CONTACT.facebook && (
            <a href={CONTACT.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
          )}
          {CONTACT.email && <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>}
          {CONTACT.phone && <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>}
          {CONTACT.address && <span>{CONTACT.address}</span>}
        </div>
      </div>

      <div className="foot-bottom">
        <span>© {year} PartTimeSV. Nhóm GR7, Trường Đại học Văn Lang.</span>
        <span>Đồ án Chuyên đề tốt nghiệp 2</span>
      </div>
    </footer>
  );
}
