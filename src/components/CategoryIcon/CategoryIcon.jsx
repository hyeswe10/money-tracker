import { getCategoryMeta } from '../../constants/categories';
import icons from './icons';
import './CategoryIcon.scss';

const CategoryIcon = ({ category, size = 'md' }) => {
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
