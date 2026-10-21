import { IS_SINGLE_USER, getUser } from '../../constants/users';
import './UserBadge.scss';

// 혼자 쓰는 가계부에서는 누가 썼는지 표시할 필요가 없다
const UserBadge = ({ userId }) => {
  if (IS_SINGLE_USER) return null;
  const { name, color } = getUser(userId);
  return (
    <span className="user-badge" style={{ '--user-color': color }}>
      {name}
    </span>
  );
};

export default UserBadge;
