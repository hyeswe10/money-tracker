import { formatAmount, formatSignedAmount } from '../../utils/format';
import CategoryIcon from '../CategoryIcon/CategoryIcon';
import './Summary.scss';

// 'n월' 표기, 연도가 다르면 연도까지
const monthLabel = ({ year, month }, viewYear) => (year === viewYear ? `${month + 1}월` : `${year}년 ${month + 1}월`);

// 이번 달 - 평균. 지출은 평균보다 많으면 빨강, 수입·저축은 많으면 파랑
const Diff = ({ current, average, upIsBad }) => {
  const diff = current - average;
  if (diff === 0) return <span className="avg-diff">-</span>;
  const tone = diff > 0 === upIsBad ? 'is-bad' : 'is-good';
  return <span className={`avg-diff ${tone}`}>{formatSignedAmount(diff)}</span>;
};

// 평균 또는 이번 달에 한 번이라도 나온 카테고리를 평균 금액 순으로
const toRows = (avgMap, currentMap) =>
  [...new Set([...Object.keys(avgMap), ...Object.keys(currentMap)])]
    .map((category) => ({ category, average: avgMap[category] ?? 0, current: currentMap[category] ?? 0 }))
    .sort((a, b) => b.average - a.average || b.current - a.current);

const CategoryRows = ({ label, rows, upIsBad }) => (
  <tbody>
    <tr className="avg-table__group">
      <th scope="rowgroup" colSpan={4}>
        {label}
      </th>
    </tr>
    {rows.map(({ category, average, current }) => (
      <tr key={category}>
        <th scope="row">
          <span className="savings-summary__name">
            <CategoryIcon category={category} size="sm" />
            {category}
          </span>
        </th>
        <td>{formatAmount(average)}</td>
        <td className={current ? '' : 'is-zero'}>{formatAmount(current)}</td>
        <td>
          <Diff current={current} average={average} upIsBad={upIsBad} />
        </td>
      </tr>
    ))}
  </tbody>
);

const AverageSummary = ({ year, months, viewLabel, average, current }) => {
  const range = `${monthLabel(months[0], year)} ~ ${monthLabel(months[months.length - 1], year)}`;
  const expenseRows = toRows(average.byCategory, current.byCategory);
  const savingRows = toRows(average.savingByCategory, current.savingByCategory);

  const totals = [
    { key: 'income', label: '수입', upIsBad: false },
    { key: 'expense', label: '지출', upIsBad: true },
    { key: 'saving', label: '저축', upIsBad: false },
  ];

  return (
    <section className="summary-card">
      <h2 className="summary-card__title">
        최근 3개월 평균 <span className="summary-card__scope">{viewLabel}</span>
      </h2>
      <p className="avg-summary__range">
        {range} 월평균
        {average.monthCount > 0 && average.monthCount < months.length && ` · 내역이 있는 ${average.monthCount}개월 기준`}
      </p>

      {average.monthCount === 0 ? (
        <p className="summary-card__empty">{range}에 기록된 내역이 없어 평균을 낼 수 없습니다.</p>
      ) : (
        <>
          <dl className="monthly-summary monthly-summary__tiles">
            {totals.map(({ key, label, upIsBad }) => (
              <div key={key} className="monthly-summary__tile">
                <dt>평균 {label}</dt>
                <dd className={key}>{formatAmount(average[key])}</dd>
                <span className="avg-summary__compare">이번 달 {formatAmount(current[key])}</span>
                <span className="avg-summary__compare">
                  평균 대비 <Diff current={current[key]} average={average[key]} upIsBad={upIsBad} />
                </span>
              </div>
            ))}
          </dl>

          <h3 className="summary-card__subtitle">카테고리별 월평균</h3>
          <table className="savings-summary__table avg-table">
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col">월평균</th>
                <th scope="col">이번 달</th>
                <th scope="col">차이</th>
              </tr>
            </thead>
            {expenseRows.length > 0 && <CategoryRows label="지출" rows={expenseRows} upIsBad />}
            {savingRows.length > 0 && <CategoryRows label="저축" rows={savingRows} upIsBad={false} />}
          </table>
        </>
      )}
    </section>
  );
};

export default AverageSummary;
