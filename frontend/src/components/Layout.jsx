import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const MENU = {
  STUDENT: [['Việc làm', '/'], ['Đơn của tôi', '/student/applications'], ['Hồ sơ', '/student/profile']],
  EMPLOYER: [['Tin của tôi', '/employer/jobs'], ['Hồ sơ công ty', '/employer/profile']],
  ADMIN: [['Quản trị', '/admin']],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
            <span className="who">{user.fullName}</span>
            <button className="btn ghost" onClick={onLogout}>Đăng xuất</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn ghost">Đăng nhập</Link>
            <Link to="/register" className="btn accent">Đăng ký</Link>
          </>
        )}
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
