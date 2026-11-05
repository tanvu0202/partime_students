import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const MENU = {
  STUDENT: [['Việc làm', '/'], ['Đơn của tôi', '/student/applications'], ['Hồ sơ', '/student/profile']],
  EMPLOYER: [['Tin của tôi', '/employer/jobs'], ['Hồ sơ công ty', '/employer/profile']],
  ADMIN: [['Quản trị', '/admin']],
};

const ROLE_NAME = { STUDENT: 'Sinh viên', EMPLOYER: 'Nhà tuyển dụng', ADMIN: 'Quản trị viên' };

// Lấy 2 chữ cái đầu của 2 từ cuối trong tên: "Nguyễn Văn An" -> "VA"
export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="nav">
        <Link to="/" className="logo">PartTime<span>SV</span></Link>
        {(MENU[user?.role] || [['Việc làm', '/']]).map(([label, to]) => (
          <NavLink key={to} to={to} end className="nav-item">{label}</NavLink>
        ))}
        <span className="spacer" />
        {user ? (
          <>
            <span className="who">
              <span className="avatar">{initials(user.fullName)}</span>
              <span className="who-text"><b>{user.fullName}</b><small>{ROLE_NAME[user.role]}</small></span>
            </span>
            <button className="btn ghost" onClick={onLogout}>Đăng xuất</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn ghost">Đăng nhập</Link>
            <Link to="/register" className="btn accent">Đăng ký</Link>
          </>
        )}
      </header>
      {/* Trang chủ dùng bố cục rộng hơn các trang form */}
      <main className={pathname === '/' ? 'page wide' : 'page'} key={pathname}>
        <Outlet />
      </main>
      <footer className="foot">
        <span><b>PartTime<span>SV</span></b> – Đồ án Chuyên đề tốt nghiệp 2, nhóm GR7, Trường ĐH Văn Lang</span>
        <span>Về chúng tôi · Điều khoản sử dụng · Hỗ trợ</span>
      </footer>
    </>
  );
}
