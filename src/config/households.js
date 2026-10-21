// 같은 코드로 여러 가계부를 따로 배포한다. 각 가계부는 Supabase 프로젝트와 사이트 주소가 따로
// 빌드 모드 이름이 곧 가계부 id: `vite build` → home, `vite build --mode mom` → mom (.env.mom 사용)
// vite.config.js 에서도 읽으므로 이 파일은 다른 파일을 import 하지 않는다
export const HOUSEHOLDS = {
  home: {
    name: '만년 가계부',
    shortName: '가계부',
    description: '정우와 계주의 가계부',
    loginHint: '정우 · 계주 계정으로 로그인하세요',
    themeColor: '#fbf8fa', // 폰 상단 바·홈 화면 앱 배경. 나머지 디자인 값은 src/styles/_themes.scss
    // 화면 구성: 헤더 작은 글씨('members' = 정우 · 계주의 10월 / 'today' = 오늘 날짜),
    // 달력 표시('users' = 누가 썼는지 색 점 / 'expense' = 그날 쓴 금액), 월 합계('tiles' = 칸 3개 / 'hero' = 쓴 돈 크게)
    headerSubtitle: 'members',
    calendarMarks: 'users',
    summaryStyle: 'tiles',
    path: '', // 사이트 주소 /money-tracker/
    importLegacyLocal: true, // Supabase 전환 전 브라우저에 저장된 내역 옮기기
    users: [
      { id: 'jungwoo', name: '정우', color: '#5b8fe0', avatar: true },
      { id: 'kyeju', name: '계주', color: '#e57ba3', avatar: true },
      { id: 'shared', name: '공용', color: '#2fa9b8' }, // 두 사람이 같이 쓰는 돈 (로그인 계정 아님)
    ],
  },
  mom: {
    name: '만년형 가계부',
    shortName: '만년형 가계부',
    description: '엄마의 가계부',
    loginHint: '엄마 계정으로 로그인하세요',
    themeColor: '#f8f6fc',
    headerSubtitle: 'today',
    calendarMarks: 'expense',
    summaryStyle: 'hero',
    path: 'mom/', // 사이트 주소 /money-tracker/mom/
    importLegacyLocal: false,
    users: [{ id: 'mom', name: '엄마', color: '#8a72d6' }],
  },
};

export const getHousehold = (mode) => HOUSEHOLDS[mode] ?? HOUSEHOLDS.home;

export const getHouseholdId = (mode) => (HOUSEHOLDS[mode] ? mode : 'home');
