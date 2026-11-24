import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { Confirm, Modal, StatusBadge, Toast } from '../components/ui';
import { JOB_STATUS, REPORT_STATUS, dateText } from '../utils/format';

// MH-12 – Trang Quản trị: quản lý người dùng (PB-15), kiểm duyệt tin (PB-16, PB-24)
// và MH-16 – tab Báo cáo tin (PB-21).
const TABS = [['users', 'Người dùng'], ['jobs', 'Tin đăng'], ['reports', 'Báo cáo tin']];

const ROLE = { STUDENT: 'Sinh viên', EMPLOYER: 'Nhà tuyển dụng', ADMIN: 'Quản trị viên' };
const USER_STATUS = { ACTIVE: ['Đang hoạt động', 'open'], LOCKED: ['Đã khóa', 'rejected'] };

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === searchParams.get('tab')) ? searchParams.get('tab') : 'users';
  const [pendingReports, setPendingReports] = useState(0);

  const pickTab = (k) => {
    setSearchParams(k === 'users' ? {} : { tab: k }, { replace: true });
  };

  // Số tin đang có báo cáo chờ xử lý, hiện trên nhãn tab
  const countReports = useCallback(() => {
    client.get('/api/admin/reports', { params: { status: 'PENDING' } })
      .then((res) => setPendingReports(res.data.length))
      .catch(() => {});
  }, []);
  useEffect(() => { countReports(); }, [countReports]);

  return (
    <div className="list-page admin">
      <div className="page-head">
        <div>
          <h1>Quản trị</h1>
          <p className="lead">Duyệt tin mới, xử lý báo cáo, khóa tài khoản vi phạm và ẩn tin sai quy định. Không xóa dữ liệu, có thể mở lại khi cần.</p>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''}
            onClick={() => pickTab(k)}>{label}{k === 'reports' && pendingReports > 0 ? ` (${pendingReports})` : ''}</button>
        ))}
      </div>
      {tab === 'users' && <UsersTab />}
      {tab === 'jobs' && <JobsTab />}
      {tab === 'reports' && <ReportsTab onChanged={countReports} />}
    </div>
  );
}

// Dùng chung cho 2 tab: tải danh sách theo bộ lọc, hộp thoại xác nhận, thông báo nổi
function useAdminList(url, params) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const key = JSON.stringify(params);
  const load = useCallback(() => {
    client.get(url, { params: JSON.parse(key) })
      .then((res) => { setList(res.data); setError(''); })
      .catch((err) => setError(errorMessage(err)));
  }, [url, key]);
  useEffect(() => {
    const t = setTimeout(load, 250);   // gõ ô tìm kiếm xong mới gọi API
    return () => clearTimeout(t);
  }, [load]);
  return { list, setList, error, reload: load };
}

