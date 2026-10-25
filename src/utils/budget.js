import { getDaysInMonth, getPreviousMonths, toMonthKey } from './calendar';
import { formatAmount } from './format';
import { averageOverMonths } from './summary';

export const TOTAL_BUDGET = 'total';

// 하루 쓸 수 있는 돈 같은 안내 금액은 100원 단위로 내림
const floor100 = (n) => Math.max(0, Math.floor(n / 100) * 100);

// 평균으로 예산 채우기: 만원 단위로 올림
export const roundBudget = (n) => Math.ceil(n / 10000) * 10000;

const sumBy = (list) => list.reduce((s, t) => s + t.amount, 0);

const percent = (n) => `${Math.round(n * 100)}%`;

// 이번 달(todayKey 기준) 예산 대비 지출 분석
// transactions: 건너뜀을 뺀 전체 내역. budgets: { total?, [카테고리]: 금액 }
export const analyzeBudget = (transactions, budgets, todayKey) => {
  const monthKey = todayKey.slice(0, 7);
  const [year, month, day] = todayKey.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, month - 1);
  const daysLeft = daysInMonth - day + 1; // 오늘 포함

  const expenses = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(monthKey));
  // 고정 항목은 이번 달 것이 미리 만들어지므로, 날짜가 안 됐어도 '나갈 돈'으로 센다
  const committed = sumBy(expenses);
  const spentSoFar = sumBy(expenses.filter((t) => t.date <= todayKey));
  const fixed = sumBy(expenses.filter((t) => t.recurringId));
  const variableSoFar = sumBy(expenses.filter((t) => !t.recurringId && t.date <= todayKey));
  const spentByCategory = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {});

  const categoryBudgets = Object.fromEntries(Object.entries(budgets).filter(([id]) => id !== TOTAL_BUDGET));
  const categorySum = Object.values(categoryBudgets).reduce((s, amount) => s + amount, 0);
  const totalBudget = budgets[TOTAL_BUDGET] ?? (categorySum > 0 ? categorySum : null);
  const remaining = totalBudget === null ? null : totalBudget - committed;

  // 지금까지의 변동 지출 속도가 이어지면 월말에 얼마가 될지 (초반 며칠은 들쭉날쭉해서 5일부터)
  const projected = day >= 5 ? Math.round(committed + (variableSoFar / day) * (daysLeft - 1)) : null;
  const progress = day / daysInMonth;

  const categories = [...new Set([...Object.keys(categoryBudgets), ...Object.keys(spentByCategory)])]
    .map((category) => {
      const budget = categoryBudgets[category] ?? null;
      const spent = spentByCategory[category] ?? 0;
      const rate = budget ? spent / budget : null;
      let status = 'none';
      if (budget) {
        if (spent > budget) status = 'over';
        // 달이 지난 비율보다 15%p 넘게 앞서거나, 90% 넘게 썼으면 '빠름'
        else if (rate >= 0.5 && (rate > progress + 0.15 || rate >= 0.9)) status = 'fast';
        else status = 'ok';
      }
      return { category, budget, spent, rate, status };
    })
    .sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0) || b.spent - a.spent);

  // 직전 3개월 평균 (이번 달은 진행 중이라 제외)
  const average = averageOverMonths(
    transactions,
    getPreviousMonths(year, month - 1, 3).map((m) => toMonthKey(m.year, m.month)),
  );

  return {
    monthKey,
    day,
    daysInMonth,
    daysLeft,
    progress,
    committed,
    spentSoFar,
    upcomingFixed: committed - spentSoFar,
    fixed,
    totalBudget,
    categorySum,
    hasTotal: budgets[TOTAL_BUDGET] !== undefined,
    remaining,
    dailyAllowance: remaining === null ? null : floor100(remaining / daysLeft),
    // 고정 지출을 뺀 예산을 한 달에 고르게 쓴다면 하루 얼마인지 (빠듯한지 판단 기준)
    baseDaily: totalBudget === null ? null : floor100((totalBudget - fixed) / daysInMonth),
    projected,
    categories,
    spentByCategory,
    average,
  };
};

