import { ALL_USERS, USERS } from '../../constants/users';
import './UserFilter.scss';

const OPTIONS = [{ id: ALL_USERS, name: '전체', color: null }, ...USERS];

// 달력·목록·요약에 적용되는 보기 필터
const UserFilter = ({ value, onChange }) => (
  <div className="user-filter" role="radiogroup" aria-label="보기 필터">
    {OPTIONS.map(({ id, name, color }) => (
      <button
        key={id}
        type="button"
        role="radio"
        aria-checked={value === id}
        className={`user-filter__option${value === id ? ' is-active' : ''}`}
        style={color ? { '--user-color': color } : undefined}
        onClick={() => onChange(id)}
      >
        {color && <span className="user-filter__dot" />}
        {name}
      </button>
    ))}
  </div>
);

export default UserFilter;
