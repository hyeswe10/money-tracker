import { useState } from 'react';
import { CATEGORIES } from '../../constants/categories';
import { judgeItem } from '../../utils/budget';
import { formatAmount } from '../../utils/format';
import UserBadge from '../UserBadge/UserBadge';
import '../DayPanel/DayPanel.scss';
import '../Summary/Summary.scss';
import '../Recurring/RecurringPanel.scss';
import './Planner.scss';

const VERDICT_LABELS = { ok: '여유', tight: '빠듯', over: '무리', unknown: '예산 없음' };
const NAME_MAX = 50;
const MEMO_MAX = 500;

const withComma = (digits) => (digits ? Number(digits).toLocaleString('ko-KR') : '');

const toFormState = (item) => ({
  name: item?.name ?? '',
  amount: item?.amount ? String(item.amount) : '',
  category: item?.category ?? '',
  memo: item?.memo ?? '',
});

// 살 것 추가·수정 폼. initial이 있으면 수정
const ItemForm = ({ initial, onSubmit, onCancel }) => {
  const [form, setForm] = useState(() => toFormState(initial));
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
      // 메모가 바뀔 때만 보냄 (007을 실행하기 전에도 메모 없이 추가·수정은 되도록)
      ...(memo !== (initial?.memo ?? '') ? { memo } : {}),
    });
    if (!initial) setForm(toFormState());
  };

  return (
    <form className={`shopping__form${initial ? ' is-edit' : ''}`} onSubmit={handleSubmit}>
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
      {!initial && (
        <button type="submit" className="btn btn--primary shopping__submit" disabled={!form.name.trim()}>
          추가
        </button>
      )}
      <textarea
        className="shopping__memo-input"
        value={form.memo}
        onChange={(e) => set({ memo: e.target.value })}
        placeholder="메모 (선택) · 어디서 살지, 크기·색, 이사 전에 필요 등"
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

// 앞으로 살 것 체크리스트. 금액을 적으면 이번 달 예산으로 살 만한지 알려준다
const ShoppingList = ({ items, analysis, budgets, defaultUser, onAdd, onUpdate, onDelete, onRecord }) => {
  const [showDone, setShowDone] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const todo = items.filter((i) => !i.done).sort((a, b) => a.createdAt - b.createdAt);
  const done = items.filter((i) => i.done).sort((a, b) => b.createdAt - a.createdAt);
  const todoSum = todo.reduce((s, i) => s + (i.amount ?? 0), 0);

  const handleAdd = (data) => onAdd({ ...data, user: defaultUser, done: false });

  const handleEdit = (data) => {
    onUpdate(editingId, data);
    setEditingId(null);
  };

  const handleDelete = (item) => {
    if (window.confirm(`'${item.name}'을(를) 목록에서 지울까요?`)) onDelete(item.id);
  };

  const clearDone = () => {
    if (window.confirm(`산 것 ${done.length}개를 목록에서 지울까요?`)) done.forEach((i) => onDelete(i.id));
  };

  return (
    <section className="summary-card shopping">
      <h2 className="summary-card__title">살 것</h2>
      {todo.length > 0 && (
        <p className="recurring__totals">
          {todo.length}개{todoSum > 0 && <> · 예상 <strong>{formatAmount(todoSum)}</strong></>}
        </p>
      )}

      <ItemForm onSubmit={handleAdd} />

      {todo.length === 0 ? (
        <p className="summary-card__empty">사야 할 것을 적어 두면, 금액에 따라 이번 달에 사도 될지 알려드려요.</p>
      ) : (
        <ul className="shopping__list">
          {todo.map((item) => {
            if (editingId === item.id) {
              return (
                <li key={item.id} className="shopping__item is-editing">
                  <ItemForm initial={item} onSubmit={handleEdit} onCancel={() => setEditingId(null)} />
                </li>
              );
            }
            const verdict = judgeItem(item, analysis, budgets);
            return (
              <li key={item.id} className="shopping__item">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => onUpdate(item.id, { done: true })}
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
                  {verdict && (
                    <span className={`shopping__verdict is-${verdict.level}`}>
                      <em>{VERDICT_LABELS[verdict.level]}</em>
                      {verdict.text}
                    </span>
                  )}
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
                    {item.amount && <span className="tx-item__meta">{formatAmount(item.amount)}</span>}
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
    </section>
  );
};

export default ShoppingList;
