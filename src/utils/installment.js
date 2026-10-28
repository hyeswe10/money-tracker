import { addMonth, getDaysInMonth, toDateKey } from './calendar';

export const INSTALLMENT_MONTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36];

// 카드사 방식: 원금은 개월 수로 똑같이 나누고(나누어떨어지지 않는 나머지는 1회차에),
// 수수료는 그 회차 직전 남은 원금 × 연이율 ÷ 12 (원 미만 버림). 1~freeMonths회차는 수수료 없음
export const buildSchedule = ({ amount, months, rate = 0, freeMonths = 0 }) => {
  const base = Math.floor(amount / months);
  let remaining = amount;
  return Array.from({ length: months }, (_, i) => {
    const principal = i === 0 ? amount - base * (months - 1) : base;
    const fee = i < freeMonths ? 0 : Math.floor((remaining * rate) / 100 / 12);
    remaining -= principal;
    return { no: i + 1, principal, fee, amount: principal + fee };
  });
};

export const summarizeSchedule = (schedule) => ({
  fee: schedule.reduce((s, r) => s + r.fee, 0),
  total: schedule.reduce((s, r) => s + r.amount, 0),
});

// dateKey에서 n개월 뒤 같은 날. 그 달에 없는 날(31일 등)이면 말일
const addMonthsToDate = (dateKey, n) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const next = addMonth(y, m - 1, n);
  return toDateKey(next.year, next.month, Math.min(d, getDaysInMonth(next.year, next.month)));
};

// 1회차는 산 날, 이후 매달 같은 날에 그 회차 금액으로 지출 기록
export const buildInstallmentRows = ({ installment, date, amount, ...base }) => {
  const installmentId = crypto.randomUUID();
  return buildSchedule({ amount, ...installment }).map((r) => ({
    ...base,
    date: addMonthsToDate(date, r.no - 1),
    amount: r.amount,
    installmentId,
    installmentNo: r.no,
    installmentMonths: installment.months,
    installmentFee: r.fee,
  }));
};
