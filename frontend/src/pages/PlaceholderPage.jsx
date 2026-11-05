// Trang tạm cho các chức năng làm ở Sprint 3–4
export default function PlaceholderPage({ title, sprint }) {
  return (
    <div className="card">
      <h1>{title}</h1>
      <p className="muted">Chức năng này sẽ làm ở {sprint}.</p>
    </div>
  );
}
