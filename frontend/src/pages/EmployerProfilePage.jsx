import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { errorMessage, fieldErrors } from '../api/client';
import { initials } from '../components/Layout';
import { Progress, PromoBanner, Toast } from '../components/ui';

const BANNERS = [
  { tag: 'Mẹo tuyển dụng', title: 'Tin ghi rõ ca làm và mức lương nhận nhiều đơn hơn', text: 'Sinh viên lọc theo ca và lương, tin thiếu thông tin sẽ khó được tìm thấy.', big: '3x', bigNote: 'lượt ứng tuyển', cta: 'Xem tin của tôi', to: '/employer/jobs', theme: 'yellow' },
  { tag: 'Ưu đãi tháng này', title: 'Đăng tin miễn phí, không giới hạn số tin', text: 'Tin được hiển thị ngay trên trang chủ cho hàng trăm sinh viên.', big: '0đ', bigNote: 'phí đăng tin', cta: 'Đăng tin ngay', to: '/employer/jobs', theme: 'blue' },
  { tag: 'Đánh giá hai chiều', title: 'Điểm đánh giá cao giúp tin của bạn được tin tưởng', text: 'Sau mỗi công việc, hãy đánh giá sinh viên để họ đánh giá lại bạn.', big: '4,8', bigNote: 'điểm trung bình', cta: 'Về trang chủ', to: '/', theme: 'violet' },
];

const EMPTY = { companyName: '', description: '', contactEmail: '', contactPhone: '', address: '' };

const FIELDS = [
  ['companyName', 'Tên đơn vị / cá nhân *', 'vd: The Coffee Corner'],
  ['contactEmail', 'Email liên hệ', 'vd: tuyendung@congty.vn'],
  ['contactPhone', 'Số điện thoại liên hệ', 'vd: 0281234567'],
  ['address', 'Địa chỉ', 'vd: Bình Thạnh, TP.HCM'],
];

// MH-06 – Hồ sơ nhà tuyển dụng (B6-09)
export default function EmployerProfilePage() {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ text: '', type: 'success' });
  const [saving, setSaving] = useState(false);
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  useEffect(() => {
    client.get('/api/employers/me')
      .then(({ data }) => {
        const f = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? '']));
        setForm(f); setSaved(f);
      })
      .catch((err) => setToast({ text: errorMessage(err), type: 'error' }));
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await client.put('/api/employers/me', form);
      setSaved(form);
      setToast({ text: 'Đã lưu hồ sơ công ty', type: 'success' });
    } catch (err) {
      setErrors(fieldErrors(err));
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filled = Object.keys(EMPTY).filter((k) => String(saved[k]).trim()).length;
  const percent = Math.round((filled / Object.keys(EMPTY).length) * 100);
  const changed = JSON.stringify(form) !== JSON.stringify(saved);
  const name = form.companyName || 'Tên đơn vị của bạn';

  return (
    <div className="profile">
      <section className="profile-head employer">
        <div className="big-avatar square">{initials(form.companyName) || 'NT'}</div>
        <div className="profile-who">
          <span className="role-tag">Nhà tuyển dụng</span>
          <h1>{form.companyName || 'Hồ sơ nhà tuyển dụng'}</h1>
          <p>{saved.address || 'Chưa cập nhật địa chỉ'}</p>
          <small>Hồ sơ đầy đủ giúp sinh viên tin tưởng ứng tuyển hơn</small>
        </div>
        <Progress value={percent} />
      </section>

      <PromoBanner items={BANNERS} />

      <div className="profile-grid">
        <form className="card" onSubmit={onSave} noValidate>
          <div className="card-head">
            <h2>Thông tin đơn vị</h2>
            {changed && <span className="unsaved">Có thay đổi chưa lưu</span>}
          </div>
          <div className="grid">
            {FIELDS.map(([key, label, ph]) => (
              <label key={key}>{label}
                <input name={key} value={form[key]} onChange={onChange} placeholder={ph}
                  className={errors[key] ? 'invalid' : ''} />
                {errors[key] && <span className="error">{errors[key]}</span>}
              </label>
            ))}
            <label className="wide">Mô tả
              <textarea name="description" rows="5" value={form.description} onChange={onChange}
                placeholder="Lĩnh vực hoạt động, môi trường làm việc, quyền lợi cho sinh viên..." />
              <span className="count">{form.description.length} ký tự</span>
            </label>
          </div>
          <div className="form-foot">
            <button className="btn primary big" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
            {changed && <button type="button" className="btn link" onClick={() => setForm(saved)}>Hoàn tác</button>}
          </div>
        </form>

        <aside className="side-col">
          <div className="card">
            <h2>Sinh viên sẽ thấy</h2>
            <div className="preview">
              <div className="job-logo">{initials(form.companyName) || 'NT'}</div>
              <div>
                <b>{name}</b>
                <span>{form.address || 'Địa chỉ'}</span>
              </div>
            </div>
            <p className="preview-text">{form.description || 'Phần mô tả sẽ hiện ở đây, bên cạnh tin tuyển dụng của bạn.'}</p>
            <div className="preview-contact">
              <span>{form.contactEmail || 'Email liên hệ'}</span>
              <span>{form.contactPhone || 'Số điện thoại'}</span>
            </div>
          </div>
          <div className="card cta-card">
            <b>Sẵn sàng tuyển người?</b>
            <span>Đăng tin đầu tiên để nhận hồ sơ sinh viên.</span>
            <Link to="/employer/jobs" className="btn accent full">Đến trang Tin của tôi</Link>
          </div>
        </aside>
      </div>
      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}
