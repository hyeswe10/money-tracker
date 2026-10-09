import { WEEKDAYS } from './calendar';

export const formatAmount = (amount) => `${amount.toLocaleString('ko-KR')}원`;

// 증감 표기: +1,000원 / -1,000원 / 0원
export const formatSignedAmount = (amount) => `${amount > 0 ? '+' : amount < 0 ? '-' : ''}${formatAmount(Math.abs(amount))}`;

// 달력 칸처럼 좁은 곳에 쓰는 짧은 표기
export const formatCompact = (amount) => amount.toLocaleString('ko-KR');

export const formatDateLabel = (dateKey) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${weekday})`;
};
