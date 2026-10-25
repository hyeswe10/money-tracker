import { useState } from 'react';
import { CATEGORIES } from '../../constants/categories';
import { TOTAL_BUDGET, roundBudget } from '../../utils/budget';
import { formatAmount } from '../../utils/format';
import CategoryIcon from '../CategoryIcon/CategoryIcon';
import '../DayPanel/DayPanel.scss';
import '../Summary/Summary.scss';
import '../Recurring/RecurringPanel.scss';
import './Planner.scss';

const STATUS_LABELS = { over: '초과', fast: '빠름', ok: '' };
const TONE_ICONS = { good: '✓', info: 'i', warn: '!', bad: '!' };

// 콤마 표시용. 입력값은 숫자만 보관
const withComma = (digits) => (digits ? Number(digits).toLocaleString('ko-KR') : '');
const onlyDigits = (value) => value.replace(/[^\d]/g, '').slice(0, 12);

// 예산 설정: 전체 예산(비우면 카테고리 합) + 지출 카테고리별 예산
const BudgetForm = ({ budgets, average, onSave, onCancel }) => {
  const [draft, setDraft] = useState(() =>
    Object.fromEntries([TOTAL_BUDGET, ...CATEGORIES.expense].map((id) => [id, budgets[id] ? String(budgets[id]) : ''])),
  );
  const categorySum = CATEGORIES.expense.reduce((s, c) => s + Number(draft[c] || 0), 0);

  const set = (id, value) => setDraft((prev) => ({ ...prev, [id]: onlyDigits(value) }));

  // 최근 3개월 평균을 만원 단위로 올려서 채운다 (평균이 없는 카테고리는 그대로)
  const fillFromAverage = () =>
    setDraft((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(average.byCategory)
          .filter(([c, amount]) => CATEGORIES.expense.includes(c) && amount > 0)
          .map(([c, amount]) => [c, String(roundBudget(amount))]),
      ),
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(Object.fromEntries(Object.entries(draft).map(([id, v]) => [id, Number(v || 0)])));
  };

  return (
    <form className="tx-form budget-form" onSubmit={handleSubmit}>
      <label className="tx-form__field">
        <span>한 달 전체 예산</span>
        <input
          inputMode="numeric"
          value={withComma(draft[TOTAL_BUDGET])}
          onChange={(e) => set(TOTAL_BUDGET, e.target.value)}
          placeholder={categorySum ? `비우면 카테고리 합 ${formatAmount(categorySum)}` : '예: 1,500,000'}
        />
      </label>
      {average.monthCount > 0 && (
        <p className="tx-form__hint">
          최근 {average.monthCount}개월 평균 지출 {formatAmount(average.expense)} · 수입 {formatAmount(average.income)}
        </p>
      )}

      <div className="budget-form__head">
        <span>카테고리별 예산 (선택)</span>
        {average.monthCount > 0 && (
          <button type="button" className="recurring__add" onClick={fillFromAverage}>
            평균으로 채우기
          </button>
        )}
      </div>
      <ul className="budget-form__list">
        {CATEGORIES.expense.map((c) => (
          <li key={c}>
            <span className="budget-form__name">
              <CategoryIcon category={c} size="sm" />
              <span>
                {c}
                {average.byCategory[c] > 0 && <small>평균 {formatAmount(average.byCategory[c])}</small>}
              </span>
            </span>
            <input
              inputMode="numeric"
              value={withComma(draft[c])}
              onChange={(e) => set(c, e.target.value)}
              placeholder="0"
              aria-label={`${c} 예산`}
            />
          </li>
        ))}
      </ul>

      <div className="tx-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn btn--primary">
          저장
        </button>
      </div>
    </form>
  );
};

const AdviceList =({ tips }) =>
  tips.length > 0 && (
    <ul className="advice">
      {tips.map((tip) => (
        <li key={tip.text} className={`advice__item is-${tip.tone}`}>
          <span className="advice__icon" aria-hidden="true">
            {TONE_ICONS[tip.tone]}
          </span>
          {tip.text}
        </li>
      ))}
    </ul>
  );

// 이번 달 예산: 남은 돈, 하루 쓸 수 있는 돈, 카테고리별 진행, 배분 추천
const BudgetCard = ({ analysis, budgets, tips, onSave }) => {
  const [editing, setEditing] = useState(false);
  const { totalBudget, remaining, committed, upcomingFixed, dailyAllowance, daysLeft, progress } = analysis;
  const month = Number(analysis.monthKey.slice(5, 7));
  const budgeted = analysis.categories.filter((c) => c.budget);
  const usedRate = totalBudget ? Math.min(committed / totalBudget, 1) : 0;

  const handleSave = async (next) => {
    // 저장에 실패하면(null) 입력한 값을 그대로 둔다
    if ((await onSave(next)) !== null) setEditing(false);
  };

  return (
    <section className="summary-card budget">
      <div className="recurring__head">
        <h2 className="summary-card__title">{month}월 예산</h2>
        {!editing && (
          <button type="button" className="recurring__add" onClick={() => setEditing(true)}>
            {totalBudget === null ? '+ 예산 정하기' : '설정'}
          </button>
        )}
      </div>

      {editing ? (
        <BudgetForm
          budgets={budgets}
          average={analysis.average}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          {totalBudget !== null && (
            <>
              <div className={`budget__hero${remaining < 0 ? ' is-over' : ''}`}>
                <span>{remaining < 0 ? '예산 초과' : '남은 예산'}</span>
                <strong>{formatAmount(Math.abs(remaining))}</strong>
                <div
                  className="budget__bar"
                  role="img"
                  aria-label={`예산의 ${Math.round((committed / totalBudget) * 100)}% 사용, 달의 ${Math.round(progress * 100)}% 지남`}
                >
                  <span className="budget__fill" style={{ width: `${usedRate * 100}%` }} />
                  <span className="budget__today" style={{ left: `${progress * 100}%` }} />
                </div>
                <small>
                  예산 {formatAmount(totalBudget)} 중 {formatAmount(committed)} 사용
                  {upcomingFixed > 0 && ` (예정된 고정 지출 ${formatAmount(upcomingFixed)} 포함)`}
                </small>
              </div>

              <dl className="monthly-summary budget__tiles">
                <div className="monthly-summary__tile">
                  <dt>하루 쓸 수 있는 돈</dt>
                  <dd>{formatAmount(dailyAllowance)}</dd>
                </div>
                <div className="monthly-summary__tile">
                  <dt>남은 날</dt>
                  <dd>{daysLeft}일</dd>
                </div>
              </dl>
            </>
          )}

          {budgeted.length > 0 && (
            <>
              <h3 className="summary-card__subtitle">카테고리별 예산</h3>
              <ul className="budget__categories">
                {budgeted.map((c) => (
                  <li key={c.category} className={`is-${c.status}`}>
                    <CategoryIcon category={c.category} size="sm" />
                    <div className="budget__cat-body">
                      <div className="budget__cat-label">
                        <span>
                          {c.category}
                          {STATUS_LABELS[c.status] && <em>{STATUS_LABELS[c.status]}</em>}
                        </span>
                        <span>
                          {formatAmount(c.spent)} <small>/ {formatAmount(c.budget)}</small>
                        </span>
                      </div>
                      <div className="budget__cat-bar">
                        <span style={{ width: `${Math.min(c.rate, 1) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="summary-card__subtitle">추천</h3>
          <AdviceList tips={tips} />
        </>
      )}
    </section>
  );
};

export default BudgetCard;
