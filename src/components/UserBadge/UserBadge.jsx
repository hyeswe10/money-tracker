import { getUser } from '../../constants/users';
import './UserBadge.scss';

const UserBadge = ({ userId }) => {
  const { name, color } = getUser(userId);
  return (
    <span className="user-badge" style={{ '--user-color': color }}>
      {name}
    </span>
  );
};

export default UserBadge;
