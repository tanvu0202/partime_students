import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

// Thông báo nổi góc màn hình, tự ẩn sau 4 giây
export function Toast({ text, type = 'success', onClose }) {
  useEffect(() => {
    if (!text) return undefined;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [text, onClose]);
  if (!text) return null;
  return (
    <div className={`toast ${type}`} role="status">
      <span>{text}</span>
      <button type="button" onClick={onClose}>Đóng</button>
    </div>
  );
}

// Ô mật khẩu có nút Hiện/Ẩn
export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <span className="pw">
      <input {...props} type={show ? 'text' : 'password'} />
      <button type="button" onClick={() => setShow(!show)}>{show ? 'Ẩn' : 'Hiện'}</button>
    </span>
  );
}

// Khung bên trái của trang Đăng nhập / Đăng ký
// Cột trái trang đăng nhập / đăng ký: tiêu đề, mô tả và ảnh minh họa phía dưới
export function AuthAside({ title, text, image, children }) {
  return (
    <aside className="auth-side">
      <span className="auth-side-tag">PartTimeSV</span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
      {image && <img className="auth-art" src={image} alt="Sinh viên tìm việc làm thêm gần trường" />}
    </aside>
  );
}

// Thanh % hoàn thiện hồ sơ
export function Progress({ value }) {
  return (
    <div className="progress">
      <div className="progress-top"><span>Hồ sơ hoàn thiện</span><b>{value}%</b></div>
      <div className="progress-bar"><i style={{ width: `${value}%` }} /></div>
    </div>
  );
}

// Banner quảng cáo nhỏ, tự chuyển sau 5 giây (dùng ở trang hồ sơ và trang tạm)
// items: [{ tag, title, text, cta, to, big, bigNote, theme: 'violet' | 'yellow' | 'blue' }]
export function PromoBanner({ items }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || items.length < 2) return undefined;
    const t = setTimeout(() => setI((x) => (x + 1) % items.length), 5000);
    return () => clearTimeout(t);
  }, [i, paused, items.length]);
  const b = items[i];
  return (
    <section className={`promo-strip ps-${b.theme}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="ps-body" key={i}>
        <span className="ps-tag">{b.tag}</span>
        <b>{b.title}</b>
        <span className="ps-text">{b.text}</span>
      </div>
      <div className="ps-big" key={`b${i}`}><b>{b.big}</b><span>{b.bigNote}</span></div>
      <Link to={b.to} className="btn ps-cta">{b.cta}</Link>
      {items.length > 1 && (
        <div className="ps-dots">
          {items.map((x, k) => (
            <button key={x.title} type="button" aria-label={`Banner ${k + 1}`} className={k === i ? 'on' : ''} onClick={() => setI(k)} />
          ))}
        </div>
      )}
    </section>
  );
}

// Hộp thoại dùng chung (thay cho alert/confirm của trình duyệt)
// Đóng khi bấm nền tối hoặc phím Esc. Vẽ thẳng vào <body> để nền tối phủ kín màn hình.
export function Modal({ title, children, onClose, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="modal-x" onClick={onClose}>Đóng</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// Hộp thoại xác nhận trước thao tác không hoàn tác được (đóng tin, xóa tin, duyệt đơn)
export function Confirm({ title, text, okText = 'Đồng ý', danger, busy, onOk, onClose }) {
  return (
    <Modal title={title} onClose={onClose} footer={(
      <>
        <button type="button" className="btn link" onClick={onClose}>Hủy</button>
        <button type="button" className={`btn ${danger ? 'danger' : 'primary'}`} disabled={busy} onClick={onOk}>
          {busy ? 'Đang xử lý...' : okText}
        </button>
      </>
    )}>
      <p className="modal-text">{text}</p>
    </Modal>
  );
}

// Nhãn trạng thái có màu: map = JOB_STATUS hoặc APP_STATUS trong utils/format.js
export function StatusBadge({ map, value }) {
  const [text, cls] = map[value] || [value, ''];
  return <span className={`badge ${cls}`}>{text}</span>;
}
