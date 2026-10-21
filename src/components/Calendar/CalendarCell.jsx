import { HOUSEHOLD, USERS, getUser } from '../../constants/users';
import { formatShort } from '../../utils/format';

// 점 순서를 사람 목록 순서로 고정 (정우 → 계주 → 공용)
const byUserOrder = (a, b) => USERS.findIndex((u) => u.id === a) - USERS.findIndex((u) => u.id === b);

// 우리 집: 그날 지출한 사람 색 점, 수입이 있는 날(월급날 등)은 날짜에 테두리
const UserMarks = ({ totals }) => (
  <span className="calendar__dots" aria-hidden="true">
    {[...totals.spenders].sort(byUserOrder).map((id) => (
      <span key={id} className="calendar__dot" style={{ '--user-color': getUser(id).color }} />
    ))}
  </span>
);

// 엄마: 그날 쓴 금액
const ExpenseMark = ({ totals }) =>
  totals.expense > 0 ? <span className="calendar__spent">{formatShort(totals.expense)}</span> : null;

const CalendarCell = ({ cell, totals, isSelected, onSelect }) => {
  const classNames = [
    'calendar__cell',
    !cell.inMonth && 'is-outside',
    cell.isToday && 'is-today',
    isSelected && 'is-selected',
    totals?.income > 0 && 'has-income',
    cell.weekday === 0 && 'is-sunday',
    cell.weekday === 6 && 'is-saturday',
  ]
    .filter(Boolean)
    .join(' ');

  const Marks = HOUSEHOLD.calendarMarks === 'expense' ? ExpenseMark : UserMarks;

  return (
    <button type="button" className={classNames} onClick={() => onSelect(cell)}>
      <span className="calendar__day">{cell.day}</span>
      {totals && <Marks totals={totals} />}
    </button>
  );
};

export default CalendarCell;
