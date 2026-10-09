import { USERS } from '../constants/users';

const sumAmount = (list) => list.reduce((sum, t) => sum + t.amount, 0);

const totalsByType = (list) => ({
  income: sumAmount(list.filter((t) => t.type === 'income')),
  expense: sumAmount(list.filter((t) => t.type === 'expense')),
  saving: sumAmount(list.filter((t) => t.type === 'saving')),
});

// 카테고리별 합계 맵과 금액 내림차순 배열
const groupByCategory = (list) => {
  const byCategory = list.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {});
  const sorted = Object.entries(byCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  return { byCategory, sorted };
};

export const filterByUser = (transactions, userId, allValue) =>
  userId === allValue ? transactions : transactions.filter((t) => t.user === userId);

// monthKey('YYYY-MM')의 수입/지출/저축 합계와 카테고리별 지출·저축
export const summarizeMonth = (transactions, monthKey) => {
  const inMonth = transactions.filter((t) => t.date.startsWith(monthKey));
  const expense = groupByCategory(inMonth.filter((t) => t.type === 'expense'));
  const saving = groupByCategory(inMonth.filter((t) => t.type === 'saving'));

  return {
    ...totalsByType(inMonth),
    categories: expense.sorted,
    byCategory: expense.byCategory,
    savingByCategory: saving.byCategory,
  };
};

// 사람별 합계 + 최종합산
export const summarizeByUser = (transactions, monthKey) => {
  const inMonth = transactions.filter((t) => t.date.startsWith(monthKey));
  const rows = USERS.map((u) => ({ ...u, ...totalsByType(inMonth.filter((t) => t.user === u.id)) }));
  return { rows, total: totalsByType(inMonth) };
};

// monthKey 달까지 쌓인 저축 누적 (카테고리별). 'YYYY-MM' 문자열 비교로 기간 판단
export const cumulativeSaving = (transactions, monthKey) => {
  const upTo = transactions.filter((t) => t.type === 'saving' && t.date.slice(0, 7) <= monthKey);
  return { total: sumAmount(upTo), byCategory: groupByCategory(upTo).byCategory };
};

// 이번 달 - 지난달. 지난달이 0이면 비율은 null
export const compareAmount = (current, previous) => ({
  diff: current - previous,
  rate: previous > 0 ? ((current - previous) / previous) * 100 : null,
});

// 여러 달의 월평균. 내역이 있는 달 수로 나눈다 (아직 기록이 없는 달 때문에 평균이 낮아지지 않도록)
export const averageOverMonths = (transactions, monthKeys) => {
  const months = monthKeys.map((key) => summarizeMonth(transactions, key));
  const activeMonths = months.filter((m, i) => transactions.some((t) => t.date.startsWith(monthKeys[i])));
  const count = activeMonths.length;
  const avg = (sum) => (count ? Math.round(sum / count) : 0);

  const avgCategories = (field) => {
    const sums = activeMonths.reduce((acc, m) => {
      Object.entries(m[field]).forEach(([category, amount]) => {
        acc[category] = (acc[category] ?? 0) + amount;
      });
      return acc;
    }, {});
    return Object.fromEntries(Object.entries(sums).map(([category, sum]) => [category, avg(sum)]));
  };

  return {
    monthCount: count,
    income: avg(activeMonths.reduce((s, m) => s + m.income, 0)),
    expense: avg(activeMonths.reduce((s, m) => s + m.expense, 0)),
    saving: avg(activeMonths.reduce((s, m) => s + m.saving, 0)),
    byCategory: avgCategories('byCategory'),
    savingByCategory: avgCategories('savingByCategory'),
  };
};
