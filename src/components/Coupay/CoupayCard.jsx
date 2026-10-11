import { useEffect, useState } from 'react';
import { TRANSACTION_TYPES } from '../../constants/categories';
import { getTodayKey } from '../../utils/calendar';
import { summarizeCoupay } from '../../utils/coupay';
import { formatAmount } from '../../utils/format';
import CategoryIcon from '../CategoryIcon/CategoryIcon';
import UserBadge from '../UserBadge/UserBadge';
import TransactionForm from '../DayPanel/TransactionForm';
import '../DayPanel/DayPanel.scss';
import '../Summary/Summary.scss';
import '../Recurring/RecurringPanel.scss';
import './CoupayCard.scss';

const PREVIEW_COUNT = 6;

const shortDate = (dateKey) => `${Number(dateKey.slice(5, 7))}/${Number(dateKey.slice(8, 10))}`;

// 쿠페이머니 지갑: 충전하면 늘고, 메모에 '쿠팡'이 들어간 지출만큼 줄어든다
// 지갑은 집 전체에 하나라서 보기 필터와 관계없이 모든 내역으로 계산
const CoupayCard = ({ transactions, month, monthKey, defaultUser, onAdd }) => {
  const todayKey = getTodayKey();
  const { balance, upcomingUse, monthCharge, monthUse, monthEntries } = summarizeCoupay(transactions, todayKey, monthKey);
  const [charging, setCharging] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // 잔액이 마이너스가 되면 팝업. 닫은 뒤 같은 잔액이면 다시 띄우지 않음
  const [dismissedAt, setDismissedAt] = useState(null);
  const alertOpen = balance < 0 && dismissedAt !== balance;

  useEffect(() => {
    if (balance >= 0) setDismissedAt(null);
  }, [balance]);

  const entries = showAll ? monthEntries : monthEntries.slice(0, PREVIEW_COUNT);

  const handleCharge = (data) => {
    onAdd(data);
    setCharging(false);
  };

  const openCharge = () => {
    setDismissedAt(balance);
    setCharging(true);
  };

  return (
    <section className="summary-card coupay">
      <div className="recurring__head">
        <h2 className="summary-card__title coupay__title">
          <CategoryIcon category="쇼핑" memo="쿠팡" size="sm" />
          쿠페이머니
        </h2>
        {!charging && (
          <button type="button" className="recurring__add" onClick={() => setCharging(true)}>
            + 충전
          </button>
        )}
      </div>

      <div className={`coupay__balance${balance < 0 ? ' is-negative' : ''}`}>
        <span>현재 잔액</span>
        <strong>
          {balance < 0 ? '-' : ''}
          {formatAmount(Math.abs(balance))}
        </strong>
        {balance < 0 && <em>충전이 필요합니다</em>}
        {upcomingUse > 0 && <small>날짜가 안 된 쿠팡 결제 {formatAmount(upcomingUse)} 예정</small>}
      </div>

      <dl className="monthly-summary coupay__stats">
        <div className="monthly-summary__tile">
          <dt>{month + 1}월 충전</dt>
          <dd className="transfer">+{formatAmount(monthCharge)}</dd>
        </div>
        <div className="monthly-summary__tile">
          <dt>{month + 1}월 사용</dt>
          <dd className="expense">-{formatAmount(monthUse)}</dd>
        </div>
      </dl>

      {charging && (
        <div className="recurring__form">
          <h3 className="day-panel__form-title">쿠페이머니 충전</h3>
          <TransactionForm
            defaultUser={defaultUser}
            fixedType={TRANSACTION_TYPES.TRANSFER}
            withDate
            defaultDate={todayKey}
            submitLabel="충전"
            onSubmit={handleCharge}
            onCancel={() => setCharging(false)}
          />
        </div>
      )}

      <h3 className="summary-card__subtitle">{month + 1}월 쿠페이머니 내역</h3>
      {monthEntries.length === 0 ? (
        <p className="summary-card__empty">
          이번 달 충전·사용 내역이 없습니다. 지출 메모에 &lsquo;쿠팡&rsquo;이 들어가면 여기서 차감돼요.
        </p>
      ) : (
        <>
          <ul className="coupay__list">
            {entries.map((e) => (
              <li key={e.id} className={e.date > todayKey ? 'is-upcoming' : ''}>
                <span className="coupay__date">{shortDate(e.date)}</span>
                <span className="coupay__name">
                  {e.delta > 0 ? '충전' : e.memo || e.category}
                  {e.delta > 0 && e.memo && <small> · {e.memo}</small>}
                </span>
                <UserBadge userId={e.user} />
                <span className={`coupay__amount ${e.delta > 0 ? 'transfer' : 'expense'}`}>
                  {e.delta > 0 ? '+' : '-'}
                  {formatAmount(Math.abs(e.delta))}
                </span>
                <span className={`coupay__after${e.balanceAfter < 0 ? ' is-negative' : ''}`}>
                  잔액 {e.balanceAfter < 0 ? '-' : ''}
                  {formatAmount(Math.abs(e.balanceAfter))}
                </span>
              </li>
            ))}
          </ul>
          {monthEntries.length > PREVIEW_COUNT && (
            <button type="button" className="coupay__more" onClick={() => setShowAll((v) => !v)}>
              {showAll ? '접기' : `${monthEntries.length - PREVIEW_COUNT}건 더 보기`}
            </button>
          )}
        </>
      )}

      {alertOpen && (
        <div className="coupay-alert" role="alertdialog" aria-modal="true" aria-labelledby="coupay-alert-title">
          <div className="coupay-alert__box">
            <span className="coupay-alert__icon" aria-hidden="true">
              !
            </span>
            <h3 id="coupay-alert-title">쿠페이머니 충전이 필요합니다</h3>
            <p>
              쿠팡 결제가 충전 금액보다 많아 잔액이{' '}
              <strong className="expense">-{formatAmount(Math.abs(balance))}</strong>입니다.
            </p>
            <div className="coupay-alert__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setDismissedAt(balance)}>
                닫기
              </button>
              <button type="button" className="btn btn--primary" onClick={openCharge}>
                충전하기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CoupayCard;
