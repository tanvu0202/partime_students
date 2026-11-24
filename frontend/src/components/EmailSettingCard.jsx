import { useEffect, useState } from 'react';
import client, { errorMessage } from '../api/client';

// Thẻ "Thông báo qua email" ở trang Hồ sơ sinh viên và Hồ sơ nhà tuyển dụng (PB-22, WF-17d).
// Bật / tắt lưu ngay bằng PATCH /api/users/me/email-settings; giá trị hiện tại lấy từ GET /api/auth/me.
export default function EmailSettingCard({ role, onMessage }) {
  const [on, setOn] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    client.get('/api/auth/me')
      .then((res) => setOn(res.data.emailNotify !== false))
      .catch(() => setOn(true));
  }, []);

  const toggle = async () => {
    const next = !on;
    setBusy(true);
    try {
      const res = await client.patch('/api/users/me/email-settings', { emailNotify: next });
      setOn(res.data.emailNotify);
      onMessage(res.data.emailNotify ? 'Đã bật nhận email' : 'Đã tắt nhận email', 'success');
    } catch (err) {
      onMessage(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const what = role === 'EMPLOYER'
    ? 'Gửi email cho bạn khi có sinh viên ứng tuyển tin của bạn.'
    : 'Gửi email cho bạn khi đơn ứng tuyển được nhận hoặc chưa phù hợp.';

  return (
    <div className="card">
      <h2>Thông báo qua email</h2>
      <label className="switch-row">
        <input type="checkbox" role="switch" checked={!!on} disabled={on === null || busy} onChange={toggle} />
        <span className="switch-track" aria-hidden="true"><i /></span>
        <span>Nhận email khi trạng thái đơn ứng tuyển thay đổi</span>
      </label>
      <p className="hint">{what} Thông báo trong hệ thống vẫn hiện bình thường khi tắt email.</p>
    </div>
  );
}
