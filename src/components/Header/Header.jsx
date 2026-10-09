import { useEffect, useState } from 'react';
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

const Header = ({ year, month, onMove, onChange, onToday }) => {
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
        <span className="header__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
        </span>
        <h1 className="header__title">만년 가계부</h1>
      </div>
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
    </header>
  );
};

export default Header;
