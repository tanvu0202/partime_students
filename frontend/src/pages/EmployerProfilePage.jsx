import { useEffect, useState } from 'react';
import client, { errorMessage, fieldErrors } from '../api/client';

const EMPTY = { companyName: '', description: '', contactEmail: '', contactPhone: '', address: '' };

// MH-06 – Hồ sơ nhà tuyển dụng (B6-09)
export default function EmployerProfilePage() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/api/employers/me')
      .then(({ data }) => setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? '']))))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async (e) => {
    e.preventDefault();
    setNotice(''); setError(''); setErrors({});
    try {
      await client.put('/api/employers/me', form);
      setNotice('Đã lưu hồ sơ công ty');
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    }
  };

  const fields = [
    ['companyName', 'Tên đơn vị / cá nhân *'],
    ['contactEmail', 'Email liên hệ'],
    ['contactPhone', 'Số điện thoại liên hệ'],
    ['address', 'Địa chỉ'],
  ];

  return (
    <div className="card">
      <h1>Hồ sơ nhà tuyển dụng</h1>
      <form onSubmit={onSave} noValidate className="grid">
        {fields.map(([name, label]) => (
          <label key={name}>{label}
            <input name={name} value={form[name]} onChange={onChange} />
            {errors[name] && <span className="error">{errors[name]}</span>}
          </label>
        ))}
        <label className="wide">Mô tả
          <textarea name="description" rows="4" value={form.description} onChange={onChange} />
        </label>
        <div className="wide"><button className="btn primary">Lưu hồ sơ</button></div>
      </form>
      {notice && <p className="success">{notice}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
