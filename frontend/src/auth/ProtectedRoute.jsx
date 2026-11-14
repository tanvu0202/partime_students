import { Navigate, useLocation } from 'react-router-dom';
import { homeOf, useAuth } from './AuthContext';

// Chặn trang theo vai trò (B6-07): chưa đăng nhập -> /login; sai vai trò -> về trang của mình
export default function ProtectedRoute({ roles, children }) {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <p className="page">Đang tải...</p>;
  // Ghi lại trang đang mở để đăng nhập xong quay về đúng trang đó
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeOf(user.role)} replace />;
  return children;
}
