import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import client, { errorMessage, fieldErrors } from '../api/client';
import { Toast } from '../components/ui';
import { CATEGORIES, UNIT, salaryText } from '../utils/format';
import { DAYS, QUICK, checkWorkTime, composeWorkTime, parseWorkTime } from '../utils/workTime';

const EMPTY = {
  title: '', category: '', location: '', salaryMin: '', salaryMax: '', salaryUnit: 'HOUR',
  workTime: '', slots: 1, description: '',
};

// MH-08 – Form đăng / sửa tin (PB-05, PB-06). Dùng chung một form cho cả đăng mới và sửa.
export default function JobFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ text: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [wt, setWt] = useState(parseWorkTime('')); // ngày + giờ làm, ghép thành form.workTime khi lưu
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  useEffect(() => {
    if (!editing) return;
    client.get(`/api/employers/me/jobs/${id}`)
      .then(({ data }) => {
        setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? ''])));
        setWt(parseWorkTime(data.workTime || ''));
      })
      .catch((err) => setToast({ text: errorMessage(err), type: 'error' }))
      .finally(() => setLoading(false));
  }, [editing, id]);

  // Gõ lại vào ô nào thì ẩn lỗi của ô đó
  const set = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: undefined });
  };

  // Chọn / bỏ chọn ngày, chọn nhanh cả nhóm ngày
  const changeWt = (next) => {
    setWt(next);
    if (errors.workTime) setErrors({ ...errors, workTime: undefined });
  };
  const toggleDay = (d) => changeWt({ ...wt, days: wt.days.includes(d) ? wt.days.filter((x) => x !== d) : [...wt.days, d] });
  const workTime = composeWorkTime(wt);

  const submit = async (e) => {
    e.preventDefault();
    const wtError = checkWorkTime(wt);
    if (wtError) {
      setErrors({ workTime: wtError });
      setToast({ text: wtError, type: 'error' });
      return;
    }
    setErrors({});
    setSaving(true);
    const body = {
      ...form,
      workTime,
      salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
      salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax),
      slots: form.slots === '' ? null : Number(form.slots),
    };
    try {
      if (editing) await client.put(`/api/jobs/${id}`, body);
      else await client.post('/api/jobs', body);
      navigate('/employer/jobs');
    } catch (err) {
      setErrors(fieldErrors(err));
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, { wide, ...props } = {}) => (
    <label className={wide ? 'wide' : ''}>{label}
      <input name={name} value={form[name]} onChange={set} className={errors[name] ? 'invalid' : ''} {...props} />
      {errors[name] && <span className="error">{errors[name]}</span>}
    </label>
  );

  if (loading) return <div className="card muted-box">Đang tải tin...</div>;

  return (
    <div className="list-page">
      <div className="crumb"><Link to="/employer/jobs">Tin của tôi</Link> / {editing ? 'Sửa tin' : 'Đăng tin mới'}</div>
      <div className="form-grid">
        <form className="card" onSubmit={submit} noValidate>
          <div className="card-head"><h2>{editing ? 'Sửa tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}</h2></div>
          {/* 1. Thông tin chung */}
          <fieldset className="form-sec">
            <legend>Thông tin chung</legend>
            <div className="grid">
              {field('title', 'Tiêu đề tin *', { wide: true, placeholder: 'vd: Phục vụ quán cà phê ca tối', maxLength: 200 })}
              <label>Ngành nghề *
                <select name="category" value={form.category} onChange={set} className={errors.category ? 'invalid' : ''}>
                  <option value="">Chọn ngành nghề</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                {errors.category && <span className="error">{errors.category}</span>}
              </label>
              {field('location', 'Địa điểm *', { placeholder: 'vd: Bình Thạnh, TP.HCM' })}
            </div>
          </fieldset>

          {/* 2. Thời gian làm việc: chọn ngày và khung giờ thay cho ô nhập tay */}
          <fieldset className={`form-sec ${errors.workTime ? 'has-error' : ''}`}>
            <legend>Thời gian làm việc *</legend>
            <div className="wt-row">
              <span className="wt-label">Ngày làm</span>
              <div className="day-pick">
                {DAYS.map((d) => (
                  <button key={d} type="button" className={wt.days.includes(d) ? 'on' : ''}
                    aria-pressed={wt.days.includes(d)} onClick={() => toggleDay(d)}>{d}</button>
                ))}
              </div>
              <div className="day-quick">
                {QUICK.map(([label, days]) => (
                  <button key={label} type="button" className="link-btn" onClick={() => changeWt({ ...wt, days })}>{label}</button>
                ))}
              </div>
            </div>
            <div className="wt-row">
              <span className="wt-label">Khung giờ</span>
              <div className="time-pick">
                <input type="time" value={wt.start} onChange={(e) => changeWt({ ...wt, start: e.target.value })} aria-label="Giờ bắt đầu" />
                <span>đến</span>
                <input type="time" value={wt.end} onChange={(e) => changeWt({ ...wt, end: e.target.value })} aria-label="Giờ kết thúc" />
              </div>
            </div>
            <label className="wt-note">Ghi chú thêm (không bắt buộc)
              <input value={wt.note} maxLength={100} placeholder="vd: có thể xoay ca, làm tối thiểu 3 buổi/tuần"
                onChange={(e) => changeWt({ ...wt, note: e.target.value })} />
            </label>
            <div className="wt-result">Hiển thị trên tin: <b>{workTime || 'chưa chọn'}</b></div>
            {errors.workTime && <span className="error">{errors.workTime}</span>}
          </fieldset>

          {/* 3. Lương và số lượng */}
          <fieldset className="form-sec">
            <legend>Lương và số lượng</legend>
            <div className="grid grid-3">
              {field('salaryMin', 'Lương từ (đồng)', { type: 'number', min: 0, step: 1000, placeholder: 'vd: 25000' })}
              {field('salaryMax', 'Lương đến (đồng)', { type: 'number', min: 0, step: 1000, placeholder: 'vd: 30000' })}
              <label>Tính lương theo *
                <select name="salaryUnit" value={form.salaryUnit} onChange={set}>
                  {Object.entries(UNIT).map(([k, v]) => <option key={k} value={k}>Theo {v}</option>)}
                </select>
              </label>
              {field('slots', 'Cần tuyển (người) *', { type: 'number', min: 1, max: 100 })}
            </div>
          </fieldset>

          {/* 4. Mô tả */}
          <fieldset className="form-sec">
            <legend>Mô tả công việc *</legend>
            <label className="wide">
              <textarea name="description" rows="7" value={form.description} onChange={set} maxLength={5000}
                className={errors.description ? 'invalid' : ''} aria-label="Mô tả công việc"
                placeholder="Công việc cụ thể, yêu cầu, quyền lợi, cách nhận lương..." />
              <span className="count">{form.description.length}/5000 ký tự</span>
              {errors.description && <span className="error">{errors.description}</span>}
            </label>
          </fieldset>
          <div className="form-foot">
            <button className="btn primary big" disabled={saving}>{saving ? 'Đang lưu...' : (editing ? 'Lưu thay đổi' : 'Đăng tin')}</button>
            <Link to="/employer/jobs" className="btn link">Hủy</Link>
          </div>
        </form>

        <aside className="side-col">
          <div className="card">
            <h2>Sinh viên sẽ thấy</h2>
            <article className="job preview-job">
              <div className="job-body">
                <span className="job-title">{form.title || 'Tiêu đề tin của bạn'}</span>
                <div className="job-meta">
                  <span className="salary">{salaryText({ ...form, salaryMin: form.salaryMin || null, salaryMax: form.salaryMax || null })}</span>
                  <span className="chip">{form.location || 'Địa điểm'}</span>
                  <span className="chip">{form.category || 'Ngành nghề'}</span>
                  {workTime && <span className="chip">{workTime}</span>}
                </div>
              </div>
            </article>
          </div>
          <div className="card checklist-card">
            <h2>Tin dễ nhận hồ sơ</h2>
            <ul className="tips">
              <li className={form.title.length >= 10 ? 'ok' : ''}>Tiêu đề nêu rõ vị trí và ca làm</li>
              <li className={form.salaryMin ? 'ok' : ''}>Ghi mức lương cụ thể</li>
              <li className={!checkWorkTime(wt) && workTime ? 'ok' : ''}>Chọn ngày và khung giờ làm việc</li>
              <li className={form.description.length >= 60 ? 'ok' : ''}>Mô tả từ 60 ký tự trở lên</li>
            </ul>
          </div>
        </aside>
      </div>
      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}
