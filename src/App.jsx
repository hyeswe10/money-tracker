import Ledger from './Ledger';
import LoginScreen from './components/Login/LoginScreen';
import { useAuth, useMember } from './hooks/useAuth';
import { isSupabaseConfigured } from './lib/supabase';
import './components/Login/LoginScreen.scss';

// 로그인 화면과 같은 카드 모양으로 안내 메시지를 보여준다
const Message = ({ title, children }) => (
  <div className="login">
    <div className="login__card">
      <h1 className="login__title">{title}</h1>
      <div className="login__desc">{children}</div>
    </div>
  </div>
);

// 로그인과 구성원 확인이 끝난 뒤에 가계부를 보여준다
const AuthGate = () => {
  const { session, ready, signIn, signOut } = useAuth();
  const member = useMember(session);

  if (!ready) return <Message title="만년 가계부">불러오는 중…</Message>;
  if (!session) return <LoginScreen onSignIn={signIn} />;
  if (!member.checked) return <Message title="만년 가계부">계정을 확인하는 중…</Message>;

  if (!member.memberId) {
    return (
      <Message title="구성원이 아닌 계정">
        <p>
          <strong>{session.user.email}</strong> 계정이 가계부 구성원으로 등록되어 있지 않습니다. Supabase SQL Editor에서
          members 테이블의 email을 확인해주세요.
        </p>
        <button type="button" className="btn btn--ghost" onClick={signOut}>
          로그아웃
        </button>
      </Message>
    );
  }

  return <Ledger session={session} memberId={member.memberId} onSignOut={signOut} />;
};

const App = () => {
  if (!isSupabaseConfigured) {
    return (
      <Message title="설정이 필요합니다">
        .env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 넣고 개발 서버를 다시 시작해주세요.
      </Message>
    );
  }
  return <AuthGate />;
};

export default App;
