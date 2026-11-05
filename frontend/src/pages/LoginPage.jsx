import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { homeOf, useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';

// MH-01 – Đăng nhập (B6-08)
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(homeOf(user.role));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-box">
      <h1>Đăng nhập</h1>
      {location.state?.registered && <p className="success">Đăng ký thành công, mời bạn đăng nhập</p>}
      <form onSubmit={onSubmit} noValidate>
        <label>Email
          <input name="email" type="email" value={form.email} onChange={onChange} placeholder="sv1@gr7.vn" />
        </label>
        <label>Mật khẩu
          <input name="password" type="password" value={form.password} onChange={onChange} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary full" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
      <p className="muted">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
    </div>
  );
}