function UsersTab() {
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const { list, setList, error } = useAdminList('/api/admin/users', { role: role || undefined, q: q || undefined });
  const [ask, setAsk] = useState(null);   // người dùng cần xác nhận khóa / mở khóa
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  const toggle = async () => {
    const lock = ask.status === 'ACTIVE';
    setBusy(true);
    try {
      const res = await client.patch(`/api/admin/users/${ask.id}/${lock ? 'lock' : 'unlock'}`);
      setList((l) => l.map((u) => (u.id === res.data.id ? res.data : u)));
      setToast({ text: lock ? `Đã khóa tài khoản ${ask.email}` : `Đã mở khóa tài khoản ${ask.email}`, type: 'success' });
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAsk(null);
    }
  };

  return (
    <>
      <div className="admin-filter">
        <input type="search" placeholder="Tìm theo email hoặc họ tên" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm người dùng" />
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Lọc vai trò">
          <option value="">Mọi vai trò</option>
          {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {list && <span className="admin-count">{list.length} tài khoản</span>}
      </div>

      {error && <div className="card muted-box"><b>{error}</b></div>}
      {!list && !error && <div className="card muted-box">Đang tải danh sách người dùng...</div>}
      {list && list.length === 0 && <div className="card muted-box"><b>Không có tài khoản nào khớp bộ lọc</b></div>}

      {list && list.length > 0 && (
        <div className="card admin-table">
          <table>
            <thead><tr><th>Người dùng</th><th>Vai trò</th><th>Ngày tạo</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/admin/users/${u.id}`}><b>{u.fullName}</b></Link>
                    <small>{u.email}</small>
                  </td>
                  <td>{ROLE[u.role]}</td>
                  <td>{dateText(u.createdAt)}</td>
                  <td><StatusBadge map={USER_STATUS} value={u.status} /></td>
                  <td className="act">
                    {u.role !== 'ADMIN' && (
                      <button type="button" className={`btn small ${u.status === 'ACTIVE' ? 'ghost' : 'primary'}`} onClick={() => setAsk(u)}>
                        {u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ask && (
        <Confirm
          title={ask.status === 'ACTIVE' ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
          text={ask.status === 'ACTIVE'
            ? `${ask.fullName} (${ask.email}) sẽ không đăng nhập được nữa cho tới khi được mở khóa. Dữ liệu của tài khoản vẫn được giữ.`
            : `${ask.fullName} (${ask.email}) sẽ đăng nhập lại được bình thường.`}
          okText={ask.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
          danger={ask.status === 'ACTIVE'}
          busy={busy}
          onOk={toggle}
          onClose={() => setAsk(null)}
        />
      )}
      <Toast {...toast} onClose={closeToast} />
    </>
  );
}

const JOB_FILTERS = [
  ['PENDING', 'Chờ duyệt'],
  ['', 'Tất cả'],
  ['VISIBLE', 'Đang hiển thị'],
  ['REJECTED', 'Đã từ chối'],
  ['HIDDEN', 'Đã ẩn'],
];

const VISIBLE_STATUSES = [
  ['', 'Trạng thái: Tất cả'],
  ['OPEN', 'Đang tuyển'],
  ['FILLED', 'Đã đủ người'],
  ['COMPLETED', 'Đã hoàn thành'],
  ['CLOSED', 'Đã đóng'],
];

function JobsTab() {
  const VALID_FILTERS = ['', 'PENDING', 'VISIBLE', 'REJECTED', 'HIDDEN'];
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const urlFilter = searchParams.get('filter') || '';
  const filter = VALID_FILTERS.includes(urlFilter) ? urlFilter : '';
  const highlightId = Number(searchParams.get('jobId')) || null;

  const [statusFilter, setStatusFilter] = useState('');
  const [q, setQ] = useState('');

  const pickFilter = (v) => {
    const next = { tab: 'jobs' };
    if (v) next.filter = v;
    setSearchParams(next, { replace: true });
    setStatusFilter('');
  };

  const params = {
    q: q || undefined,
    status: (filter === 'PENDING' || filter === 'REJECTED') ? filter : undefined,
    hidden: filter === 'HIDDEN' ? 'true' : (filter === 'VISIBLE' ? 'false' : undefined),
  };

  const { list, error, reload } = useAdminList('/api/admin/jobs', params);
  const [ask, setAsk] = useState(null); // { type: 'approve' | 'reject' | 'hide' | 'unhide', job }
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  const openAsk = (type, job) => {
    setReason('');
    setAsk({ type, job });
  };

  useEffect(() => {
    if (location.state?.fromNotif) reload();
  }, [location.state?.fromNotif, reload]);

  const submitAction = async () => {
    const { type, job } = ask;
    setBusy(true);
    try {
      if (type === 'approve') {
        await client.patch(`/api/admin/jobs/${job.id}/approve`);
        setToast({ text: `Đã duyệt tin "${job.title}"`, type: 'success' });
      } else if (type === 'reject') {
        await client.patch(`/api/admin/jobs/${job.id}/reject`, { reason: reason.trim() || null });
        setToast({ text: `Đã từ chối tin "${job.title}"`, type: 'success' });
      } else if (type === 'hide') {
        await client.patch(`/api/admin/jobs/${job.id}/hide`);
        setToast({ text: `Đã ẩn tin "${job.title}"`, type: 'success' });
      } else {
        await client.patch(`/api/admin/jobs/${job.id}/unhide`);
        setToast({ text: `Đã hiện lại tin "${job.title}"`, type: 'success' });
      }
      reload();
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAsk(null);
    }
  };

  const shown = (list || []).filter(
    (j) => filter !== 'VISIBLE' || !statusFilter || j.status === statusFilter,
  );
  const keepTable = filter === 'VISIBLE' && statusFilter !== '';

  return (
    <>
      <div className="admin-filter">
        <div className="tabs small-tabs">
          {JOB_FILTERS.map(([v, label]) => (
            <button
              key={v}
              type="button"
              className={filter === v ? 'on' : ''}
              onClick={() => { pickFilter(v);}}
            >
              {label}
            </button>
          ))}
        </div>
        {list && <span className="admin-count">{shown.length} tin</span>}
        <input
          type="search"
          className="admin-search"
          placeholder="Tìm tiêu đề, công ty..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Tìm tin"
        />
      </div>

      {error && <div className="card muted-box"><b>{error}</b></div>}
      {!list && !error && <div className="card muted-box">Đang tải danh sách tin...</div>}
      {list && shown.length === 0 && !keepTable && (
        <div className="card muted-box"><b>Không có tin nào khớp bộ lọc</b></div>
      )}

      {list && (shown.length > 0 || keepTable) && (
        <div className="card admin-table">
          <table>
            <thead>
              <tr>
                <th>Tin tuyển dụng</th>
                <th>Khu vực</th>
                <th>Ngày đăng</th>
                <th>
                  {filter === 'VISIBLE' ? (
                    <select
                      className={`th-select ${statusFilter ? 'on' : ''}`}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Lọc trạng thái tin"
                    >
                      {VISIBLE_STATUSES.map(([v, label]) => (
                        <option key={v} value={v}>{label}</option>
                      ))}
                    </select>
                  ) : 'Trạng thái'}
                </th>
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-row">
                    Không có tin nào ở trạng thái này.{' '}
                    <button type="button" className="link-btn" onClick={() => setStatusFilter('')}>
                      Xem tất cả
                    </button>
                  </td>
                </tr>
              ) : (
                shown.map((j) => (
                  <tr key={j.id} className={`${j.hidden ? 'dim' : ''} ${highlightId === j.id ? 'hl' : ''}`.trim()}>
                    <td>
                      <Link to={`/admin/jobs/${j.id}`}><b>{j.title}</b></Link>
                      <small>{j.companyName} · {j.category}</small>
                      {j.status === 'REJECTED' && j.rejectReason && (
                        <small className="reject-reason">Lý do từ chối: {j.rejectReason}</small>
                      )}
                    </td>
                    <td>{j.location}</td>
                    <td>{dateText(j.createdAt)}</td>
                    <td>{j.hidden ? <span className="badge rejected">Đã ẩn</span> : <StatusBadge map={JOB_STATUS} value={j.status} />}</td>
                    <td className="act">
                      <div className="row-btns" style={{ justifyContent: 'flex-end' }}>
                        {j.status === 'PENDING' && (
                          <>
                            <button type="button" className="btn primary small" onClick={() => openAsk('approve', j)}>Duyệt</button>
                            <button type="button" className="btn ghost small" onClick={() => openAsk('reject', j)}>Từ chối</button>
                          </>
                        )}
                        {j.status === 'REJECTED' && (
                          <button type="button" className="btn primary small" onClick={() => openAsk('approve', j)}>Duyệt lại</button>
                        )}
                        {j.status !== 'PENDING' && j.status !== 'REJECTED' && (
                          <button
                            type="button"
                            className={`btn small ${j.hidden ? 'primary' : 'ghost'}`}
                            onClick={() => openAsk(j.hidden ? 'unhide' : 'hide', j)}
                          >
                            {j.hidden ? 'Hiện lại' : 'Ẩn tin'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {ask?.type === 'approve' && (
        <Confirm
          title="Duyệt tin tuyển dụng?"
          text={`Tin "${ask.job.title}" của ${ask.job.companyName} sẽ được hiển thị công khai trên trang chủ và gửi thông báo tới các sinh viên phù hợp.`}
          okText="Duyệt tin"
          busy={busy}
          onOk={submitAction}
          onClose={() => setAsk(null)}
        />
      )}

      {ask?.type === 'reject' && (
        <Modal title="Từ chối duyệt tin" onClose={() => setAsk(null)} footer={(
          <>
            <button type="button" className="btn link" onClick={() => setAsk(null)}>Hủy</button>
            <button type="button" className="btn danger" disabled={busy} onClick={submitAction}>
              {busy ? 'Đang xử lý...' : 'Từ chối tin'}
            </button>
          </>
        )}>
          <p className="modal-text">
            Tin <b>{ask.job.title}</b> sẽ không hiển thị công khai. Nhà tuyển dụng sẽ nhận thông báo và có thể sửa lại để gửi duyệt.
          </p>
          <label>Lý do từ chối <small>(không bắt buộc, tối đa 500 ký tự)</small>
            <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Mức lương không rõ ràng, nội dung thiếu thông tin ca làm..." />
            <small className="count">{reason.length}/500</small>
          </label>
        </Modal>
      )}

      {(ask?.type === 'hide' || ask?.type === 'unhide') && (
        <Confirm
          title={ask.type === 'unhide' ? 'Hiện lại tin?' : 'Ẩn tin vi phạm?'}
          text={ask.type === 'unhide'
            ? `Tin "${ask.job.title}" sẽ hiện lại trong kết quả tìm kiếm.`
            : `Tin "${ask.job.title}" của ${ask.job.companyName} sẽ biến mất khỏi tìm kiếm và trang chi tiết, sinh viên không ứng tuyển được. Nhà tuyển dụng sẽ nhận thông báo. Tin không bị xóa.`}
          okText={ask.type === 'unhide' ? 'Hiện lại' : 'Ẩn tin'}
          danger={ask.type === 'hide'}
          busy={busy}
          onOk={submitAction}
          onClose={() => setAsk(null)}
        />
      )}

      <Toast {...toast} onClose={closeToast} />
    </>
  );
}

const REPORT_FILTERS = [['PENDING', 'Chờ xử lý'], ['RESOLVED', 'Đã gỡ tin'], ['DISMISSED', 'Đã bỏ qua'], ['', 'Tất cả']];

// MH-16 – Xử lý báo cáo tin (PB-21): mỗi dòng là một tin cùng các báo cáo cùng trạng thái, khung bên phải là chi tiết
function ReportsTab({ onChanged }) {
  const [status, setStatus] = useState('PENDING');
  const { list, error, reload } = useAdminList('/api/admin/reports', { status: status || undefined });
  const [selected, setSelected] = useState(null);   // khóa jobId:status của dòng đang xem
  const [ask, setAsk] = useState(null);             // { action: 'HIDE_JOB' | 'DISMISS', row }
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ text: '' });
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.fromNotif) { reload(); onChanged(); }
  }, [location.state?.fromNotif, reload, onChanged]);

  const keyOf = (r) => `${r.jobId}:${r.status}`;
  const current = (list || []).find((r) => keyOf(r) === selected) || (list && list[0]) || null;

  const submit = async () => {
    const { action, row } = ask;
    setBusy(true);
    try {
      const res = await client.patch(`/api/admin/reports/${row.reportId}`, { action });
      setToast({
        text: action === 'HIDE_JOB'
          ? `Đã gỡ tin "${row.jobTitle}" và xử lý ${res.data.handledCount} báo cáo`
          : `Đã bỏ qua ${res.data.handledCount} báo cáo của tin "${row.jobTitle}"`,
        type: 'success',
      });
      setSelected(null);
      reload();
      onChanged();
    } catch (err) {
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setBusy(false);
      setAsk(null);
    }
  };

  return (
    <>
      <div className="admin-filter">
        <div className="tabs small-tabs">
          {REPORT_FILTERS.map(([v, label]) => (
            <button key={v} type="button" className={status === v ? 'on' : ''}
              onClick={() => { setStatus(v); setSelected(null); }}>{label}</button>
          ))}
        </div>
        {list && <span className="admin-count">{list.length} tin bị báo cáo</span>}
      </div>

      {error && <div className="card muted-box"><b>{error}</b></div>}
      {!list && !error && <div className="card muted-box">Đang tải danh sách báo cáo...</div>}
      {list && list.length === 0 && (
        <div className="card muted-box">
          <b>{status === 'PENDING' ? 'Không có báo cáo nào đang chờ xử lý' : 'Không có báo cáo nào ở mục này'}</b>
          <p>Sinh viên báo cáo tin ở trang chi tiết tin, báo cáo mới sẽ hiện ở mục Chờ xử lý.</p>
        </div>
      )}

      {list && list.length > 0 && (
        <div className="report-layout">
          <div className="card admin-table">
            <table>
              <thead>
                <tr><th>Tin bị báo cáo</th><th>Lượt</th><th>Lý do chính</th><th>Gần nhất</th><th>Trạng thái</th><th aria-label="Thao tác" /></tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={keyOf(r)} className={current && keyOf(current) === keyOf(r) ? 'hl' : ''}>
                    <td>
                      <Link to={`/admin/jobs/${r.jobId}`}><b>{r.jobTitle}</b></Link>
                      <small>{r.companyName}{r.jobHidden ? ' · Tin đang bị ẩn' : ''}</small>
                    </td>
                    <td><b>{r.reportCount}</b></td>
                    <td>{r.mainReasonLabel}</td>
                    <td>{dateText(r.latestAt)}</td>
                    <td><StatusBadge map={REPORT_STATUS} value={r.status} /></td>
                    <td className="act">
                      <div className="row-btns" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="btn ghost small" onClick={() => setSelected(keyOf(r))}>Xem</button>
                        {r.status === 'PENDING' && (
                          <>
                            <button type="button" className="btn danger small" onClick={() => setAsk({ action: 'HIDE_JOB', row: r })}>Gỡ tin</button>
                            <button type="button" className="btn ghost small" onClick={() => setAsk({ action: 'DISMISS', row: r })}>Bỏ qua</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {current && (
            <aside className="card report-detail">
              <h2>Chi tiết báo cáo</h2>
              <Link to={`/admin/jobs/${current.jobId}`} className="report-job"><b>{current.jobTitle}</b></Link>
              <span className="report-sub">{current.companyName} · {current.reportCount} lượt báo cáo</span>
              <ul className="report-items">
                {current.reports.map((x) => (
                  <li key={x.id}>
                    <span className="filter-chip plain">{x.reasonLabel}</span>
                    <p>{x.description || 'Không có mô tả thêm.'}</p>
                    <small>{x.reporterName} · {dateText(x.createdAt)}{x.handledAt ? ` · Xử lý ${dateText(x.handledAt)}` : ''}</small>
                  </li>
                ))}
              </ul>
              {current.status === 'PENDING' && (
                <div className="report-actions">
                  <button type="button" className="btn danger" onClick={() => setAsk({ action: 'HIDE_JOB', row: current })}>Gỡ tin</button>
                  <button type="button" className="btn ghost" onClick={() => setAsk({ action: 'DISMISS', row: current })}>Bỏ qua</button>
                </div>
              )}
            </aside>
          )}
        </div>
      )}

      {ask && (
        <Confirm
          title={ask.action === 'HIDE_JOB' ? 'Gỡ tin bị báo cáo?' : 'Bỏ qua báo cáo?'}
          text={ask.action === 'HIDE_JOB'
            ? `Tin "${ask.row.jobTitle}" sẽ bị ẩn khỏi tìm kiếm và trang chi tiết. Nhà tuyển dụng và ${ask.row.reportCount} sinh viên đã báo cáo sẽ nhận thông báo. Có thể hiện lại tin ở tab Tin đăng.`
            : `${ask.row.reportCount} báo cáo của tin "${ask.row.jobTitle}" sẽ chuyển sang Đã bỏ qua, tin vẫn hiển thị. Sinh viên đã báo cáo sẽ nhận thông báo kết quả.`}
          okText={ask.action === 'HIDE_JOB' ? 'Gỡ tin' : 'Bỏ qua'}
          danger={ask.action === 'HIDE_JOB'}
          busy={busy}
          onOk={submit}
          onClose={() => setAsk(null)}
        />
      )}
      <Toast {...toast} onClose={closeToast} />
    </>
  );
}
