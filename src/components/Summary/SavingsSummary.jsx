import { formatAmount } from '../../utils/format';
import CategoryIcon from '../CategoryIcon/CategoryIcon';
import './Summary.scss';

// 적금·청약 등 저축: 이번 달 납입액과 이번 달까지의 누적액
const SavingsSummary = ({ year, month, viewLabel, monthTotal, monthByCategory, cumulative }) => {
  const rows = Object.entries(cumulative.byCategory)
    .map(([category, total]) => ({ category, total, thisMonth: monthByCategory[category] ?? 0 }))
    .sort((a, b) => b.total - a.total);

  return (
    <section className="summary-card">
      <h2 className="summary-card__title">
        저축 <span className="summary-card__scope">{viewLabel}</span>
      </h2>

      <dl className="monthly-summary savings-summary__stats">
        <div className="monthly-summary__tile">
          <dt>{month + 1}월 저축</dt>
          <dd className="saving">{formatAmount(monthTotal)}</dd>
        </div>
        <div className="monthly-summary__tile">
          <dt>
            누적 ({year}년 {month + 1}월까지)
          </dt>
          <dd className="saving">{formatAmount(cumulative.total)}</dd>
        </div>
      </dl>

      {rows.length === 0 ? (
        <p className="summary-card__empty">아직 저축 내역이 없습니다. 내역 입력에서 &lsquo;저축&rsquo;을 선택해 기록해보세요.</p>
      ) : (
        <table className="savings-summary__table">
          <thead>
            <tr>
              <th scope="col">항목</th>
              <th scope="col">{month + 1}월</th>
              <th scope="col">누적</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ category, total, thisMonth }) => (
              <tr key={category}>
                <th scope="row">
                  <span className="savings-summary__name">
                    <CategoryIcon category={category} size="sm" />
                    {category}
                  </span>
                </th>
                <td className={thisMonth ? '' : 'is-zero'}>{formatAmount(thisMonth)}</td>
                <td>{formatAmount(total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default SavingsSummary;
