import { useState } from 'react';
import { CATEGORIES } from '../../constants/categories';
import { IS_SINGLE_USER, USERS } from '../../constants/users';
import { addMonth, toMonthKey } from '../../utils/calendar';
import { formatAmount } from '../../utils/format';
import UserBadge from '../UserBadge/UserBadge';
import '../DayPanel/DayPanel.scss';
import '../Summary/Summary.scss';
import '../Recurring/RecurringPanel.scss';
import './Planner.scss';

const NAME_MAX = 50;
const MEMO_MAX = 500;
// 살 달 고르기: 보고 있는 달 기준 앞 6개월 ~ 뒤 12개월
const MONTHS_BEFORE = 6;
const MONTHS_AFTER = 12;

const withComma = (digits) => (digits ? Number(digits).toLocaleString('ko-KR') : '');

const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return `${y}년 ${m}월`;
};

// 미정 + 보고 있는 달 주변. 항목의 달이 범위 밖이면 그 달도 넣는다
const getMonthOptions = (monthKey, current) => {
  const [y, m] = monthKey.split('-').map(Number);
  const keys = Array.from({ length: MONTHS_BEFORE + MONTHS_AFTER + 1 }, (_, i) => {
    const d = addMonth(y, m - 1, i - MONTHS_BEFORE);
    return toMonthKey(d.year, d.month);
  });
  if (current && !keys.includes(current)) keys.push(current);
  return keys.sort();
};

const toFormState = (item, defaultUser, monthKey) => ({
  name: item?.name ?? '',
  amount: item?.amount ? String(item.amount) : '',
  category: item?.category ?? '',
  memo: item?.memo ?? '',
  user: item?.user ?? defaultUser,
  month: item ? (item.month ?? '') : monthKey,
});

