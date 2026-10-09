import { useState } from 'react';
import { CATEGORIES, TRANSACTION_TYPES, TYPE_LABELS } from '../../constants/categories';
import { USERS } from '../../constants/users';
import CategoryIcon from '../CategoryIcon/CategoryIcon';

const TYPES = [TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.SAVING];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTH_KEY_RE = /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/;

const EMPTY_FORM = {
  type: TRANSACTION_TYPES.EXPENSE,
  amount: '',
  category: CATEGORIES.expense[0],
  memo: '',
};

// initial: 수정할 내역 또는 고정 항목 규칙. scheduleDefaults: 새 고정 항목의 기본 날짜/시작 월
const toFormState = (initial, defaultUser, scheduleDefaults) =>
  initial
    ? {
        type: initial.type,
        amount: String(initial.amount),
        category: initial.category,
        memo: initial.memo,
        user: initial.user,
        dayOfMonth: String(initial.dayOfMonth ?? scheduleDefaults?.dayOfMonth ?? 1),
        startMonth: initial.startMonth ?? scheduleDefaults?.startMonth ?? '',
        repeat: false,
      }
    : {
        ...EMPTY_FORM,
        user: defaultUser,
        dayOfMonth: String(scheduleDefaults?.dayOfMonth ?? 1),
        startMonth: scheduleDefaults?.startMonth ?? '',
        repeat: false,
      };

// schedule: 고정 항목 편집 모드 (매월 며칠, 시작 월 입력)
// allowRepeat: 일반 입력에서 '매달 반복' 체크박스 표시
const TransactionForm = ({
  initial,
  defaultUser,
  schedule = false,
  scheduleDefaults,
  allowRepeat = false,
  repeatHint,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState(() => toFormState(initial, defaultUser, scheduleDefaults));
  const [error, setError] = useState('');

  const isEdit = Boolean(initial);
  const showCancel = isEdit || schedule;

  const handleTypeChange = (type) => {
    setForm((prev) => ({ ...prev, type, category: CATEGORIES[type][0] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 숫자만 남겨서 보관 (표시할 때만 콤마)
  const handleAmountChange = (e) => {
    const digits = e.target.value.replace(/[^\d]/g, '');
    setForm((prev) => ({ ...prev, amount: digits }));
  };

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
    onSubmit({
      ...base,
      ...(schedule ? { dayOfMonth: Number(form.dayOfMonth), startMonth: form.startMonth } : {}),
      ...(allowRepeat && form.repeat ? { repeat: true } : {}),
    });
    setError('');
    if (!isEdit) {
      setForm((prev) => ({
        ...prev,
        amount: '',
        memo: '',
        repeat: false,
      }));
    }
  };

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
              onClick={() => setForm((prev) => ({ ...prev, user: id }))}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="tx-form__types">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`tx-form__type tx-form__type--${type}${form.type === type ? ' is-active' : ''}`}
            onClick={() => handleTypeChange(type)}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

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
              onClick={() => setForm((prev) => ({ ...prev, category: c }))}
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

      {schedule && (
        <div className="tx-form__row">
          <label className="tx-form__field">
            <span>매월</span>
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
      )}
      {schedule && Number(form.dayOfMonth) > 28 && (
        <p className="tx-form__hint">{form.dayOfMonth}일이 없는 달에는 그 달 말일에 나갑니다.</p>
      )}

      {allowRepeat && !isEdit && (
        <label className="tx-form__check">
          <input
            type="checkbox"
            checked={form.repeat}
            onChange={(e) => setForm((prev) => ({ ...prev, repeat: e.target.checked }))}
          />
          <span>
            매달 반복 <small>{repeatHint}</small>
          </span>
        </label>
      )}

      {error && <p className="tx-form__error">{error}</p>}

      <div className="tx-form__actions">
        {showCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="btn btn--primary">
          {isEdit ? '수정' : form.repeat ? '고정 항목으로 추가' : '추가'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
