import { addMonth, getDaysInMonth, toDateKey, toMonthKey } from './calendar';

const MAX_MONTHS = 600; // 안전장치: 한 번에 계산하는 최대 개월 수

const parseMonthKey = (key) => {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m - 1 };
};

// fromKey ~ toKey ('YYYY-MM', 양끝 포함)
export const monthRange = (fromKey, toKey) => {
  if (fromKey > toKey) return [];
  const keys = [];
  let { year, month } = parseMonthKey(fromKey);
  let key = fromKey;
  while (key <= toKey && keys.length < MAX_MONTHS) {
    keys.push(key);
    ({ year, month } = addMonth(year, month, 1));
    key = toMonthKey(year, month);
  }
  return keys;
};

// 규칙이 monthKey 달에 나가는 날짜. 31일 규칙은 2월이면 28(29)일
export const ruleDateFor = (rule, monthKey) => {
  const { year, month } = parseMonthKey(monthKey);
  return toDateKey(year, month, Math.min(rule.dayOfMonth, getDaysInMonth(year, month)));
};

// 그 달에 결제가 있는지: 매월은 항상, 매년은 지정한 달만
export const occursIn = (rule, monthKey) =>
  rule.frequency !== 'yearly' || parseMonthKey(monthKey).month + 1 === rule.monthOfYear;

const isYearly = (rule) => rule.frequency === 'yearly';

// 월 환산 금액 (연 결제는 12로 나눔)
export const monthlyEquivalent = (rule) => (isYearly(rule) ? Math.round(rule.amount / 12) : rule.amount);

// 1년 총액
export const annualAmount = (rule) => (isYearly(rule) ? rule.amount : rule.amount * 12);

// '매월 15일' / '매년 3월 1일'
export const scheduleLabel = (rule) =>
  isYearly(rule) ? `매년 ${rule.monthOfYear}월 ${rule.dayOfMonth}일` : `매월 ${rule.dayOfMonth}일`;

// 오늘 이후(오늘 포함) 첫 결제일 'YYYY-MM-DD'. 시작 월 이전은 건너뜀
export const nextPaymentDate = (rule, todayKey) => {
  const todayMonth = todayKey.slice(0, 7);
  const fromKey = rule.startMonth > todayMonth ? rule.startMonth : todayMonth;
  const { year, month } = parseMonthKey(fromKey);
  const end = addMonth(year, month, 13);
  const found = monthRange(fromKey, toMonthKey(end.year, end.month))
    .filter((key) => occursIn(rule, key))
    .map((key) => ruleDateFor(rule, key))
    .find((date) => date >= todayKey);
  return found ?? null;
};

const toEntry = (rule, monthKey) => ({
  type: rule.type,
  amount: rule.amount,
  category: rule.category,
  memo: rule.memo,
  user: rule.user,
  date: ruleDateFor(rule, monthKey),
  recurringId: rule.id,
  recurringMonth: monthKey,
});

// 시작 월 ~ 이번 달 중 아직 생성되지 않은 (규칙, 월) 목록. allRows는 건너뜀 처리된 내역까지 포함해야 함
export const findMissingRecurring = (rules, allRows, currentMonthKey) => {
  const existing = new Set(allRows.filter((t) => t.recurringId).map((t) => `${t.recurringId}|${t.recurringMonth}`));
  return rules.flatMap((rule) =>
    monthRange(rule.startMonth, currentMonthKey)
      .filter((key) => occursIn(rule, key) && !existing.has(`${rule.id}|${key}`))
      .map((key) => toEntry(rule, key)),
  );
};

// 다음 달 이후(fromKey ~ toKey) 미리보기용 예정 내역. 저장하지 않는다
export const buildPlannedRows = (rules, fromKey, toKey) =>
  monthRange(fromKey, toKey).flatMap((key) =>
    rules
      .filter((rule) => rule.startMonth <= key && occursIn(rule, key))
      .map((rule) => ({ ...toEntry(rule, key), id: `planned-${rule.id}-${key}`, planned: true, createdAt: 0 })),
  );