// 살 것 추가·수정 폼. initial이 있으면 수정
const ItemForm = ({ initial, defaultUser, monthKey, onSubmit, onCancel }) => {
  const [form, setForm] = useState(() => toFormState(initial, defaultUser, monthKey));
  const set = (patch) => setForm((p) => ({ ...p, ...patch }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const memo = form.memo.trim();
    onSubmit({
      name: name.slice(0, NAME_MAX),
      amount: Number(form.amount) || null,
      category: form.category || null,
      user: form.user,
      month: form.month || null,
      // 메모가 바뀔 때만 보냄 (007을 실행하기 전에도 메모 없이 추가·수정은 되도록)
      ...(memo !== (initial?.memo ?? '') ? { memo } : {}),
    });
    // 다음 항목도 같은 사람·같은 달로 이어서 적기 쉽게
    if (!initial) setForm((p) => toFormState(null, p.user, p.month));
  };

  return (
    <form className={`shopping__form${initial ? ' is-edit' : ''}`} onSubmit={handleSubmit}>
      {!IS_SINGLE_USER && (
        <div className="tx-form__users shopping__users" role="radiogroup" aria-label="누구 것">
          {USERS.map(({ id, name, color }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={form.user === id}
              className={`tx-form__user${form.user === id ? ' is-active' : ''}`}
              style={{ '--user-color': color }}
              onClick={() => set({ user: id })}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <input
        className="shopping__name"
        value={form.name}
        onChange={(e) => set({ name: e.target.value })}
        placeholder="살 것 (예: 겨울 이불)"
        maxLength={NAME_MAX}
        aria-label="살 것"
        autoFocus={Boolean(initial)}
      />
      <input
        className="shopping__amount"
        inputMode="numeric"
        value={withComma(form.amount)}
        onChange={(e) => set({ amount: e.target.value.replace(/[^\d]/g, '').slice(0, 12) })}
        placeholder="예상 금액"
        aria-label="예상 금액"
      />
      <select
        className="shopping__category"
        value={form.category}
        onChange={(e) => set({ category: e.target.value })}
        aria-label="카테고리"
      >
        <option value="">카테고리</option>
        {CATEGORIES.expense.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        className="shopping__month"
        value={form.month}
        onChange={(e) => set({ month: e.target.value })}
        aria-label="살 달"
      >
        <option value="">언제 살지 미정</option>
        {getMonthOptions(monthKey, initial?.month).map((key) => (
          <option key={key} value={key}>
            {monthLabel(key)}
          </option>
        ))}
      </select>
      {!initial && (
        <button type="submit" className="btn btn--primary shopping__submit" disabled={!form.name.trim()}>
          추가
        </button>
      )}
      <textarea
        className="shopping__memo-input"
        value={form.memo}
        onChange={(e) => set({ memo: e.target.value })}
        placeholder="메모 (선택) · 어디서 살지, 크기·색 등"
        maxLength={MEMO_MAX}
        rows={initial ? 3 : 1}
        aria-label="메모"
      />
      {initial && (
        <div className="shopping__form-actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            취소
          </button>
          <button type="submit" className="btn btn--primary" disabled={!form.name.trim()}>
            저장
          </button>
        </div>
      )}
    </form>
  );
};

const sumAmount = (list) => list.reduce((s, i) => s + (i.amount ?? 0), 0);

// 예상 금액을 정우·계주·공용 따로. 기본은 금액 있는 사람이 둘 이상일 때만 (한 사람뿐이면 합계와 같으니)
// always: 한 사람뿐이어도 누구 것인지 보이게 (다음 달 줄은 목록이 안 보이므로)
const UserSums = ({ list, always = false }) => {
  if (IS_SINGLE_USER) return null;
  const sums = USERS.map(({ id }) => ({ id, sum: sumAmount(list.filter((i) => i.user === id)) })).filter((u) => u.sum > 0);
  if (sums.length < (always ? 1 : 2)) return null;
  return (
    <span className="shopping__user-sums">
      {sums.map(({ id, sum }) => (
        <span key={id} className="shopping__user-sum">
          <UserBadge userId={id} />
          {formatAmount(sum)}
        </span>
      ))}
    </span>
  );
};

const Totals = ({ list }) => {
  const sum = sumAmount(list);
  return (
    <div className="recurring__totals shopping__totals">
      <span>
        {list.length}개{sum > 0 && <> · 예상 <strong>{formatAmount(sum)}</strong></>}
      </span>
      <UserSums list={list} />
    </div>
  );
};

// 살 것 목록: 달마다 따로, 언제 살지 안 정한 것은 '미정'에 모아 둔다
// monthKey: 헤더에서 보고 있는 달, todayMonthKey: 미정 항목을 체크하면 이번 달로 옮긴다
const ShoppingList = ({ items, month, monthKey, todayMonthKey, viewLabel, defaultUser, onAdd, onUpdate, onDelete, onRecord }) => {
  const [showDone, setShowDone] = useState(false);
  const [showUndecided, setShowUndecided] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const byCreated = (a, b) => a.createdAt - b.createdAt;
  const monthItems = items.filter((i) => i.month === monthKey);
  const todo = monthItems.filter((i) => !i.done).sort(byCreated);
  const done = monthItems.filter((i) => i.done).sort((a, b) => b.createdAt - a.createdAt);
  const undecided = items.filter((i) => !i.month && !i.done).sort(byCreated);
  // 다음 달로 넘기지 않아도 몇 개 잡혀 있는지 보이게
  const [year, monthNum] = monthKey.split('-').map(Number);
  const next = addMonth(year, monthNum - 1, 1);
  const nextTodo = items.filter((i) => i.month === toMonthKey(next.year, next.month) && !i.done);
  const nextSum = sumAmount(nextTodo);

  const handleEdit = (data) => {
    onUpdate(editingId, data);
    setEditingId(null);
  };

  const handleCheck = (item) => onUpdate(item.id, { done: true, ...(item.month ? {} : { month: todayMonthKey }) });

  const handleDelete = (item) => {
    if (window.confirm(`'${item.name}'을(를) 목록에서 지울까요?`)) onDelete(item.id);
  };

  const clearDone = () => {
    if (window.confirm(`산 것 ${done.length}개를 목록에서 지울까요?`)) done.forEach((i) => onDelete(i.id));
  };

  const renderTodo = (list) => (
    <ul className="shopping__list">
      {list.map((item) => {
        if (editingId === item.id) {
          return (
            <li key={item.id} className="shopping__item is-editing">
              <ItemForm initial={item} monthKey={monthKey} onSubmit={handleEdit} onCancel={() => setEditingId(null)} />
            </li>
          );
        }
        return (
          <li key={item.id} className="shopping__item">
            <input
              type="checkbox"
              checked={false}
              onChange={() => handleCheck(item)}
              aria-label={`${item.name} 완료`}
            />
            <div className="shopping__info">
              <span className="shopping__title">{item.name}</span>
              <span className="tx-item__meta">
                <UserBadge userId={item.user} />
                {item.amount && <strong>{formatAmount(item.amount)}</strong>}
                {item.category && <span>{item.category}</span>}
              </span>
              {item.memo && <p className="shopping__memo">{item.memo}</p>}
            </div>
            <div className="tx-item__actions shopping__actions">
              {item.amount && (
                <button type="button" onClick={() => onRecord(item)} title="오늘 지출로 기록하고 체크">
                  샀어요
                </button>
              )}
              <button type="button" onClick={() => setEditingId(item.id)}>
                수정
              </button>
              <button type="button" className="is-danger" onClick={() => handleDelete(item)}>
                삭제
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className="summary-card shopping">
      <h2 className="summary-card__title">
        {month + 1}월에 살 것 <span className="summary-card__scope">{viewLabel}</span>
      </h2>
      {todo.length > 0 && <Totals list={todo} />}

      <ItemForm key={monthKey} defaultUser={defaultUser} monthKey={monthKey} onSubmit={(data) => onAdd({ ...data, done: false })} />

      {todo.length === 0 ? (
        <p className="summary-card__empty">{month + 1}월에 살 것이 없어요.</p>
      ) : (
        renderTodo(todo)
      )}

      {done.length > 0 && (
        <div className="shopping__done">
          <div className="shopping__done-head">
            <button type="button" className="shopping__more" onClick={() => setShowDone((v) => !v)}>
              {showDone ? '산 것 접기' : `산 것 ${done.length}개 보기`}
            </button>
            {showDone && (
              <button type="button" className="shopping__more" onClick={clearDone}>
                모두 지우기
              </button>
            )}
          </div>
          {showDone && (
            <ul className="shopping__list">
              {done.map((item) => (
                <li key={item.id} className="shopping__item is-done">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => onUpdate(item.id, { done: false })}
                    aria-label={`${item.name} 완료 취소`}
                  />
                  <div className="shopping__info">
                    <span className="shopping__title">{item.name}</span>
                    <span className="tx-item__meta">
                      <UserBadge userId={item.user} />
                      {item.amount && <span>{formatAmount(item.amount)}</span>}
                    </span>
                    {item.memo && <p className="shopping__memo">{item.memo}</p>}
                  </div>
                  <div className="tx-item__actions shopping__actions">
                    <button type="button" className="is-danger" onClick={() => onDelete(item.id)}>
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="shopping__next">
        <span>
          다음 달({next.month + 1}월)에 살 것{' '}
          {nextTodo.length > 0 ? (
            <>
              <strong>{nextTodo.length}개</strong>
              {nextSum > 0 && <> · 예상 {formatAmount(nextSum)}</>}
            </>
          ) : (
            '없음'
          )}
        </span>
        <UserSums list={nextTodo} always />
      </div>

      <div className="shopping__undecided">
        <button
          type="button"
          className="shopping__toggle"
          onClick={() => setShowUndecided((v) => !v)}
          aria-expanded={showUndecided}
        >
          <h3 className="shopping__subtitle">언제 살지 미정</h3>
          <span className="shopping__toggle-summary">
            {undecided.length}개{sumAmount(undecided) > 0 && <> · 예상 {formatAmount(sumAmount(undecided))}</>}
          </span>
          <span className={`shopping__chevron${showUndecided ? ' is-open' : ''}`} aria-hidden="true" />
        </button>
        {showUndecided &&
          (undecided.length === 0 ? (
            <p className="summary-card__empty">살 달을 &lsquo;언제 살지 미정&rsquo;으로 두면 여기에 모여요.</p>
          ) : (
            <>
              <UserSums list={undecided} />
              {renderTodo(undecided)}
            </>
          ))}
      </div>
    </section>
  );
};

export default ShoppingList;
