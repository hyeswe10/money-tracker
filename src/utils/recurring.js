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
      .filter((key) => !existing.has(`${rule.id}|${key}`))
      .map((key) => toEntry(rule, key)),
  );
};

// 다음 달 이후(fromKey ~ toKey) 미리보기용 예정 내역. 저장하지 않는다
export const buildPlannedRows = (rules, fromKey, toKey) =>
  monthRange(fromKey, toKey).flatMap((key) =>
    rules
      .filter((rule) => rule.startMonth <= key)
      .map((rule) => ({ ...toEntry(rule, key), id: `planned-${rule.id}-${key}`, planned: true, createdAt: 0 })),
  );
