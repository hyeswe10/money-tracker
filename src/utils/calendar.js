export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n) => String(n).padStart(2, '0');

// month는 0~11 (Date 기준)
export const toDateKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

export const toMonthKey = (year, month) => `${year}-${pad(month + 1)}`;

export const getTodayKey = () => {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
};

// delta만큼 월 이동, 연도 넘김은 Date가 자동 처리 (12월 + 1 → 다음해 1월)
export const addMonth = (year, month, delta) => {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
};

// (year, month) 직전 n개월, 오래된 달부터. 예: 2026년 1월, n=3 → 2025년 10·11·12월
export const getPreviousMonths = (year, month, n) =>
  Array.from({ length: n }, (_, i) => addMonth(year, month, i - n));

export const getDaysInMonth =(year, month) => new Date(year, month + 1, 0).getDate();

// 그 달에 필요한 주 수(4~6주) × 7일. 앞뒤는 이전/다음 달 날짜로 채운다.
export const getCalendarCells = (year, month) => {
  const firstWeekday = new Date(year, month, 1).getDay();
  const weeks = Math.ceil((firstWeekday + getDaysInMonth(year, month)) / 7);
  const todayKey = getTodayKey();

  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(year, month, i - firstWeekday + 1);
    const dateKey = toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
    return {
      dateKey,
      day: d.getDate(),
      weekday: d.getDay(),
      inMonth: d.getMonth() === month,
      isToday: dateKey === todayKey,
    };
  });
};
