import { Navigate } from 'react-router-dom';
import { homeOf, useAuth } from './AuthContext';

// Chặn trang theo vai trò (B6-07): chưa đăng nhập -> /login; sai vai trò -> về trang của mình
export default function ProtectedRoute({ roles, children }) {
  const { user, checking } = useAuth();
  if (checking) return <p className="page">Đang tải...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeOf(user.role)} replace />;
  return children;
}
