import { detectBrand } from '../../constants/brands';
import { getCategoryMeta } from '../../constants/categories';
import icons from './icons';
import './CategoryIcon.scss';

// memo에 넷플릭스·티빙 등 서비스 이름이 있으면 서비스 마크, 없으면 카테고리 아이콘
const CategoryIcon = ({ category, memo, size = 'md' }) => {
  const brand = detectBrand(memo);

  if (brand) {
    return (
      <span
        className={`category-icon category-icon--${size} category-icon--brand`}
        style={{ '--brand-bg': brand.bg, '--brand-fg': brand.fg, '--brand-ring': brand.ring ?? 'transparent' }}
        title={brand.name}
        aria-hidden="true"
      >
        <span className={`category-icon__mark${brand.mark.length > 1 ? ' is-wide' : ''}`}>{brand.mark}</span>
      </span>
    );
  }

  const { icon, color } = getCategoryMeta(category);

  return (
    <span className={`category-icon category-icon--${size}`} style={{ '--cat-color': color }} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icons[icon]}
      </svg>
    </span>
  );
};

export default CategoryIcon;
