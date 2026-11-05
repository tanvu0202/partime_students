import { Link } from 'react-router-dom';
import { PromoBanner } from '../components/ui';

const BANNERS = [
  { tag: 'Sắp ra mắt', title: 'Chức năng đang được nhóm hoàn thiện', text: 'Trong lúc chờ, bạn có thể xem các việc làm mới nhất trên trang chủ.', big: '24', bigNote: 'việc mới', cta: 'Xem việc làm', to: '/', theme: 'violet' },
];

// Trang tạm cho các chức năng làm ở Sprint 3–4
export default function PlaceholderPage({ title, sprint }) {
  return (
    <>
      <div className="card placeholder">
        <span className="role-tag">Đang xây dựng</span>
        <h1>{title}</h1>
        <p>Chức năng này sẽ hoàn thành ở {sprint}.</p>
        <Link to="/" className="btn ghost">Về trang chủ</Link>
      </div>
      <PromoBanner items={BANNERS} />
    </>
  );
}
