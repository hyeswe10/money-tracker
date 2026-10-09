import { useState } from 'react';
import { TYPE_LABELS } from '../../constants/categories';
import { getTodayKey } from '../../utils/calendar';
import { formatAmount } from '../../utils/format';
import CategoryIcon from '../CategoryIcon/CategoryIcon';
import UserBadge from '../UserBadge/UserBadge';
import TransactionForm from '../DayPanel/TransactionForm';
import '../DayPanel/DayPanel.scss';
import '../Summary/Summary.scss';
import './RecurringPanel.scss';

const SIGNS = { income: '+', expense: '-', saving: '' };

const startLabel = (monthKey) => {
  const [y, m] = monthKey.split('-').map(Number);
  return `${y}년 ${m}월부터`;
};

// 통신비·보험료·구독료처럼 매달 같은 날 나가는 항목 관리
const RecurringPanel = ({ rules, viewLabel, defaultUser, onAdd, onUpdate, onDelete }) => {
  const [mode, setMode] = useState(null); // null | 'new' | 수정 중인 규칙 id
  const editing = rules.find((r) => r.id === mode);
  const todayKey = getTodayKey();

  const totals = ['expense', 'income', 'saving']
    .map((type) => ({ type, sum: rules.filter((r) => r.type === type).reduce((s, r) => s + r.amount, 0) }))
    .filter((t) => t.sum > 0);

  const handleSubmit = (data) => {
    if (editing) onUpdate(editing.id, data);
    else onAdd(data);
    setMode(null);
  };

  const handleDelete = (rule) => {
    const name = rule.memo || rule.category;
    const ok = window.confirm(
      `'${name}' 고정 항목을 삭제할까요?\n지난 내역은 그대로 남고, 아직 날짜가 안 된 내역만 함께 삭제됩니다.`,
    );
    if (!ok) return;
    onDelete(rule.id);
    if (mode === rule.id) setMode(null);
  };

  return (
    <section className="summary-card recurring">
      <div className="recurring__head">
        <h2 className="summary-card__title">
          고정 항목 <span className="summary-card__scope">{viewLabel}</span>
        </h2>
        {mode === null && (
          <button type="button" className="recurring__add" onClick={() => setMode('new')}>
            + 추가
          </button>
        )}
      </div>

      {totals.length > 0 && (
        <p className="recurring__totals">
          매달{' '}
          {totals.map(({ type, sum }, i) => (
            <span key={type}>
              {i > 0 && ' · '}
              {TYPE_LABELS[type]} <strong className={type}>{formatAmount(sum)}</strong>
            </span>
          ))}
        </p>
      )}

      {rules.length === 0 && mode === null && (
        <p className="summary-card__empty">
          통신비, 보험료, OTT 구독료처럼 매달 같은 날 나가는 항목을 등록하면 매달 자동으로 기록됩니다.
        </p>
      )}

      {rules.length > 0 && (
        <ul className="day-panel__list recurring__list">
          {rules.map((rule) => (
            <li key={rule.id} className={`tx-item${mode === rule.id ? ' is-editing' : ''}`}>
              <span className="tx-item__icon">
                <CategoryIcon category={rule.category} />
              </span>
              <div className="tx-item__info">
                <span className="tx-item__title">
                  <span className="tx-item__category">{rule.memo || rule.category}</span>
                  <UserBadge userId={rule.user} />
                </span>
                <span className="tx-item__memo">
                  매월 {rule.dayOfMonth}일 · {rule.category} · {startLabel(rule.startMonth)}
                </span>
              </div>
              <span className={`tx-item__amount ${rule.type}`}>
                {SIGNS[rule.type]}
                {formatAmount(rule.amount)}
              </span>
              <div className="tx-item__actions">
                <button type="button" onClick={() => setMode(rule.id)}>
                  수정
                </button>
                <button type="button" className="is-danger" onClick={() => handleDelete(rule)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {mode !== null && (
        <div className="recurring__form">
          <h3 className="day-panel__form-title">{editing ? '고정 항목 수정' : '고정 항목 추가'}</h3>
          {editing && (
            <p className="tx-form__hint recurring__hint">
              수정 내용은 아직 날짜가 안 된 내역과 앞으로 생길 내역에 반영됩니다. 날짜(매월 며칠) 변경은 다음 달부터
              적용됩니다.
            </p>
          )}
          <TransactionForm
            key={mode}
            initial={editing}
            defaultUser={defaultUser}
            schedule
            scheduleDefaults={{ dayOfMonth: Number(todayKey.slice(8, 10)), startMonth: todayKey.slice(0, 7) }}
            onSubmit={handleSubmit}
            onCancel={() => setMode(null)}
          />
        </div>
      )}
    </section>
  );
};

export default RecurringPanel;
