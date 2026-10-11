import { useState } from 'react';
import { detectBrand } from '../../constants/brands';
import { CATEGORIES, TRANSACTION_TYPES, TYPE_LABELS } from '../../constants/categories';
import { USERS } from '../../constants/users';
import CategoryIcon from '../CategoryIcon/CategoryIcon';

const TYPES = [TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.SAVING];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const MONTH_KEY_RE = /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/;

const FREQUENCIES = [
  { id: 'monthly', label: '매월' },
  { id: 'yearly', label: '매년' },
];
const REPEATS = [{ id: 'none', label: '반복 안 함' }, ...FREQUENCIES];

const EMPTY_FORM = {
  type: TRANSACTION_TYPES.EXPENSE,
  amount: '',
  category: CATEGORIES.expense[0],
  memo: '',
};

// initial: 수정할 내역 또는 고정 항목 규칙. scheduleDefaults: 새 고정 항목의 기본값
const toFormState = (initial, defaultUser, scheduleDefaults = {}) => {
  const schedule = {
    dayOfMonth: String(initial?.dayOfMonth ?? scheduleDefaults.dayOfMonth ?? 1),
    startMonth: initial?.startMonth ?? scheduleDefaults.startMonth ?? '',
    frequency: initial?.frequency ?? 'monthly',
    monthOfYear: String(initial?.monthOfYear ?? scheduleDefaults.monthOfYear ?? 1),
    isSubscription: initial?.isSubscription ?? scheduleDefaults.isSubscription ?? false,
    repeat: 'none',
  };
  return initial
    ? {
        type: initial.type,
        amount: String(initial.amount),
        category: initial.category,
        memo: initial.memo,
        user: initial.user,
        ...schedule,
      }
    : { ...EMPTY_FORM, user: defaultUser, ...schedule };
};

