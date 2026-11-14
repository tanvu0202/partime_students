// Thời gian làm việc của tin tuyển dụng: chọn ngày trong tuần + giờ bắt đầu, kết thúc.
// Vẫn lưu xuống backend dưới dạng chuỗi workTime, ví dụ "18:00–22:00, T2–T6" hoặc "08:00–12:00, T7, CN; ca xoay".

export const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
export const QUICK = [
  ['T2–T6', ['T2', 'T3', 'T4', 'T5', 'T6']],
  ['Cuối tuần', ['T7', 'CN']],
  ['Cả tuần', DAYS],
];

// Ghép danh sách ngày: các ngày liền nhau từ 3 ngày trở lên viết gọn "T2–T6"
function daysText(days) {
  const idx = DAYS.map((d, i) => (days.includes(d) ? i : -1)).filter((i) => i >= 0);
  const parts = [];
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j += 1;
    if (j - i >= 2) parts.push(`${DAYS[idx[i]]}–${DAYS[idx[j]]}`);
    else for (let k = i; k <= j; k += 1) parts.push(DAYS[idx[k]]);
    i = j + 1;
  }
  return parts.join(', ');
}

export function composeWorkTime({ days, start, end, note }) {
  const head = [start && end ? `${start}–${end}` : '', daysText(days)].filter(Boolean).join(', ');
  return [head, note?.trim()].filter(Boolean).join('; ');
}

// Đọc lại chuỗi đã lưu khi sửa tin. Chuỗi cũ nhập tay không đọc được thì đưa vào ô ghi chú.
export function parseWorkTime(text = '') {
  const empty = { days: [], start: '', end: '', note: '' };
  if (!text) return empty;
  const [head, ...rest] = text.split(';');
  const time = head.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  const days = [];
  head.replace(time ? time[0] : '', '').split(',').map((x) => x.trim()).filter(Boolean).forEach((tok) => {
    const r = tok.match(/^(T[2-7]|CN)\s*[–-]\s*(T[2-7]|CN)$/);
    if (r) {
      for (let i = DAYS.indexOf(r[1]); i <= DAYS.indexOf(r[2]); i += 1) days.push(DAYS[i]);
    } else if (DAYS.includes(tok)) days.push(tok);
    else days.push(null);
  });
  if (!time || days.includes(null)) return { ...empty, note: text };
  const pad = (t) => t.padStart(5, '0');
  return { days, start: pad(time[1]), end: pad(time[2]), note: rest.join(';').trim() };
}

// Trả về thông báo lỗi hoặc '' nếu hợp lệ
export function checkWorkTime({ days, start, end, note }) {
  if (!days.length && !start && !end && note?.trim()) return '';
  if (!days.length) return 'Chọn ít nhất một ngày làm việc';
  if (!start || !end) return 'Nhập giờ bắt đầu và giờ kết thúc';
  if (start >= end) return 'Giờ kết thúc phải sau giờ bắt đầu';
  return '';
}
