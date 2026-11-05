import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client, { errorMessage, fieldErrors } from '../api/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// MH-01 – Đăng ký (B6-08): kiểm tra ở trình duyệt trước, rồi hiển thị lỗi từ API
export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', role: 'STUDENT' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Họ tên không được để trống';
    if (!EMAIL_RE.test(form.email)) e.email = 'Email không đúng định dạng';
    if (form.password.length < 8) e.password = 'Mật khẩu phải từ 8 ký tự';
    if (form.confirm !== form.password) e.confirm = 'Mật khẩu nhập lại không khớp';
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setMessage('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const { confirm: _confirm, ...body } = form;
      await client.post('/api/auth/register', body);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setErrors(fieldErrors(err));
      setMessage(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-box">
      <h1>Đăng ký tài khoản</h1>
      <form onSubmit={onSubmit} noValidate>
        <div className="role-switch">
          {[['STUDENT', 'Sinh viên'], ['EMPLOYER', 'Nhà tuyển dụng']].map(([value, label]) => (
            <button type="button" key={value}
              className={form.role === value ? 'btn primary' : 'btn ghost'}
              onClick={() => setForm({ ...form, role: value })}>{label}</button>
          ))}
        </div>
        <Field label="Họ tên" name="fullName" form={form} errors={errors} onChange={onChange} />
        <Field label="Email" name="email" type="email" form={form} errors={errors} onChange={onChange} />
        <Field label="Mật khẩu (từ 8 ký tự)" name="password" type="password" form={form} errors={errors} onChange={onChange} />
        <Field label="Nhập lại mật khẩu" name="confirm" type="password" form={form} errors={errors} onChange={onChange} />
        {message && <p className="error">{message}</p>}
        <button className="btn primary full" disabled={loading}>{loading ? 'Đang gửi...' : 'Đăng ký'}</button>
      </form>
      <p className="muted">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </div>
  );
}

function Field({ label, name, type = 'text', form, errors, onChange }) {
  return (
    <label>{label}
      <input name={name} type={type} value={form[name]} onChange={onChange} />
      {errors[name] && <span className="error">{errors[name]}</span>}
    </label>
  );
}
