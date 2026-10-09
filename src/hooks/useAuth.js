import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ERROR_MESSAGES = {
  'Invalid login credentials': '이메일 또는 비밀번호가 맞지 않습니다.',
  'Email not confirmed': '이메일 인증이 안 된 계정입니다. 대시보드에서 계정을 확인해주세요.',
};

export const toAuthMessage = (error) => ERROR_MESSAGES[error?.message] ?? error?.message ?? '로그인에 실패했습니다.';

export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = () => supabase.auth.signOut();

  return { session, ready, signIn, signOut };
};

// 로그인한 이메일이 members의 누구인지 (구성원이 아니면 memberId = null)
export const useMember = (session) => {
  const [state, setState] = useState({ checked: false, memberId: null });
  const email = session?.user?.email?.toLowerCase();

  useEffect(() => {
    if (!email) return undefined;
    let cancelled = false;
    setState({ checked: false, memberId: null });
    supabase
      .from('members')
      .select('id, email')
      .then(({ data, error }) => {
        if (cancelled) return;
        const me = !error && data.find((m) => m.email?.toLowerCase() === email);
        setState({ checked: true, memberId: me ? me.id : null });
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  return state;
};
