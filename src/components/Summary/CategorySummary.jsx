import { useState } from 'react';
import { OTHERS_COLOR, OTHERS_KEY, getCategoryMeta } from '../../constants/categories';
import { formatAmount, formatSignedAmount } from '../../utils/format';
import CategoryIcon from '../CategoryIcon/CategoryIcon';
import DonutChart from './DonutChart';
import './Summary.scss';

// 원형그래프는 6조각까지만: 상위 5개 + 나머지는 '그 외'로 묶는다
const MAX_SEGMENTS = 6;

const toSegments = (items) => {
  const toSegment = ({ category, amount }) => ({
    key: category,
    label: category,
    value: amount,
    color: getCategoryMeta(category).color,
  });
  if (items.length <= MAX_SEGMENTS) return items.map(toSegment);

  const top = items.slice(0, MAX_SEGMENTS - 1);
  const restTotal = items.slice(MAX_SEGMENTS - 1).reduce((sum, i) => sum + i.amount, 0);
  return [...top.map(toSegment), { key: OTHERS_KEY, label: OTHERS_KEY, value: restTotal, color: OTHERS_COLOR }];
};

const CategoryDelta = ({ current, previous }) => {
  if (!previous) return <span className="category-summary__delta">지난달 지출 없음</span>;
  const diff = current - previous;
  if (diff === 0) return <span className="category-summary__delta">지난달과 같음</span>;
  const tone = diff > 0 ? 'is-up' : 'is-down';
  return <span className={`category-summary__delta ${tone}`}>지난달 대비 {formatSignedAmount(diff)}</span>;
};

const CategorySummary = ({ items, total, prevByCategory, viewLabel }) => {
  const [activeKey, setActiveKey] = useState(null);

  if (items.length === 0) {
    return (
      <section className="summary-card">
        <h2 className="summary-card__title">
          카테고리별 지출 <span className="summary-card__scope">{viewLabel}</span>
        </h2>
        <p className="summary-card__empty">이번 달 지출 내역이 없습니다.</p>
      </section>
    );
  }

  const segments = toSegments(items);
  const segmentKeys = new Set(segments.map((s) => s.key));
  // 목록에서 '그 외'에 묶인 카테고리에 올리면 '그 외' 조각을 강조
  const segmentKeyOf = (category) => (segmentKeys.has(category) ? category : OTHERS_KEY);

  return (
    <section className="summary-card">
      <h2 className="summary-card__title">
          카테고리별 지출 <span className="summary-card__scope">{viewLabel}</span>
        </h2>
      <div className="category-summary">
        <DonutChart segments={segments} total={total} activeKey={activeKey} onActiveChange={setActiveKey} />
        <ul className="category-summary__list" onMouseLeave={() => setActiveKey(null)}>
          {items.map(({ category, amount }) => {
            const percent = (amount / total) * 100;
            const isActive = activeKey !== null && segmentKeyOf(category) === activeKey;
            return (
              <li
                key={category}
                className={`category-summary__item${isActive ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveKey(segmentKeyOf(category))}
              >
                <CategoryIcon category={category} />
                <div className="category-summary__body">
                  <div className="category-summary__label">
                    <span>{category}</span>
                    <span className="category-summary__value">
                      {formatAmount(amount)} <small>{percent.toFixed(1)}%</small>
                    </span>
                  </div>
                  <div className="category-summary__bar">
                    <div
                      className="category-summary__fill"
                      style={{ width: `${percent}%`, background: getCategoryMeta(category).color }}
                    />
                  </div>
                  <CategoryDelta current={amount} previous={prevByCategory[category] ?? 0} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default CategorySummary;
