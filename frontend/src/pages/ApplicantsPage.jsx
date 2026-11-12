import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client, { API_URL, errorMessage } from '../api/client';
import { initials } from '../components/Layout';
import { Confirm, StatusBadge, Toast } from '../components/ui';
import { APP_STATUS, JOB_STATUS, dateText, salaryText } from '../utils/format';

const TABS = [['PENDING', 'Chờ duyệt'], ['ACCEPTED', 'Đã nhận'], ['REJECTED', 'Đã từ chối'], ['ALL', 'Tất cả']];

// MH-09 – Danh sách ứng viên của một tin, duyệt / từ chối (PB-11)
export default function ApplicantsPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('PENDING');
  const [ask, setAsk] = useState(null); // { app, status }
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  useEffect(() => {
    client.get(`/api/employers/me/jobs/${id}`).then((res) => setJob(res.data)).catch((err) => setError(errorMessage(err)));
    client.get(`/api/jobs/${id}/applications`).then((res) => setList(res.data)).catch((err) => setError(errorMessage(err)));
  }, [id]);

  const decide = async () => {
    setBusy(true);
    try {
      const res = await client.patch(`/api/applications/${ask.app.id}/status`, { status: ask.status });
      setList((l) => l.map((a) => (a.id === res.data.id ? res.data : a)));
      setToast({ text: ask.status === 'ACCEPTED' ? `Đã nhận ${ask.app.fullName}` : `Đã từ chối ${ask.app.fullName}`, type: 'success' });
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAsk(null);
    }
  };

  if (error) {
    return <div className="card muted-box"><b>{error}</b><p><Link to="/employer/jobs">Quay lại Tin của tôi</Link></p></div>;
  }

  const count = (s) => (list || []).filter((a) => s === 'ALL' || a.status === s).length;
  const shown = (list || []).filter((a) => tab === 'ALL' || a.status === tab);
  const accepted = count('ACCEPTED');

  return (
    <div className="list-page">
      <div className="crumb"><Link to="/employer/jobs">Tin của tôi</Link> / Ứng viên</div>
      {job && (
        <section className="card job-strip">
          <div>
            <h1>{job.title}</h1>
            <div className="job-meta">
              <StatusBadge map={JOB_STATUS} value={job.status} />
              <span className="salary">{salaryText(job)}</span>
              <span className="chip">{job.location}</span>
              <span className="chip">{job.workTime}</span>
            </div>
          </div>
          <div className="slots">
            <b>{accepted}/{job.slots}</b>
            <span>đã nhận / cần tuyển</span>
            <i><u style={{ width: `${Math.min(100, (accepted / job.slots) * 100)}%` }} /></i>
          </div>
        </section>
      )}

      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label}<em>{count(k)}</em>
          </button>
        ))}
      </div>

      {!list && <div className="card muted-box">Đang tải danh sách ứng viên...</div>}
      {list && shown.length === 0 && (
        <div className="card muted-box">
          <b>{list.length === 0 ? 'Tin này chưa có ai ứng tuyển' : 'Không có ứng viên ở mục này'}</b>
          <p>Ứng viên mới sẽ hiện ở mục Chờ duyệt.</p>
        </div>
      )}

      <div className="rows">
        {shown.map((a) => (
          <article key={a.id} className={`row-card applicant st-${APP_STATUS[a.status]?.[1]}`}>
            <div className="avatar big-av">{initials(a.fullName)}</div>
            <div className="row-main">
              <b className="app-name">{a.fullName}</b>
              <div className="job-company">{[a.school, a.major].filter(Boolean).join(' · ') || 'Chưa cập nhật trường, ngành'}</div>
              {a.skills && (
                <div className="chips">{a.skills.split(',').map((s) => s.trim()).filter(Boolean).map((s) => <em key={s}>{s}</em>)}</div>
              )}
              {a.coverLetter && <p className="letter">{a.coverLetter}</p>}
              <div className="contact">
                <span>{a.email}</span>
                {a.phone && <span>{a.phone}</span>}
                <span>Nộp ngày {dateText(a.appliedAt)}</span>
                {a.cvUrl
                  ? <a href={API_URL + a.cvUrl} target="_blank" rel="noreferrer">Xem CV</a>
                  : <span>Không kèm CV</span>}
              </div>
            </div>
            <div className="row-side">
              <StatusBadge map={APP_STATUS} value={a.status} />
              {a.status === 'PENDING' && (
                <div className="decide">
                  <button type="button" className="btn primary small" onClick={() => setAsk({ app: a, status: 'ACCEPTED' })}>Duyệt</button>
                  <button type="button" className="btn ghost small" onClick={() => setAsk({ app: a, status: 'REJECTED' })}>Từ chối</button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {ask && (
        <Confirm
          title={ask.status === 'ACCEPTED' ? 'Duyệt ứng viên?' : 'Từ chối ứng viên?'}
          text={ask.status === 'ACCEPTED'
            ? `${ask.app.fullName} sẽ thấy đơn chuyển sang "Đã được nhận". Bạn nên liên hệ qua ${ask.app.email} để hẹn lịch làm việc.`
            : `${ask.app.fullName} sẽ thấy đơn chuyển sang "Chưa phù hợp". Không đổi lại được sau khi xác nhận.`}
          okText={ask.status === 'ACCEPTED' ? 'Duyệt' : 'Từ chối'}
          danger={ask.status === 'REJECTED'}
          busy={busy}
          onOk={decide}
          onClose={() => setAsk(null)}
        />
      )}
      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}
