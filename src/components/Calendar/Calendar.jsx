import { useMemo } from 'react';
import { WEEKDAYS, getCalendarCells } from '../../utils/calendar';
import CalendarCell from './CalendarCell';
import './Calendar.scss';

const Calendar = ({ year, month, selectedDate, dailyTotals, onSelect }) => {
  const cells = useMemo(() => getCalendarCells(year, month), [year, month]);

  return (
    <section className="calendar">
      <div className="calendar__weekdays">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`calendar__weekday${i === 0 ? ' is-sunday' : ''}${i === 6 ? ' is-saturday' : ''}`}>
            {w}
          </div>
        ))}
      </div>
      <div className="calendar__grid">
        {cells.map((cell) => (
          <CalendarCell
            key={cell.dateKey}
            cell={cell}
            totals={dailyTotals[cell.dateKey]}
            isSelected={cell.dateKey === selectedDate}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
};

export default Calendar;