// 작은 세그먼트 버튼 묶음 (지출/수입/저축, 매월/매년, 반복 여부)
const Segment = ({ options, value, onChange, label }) => (
  <div className={`tx-form__types tx-form__types--${options.length}`} role="radiogroup" aria-label={label}>
    {options.map((o) => (
      <button
        key={o.id}
        type="button"
        role="radio"
        aria-checked={value === o.id}
        className={`tx-form__type tx-form__type--${o.id}${value === o.id ? ' is-active' : ''}`}
        onClick={() => onChange(o.id)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// schedule: 고정 항목 편집 모드 (주기, 날짜, 시작 월, 정기구독)
// allowRepeat: 일반 입력에서 '반복' 선택 표시. repeatDay/repeatMonth는 선택한 날짜의 일/월
const TransactionForm = ({
  initial,
  defaultUser,
  schedule = false,
  scheduleDefaults,
  allowRepeat = false,
  repeatDay,
  repeatMonth,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState(() => toFormState(initial, defaultUser, scheduleDefaults));
  const [error, setError] = useState('');

  const isEdit = Boolean(initial);
  const showCancel = isEdit || schedule;
  const isRepeating = allowRepeat && !isEdit && form.repeat !== 'none';
  const brand = detectBrand(form.memo);
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleTypeChange = (type) => set({ type, category: CATEGORIES[type][0] });

  const handleChange = (e) => set({ [e.target.name]: e.target.value });

  // 숫자만 남겨서 보관 (표시할 때만 콤마)
  const handleAmountChange = (e) => set({ amount: e.target.value.replace(/[^\d]/g, '') });

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      setError('금액을 입력해주세요.');
      return;
    }
    if (!form.category) {
      setError('카테고리를 선택해주세요.');
      return;
    }
    if (schedule && !MONTH_KEY_RE.test(form.startMonth)) {
      setError('시작 월을 YYYY-MM 형식으로 입력해주세요.');
      return;
    }
    const base = { type: form.type, amount, category: form.category, memo: form.memo.trim(), user: form.user };
    const scheduleData = schedule
      ? {
          dayOfMonth: Number(form.dayOfMonth),
          startMonth: form.startMonth,
          frequency: form.frequency,
          monthOfYear: form.frequency === 'yearly' ? Number(form.monthOfYear) : null,
          isSubscription: form.isSubscription,
        }
      : {};
    const repeatData = isRepeating ? { repeat: form.repeat, isSubscription: form.isSubscription } : {};
    onSubmit({ ...base, ...scheduleData, ...repeatData });
    setError('');
    if (!isEdit) set({ amount: '', memo: '', repeat: 'none', isSubscription: false });
  };

  const repeatLabel = form.repeat === 'yearly' ? `매년 ${repeatMonth}월 ${repeatDay}일` : `매월 ${repeatDay}일`;

  const subscriptionCheck = (
    <label className="tx-form__check">
      <input type="checkbox" checked={form.isSubscription} onChange={(e) => set({ isSubscription: e.target.checked })} />
      <span>
        정기구독 <small>넷플릭스·쿠팡 와우처럼 구독 서비스면 체크 (구독 메뉴에 모아 보기)</small>
      </span>
    </label>
  );

  return (
    <form className="tx-form" onSubmit={handleSubmit}>
      <div className="tx-form__field">
        <span>누가</span>
        <div className="tx-form__users" role="radiogroup" aria-label="작성자">
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
      </div>

      <Segment
        label="유형"
        options={TYPES.map((t) => ({ id: t, label: TYPE_LABELS[t] }))}
        value={form.type}
        onChange={handleTypeChange}
      />

      <label className="tx-form__field">
        <span>금액</span>
        <input
          name="amount"
          inputMode="numeric"
          placeholder="0"
          value={form.amount ? Number(form.amount).toLocaleString('ko-KR') : ''}
          onChange={handleAmountChange}
          autoFocus={isEdit}
        />
      </label>

      <div className="tx-form__field">
        <span>카테고리</span>
        <div className="tx-form__categories" role="radiogroup" aria-label="카테고리">
          {CATEGORIES[form.type].map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={form.category === c}
              className={`tx-form__category${form.category === c ? ' is-active' : ''}`}
              onClick={() => set({ category: c })}
            >
              <CategoryIcon category={c} size="sm" />
              <span>{c}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="tx-form__field">
        <span>{schedule ? '이름' : '메모'}</span>
        <input
          name="memo"
          placeholder={schedule ? '예: 넷플릭스, 휴대폰 요금 (선택)' : '메모 (선택)'}
          value={form.memo}
          onChange={handleChange}
          maxLength={100}
        />
      </label>
      {brand && (
        <p className="tx-form__brand">
          <CategoryIcon category={form.category} memo={form.memo} size="sm" />
          {brand.name} 아이콘으로 표시됩니다
        </p>
      )}

      {schedule && (
        <>
          <div className="tx-form__field">
            <span>주기</span>
            <Segment label="주기" options={FREQUENCIES} value={form.frequency} onChange={(id) => set({ frequency: id })} />
          </div>
          <div className={`tx-form__row${form.frequency === 'yearly' ? ' tx-form__row--3' : ''}`}>
            {form.frequency === 'yearly' && (
              <label className="tx-form__field">
                <span>매년</span>
                <select name="monthOfYear" value={form.monthOfYear} onChange={handleChange}>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="tx-form__field">
              <span>{form.frequency === 'yearly' ? '날짜' : '매월'}</span>
              <select name="dayOfMonth" value={form.dayOfMonth} onChange={handleChange}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}일
                  </option>
                ))}
              </select>
            </label>
            <label className="tx-form__field">
              <span>시작 월</span>
              <input type="month" name="startMonth" value={form.startMonth} onChange={handleChange} />
            </label>
          </div>
          {Number(form.dayOfMonth) > 28 && (
            <p className="tx-form__hint">{form.dayOfMonth}일이 없는 달에는 그 달 말일에 나갑니다.</p>
          )}
          {subscriptionCheck}
        </>
      )}

      {allowRepeat && !isEdit && (
        <div className="tx-form__field">
          <span>반복 {isRepeating && <small className="tx-form__repeat-hint">{repeatLabel}에 자동 기록</small>}</span>
          <Segment label="반복" options={REPEATS} value={form.repeat} onChange={(id) => set({ repeat: id })} />
        </div>
      )}
      {isRepeating && subscriptionCheck}

      {error && <p className="tx-form__error">{error}</p>}

      <div className="tx-form__actions">
        {showCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="btn btn--primary">
          {isEdit ? '수정' : isRepeating ? '고정 항목으로 추가' : '추가'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