// 살 것 하나를 이번 달에 사도 될지: 'ok' 여유 / 'tight' 빠듯 / 'over' 무리 / 'unknown' 예산 없음
export const judgeItem = (item, analysis, budgets) => {
  if (!item.amount) return null;
  const { totalBudget, remaining, daysLeft, baseDaily, average } = analysis;
  if (totalBudget === null) {
    return { level: 'unknown', text: '예산을 정하면 이번 달에 사도 될지 알려드려요.' };
  }

  const after = remaining - item.amount;
  if (after < 0) {
    // 한 달 예산을 넘는 큰 지출이면 몇 달 모을지 제안 (평균 수입에서 예산·저축을 빼고 남는 돈 기준)
    const spare = average.income - totalBudget - average.saving;
    const months = spare > 0 ? Math.ceil(item.amount / spare) : 0;
    if (item.amount > totalBudget * 0.5 && months >= 2) {
      return {
        level: 'over',
        text: `이번 달엔 무리예요. 매달 남는 ${formatAmount(spare)}씩 모으면 ${months}개월 뒤에 살 수 있어요.`,
      };
    }
    return {
      level: 'over',
      text: `남은 예산보다 ${formatAmount(-after)} 많아요. 다음 달 예산으로 미루는 걸 추천해요.`,
    };
  }

  const categoryBudget = item.category ? budgets[item.category] : undefined;
  if (categoryBudget) {
    const categoryLeft = categoryBudget - (analysis.spentByCategory[item.category] ?? 0);
    if (item.amount > categoryLeft) {
      return {
        level: 'tight',
        text: `${item.category} 예산을 ${formatAmount(item.amount - Math.max(categoryLeft, 0))} 넘어요. 다른 항목에서 줄이면 살 수 있어요.`,
      };
    }
  }

  const dailyAfter = floor100(after / daysLeft);
  // 평소 하루 예산의 70%도 안 남으면 빠듯
  if (baseDaily > 0 && dailyAfter < baseDaily * 0.7) {
    return { level: 'tight', text: `사고 나면 남은 ${daysLeft}일 동안 하루 ${formatAmount(dailyAfter)}으로 지내야 해요.` };
  }
  return { level: 'ok', text: `사도 괜찮아요. 산 뒤에도 하루 ${formatAmount(dailyAfter)}씩 쓸 수 있어요.` };
};

// 예산 배분과 이번 달 지출 속도에 대한 조언. tone: 'good' | 'info' | 'warn' | 'bad'
export const buildAdvice = (analysis, budgets, items) => {
  const { totalBudget, remaining, average, categories, projected, day, categorySum, hasTotal } = analysis;
  const tips = [];
  const add = (tone, text) => tips.push({ tone, text });

  if (totalBudget === null) {
    add(
      'info',
      average.monthCount > 0
        ? `최근 ${average.monthCount}개월 평균 지출은 ${formatAmount(average.expense)}이에요. '평균으로 채우기'로 예산을 시작해 보세요.`
        : '한 달 예산을 정하면 지출 속도와 살 것 목록을 함께 봐 드려요.',
    );
    return tips;
  }

  // 1) 이번 달 상황
  categories
    .filter((c) => c.status === 'over')
    .forEach((c) => add('bad', `${c.category} 예산을 ${formatAmount(c.spent - c.budget)} 넘었어요.`));
  categories
    .filter((c) => c.status === 'fast')
    .forEach((c) =>
      add('warn', `${c.category} 지출이 빨라요. 달의 ${percent(analysis.progress)}가 지났는데 예산의 ${percent(c.rate)}를 썼어요.`),
    );
  if (remaining < 0) {
    add('bad', `이번 달 예산을 ${formatAmount(-remaining)} 넘었어요.`);
  } else if (projected !== null && projected > totalBudget) {
    add('warn', `지금 속도면 월말에 약 ${formatAmount(projected)}을 써서 예산보다 ${formatAmount(projected - totalBudget)} 많아요.`);
  }

  // 2) 예산 배분
  if (hasTotal && categorySum > totalBudget) {
    add('warn', `카테고리 예산 합(${formatAmount(categorySum)})이 전체 예산보다 ${formatAmount(categorySum - totalBudget)} 많아요.`);
  }
  categories.forEach((c) => {
    const avg = average.byCategory[c.category] ?? 0;
    if (c.budget && avg >= 30000 && c.budget < avg * 0.7) {
      add('warn', `${c.category} 예산이 평소(월 ${formatAmount(avg)})보다 30% 넘게 적어요. 지키기 어려울 수 있어요.`);
    }
    if (!c.budget && average.expense > 0 && avg >= average.expense * 0.1) {
      add('info', `${c.category}에 평균 월 ${formatAmount(avg)}을 쓰는데 예산이 없어요. 따로 정해 두면 관리가 쉬워요.`);
    }
  });

  // 3) 수입 대비
  if (average.income > 0) {
    const savingRate = average.saving / average.income;
    const spare = average.income - totalBudget - average.saving;
    if (totalBudget > average.income) {
      add('bad', `예산이 최근 평균 수입(${formatAmount(average.income)})보다 많아요. 예산을 줄여야 해요.`);
    } else if (savingRate < 0.1) {
      add('warn', `수입 대비 저축이 ${percent(savingRate)}예요. 수입의 10~20%는 저축으로 먼저 떼어 두는 걸 추천해요.`);
    } else {
      add('good', `수입의 ${percent(savingRate)}를 저축하고 있어요.`);
    }
    if (spare > 0 && totalBudget <= average.income) {
      add('info', `예산과 저축을 빼도 매달 약 ${formatAmount(spare)}이 남아요. 비상금이나 저축으로 돌려 보세요.`);
    }
  }

  // 4) 살 것 목록
  const wanted = items.filter((i) => !i.done && i.amount);
  const wantedSum = sumBy(wanted);
  if (wanted.length > 0 && remaining >= 0 && wantedSum > remaining) {
    add('warn', `살 것 ${wanted.length}개 합계(${formatAmount(wantedSum)})가 남은 예산보다 많아요. 급한 것부터 사세요.`);
  }

  if (tips.every((t) => t.tone === 'good' || t.tone === 'info') && day >= 5 && remaining >= 0) {
    add('good', '이번 달 예산을 잘 지키고 있어요.');
  }
  return tips;
};
