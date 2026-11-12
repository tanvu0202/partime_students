import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { CATEGORIES, LOCATIONS, daysAgo, salaryText } from '../utils/format';

// MH-02 – Trang chủ: banner quảng cáo + tìm kiếm + danh sách việc làm (PB-07, PB-08)
// Danh sách gọi GET /api/jobs: lọc theo từ khóa, ngành, địa điểm, mức lương; sắp xếp; phân trang.

// Mức lương theo giờ để lọc nhanh (gửi minSalary + salaryUnit=HOUR)
const SALARY = [['', 'Mọi mức lương'], ['25000', 'Từ 25.000đ/giờ'], ['30000', 'Từ 30.000đ/giờ'], ['35000', 'Từ 35.000đ/giờ']];
const EMPTY = { keyword: '', category: '', location: '', minSalary: '', sort: 'newest' };

const SLIDES = [
  {
    tag: 'Việc cuối tuần',
    title: 'Làm thêm thứ Bảy, Chủ nhật – nhận lương ngay cuối ngày',
    text: 'Hơn 120 ca làm cuối tuần gần trường: hỗ trợ sự kiện, phát tờ rơi, phục vụ tiệc.',
    cta: 'Xem việc cuối tuần', category: 'Sự kiện – PG', theme: 'violet', visual: 'weekend',
  },
  {
    tag: 'Tuyển gấp mùa Tết',
    title: 'Cuối năm cửa hàng cần người – hơn 500 vị trí đang chờ bạn',
    text: 'Bán hàng, đóng gói, giao hàng nội thành. Ca linh hoạt, xếp theo lịch học.',
    cta: 'Xem việc bán hàng', category: 'Bán hàng', theme: 'yellow', visual: 'urgent',
  },
  {
    tag: 'Dành cho nhà tuyển dụng',
    title: 'Đăng tin miễn phí, nhận hồ sơ sinh viên ngay trong ngày',
    text: 'Theo dõi lượt xem, duyệt đơn và đánh giá hai chiều trên cùng một trang.',
    cta: 'Đăng ký nhà tuyển dụng', to: '/register', theme: 'blue', visual: 'employer',
  },
];

