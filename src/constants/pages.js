import { HOUSEHOLD } from './users';

export const HAS_SHOPPING = HOUSEHOLD.planner === 'shopping';

// 상단(넓은 화면) / 하단(폰) 탭 메뉴. monthly: 월 이동이 필요한 화면
export const PAGES = [
  { id: 'ledger', label: '가계부', monthly: true },
  { id: 'stats', label: '통계', monthly: true },
  { id: 'fixed', label: '고정·구독', monthly: false },
  { id: 'coupay', label: '쿠페이', monthly: true },
  // 우리 집: 달마다 살 것 + 메모 / 엄마: 메모만
  HAS_SHOPPING ? { id: 'plan', label: '계획', monthly: true } : { id: 'plan', label: '메모', monthly: false },
];

export const DEFAULT_PAGE = 'ledger';

// 예전 주소(#/subscriptions)도 고정·구독 탭으로
const ALIASES = { subscriptions: 'fixed' };

export const resolvePage = (id) => {
  const page = ALIASES[id] ?? id;
  return PAGES.some((p) => p.id === page) ? page : null;
};
