import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client, { errorMessage, fieldErrors } from '../api/client';
import { AuthAside, PasswordInput } from '../components/ui';
import loginArt from '../assets/dang-nhap.svg';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES = [
  ['STUDENT', 'Sinh viên', 'Tìm việc part-time'],
  ['EMPLOYER', 'Nhà tuyển dụng', 'Đăng tin, tìm người'],
];

const BENEFITS = {
  STUDENT: {
    title: 'Bắt đầu kiếm thêm thu nhập ngay trong tuần này',
    text: 'Tạo tài khoản sinh viên miễn phí để ứng tuyển và theo dõi đơn ở một nơi.',
    items: ['Lọc việc theo ca làm, khu vực và mức lương', 'Theo dõi trạng thái đơn, nhận thông báo khi được duyệt', 'Xem điểm đánh giá nhà tuyển dụng trước khi nhận việc'],
  },
  EMPLOYER: {
    title: 'Tìm được người làm đúng ca bạn cần',
    text: 'Đăng tin miễn phí, nhận hồ sơ sinh viên ngay trong ngày.',
    items: ['Đăng, sửa, đóng tin chỉ với vài thao tác', 'Xem CV và lời giới thiệu của từng ứng viên', 'Đánh giá ứng viên sau khi công việc hoàn thành'],
  },
};

// Độ mạnh mật khẩu: 0–3
function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) s += 1;
  if (pw.length >= 12 || /[^a-zA-Z0-9]/.test(pw)) s += 1;
  return s;
}
const STRENGTH_TEXT = ['Quá ngắn', 'Tạm được', 'Khá', 'Mạnh'];

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

  const b = BENEFITS[form.role];
  const st = strength(form.password);

  return (
    <div className="auth-wrap">
      <AuthAside image={loginArt} title={b.title} text={b.text}>
        <ul className="benefits" key={form.role}>
          {b.items.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </AuthAside>

      <div className="auth-box">
        <h1>Tạo tài khoản</h1>
        <p className="lead">Chọn vai trò của bạn để bắt đầu.</p>
        <form onSubmit={onSubmit} noValidate>
          <div className="role-switch">
            {ROLES.map(([value, label, sub]) => (
              <button type="button" key={value} className={form.role === value ? 'role on' : 'role'}
                onClick={() => setForm({ ...form, role: value })}>
                <b>{label}</b><span>{sub}</span>
              </button>
            ))}
          </div>
          <Field label={form.role === 'EMPLOYER' ? 'Họ tên người liên hệ' : 'Họ tên'} name="fullName"
            form={form} errors={errors} onChange={onChange} placeholder="vd: Nguyễn Văn An" />
          <Field label="Email" name="email" type="email" form={form} errors={errors} onChange={onChange} placeholder="vd: an.nguyen@gmail.com" />
          <label>Mật khẩu
            <PasswordInput name="password" value={form.password} onChange={onChange} placeholder="Từ 8 ký tự" />
            {form.password && (
              <span className={`meter m${st}`}><i /><i /><i /><em>{STRENGTH_TEXT[st]}</em></span>
            )}
            {errors.password && <span className="error">{errors.password}</span>}
          </label>
          <label>Nhập lại mật khẩu
            <PasswordInput name="confirm" value={form.confirm} onChange={onChange} />
            {errors.confirm && <span className="error">{errors.confirm}</span>}
          </label>
          {message && <p className="alert error">{message}</p>}
          <button className="btn primary full big" disabled={loading}>{loading ? 'Đang gửi...' : 'Đăng ký'}</button>
        </form>
        <p className="switch">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </div>
    </div>
  );
}

function Field({ label, name, type = 'text', form, errors, onChange, placeholder }) {
  return (
    <label>{label}
      <input name={name} type={type} value={form[name]} onChange={onChange} placeholder={placeholder}
        className={errors[name] ? 'invalid' : ''} />
      {errors[name] && <span className="error">{errors[name]}</span>}
    </label>
  );
}