// Phần hình minh họa bên phải banner – dựng bằng HTML/CSS, không dùng ảnh hay icon
function HeroVisual({ type }) {
  if (type === 'weekend') {
    return (
      <div className="hv hv-weekend">
        <div className="hv-week">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
            <span key={d} className={d === 'T7' || d === 'CN' ? 'on' : ''}>{d}</span>
          ))}
        </div>
        <div className="hv-ticket">
          <span className="hv-ticket-tag">Ca sáng thứ Bảy</span>
          <b>Hỗ trợ sự kiện ra mắt sản phẩm</b>
          <span className="hv-ticket-info">Quận 1 · 7:30 – 12:00</span>
          <div className="hv-ticket-foot"><b>200.000đ</b><span>/ ca</span><em>Nhận lương cuối ngày</em></div>
        </div>
        <div className="hv-pill">86 sinh viên đã ứng tuyển tuần này</div>
      </div>
    );
  }
  if (type === 'urgent') {
    return (
      <div className="hv hv-urgent">
        <div className="hv-water">TẾT</div>
        {[['Bán hàng shop thời trang', 'Quận 3', 8], ['Đóng gói đơn hàng Tết', 'Thủ Đức', 12], ['Giao hàng nội thành', 'Gò Vấp', 20]].map(([t, l, n], i) => (
          <div key={t} className="hv-row" style={{ marginLeft: i * 22 }}>
            <span className="hv-hot">Gấp</span>
            <div><b>{t}</b><span>{l} · cần {n} người</span></div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="hv hv-employer">
      <div className="hv-dash">
        <div className="hv-dash-head"><span>Tin của bạn</span><b>Phục vụ ca tối</b></div>
        <div className="hv-dash-num"><b>12</b><span>hồ sơ mới<br />hôm nay</span></div>
        <div className="hv-bars">
          {[30, 45, 38, 60, 52, 78, 92].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
        </div>
        <div className="hv-dash-foot">Lượt xem 7 ngày qua</div>
      </div>
      <div className="hv-pill hv-pill-yellow">Phí đăng tin: 0đ</div>
    </div>
  );
}

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase();
}

export default function HomePage() {
  const { user } = useAuth();
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [query, setQuery] = useState({ ...EMPTY, page: 0 });
  const [counts, setCounts] = useState({}); // số tin đang tuyển theo ngành (GET /api/jobs/categories)
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | unavailable

  // Banner tự chuyển sau 6 giây, dừng khi rê chuột vào
  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setSlide((x) => (x + 1) % SLIDES.length), 6000);
    return () => clearTimeout(t);
  }, [slide, paused]);
  const go = (step) => setSlide((x) => (x + step + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    setState('loading');
    // Chỉ gửi bộ lọc có giá trị; có mức lương thì lọc theo lương giờ
    const params = Object.fromEntries(Object.entries({ ...query, size: 10 }).filter(([, v]) => v !== ''));
    if (params.minSalary) params.salaryUnit = 'HOUR';
    client
      .get('/api/jobs', { params })
      .then((res) => { setData(res.data); setState('ok'); })
      .catch(() => setState('unavailable'));
  }, [query]);

  useEffect(() => {
    client.get('/api/jobs/categories')
      .then((res) => setCounts(Object.fromEntries(res.data.map((c) => [c.category, c.count]))))
      .catch(() => {});
  }, []);

  const search = (e) => {
    e?.preventDefault();
    setQuery({ ...form, page: 0 });
  };
  const pickCategory = (category) => {
    setForm((f) => ({ ...f, category }));
    setQuery((q) => ({ ...q, category, page: 0 }));
  };
  const clearFilters = () => {
    setForm(EMPTY);
    setQuery({ ...EMPTY, page: 0 });
  };
  const changeSort = (sort) => {
    setForm((f) => ({ ...f, sort }));
    setQuery((q) => ({ ...q, sort, page: 0 }));
  };

  const s = SLIDES[slide];
  const jobs = data?.content || [];

  return (
    <div className="home">
      {/* Thanh tìm kiếm */}
      <form className="search-band" onSubmit={search}>
        <input placeholder="Tìm việc part-time: phục vụ, gia sư, bán hàng..." value={form.keyword}
          onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="">Tất cả ngành nghề</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
          <option value="">Tất cả địa điểm</option>
          {LOCATIONS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={form.minSalary} onChange={(e) => setForm({ ...form, minSalary: e.target.value })}>
          {SALARY.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <button className="btn blue">Tìm kiếm</button>
      </form>

      {/* Banner quảng cáo */}
      <section className="promo">
        <div className={`hero hero-${s.theme} ${paused ? 'paused' : ''}`}
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="hero-deco" />
          <div className="hero-text" key={`t${slide}`}>
            <span className="hero-tag">{s.tag}</span>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
            {s.to
              ? <Link to={s.to} className="btn hero-cta">{s.cta}</Link>
              : <button type="button" className="btn hero-cta" onClick={() => pickCategory(s.category)}>{s.cta}</button>}
          </div>
          <div className="hero-visual" key={`v${slide}`}><HeroVisual type={s.visual} /></div>

          <div className="hero-ctrl">
            <div className="hero-dots">
              {SLIDES.map((x, i) => (
                <button key={x.tag} type="button" aria-label={`Banner ${i + 1}`}
                  className={i === slide ? 'on' : ''} onClick={() => setSlide(i)}><i /></button>
              ))}
            </div>
            <span className="hero-count">0{slide + 1} / 0{SLIDES.length}</span>
            <button type="button" className="hero-nav" onClick={() => go(-1)}>Trước</button>
            <button type="button" className="hero-nav" onClick={() => go(1)}>Sau</button>
          </div>
        </div>

        <div className="side-ads">
          <Link to={user ? '/student/profile' : '/register'} className="ad ad-light">
            <span className="ad-tag">Mẹo ứng tuyển</span>
            <b>Hồ sơ có CV được nhà tuyển dụng xem nhiều gấp 3 lần</b>
            <span className="ad-link">{user ? 'Cập nhật hồ sơ' : 'Tạo tài khoản miễn phí'}</span>
          </Link>
          <div className="ad ad-dark">
            <span className="ad-num">30</span>
            <span className="ad-tag">Tài trợ</span>
            <b>GoMart tuyển 30 nhân viên ca tối, ưu tiên sinh viên năm 1–2</b>
            <span className="ad-link">25.000đ/giờ · Gò Vấp</span>
          </div>
        </div>
      </section>

      {/* Ngành nghề nổi bật */}
      <section className="cats">
        <div className="cats-head">
          <h2>Ngành nghề nổi bật</h2>
          <button type="button" className="link-btn" onClick={clearFilters}>Xem tất cả</button>
        </div>
        <div className="cats-grid">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => pickCategory(c)}
              className={`cat ${query.category === c ? 'on' : ''}`}>
              <b>{c}</b><span>{counts[c] || 0} việc đang tuyển</span>
            </button>
          ))}
        </div>
      </section>

      {/* Danh sách việc + cột phải */}
      <section className="main-cols">
        <div className="job-col">
          <div className="card list-head">
            <div className="crumb">Trang chủ / Việc làm part-time{query.category && ` / ${query.category}`}</div>
            <div className="list-title">
              <span>
                {state === 'ok'
                  ? <>Tuyển dụng <b>{data.totalElements}</b> việc làm part-time mới nhất</>
                  : 'Việc làm part-time mới nhất'}
              </span>
              <span className="list-tools">
                {(query.keyword || query.category || query.location || query.minSalary) && (
                  <button type="button" className="link-btn" onClick={clearFilters}>Xóa lọc</button>
                )}
                <select className="sort" value={query.sort} onChange={(e) => changeSort(e.target.value)} aria-label="Sắp xếp">
                  <option value="newest">Mới nhất</option>
                  <option value="salary">Lương cao nhất</option>
                </select>
              </span>
            </div>
          </div>

          {state === 'loading' && <div className="card muted-box">Đang tải danh sách việc làm...</div>}

          {state === 'unavailable' && (
            <div className="card muted-box">
              <b>Danh sách việc làm đang được cập nhật</b>
              <p>Không kết nối được máy chủ. Kiểm tra backend đã chạy ở cổng 8080 chưa.</p>
            </div>
          )}

          {state === 'ok' && jobs.length === 0 && (
            <div className="card muted-box"><b>Không có việc phù hợp</b><p>Thử bỏ bớt bộ lọc hoặc đổi từ khóa.</p></div>
          )}

          {state === 'ok' && jobs.map((j, i) => (
            <div key={j.id}>
              <article className="job">
                <div className="job-logo">{initials(j.companyName)}</div>
                <div className="job-body">
                  <Link to={`/jobs/${j.id}`} className="job-title">{j.title}</Link>
                  <div className="job-company">{j.companyName}</div>
                  <div className="job-meta">
                    <span className="salary">{salaryText(j)}</span>
                    <span className="chip">{j.location}</span>
                    <span className="chip">{j.category}</span>
                    <span className="chip">{j.workTime}</span>
                  </div>
                </div>
                <div className="job-side">
                  <span className="when">{daysAgo(j.createdAt)}</span>
                  <Link to={`/jobs/${j.id}`} className="btn ghost small">Xem chi tiết</Link>
                </div>
              </article>

              {/* Banner chen giữa danh sách */}
              {i === 3 && (
                <div className="inline-ad">
                  <div>
                    <span className="ad-tag">Tài trợ</span>
                    <b>Trung tâm Anh ngữ Sunrise cần 10 trợ giảng tiếng Anh buổi tối</b>
                    <span>Đào tạo miễn phí trước khi nhận lớp · 60.000đ/giờ · Quận 3</span>
                  </div>
                  <button type="button" className="btn accent" onClick={() => pickCategory('Gia sư')}>Xem việc gia sư</button>
                </div>
              )}
            </div>
          ))}

          {state === 'ok' && data.totalPages > 1 && (
            <div className="pager">
              <button type="button" className="btn ghost small" disabled={query.page === 0}
                onClick={() => setQuery({ ...query, page: query.page - 1 })}>Trang trước</button>
              <span>Trang {query.page + 1} / {data.totalPages}</span>
              <button type="button" className="btn ghost small" disabled={query.page + 1 >= data.totalPages}
                onClick={() => setQuery({ ...query, page: query.page + 1 })}>Trang sau</button>
            </div>
          )}
        </div>

        <aside className="side-col">
          <div className="card">
            <h3 className="side-title">Hoàn thiện hồ sơ để nhà tuyển dụng chú ý đến bạn</h3>
            <p className="side-text">Thêm kỹ năng và CV để ứng tuyển nhanh hơn, nhận thông báo khi đơn được duyệt.</p>
            <Link to={user ? '/student/profile' : '/login'} className="btn primary full">Cập nhật hồ sơ</Link>
            <Link to={user ? '/student/applications' : '/login'} className="btn ghost full mt8">Xem đơn của tôi</Link>
          </div>

          <div className="card dark-card">
            <span>Đánh giá hai chiều</span>
            <b>Chọn việc an tâm nhờ điểm đánh giá của sinh viên trước</b>
          </div>

          <div className="card partners">
            <h3 className="side-title">Nhà tuyển dụng nổi bật</h3>
            {[['The Coffee Corner', 'F&B – Bình Thạnh', 6], ['GoMart', 'Bán hàng – Gò Vấp', 4], ['Sunrise English', 'Gia sư – Quận 3', 3]].map(([n, d, c]) => (
              <div key={n} className="partner">
                <div className="job-logo sm">{initials(n)}</div>
                <div><b>{n}</b><span>{d}</span></div>
                <em>{c} tin</em>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* Dải kêu gọi nhà tuyển dụng */}
      {user?.role !== 'STUDENT' && (
        <section className="employer-cta">
          <div>
            <b>Bạn là nhà tuyển dụng?</b>
            <span>Đăng tin miễn phí và nhận hồ sơ sinh viên ngay trong ngày.</span>
          </div>
          <Link to={user?.role === 'EMPLOYER' ? '/employer/jobs' : '/register'} className="btn accent">Đăng tin ngay</Link>
        </section>
      )}
    </div>
  );
}
