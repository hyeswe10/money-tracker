import { formatAmount, formatCompact } from '../../utils/format';
import { compareAmount } from '../../utils/summary';
import { HOUSEHOLD, IS_SINGLE_USER } from '../../constants/users';
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

// 수입 · 지출 · 저축 칸 3개
const Tiles = ({ income, expense, saving }) => (
  <dl className="monthly-summary monthly-summary__tiles">
    <div className="monthly-summary__tile monthly-summary__tile--income">
      <dt>수입</dt>
      <dd>{formatCompact(income)}</dd>
    </div>
    <div className="monthly-summary__tile monthly-summary__tile--expense">
      <dt>지출</dt>
      <dd>{formatCompact(expense)}</dd>
    </div>
    <div className="monthly-summary__tile monthly-summary__tile--saving">
      <dt>저축</dt>
      <dd>{formatCompact(saving)}</dd>
    </div>
  </dl>
);

// 지출 나눠보기: 사람별 지출 비율 막대 (보기 필터와 관계없이 모두)
const ExpenseSplit = ({ rows }) => {
  const spent = rows.filter((r) => r.expense > 0);
  if (spent.length === 0) return null;
  return (
    <div className="expense-split">
      <div className="expense-split__labels">
        {spent.map((r) => (
          <span key={r.id} style={{ '--user-color': r.color }}>
            {r.name} {formatCompact(r.expense)}
          </span>
        ))}
      </div>
      <div className="expense-split__bar" role="img" aria-label={`지출 비율: ${spent.map((r) => `${r.name} ${formatAmount(r.expense)}`).join(', ')}`}>
        {spent.map((r) => (
          <span key={r.id} style={{ flexGrow: r.expense, '--user-color': r.color }} />
        ))}
      </div>
    </div>
  );
};

// 엄마: 쓴 돈을 크게, 지난달과 비교, 들어온 돈·모은 돈
const Hero = ({ month, isCurrent, income, expense, saving, prevExpense }) => {
  const diff = expense - prevExpense;
  const compare =
    prevExpense === 0
      ? null
      : diff === 0
        ? '지난달과 똑같이 썼어요'
        : `지난달보다 ${formatAmount(Math.abs(diff))} ${diff > 0 ? '더' : '덜'} 썼어요`;
  return (
    <div className="money-hero">
      <span className="money-hero__label">{isCurrent ? '이번 달' : `${month + 1}월에`} 쓴 돈</span>
      <strong className="money-hero__amount">
        {formatCompact(expense)}
        <small>원</small>
      </strong>
      {compare && <span className="money-hero__compare">{compare}</span>}
      <dl className="money-hero__tiles">
        <div>
          <dt className="income">들어온 돈</dt>
          <dd>{formatCompact(income)}</dd>
        </div>
        <div>
          <dt className="saving">모은 돈</dt>
          <dd>{formatCompact(saving)}</dd>
        </div>
      </dl>
    </div>
  );
};

// 사람별 수입/지출/저축 카드
const UserCards = ({ rows, activeUser }) => (
  <ul className="user-cards">
    {rows.map((row) => (
      <li
        key={row.id}
        className={`user-cards__item${row.id === activeUser ? ' is-active' : ''}`}
        style={{ '--user-color': row.color }}
      >
        <span className="user-cards__name">
          <span className="user-cards__avatar" aria-hidden="true">
            {row.name.slice(0, 1)}
          </span>
          {row.name}
        </span>
        <dl>
          <div>
            <dt>수입</dt>
            <dd>{formatCompact(row.income)}</dd>
          </div>
          <div>
            <dt>지출</dt>
            <dd>{formatCompact(row.expense)}</dd>
          </div>
          <div>
            <dt>저축</dt>
            <dd>{formatCompact(row.saving)}</dd>
          </div>
        </dl>
      </li>
    ))}
  </ul>
);

// compact: 가계부 탭에서는 합계만 (사람별 카드·지난달 비교는 통계 탭)
// isCurrent: 이번 달을 보고 있는지 ('이번 달 쓴 돈' / '9월에 쓴 돈')
const MonthlySummary = ({ month, prevMonth, isCurrent, viewLabel, totals, userSummary, activeUser, prevExpense, compact = false }) => {
  const { income, expense, saving } = totals;

  if (HOUSEHOLD.summaryStyle === 'hero') {
    return (
      <section className="summary-card summary-card--hero">
        <h2 className="sr-only">{month + 1}월 합계</h2>
        <Hero month={month} isCurrent={isCurrent} income={income} expense={expense} saving={saving} prevExpense={prevExpense} />
      </section>
    );
  }

  return (
    <section className="summary-card">
      <h2 className="summary-card__title">
        {month + 1}월 합계 <span className="summary-card__scope">{viewLabel}</span>
      </h2>
      <Tiles income={income} expense={expense} saving={saving} />
      {!IS_SINGLE_USER && <ExpenseSplit rows={userSummary.rows} />}

      {!compact && (
        <>
          {!IS_SINGLE_USER && (
            <>
              <h3 className="summary-card__subtitle">사람별</h3>
              <UserCards rows={userSummary.rows} activeUser={activeUser} />
            </>
          )}
          <ExpenseComparison expense={expense} prevExpense={prevExpense} prevMonth={prevMonth} />
        </>
      )}
    </section>
  );
};

export default MonthlySummary;
