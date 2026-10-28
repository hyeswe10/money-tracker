import { detectBrand } from '../constants/brands';
import { COUPAY_CHARGE } from '../constants/categories';

// 쿠페이머니 충전: '충전' 유형의 쿠페이머니 충전 내역
export const isCoupayCharge = (t) => t.type === 'transfer' && t.category === COUPAY_CHARGE;

// 쿠페이머니 사용: 메모에 쿠팡(쿠팡, coupang, 로켓와우 등)이 들어간 지출. 할부는 카드 결제라 제외
export const isCoupayUse = (t) => t.type === 'expense' && !t.installmentId && detectBrand(t.memo)?.id === 'coupang';

const byDate = (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt;

// 잔액(오늘까지), 날짜 안 된 사용 예정액, 보고 있는 달의 충전/사용과 내역(최신순, 그 시점 잔액 포함)
export const summarizeCoupay = (transactions, todayKey, monthKey) => {
  let running = 0;
  const entries = transactions
    .filter((t) => !t.planned && (isCoupayCharge(t) || isCoupayUse(t)))
    .sort(byDate)
    .map((t) => {
      const delta = isCoupayCharge(t) ? t.amount : -t.amount;
      running += delta;
      return { ...t, delta, balanceAfter: running };
    });

  const past = entries.filter((e) => e.date <= todayKey);
  const inMonth = entries.filter((e) => e.date.startsWith(monthKey));

  return {
    balance: past.reduce((s, e) => s + e.delta, 0),
    upcomingUse: entries.filter((e) => e.date > todayKey && e.delta < 0).reduce((s, e) => s - e.delta, 0),
    monthCharge: inMonth.filter((e) => e.delta > 0).reduce((s, e) => s + e.delta, 0),
    monthUse: inMonth.filter((e) => e.delta < 0).reduce((s, e) => s - e.delta, 0),
    monthEntries: [...inMonth].reverse(),
  };
};
