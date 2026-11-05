import { useEffect, useState } from 'react';
import client, { API_URL, errorMessage, fieldErrors } from '../api/client';

const EMPTY = { fullName: '', phone: '', school: '', major: '', skills: '', bio: '' };

// MH-04 – Hồ sơ sinh viên (B6-09)
export default function StudentProfilePage() {
  const [form, setForm] = useState(EMPTY);
  const [info, setInfo] = useState({ email: '', cvUrl: null });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    client.get('/api/students/me')
      .then(({ data }) => {
        setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? ''])));
        setInfo({ email: data.email, cvUrl: data.cvUrl });
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async (e) => {
    e.preventDefault();
    setNotice(''); setError(''); setErrors({});
    try {
      await client.put('/api/students/me', form);
      setNotice('Đã lưu hồ sơ');
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    }
  };

  const onUpload = async () => {
    setNotice(''); setError('');
    if (!file) { setError('Vui lòng chọn file CV'); return; }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) { setError('Chỉ chấp nhận file PDF hoặc DOCX'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File vượt quá 5MB'); return; }
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await client.post('/api/students/me/cv', data);
      setInfo({ ...info, cvUrl: res.data.cvUrl });
      setNotice('Đã tải lên CV');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="card">
      <h1>Hồ sơ sinh viên</h1>
      <p className="muted">Email đăng nhập: {info.email}</p>
      <form onSubmit={onSave} noValidate className="grid">
        <Input label="Họ tên *" name="fullName" form={form} errors={errors} onChange={onChange} />
        <Input label="Số điện thoại" name="phone" form={form} errors={errors} onChange={onChange} />
        <Input label="Trường" name="school" form={form} errors={errors} onChange={onChange} />
        <Input label="Ngành học" name="major" form={form} errors={errors} onChange={onChange} />
        <Input label="Kỹ năng" name="skills" form={form} errors={errors} onChange={onChange} wide />
        <label className="wide">Giới thiệu bản thân
          <textarea name="bio" rows="4" value={form.bio} onChange={onChange} />
          {errors.bio && <span className="error">{errors.bio}</span>}
        </label>
        <div className="wide"><button className="btn primary">Lưu hồ sơ</button></div>
      </form>

      <h2>CV</h2>
      <p>
        {info.cvUrl
          ? <a href={API_URL + info.cvUrl} target="_blank" rel="noreferrer">Xem CV hiện tại</a>
          : <span className="muted">Chưa có CV</span>}
      </p>
      <div className="row">
        <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files[0])} />
        <button type="button" className="btn ghost" onClick={onUpload}>Tải lên (PDF/DOCX ≤ 5MB)</button>
      </div>

      {notice && <p className="success">{notice}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function Input({ label, name, form, errors, onChange, wide }) {
  return (
    <label className={wide ? 'wide' : ''}>{label}
      <input name={name} value={form[name]} onChange={onChange} />
      {errors[name] && <span className="error">{errors[name]}</span>}
    </label>
  );
}
