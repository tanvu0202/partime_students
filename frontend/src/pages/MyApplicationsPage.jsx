import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { API_URL, errorMessage } from '../api/client';
import { initials } from '../components/Layout';
import { StatusBadge } from '../components/ui';
import { APP_STATUS, JOB_STATUS, dateText, salaryText } from '../utils/format';

const TABS = [['ALL', 'Tất cả'], ['PENDING', 'Đang chờ duyệt'], ['ACCEPTED', 'Đã được nhận'], ['REJECTED', 'Chưa phù hợp']];

// MH-05 – Đơn ứng tuyển của tôi (PB-10): trạng thái hiển thị bằng nhãn màu
export default function MyApplicationsPage() {
  const [apps, setApps] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('ALL');

  useEffect(() => {
    client.get('/api/applications/me')
      .then((res) => setApps(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const count = (s) => (apps || []).filter((a) => s === 'ALL' || a.status === s).length;
  const shown = (apps || []).filter((a) => tab === 'ALL' || a.status === tab);

  return (
    <div className="list-page">
      <div className="page-head">
        <div>
          <h1>Đơn ứng tuyển của tôi</h1>
          <p className="lead">Theo dõi trạng thái các đơn đã gửi. Nhà tuyển dụng duyệt xong, trạng thái đổi ngay tại đây.</p>
        </div>
        <Link to="/" className="btn accent">Tìm thêm việc</Link>
      </div>

      <div className="tabs">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label}<em>{count(k)}</em>
          </button>
        ))}
      </div>

      {error && <div className="card muted-box"><b>{error}</b></div>}
      {!apps && !error && <div className="card muted-box">Đang tải đơn ứng tuyển...</div>}
      {apps && shown.length === 0 && (
        <div className="card muted-box">
          <b>{apps.length === 0 ? 'Bạn chưa ứng tuyển tin nào' : 'Không có đơn ở mục này'}</b>
          <p>Vào trang Việc làm, chọn một tin phù hợp và bấm Ứng tuyển ngay.</p>
        </div>
      )}

      <div className="rows">
        {shown.map((a) => (
          <article key={a.id} className={`row-card st-${APP_STATUS[a.status]?.[1]}`}>
            <div className="job-logo">{initials(a.companyName)}</div>
            <div className="row-main">
              <Link to={`/jobs/${a.jobId}`} className="job-title">{a.jobTitle}</Link>
              <div className="job-company">{a.companyName} · {a.location}</div>
              <div className="job-meta">
                <span className="salary">{salaryText(a)}</span>
                <span className="chip">Nộp ngày {dateText(a.appliedAt)}</span>
                {a.jobStatus !== 'OPEN' && <StatusBadge map={JOB_STATUS} value={a.jobStatus} />}
                {a.cvUrl
                  ? <a className="chip link-chip" href={API_URL + a.cvUrl} target="_blank" rel="noreferrer">CV đã gửi</a>
                  : <span className="chip">Không kèm CV</span>}
              </div>
              {a.coverLetter && <p className="letter">{a.coverLetter}</p>}
            </div>
            <div className="row-side">
              <StatusBadge map={APP_STATUS} value={a.status} />
              {a.status === 'ACCEPTED' && <small>Nhà tuyển dụng sẽ liên hệ bạn qua email hoặc số điện thoại trong hồ sơ</small>}
              {a.status !== 'PENDING' && a.updatedAt && <small>Cập nhật {dateText(a.updatedAt)}</small>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
