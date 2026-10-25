import { useEffect, useState } from 'react';
import { PAGES } from '../../constants/pages';
import { HOUSEHOLD, USERS } from '../../constants/users';
import { WEEKDAYS, getTodayKey } from '../../utils/calendar';
import './Header.scss';

const MONTHS = Array.from({ length: 12 }, (_, i) => i);
// Date는 0~99년을 1900년대로 해석하므로 범위를 제한
const MIN_YEAR = 1900;
const MAX_YEAR = 9999;

const ChevronIcon = ({ direction }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
  </svg>
);

// 폰 하단 탭에서만 보이는 아이콘
const TAB_ICONS = {
  ledger: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  stats: <path d="M3 3v18h18M8 17v-5M13 17V8M18 17V5" />,
  fixed: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  coupay: (
    <>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
  plan: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="m9 9 1.5 1.5L13 8M9 15h6" />
    </>
  ),
};

// 헤더 오른쪽 동그라미 (로그인하는 사람들)
const AVATAR_USERS = USERS.filter((u) => u.avatar);

// '정우 · 계주의 10월' 또는 '10월 21일 수요일'
const getSubtitle = (month) => {
  if (HOUSEHOLD.headerSubtitle === 'today') {
    const [y, m, d] = getTodayKey().split('-').map(Number);
    return `${m}월 ${d}일 ${WEEKDAYS[new Date(y, m - 1, d).getDay()]}요일`;
  }
  return `${AVATAR_USERS.map((u) => u.name).join(' · ')}의 ${month + 1}월`;
};

const Header = ({ page, year, month, onMove, onChange, onToday }) => {
  const subtitle = getSubtitle(month);
  // 입력 중에는 임시값만 바꾸고, Enter/포커스 해제 시 반영
  const [yearDraft, setYearDraft] = useState(String(year));

  useEffect(() => {
    setYearDraft(String(year));
  }, [year]);

  const commitYear = () => {
    const next = Number(yearDraft);
    if (Number.isInteger(next) && next >= MIN_YEAR && next <= MAX_YEAR) {
      if (next !== year) onChange(next, month);
    } else {
      setYearDraft(String(year));
    }
  };

  const handleYearKeyDown = (e) => {
    if (e.key === 'Enter') e.currentTarget.blur();
  };

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__eyebrow">{subtitle}</span>
        <h1 className="header__title">{HOUSEHOLD.name}</h1>
      </div>
      {AVATAR_USERS.length > 0 && (
        <div className="header__avatars" aria-hidden="true">
          {AVATAR_USERS.map((u) => (
            <span key={u.id} className="header__avatar" style={{ '--user-color': u.color }}>
              {u.name.slice(0, 1)}
            </span>
          ))}
        </div>
      )}
      <nav className="header__tabs" aria-label="메뉴">
        {PAGES.map((p) => (
          <a
            key={p.id}
            href={`#/${p.id}`}
            className={`header__tab${page === p.id ? ' is-active' : ''}`}
            aria-current={page === p.id ? 'page' : undefined}
          >
            <svg
              className="header__tab-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {TAB_ICONS[p.id]}
            </svg>
            {p.label}
          </a>
        ))}
      </nav>
      {/* 월 이동은 달별로 보는 화면에서만 */}
      {PAGES.find((p) => p.id === page)?.monthly && (
        <div className="header__nav">
          <div className="header__pill">
            <button type="button" className="header__arrow" onClick={() => onMove(-1)} aria-label="이전 달">
              <ChevronIcon direction="left" />
            </button>
            <div className="header__current">
              <input
                type="number"
                className="header__year"
                value={yearDraft}
                min={MIN_YEAR}
                max={MAX_YEAR}
                onChange={(e) => setYearDraft(e.target.value)}
                onBlur={commitYear}
                onKeyDown={handleYearKeyDown}
                aria-label="연도"
              />
              <span>년</span>
              <select
                className="header__month"
                value={month}
                onChange={(e) => onChange(year, Number(e.target.value))}
                aria-label="월"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m + 1}월
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="header__arrow" onClick={() => onMove(1)} aria-label="다음 달">
              <ChevronIcon direction="right" />
            </button>
          </div>
          <button type="button" className="header__today" onClick={onToday}>
            오늘
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
