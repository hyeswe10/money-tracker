// 같은 코드로 여러 가계부를 따로 배포한다. 각 가계부는 Supabase 프로젝트와 사이트 주소가 따로
// 빌드 모드 이름이 곧 가계부 id: `vite build` → home, `vite build --mode mom` → mom (.env.mom 사용)
// vite.config.js 에서도 읽으므로 이 파일은 다른 파일을 import 하지 않는다
export const HOUSEHOLDS = {
  home: {
    name: '만년 가계부',
    shortName: '가계부',
    description: '정우와 계주의 가계부',
    loginHint: '정우 · 계주 계정으로 로그인하세요',
    path: '', // 사이트 주소 /money-tracker/
    importLegacyLocal: true, // Supabase 전환 전 브라우저에 저장된 내역 옮기기
    users: [
      { id: 'jungwoo', name: '정우', color: '#5a5fe8' },
      { id: 'kyeju', name: '계주', color: '#e8780c' },
      { id: 'shared', name: '공용', color: '#1098ad' }, // 두 사람이 같이 쓰는 돈 (로그인 계정 아님)
    ],
  },
  mom: {
    name: '만년형 가계부',
    shortName: '만년형 가계부',
    description: '엄마의 가계부',
    loginHint: '엄마 계정으로 로그인하세요',
    path: 'mom/', // 사이트 주소 /money-tracker/mom/
    importLegacyLocal: false,
    users: [{ id: 'mom', name: '엄마', color: '#5a5fe8' }],
  },
};

export const getHousehold = (mode) => HOUSEHOLDS[mode] ?? HOUSEHOLDS.home;

export const getHouseholdId = (mode) => (HOUSEHOLDS[mode] ? mode : 'home');
