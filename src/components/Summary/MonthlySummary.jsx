import { formatAmount } from '../../utils/format';
import { compareAmount } from '../../utils/summary';
import UserBadge from '../UserBadge/UserBadge';
import './Summary.scss';

const ExpenseComparison = ({ expense, prevExpense, prevMonth }) => {
  const { diff, rate } = compareAmount(expense, prevExpense);

  if (prevExpense === 0) {
    return (
      <div className="comparison">
        <span className="comparison__title">지난달 대비 지출</span>
        <p className="comparison__note">{prevMonth + 1}월 지출 내역이 없어 비교할 수 없습니다.</p>
      </div>
    );
  }

  const tone = diff > 0 ? 'is-up' : diff < 0 ? 'is-down' : 'is-same';
  const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '';
  const message = diff > 0 ? '더 썼어요' : diff < 0 ? '덜 썼어요' : '지난달과 같아요';

  return (
    <div className={`comparison ${tone}`}>
      <span className="comparison__title">지난달 대비 지출</span>
      <p className="comparison__main">
        {diff !== 0 && (
          <strong>
            {arrow} {formatAmount(Math.abs(diff))}
          </strong>
        )}{' '}
        {message}
        {diff !== 0 && <span className="comparison__rate">({rate > 0 ? '+' : ''}{rate.toFixed(1)}%)</span>}
      </p>
      <p className="comparison__note">
        {prevMonth + 1}월 지출 {formatAmount(prevExpense)}
      </p>
    </div>
  );
};

// 사람별 수입/지출/저축과 최종합산 표
const UserTable = ({ rows, total, activeUser }) => (
  <table className="user-table">
    <thead>
      <tr>
        <th scope="col">
          <span className="sr-only">이름</span>
        </th>
        <th scope="col">수입</th>
        <th scope="col">지출</th>
        <th scope="col">저축</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.id} className={row.id === activeUser ? 'is-active' : ''}>
          <th scope="row">
            <UserBadge userId={row.id} />
          </th>
          <td>{formatAmount(row.income)}</td>
          <td>{formatAmount(row.expense)}</td>
          <td>{formatAmount(row.saving)}</td>
        </tr>
      ))}
    </tbody>
    <tfoot>
      <tr>
        <th scope="row">합계</th>
        <td className="income">{formatAmount(total.income)}</td>
        <td className="expense">{formatAmount(total.expense)}</td>
        <td className="saving">{formatAmount(total.saving)}</td>
      </tr>
    </tfoot>
  </table>
);

const MonthlySummary = ({ month, prevMonth, viewLabel, totals, userSummary, activeUser, prevExpense }) => {
  const { income, expense, saving } = totals;
  // 저축은 지출과 따로 보지만, 남은 돈 계산에서는 빠져나간 돈으로 친다
  const balance = income - expense - saving;

  return (
    <section className="summary-card">
      <h2 className="summary-card__title">
        {month + 1}월 합계 <span className="summary-card__scope">{viewLabel}</span>
      </h2>
      <dl className="monthly-summary">
        <div className="monthly-summary__balance">
          <dt>남은 돈 (수입 − 지출 − 저축)</dt>
          <dd className={balance < 0 ? 'expense' : ''}>
            {balance < 0 ? '-' : ''}
            {formatAmount(Math.abs(balance))}
          </dd>
        </div>
        <div className="monthly-summary__tiles">
          <div className="monthly-summary__tile">
            <dt>수입</dt>
            <dd className="income">{formatAmount(income)}</dd>
          </div>
          <div className="monthly-summary__tile">
            <dt>지출</dt>
            <dd className="expense">{formatAmount(expense)}</dd>
          </div>
          <div className="monthly-summary__tile">
            <dt>저축</dt>
            <dd className="saving">{formatAmount(saving)}</dd>
          </div>
        </div>
      </dl>

      <h3 className="summary-card__subtitle">사람별 · 최종합산</h3>
      <UserTable rows={userSummary.rows} total={userSummary.total} activeUser={activeUser} />

      <ExpenseComparison expense={expense} prevExpense={prevExpense} prevMonth={prevMonth} />
    </section>
  );
};

export default MonthlySummary;
