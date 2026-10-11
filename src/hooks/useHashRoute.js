import { useEffect, useState } from 'react';

// '#/subscriptions' → 'subscriptions'. GitHub Pages에서도 새로고침·뒤로가기가 동작하도록 해시로 페이지 구분
const readRoute = (fallback) => window.location.hash.replace(/^#\/?/, '') || fallback;

export const useHashRoute = (fallback) => {
  const [route, setRoute] = useState(() => readRoute(fallback));

  useEffect(() => {
    const onChange = () => setRoute(readRoute(fallback));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, [fallback]);

  return route;
};
