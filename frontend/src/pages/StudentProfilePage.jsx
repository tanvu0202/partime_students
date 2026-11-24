import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { fileUrl, errorMessage, fieldErrors } from '../api/client';
import { initials } from '../components/Layout';
import { Progress, PromoBanner, Toast } from '../components/ui';
import { MAX_SKILLS, SKILL_GROUPS, joinSkills, parseSkills } from '../utils/skills';
import EmailSettingCard from '../components/EmailSettingCard';

const BANNERS = [
  { tag: 'Mẹo ứng tuyển', title: 'Đơn có lời giới thiệu riêng được duyệt nhanh hơn', text: 'Viết 2–3 câu nói rõ ca bạn rảnh và kinh nghiệm liên quan.', big: '2x', bigNote: 'tỉ lệ được xem', cta: 'Xem đơn của tôi', to: '/student/applications', theme: 'yellow' },
  { tag: 'Mới trong tuần', title: '42 việc F&B ca tối gần trường đang tuyển', text: 'Phục vụ, pha chế, thu ngân – nhiều nơi nhận sinh viên chưa có kinh nghiệm.', big: '42', bigNote: 'việc mới', cta: 'Xem ngay', to: '/', theme: 'violet' },
  { tag: 'Tài trợ', title: 'Sunrise English tuyển 10 trợ giảng tiếng Anh buổi tối', text: 'Đào tạo miễn phí trước khi nhận lớp · Quận 3.', big: '60K', bigNote: 'mỗi giờ', cta: 'Xem việc gia sư', to: '/', theme: 'blue' },
];

const EMPTY = { fullName: '', phone: '', school: '', major: '', skills: '', bio: '' };

// Mục kiểm tra để tính % hoàn thiện hồ sơ
const CHECKS = [
  ['fullName', 'Họ tên'], ['phone', 'Số điện thoại'], ['school', 'Trường'],
  ['major', 'Ngành học'], ['skills', 'Kỹ năng'], ['bio', 'Giới thiệu bản thân'], ['cv', 'CV đính kèm'],
];

