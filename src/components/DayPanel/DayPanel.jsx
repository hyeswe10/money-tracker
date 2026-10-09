import { useState } from 'react';
import { getTodayKey } from '../../utils/calendar';
import { formatAmount, formatDateLabel } from '../../utils/format';
import TransactionForm from './TransactionForm';
import TransactionItem from './TransactionItem';
import './DayPanel.scss';

const sumBy = (list, type) => list.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0);

const DayPanel = ({ date, transactions, defaultUser, onAdd, onAddRule, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState(null);

  const editing = transactions.find((t) => t.id === editingId);
  const todayKey = getTodayKey();
  const day = Number(date.slice(8, 10));

  const handleSubmit = ({ repeat, ...data }) => {
    if (editing) {
      onUpdate(editing.id, data);
      setEditingId(null);
    } else if (repeat) {
      // 이 날짜를 기준으로 매달 반복되는 고정 항목 등록 → 이번 달 내역은 자동 생성
      onAddRule({ ...data, dayOfMonth: day, startMonth: date.slice(0, 7) });
    } else {
      onAdd({ ...data, date });
    }
  };

  const handleDelete = (id) => {
    const target = transactions.find((t) => t.id === id);
    const message = target?.recurringId
      ? "이 달만 건너뛸까요?\n(고정 항목 자체를 없애려면 아래 '고정 항목' 카드에서 삭제하세요)"
      : '이 내역을 삭제할까요?';
    if (!window.confirm(message)) return;
    onDelete(id);
    if (id === editingId) setEditingId(null);
  };

  return (
    <section className="day-panel">
      <header className="day-panel__header">
        <h2>{formatDateLabel(date)}</h2>
        <div className="day-panel__totals">
          <span className="income">수입 {formatAmount(sumBy(transactions, 'income'))}</span>
          <span className="expense">지출 {formatAmount(sumBy(transactions, 'expense'))}</span>
          <span className="saving">저축 {formatAmount(sumBy(transactions, 'saving'))}</span>
        </div>
      </header>

      {transactions.length > 0 ? (
        <ul className="day-panel__list">
          {transactions.map((t) => (
            <TransactionItem
              key={t.id}
              transaction={t}
              isUpcoming={t.date > todayKey}
              isEditing={t.id === editingId}
              onEdit={setEditingId}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      ) : (
        <p className="day-panel__empty">등록된 내역이 없습니다.</p>
      )}

      <h3 className="day-panel__form-title">{editing ? '내역 수정' : '새 내역'}</h3>
      {/* 수정 대상이나 날짜가 바뀌면 key가 바뀌어 폼 상태가 초기화됨 */}
      <TransactionForm
        key={editing ? editing.id : `new-${date}`}
        initial={editing}
        defaultUser={defaultUser}
        allowRepeat
        repeatHint={`매월 ${day}일`}
        onSubmit={handleSubmit}
        onCancel={() => setEditingId(null)}
      />
    </section>
  );
};

export default DayPanel;
