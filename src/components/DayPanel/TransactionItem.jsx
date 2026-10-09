import { formatAmount } from '../../utils/format';
import CategoryIcon from '../CategoryIcon/CategoryIcon';
import UserBadge from '../UserBadge/UserBadge';

// 저축은 나가는 돈이지만 쌓이는 돈이라 부호 없이 표시
const SIGNS = { income: '+', expense: '-', saving: '' };

const TransactionItem = ({ transaction, isUpcoming, isEditing, onEdit, onDelete }) => {
  const { id, type, amount, category, memo, user, recurringId, planned } = transaction;
  const classNames = ['tx-item', isEditing && 'is-editing', isUpcoming && 'is-upcoming'].filter(Boolean).join(' ');

  return (
    <li className={classNames}>
      <span className="tx-item__icon">
        <CategoryIcon category={category} />
      </span>
      <div className="tx-item__info">
        <span className="tx-item__title">
          <span className="tx-item__category">{category}</span>
          <UserBadge userId={user} />
          {recurringId && <span className="tx-item__tag">고정</span>}
          {isUpcoming && <span className="tx-item__tag tx-item__tag--upcoming">예정</span>}
        </span>
        {memo && <span className="tx-item__memo">{memo}</span>}
      </div>
      <span className={`tx-item__amount ${type}`}>
        {SIGNS[type]}
        {formatAmount(amount)}
      </span>
      <div className="tx-item__actions">
        {/* 다음 달 이후 미리보기는 저장된 내역이 아니라서 고정 항목 카드에서만 바꿀 수 있다 */}
        {planned ? (
          <span className="tx-item__note">고정 항목 미리보기</span>
        ) : (
          <>
            <button type="button" onClick={() => onEdit(id)}>
              수정
            </button>
            <button type="button" className="is-danger" onClick={() => onDelete(id)}>
              {recurringId ? '이 달 건너뛰기' : '삭제'}
            </button>
          </>
        )}
      </div>
    </li>
  );
};

export default TransactionItem;
