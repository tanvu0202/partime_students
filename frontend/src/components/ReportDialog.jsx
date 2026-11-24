import { useState } from 'react';
import client, { errorMessage } from '../api/client';
import { REPORT_REASONS } from '../utils/format';
import { Modal } from './ui';

// Hộp thoại "Báo cáo tin này" ở trang chi tiết tin (PB-21, WF-17c)
// onDone(message, ok): ok = true khi gửi thành công hoặc đã báo cáo trước đó (409)
export default function ReportDialog({ job, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!reason) { setError('Vui lòng chọn lý do báo cáo'); return; }
    if (reason === 'OTHER' && !text.trim()) { setError('Vui lòng mô tả thêm khi chọn Lý do khác'); return; }
    setBusy(true);
    setError('');
    try {
      await client.post(`/api/jobs/${job.id}/reports`, { reason, description: text.trim() || null });
      onDone('Đã gửi báo cáo. Quản trị viên sẽ xem xét và báo kết quả cho bạn', true);
    } catch (err) {
      if (err.response?.status === 409) onDone(errorMessage(err), true);
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Báo cáo tin này" onClose={onClose} footer={(
      <>
        <button type="button" className="btn link" onClick={onClose}>Hủy</button>
        <button type="button" className="btn danger" disabled={busy} onClick={send}>{busy ? 'Đang gửi...' : 'Gửi báo cáo'}</button>
      </>
    )}>
      <p className="modal-text">
        Tin <b>{job.title}</b> của {job.companyName} có dấu hiệu bất thường? Mỗi tin bạn chỉ báo cáo được một lần.
      </p>
      <fieldset className="report-reasons">
        <legend>Lý do</legend>
        {REPORT_REASONS.map(([v, label]) => (
          <label key={v} className={`report-reason ${reason === v ? 'on' : ''}`}>
            <input type="radio" name="report-reason" value={v} checked={reason === v}
              onChange={() => { setReason(v); setError(''); }} />
            {label}
          </label>
        ))}
      </fieldset>
      <label>Mô tả thêm <small>{reason === 'OTHER' ? '(bắt buộc khi chọn Lý do khác)' : '(không bắt buộc)'}, tối đa 500 ký tự</small>
        <textarea rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Ví dụ: nhà tuyển dụng yêu cầu chuyển 500.000đ tiền đồng phục trước khi nhận việc" />
        <small className="count">{text.length}/500</small>
      </label>
      {error && <p className="alert error">{error}</p>}
    </Modal>
  );
}