// MH-04 – Hồ sơ sinh viên (B6-09)
export default function StudentProfilePage() {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [info, setInfo] = useState({ email: '', cvUrl: null });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ text: '', type: 'success' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [oldSkills, setOldSkills] = useState([]);
  const closeToast = useCallback(() => setToast({ text: '' }), []);

  useEffect(() => {
    client.get('/api/students/me')
      .then(({ data }) => {
        const f = Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? '']));
        // Kỹ năng nhập tay từ trước không có trong danh sách: báo cho sinh viên, không đưa vào form
        const { known, unknown } = parseSkills(f.skills);
        f.skills = joinSkills(known);
        setOldSkills(unknown);
        setForm(f); setSaved(f);
        setInfo({ email: data.email, cvUrl: data.cvUrl });
      })
      .catch((err) => setToast({ text: errorMessage(err), type: 'error' }));
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSave = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await client.put('/api/students/me', form);
      setSaved(form);
      setOldSkills([]);
      setToast({ text: 'Đã lưu hồ sơ', type: 'success' });
    } catch (err) {
      setErrors(fieldErrors(err));
      setToast({ text: errorMessage(err), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async () => {
    const fail = (text) => setToast({ text, type: 'error' });
    if (!file) return fail('Vui lòng chọn file CV');
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) return fail('Chỉ chấp nhận file PDF hoặc DOCX');
    if (file.size > 5 * 1024 * 1024) return fail('File vượt quá 5MB');
    const data = new FormData();
    data.append('file', file);
    try {
      const res = await client.post('/api/students/me/cv', data);
      setInfo({ ...info, cvUrl: res.data.cvUrl });
      setFile(null);
      setToast({ text: 'Đã tải lên CV', type: 'success' });
    } catch (err) {
      fail(errorMessage(err));
    }
  };

  const done = (k) => (k === 'cv' ? !!info.cvUrl : !!String(saved[k]).trim());
  const percent = Math.round((CHECKS.filter(([k]) => done(k)).length / CHECKS.length) * 100);
  const skills = parseSkills(form.skills).known;
  const toggleSkill = (s) => {
    if (skills.includes(s)) {
      setForm({ ...form, skills: joinSkills(skills.filter((x) => x !== s)) });
    } else if (skills.length >= MAX_SKILLS) {
      setToast({ text: `Chọn tối đa ${MAX_SKILLS} kỹ năng`, type: 'error' });
    } else {
      setForm({ ...form, skills: joinSkills([...skills, s]) });
    }
  };
  const changed = JSON.stringify(form) !== JSON.stringify(saved);

  return (
    <div className="profile">
      <section className="profile-head">
        <div className="big-avatar">{initials(form.fullName) || 'SV'}</div>
        <div className="profile-who">
          <span className="role-tag">Sinh viên</span>
          <h1>{form.fullName || 'Hồ sơ sinh viên'}</h1>
          <p>{[saved.major, saved.school].filter(Boolean).join(' · ') || 'Chưa cập nhật trường và ngành'}</p>
          <small>Email đăng nhập: {info.email}</small>
        </div>
        <Progress value={percent} />
      </section>

      <PromoBanner items={BANNERS} />

      <div className="profile-grid">
        <form className="card" onSubmit={onSave} noValidate>
          <div className="card-head">
            <h2>Thông tin cá nhân</h2>
            {changed && <span className="unsaved">Có thay đổi chưa lưu</span>}
          </div>
          <div className="grid">
            <Input label="Họ tên *" name="fullName" form={form} errors={errors} onChange={onChange} />
            <Input label="Số điện thoại" name="phone" form={form} errors={errors} onChange={onChange} placeholder="vd: 0901234567" />
            <Input label="Trường" name="school" form={form} errors={errors} onChange={onChange} placeholder="vd: Đại học Văn Lang" />
            <Input label="Ngành học" name="major" form={form} errors={errors} onChange={onChange} placeholder="vd: Công nghệ thông tin" />
            <div className="wide skill-pick">
              <label htmlFor="skill-add">Kỹ năng <small>Chọn trong danh sách, tối đa {MAX_SKILLS} ({skills.length}/{MAX_SKILLS})</small></label>
              <select id="skill-add" value="" disabled={skills.length >= MAX_SKILLS}
                onChange={(e) => e.target.value && toggleSkill(e.target.value)}>
                <option value="">{skills.length >= MAX_SKILLS ? `Đã chọn đủ ${MAX_SKILLS} kỹ năng` : 'Thêm kỹ năng...'}</option>
                {SKILL_GROUPS.map((g) => (
                  <optgroup key={g.name} label={g.name}>
                    {g.items.filter((s) => !skills.includes(s)).map((s) => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                ))}
              </select>
              {skills.length > 0 ? (
                <div className="skill-chosen">
                  {skills.map((s) => (
                    <span key={s} className="filter-chip">{s}
                      <button type="button" onClick={() => toggleSkill(s)} className="chip-x" aria-label={`Xóa kỹ năng ${s}`} title="Xóa">×</button>
                    </span>
                  ))}
                </div>
              ) : <span className="hint">Chưa chọn kỹ năng nào.</span>}
              {oldSkills.length > 0 && (
                <span className="hint old">Kỹ năng nhập trước đây không có trong danh sách và sẽ bị bỏ khi lưu: {oldSkills.join(', ')}.</span>
              )}
              {errors.skills && <span className="error">{errors.skills}</span>}
            </div>
            <label className="wide">Giới thiệu bản thân
              <textarea name="bio" rows="5" value={form.bio} onChange={onChange}
                placeholder="Năm học, thời gian rảnh, kinh nghiệm làm thêm..." />
              <span className="count">{form.bio.length} ký tự</span>
              {errors.bio && <span className="error">{errors.bio}</span>}
            </label>
          </div>
          <div className="form-foot">
            <button className="btn primary big" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
            {changed && <button type="button" className="btn link" onClick={() => setForm(saved)}>Hoàn tác</button>}
          </div>
        </form>

        <aside className="side-col">
          <EmailSettingCard role="STUDENT" onMessage={(text, type) => setToast({ text, type })} />
          <div className="card">
            <h2>CV của bạn</h2>
            {info.cvUrl ? (
              <div className="cv-file">
                <span className="cv-ext">{info.cvUrl.split('.').pop().toUpperCase()}</span>
                <div><b>{info.cvUrl.split('/').pop()}</b>
                  <a href={fileUrl(info.cvUrl)} target="_blank" rel="noreferrer">Xem CV hiện tại</a></div>
              </div>
            ) : <p className="hint">Chưa có CV. Hồ sơ có CV được nhà tuyển dụng xem nhiều hơn.</p>}
            <label className={`drop ${file ? 'has' : ''}`}>
              <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files[0])} />
              <b>{file ? file.name : 'Chọn file CV'}</b>
              <span>PDF hoặc DOCX, tối đa 5MB</span>
            </label>
            <button type="button" className="btn ghost full" onClick={onUpload}>
              {info.cvUrl ? 'Thay CV mới' : 'Tải lên'}
            </button>
          </div>

          <div className="card">
            <h2>Để hồ sơ nổi bật</h2>
            <ul className="checklist">
              {CHECKS.map(([k, label]) => (
                <li key={k} className={done(k) ? 'ok' : ''}>{label}<span>{done(k) ? 'Đã có' : 'Còn thiếu'}</span></li>
              ))}
            </ul>
            <Link to="/" className="btn accent full">Xem việc phù hợp</Link>
          </div>
        </aside>
      </div>
      <Toast {...toast} onClose={closeToast} />
    </div>
  );
}

function Input({ label, name, form, errors, onChange, placeholder }) {
  return (
    <label>{label}
      <input name={name} value={form[name]} onChange={onChange} placeholder={placeholder}
        className={errors[name] ? 'invalid' : ''} />
      {errors[name] && <span className="error">{errors[name]}</span>}
    </label>
  );
}
