import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { initials } from '../components/Layout';
import { Modal, StatusBadge, Toast } from '../components/ui';
import { APP_STATUS, JOB_STATUS, dateText, daysAgo, salaryText } from '../utils/format';

// MH-03 – Chi tiết tin + hộp thoại ứng tuyển (PB-08, PB-09)
export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [myApp, setMyApp] = useState(null);      // đơn của SV cho tin này (nếu đã nộp)
  const [cvUrl, setCvUrl] = useState(undefined); // CV trong hồ sơ SV
  const [open, setOpen] = useState(false);
  const [letter, setLetter] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    client.get(`/api/jobs/${id}`)
      .then((res) => setJob(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  // Sinh viên: kiểm tra đã ứng tuyển tin này chưa và hồ sơ đã có CV chưa
  useEffect(() => {
    if (!isStudent) return;
    client.get('/api/applications/me')
      .then((res) => setMyApp(res.data.find((a) => String(a.jobId) === String(id)) || null))
      .catch(() => {});
    client.get('/api/students/me')
      .then((res) => setCvUrl(res.data.cvUrl || null))
      .catch(() => setCvUrl(null));
  }, [isStudent, id]);

  const apply = async () => {
    setSending(true);
    try {
      const res = await client.post(`/api/jobs/${id}/applications`, { coverLetter: letter });
      setMyApp(res.data);
      setOpen(false);
      setToast({ text: 'Đã gửi đơn ứng tuyển. Theo dõi kết quả ở trang Đơn của tôi', type: 'success' });
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setSending(false);
    }
  };

  if (error) {
    return (
      <div className="card muted-box">
        <b>{error}</b>
        <p><Link to="/">Quay lại danh sách việc làm</Link></p>
      </div>
    );
  }
  if (!job) return <div className="card muted-box">Đang tải tin tuyển dụng...</div>;

  const isOpen = job.status === 'OPEN';

  let action;
  if (!user) {
    action = <button type="button" className="btn primary big full" onClick={() => navigate('/login', { state: { from: `/jobs/${id}` } })}>Đăng nhập để ứng tuyển</button>;
  } else if (isStudent && myApp) {
    action = (
      <div className="applied">
        <span>Bạn đã ứng tuyển ngày {dateText(myApp.appliedAt)}</span>
        <StatusBadge map={APP_STATUS} value={myApp.status} />
        <Link to="/student/applications" className="btn ghost full">Xem đơn của tôi</Link>
      </div>
    );
  } else if (isStudent) {
    action = (
      <button type="button" className="btn primary big full" disabled={!isOpen} onClick={() => setOpen(true)}>
        {isOpen ? 'Ứng tuyển ngay' : 'Tin đã ngừng nhận hồ sơ'}
      </button>
    );
  } else {
    action = <p className="hint">Chỉ tài khoản sinh viên mới ứng tuyển được.</p>;
  }

  return (
    <div className="detail">
      <div className="crumb"><Link to="/">Việc làm</Link> / {job.category} / {job.title}</div>

      <section className="card detail-head">
        <div className="job-logo big">{initials(job.companyName)}</div>
        <div className="detail-title">
          <h1>{job.title}</h1>
          <div className="job-company">{job.companyName}</div>
          <div className="job-meta">
            <StatusBadge map={JOB_STATUS} value={job.status} />
            <span className="chip">{job.category}</span>
            <span className="when">{daysAgo(job.createdAt)}</span>
          </div>
        </div>
        <div className="detail-action">{action}</div>
      </section>

      <div className="detail-grid">
        <section className="card">
          <div className="facts">
            <div><span>Mức lương</span><b className="salary">{salaryText(job)}</b></div>
            <div><span>Địa điểm</span><b>{job.location}</b></div>
            <div><span>Thời gian làm việc</span><b>{job.workTime}</b></div>
            <div><span>Số lượng cần tuyển</span><b>{job.slots} người</b></div>
          </div>
          <h2>Mô tả công việc</h2>
          <p className="desc">{job.description}</p>
        </section>

        <aside className="side-col">
          <div className="card">
            <h2>Nhà tuyển dụng</h2>
            <div className="preview">
              <div className="job-logo">{initials(job.companyName)}</div>
              <div><b>{job.companyName}</b><span>{job.companyAddress || 'Chưa cập nhật địa chỉ'}</span></div>
            </div>
            {job.companyDescription && <p className="preview-text">{job.companyDescription}</p>}
            {/* Khách chưa đăng nhập không thấy email, số điện thoại (backend cũng không trả về) */}
            {user ? (
              <div className="preview-contact">
                {job.contactEmail && <span>{job.contactEmail}</span>}
                {job.contactPhone && <span>{job.contactPhone}</span>}
              </div>
            ) : (
              <div className="contact-locked">
                <span>Email và số điện thoại liên hệ chỉ hiện khi bạn đã đăng nhập.</span>
                <Link to="/login" state={{ from: `/jobs/${id}` }}>Đăng nhập để xem</Link>
              </div>
            )}
          </div>
          <div className="card dark-card">
            <span>Mẹo ứng tuyển</span>
            <b>Viết 2–3 câu về lịch rảnh và kinh nghiệm liên quan để nhà tuyển dụng duyệt nhanh hơn</b>
          </div>
        </aside>
      </div>

      {open && (
        <Modal title="Ứng tuyển" onClose={() => setOpen(false)} footer={(
          <>
            <button type="button" className="btn link" onClick={() => setOpen(false)}>Hủy</button>
            <button type="button" className="btn primary" disabled={sending} onClick={apply}>
              {sending ? 'Đang gửi...' : 'Gửi đơn ứng tuyển'}
            </button>
          </>
        )}>
          <div className="apply-job">
            <b>{job.title}</b>
            <span>{job.companyName} · {salaryText(job)}</span>
          </div>
          <div className={`cv-note ${cvUrl ? 'ok' : 'warn'}`}>
            {cvUrl === undefined && 'Đang kiểm tra CV trong hồ sơ...'}
            {cvUrl === null && (
              <>Hồ sơ của bạn chưa có CV. Bạn vẫn gửi được đơn, nhưng nên <Link to="/student/profile">tải CV lên hồ sơ</Link> trước.</>
            )}
            {cvUrl && <>Đơn sẽ gửi kèm CV trong hồ sơ của bạn.</>}
          </div>
          <label>Thư giới thiệu <small>(không bắt buộc)</small>
            <textarea rows="5" maxLength={2000} value={letter} onChange={(e) => setLetter(e.target.value)}
              placeholder="Giới thiệu ngắn về bản thân, lịch rảnh trong tuần, kinh nghiệm liên quan..." />
            <span className="count">{letter.length}/2000 ký tự</span>
          </label>
        </Modal>
      )}
      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}
