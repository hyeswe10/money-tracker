import { formatAmount } from '../../utils/format';

const SIZE = 160;
const RADIUS = 60;
const STROKE = 22;
const GAP = 2; // 조각 사이 여백(px)
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// segments: [{ key, label, value, color }]
const DonutChart = ({ segments, total, activeKey, onActiveChange }) => {
  const active = segments.find((s) => s.key === activeKey);
  const hasGap = segments.length > 1;

  // 각 조각의 시작 위치(누적 비율)를 미리 계산
  const arcs = segments.reduce((acc, s) => {
    const start = acc.length ? acc[acc.length - 1].end : 0;
    return [...acc, { ...s, start, end: start + s.value / total }];
  }, []);

  const ariaLabel = segments.map((s) => `${s.label} ${((s.value / total) * 100).toFixed(1)}%`).join(', ');

  return (
    <div className="donut">
      <svg
        className="donut__svg"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`카테고리별 지출 비율: ${ariaLabel}`}
        onMouseLeave={() => onActiveChange(null)}
      >
        <circle className="donut__track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {arcs.map((arc) => {
            const length = (arc.end - arc.start) * CIRCUMFERENCE;
            const dash = Math.max(length - (hasGap ? GAP : 0), 0.5);
            const isActive = arc.key === activeKey;
            const isDimmed = activeKey !== null && !isActive;
            return (
              <circle
                key={arc.key}
                className={`donut__arc${isDimmed ? ' is-dimmed' : ''}`}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={arc.color}
                strokeWidth={isActive ? STROKE + 6 : STROKE}
                strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
                strokeDashoffset={-arc.start * CIRCUMFERENCE}
                onMouseEnter={() => onActiveChange(arc.key)}
              />
            );
          })}
        </g>
      </svg>
      <div className="donut__center" aria-hidden="true">
        {active ? (
          <>
            <span className="donut__label">{active.label}</span>
            <strong className="donut__value">{((active.value / total) * 100).toFixed(1)}%</strong>
            <span className="donut__sub">{formatAmount(active.value)}</span>
          </>
        ) : (
          <>
            <span className="donut__label">총 지출</span>
            <strong className="donut__value donut__value--total">{formatAmount(total)}</strong>
          </>
        )}
      </div>
    </div>
  );
};

export default DonutChart;
