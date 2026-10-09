import { formatCompact } from '../../utils/format';

const CalendarCell = ({ cell, totals, isSelected, onSelect }) => {
  const classNames = [
    'calendar__cell',
    !cell.inMonth && 'is-outside',
    cell.isToday && 'is-today',
    isSelected && 'is-selected',
    cell.weekday === 0 && 'is-sunday',
    cell.weekday === 6 && 'is-saturday',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classNames} onClick={() => onSelect(cell)}>
      <span className="calendar__day">{cell.day}</span>
      {totals && (
        <span className="calendar__totals">
          {totals.income > 0 && <span className="income">+{formatCompact(totals.income)}</span>}
          {totals.expense > 0 && <span className="expense">-{formatCompact(totals.expense)}</span>}
          {totals.saving > 0 && <span className="saving">{formatCompact(totals.saving)}</span>}
        </span>
      )}
    </button>
  );
};

export default CalendarCell;
