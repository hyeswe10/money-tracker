import { useState } from 'react';
import { IS_SINGLE_USER, USERS } from '../../constants/users';
import { getTodayKey } from '../../utils/calendar';
import { formatAmount } from '../../utils/format';
import { annualAmount, monthlyEquivalent, nextPaymentDate, scheduleLabel } from '../../utils/recurring';
import CategoryIcon from '../CategoryIcon/CategoryIcon';
import UserBadge from '../UserBadge/UserBadge';
import TransactionForm from '../DayPanel/TransactionForm';
import '../DayPanel/DayPanel.scss';
import '../Summary/Summary.scss';
import '../Recurring/RecurringPanel.scss';
import './SubscriptionsPage.scss';

const sum = (list, fn) => list.reduce((s, r) => s + fn(r), 0);

// 'YYYY-MM-DD' → '10월 15일', 오늘과의 차이 'D-4' / '오늘'
const dateLabel = (dateKey) => `${Number(dateKey.slice(5, 7))}월 ${Number(dateKey.slice(8, 10))}일`;
const dDay = (dateKey, todayKey) => {
  const diff = Math.round((new Date(dateKey) - new Date(todayKey)) / 86400000);
  return diff === 0 ? '오늘' : `D-${diff}`;
};

// 정기구독만 모아 보기: 넷플릭스·티빙·쿠팡 와우 등. 고정 항목 중 '정기구독'으로 체크된 것
const SubscriptionsPage = ({ rules, viewLabel, defaultUser, onAdd, onUpdate, onDelete }) => {
  const [mode, setMode] = useState(null); // null | 'new' | 수정 중인 규칙 id
  const todayKey = getTodayKey();
  const subs = rules
    .filter((r) => r.isSubscription)
    .map((r) => ({ ...r, next: nextPaymentDate(r, todayKey) }))
    .sort((a, b) => (a.next ?? '9999').localeCompare(b.next ?? '9999'));
  const editing = subs.find((r) => r.id === mode);

  const monthlyTotal = sum(subs, monthlyEquivalent);
  const annualTotal = sum(subs, annualAmount);
  const byUser = USERS.map((u) => {
    const mine = subs.filter((r) => r.user === u.id);
    return { ...u, count: mine.length, monthly: sum(mine, monthlyEquivalent) };
  });

  const handleSubmit = (data) => {
    if (editing) onUpdate(editing.id, data);
    else onAdd(data);
    setMode(null);
  };

  const handleDelete = (rule) => {
    const ok = window.confirm(
      `'${rule.memo || rule.category}' 구독을 삭제할까요?\n지난 결제 내역은 남고, 아직 날짜가 안 된 결제만 함께 삭제됩니다.`,
    );
    if (!ok) return;
    onDelete(rule.id);
    if (mode === rule.id) setMode(null);
  };

  return (
    <div className="subs">
      <section className="summary-card">
        <div className="recurring__head">
          <h2 className="summary-card__title">
            정기구독 <span className="summary-card__scope">{viewLabel}</span>
          </h2>
          {mode === null && (
            <button type="button" className="recurring__add" onClick={() => setMode('new')}>
              + 구독 추가
            </button>
          )}
        </div>

        <dl className="monthly-summary monthly-summary__tiles">
          <div className="monthly-summary__tile">
            <dt>월 구독료</dt>
            <dd className="expense">{formatAmount(monthlyTotal)}</dd>
            <span className="avg-summary__compare">연 결제 월 환산 포함</span>
          </div>
          <div className="monthly-summary__tile">
            <dt>1년 총액</dt>
            <dd>{formatAmount(annualTotal)}</dd>
          </div>
          <div className="monthly-summary__tile">
            <dt>구독 수</dt>
            <dd>{subs.length}개</dd>
          </div>
        </dl>

        {!IS_SINGLE_USER && (
          <ul className="subs__people">
            {byUser.map((u) => (
              <li key={u.id}>
                <UserBadge userId={u.id} />
                <span>
                  {u.count}개 · 월 <strong>{formatAmount(u.monthly)}</strong>
                </span>
              </li>
            ))}
          </ul>
        )}

        {mode !== null && (
          <div className="recurring__form">
            <h3 className="day-panel__form-title">{editing ? '구독 수정' : '구독 추가'}</h3>
            <TransactionForm
              key={mode}
              initial={editing}
              defaultUser={defaultUser}
              schedule
              scheduleDefaults={{
                dayOfMonth: Number(todayKey.slice(8, 10)),
                startMonth: todayKey.slice(0, 7),
                monthOfYear: Number(todayKey.slice(5, 7)),
                isSubscription: true,
              }}
              onSubmit={handleSubmit}
              onCancel={() => setMode(null)}
            />
          </div>
        )}
      </section>

      <section className="summary-card">
        <h2 className="summary-card__title">다음 결제 순</h2>
        {subs.length === 0 ? (
          <p className="summary-card__empty">
            아직 정기구독이 없습니다. &lsquo;+ 구독 추가&rsquo;를 누르거나, 고정 항목을 수정해서 &lsquo;정기구독&rsquo;에
            체크하세요.
          </p>
        ) : (
          <ul className="day-panel__list subs__list">
            {subs.map((rule) => (
              <li key={rule.id} className={`tx-item${mode === rule.id ? ' is-editing' : ''}`}>
                <span className="tx-item__icon">
                  <CategoryIcon category={rule.category} memo={rule.memo} />
                </span>
                <div className="tx-item__info">
                  <span className="tx-item__title">{rule.memo || rule.category}</span>
                  <span className="tx-item__meta">
                    <UserBadge userId={rule.user} />
                    {rule.frequency === 'yearly' && <span className="tx-item__tag">연</span>}
                    <span>
                      {scheduleLabel(rule)}
                      {rule.next && (
                        <>
                          {' · '}
                          다음 결제 {dateLabel(rule.next)} <strong className="subs__dday">{dDay(rule.next, todayKey)}</strong>
                        </>
                      )}
                    </span>
                  </span>
                </div>
                <span className={`tx-item__amount ${rule.type}`}>
                  {formatAmount(rule.amount)}
                  {rule.frequency === 'yearly' && (
                    <small className="subs__monthly">월 {formatAmount(monthlyEquivalent(rule))}</small>
                  )}
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
      </section>
    </div>
  );
};

export default SubscriptionsPage;
