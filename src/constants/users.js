export const USERS = [
  { id: 'jungwoo', name: '정우', color: '#5a5fe8' },
  { id: 'kyeju', name: '계주', color: '#e8780c' },
  { id: 'shared', name: '공용', color: '#1098ad' }, // 두 사람이 같이 쓰는 돈 (로그인 계정 아님)
];

// 보기 필터에서 '전체'를 뜻하는 값
export const ALL_USERS = 'all';

// 작성자 정보가 없는 예전 데이터는 첫 번째 사용자로 본다
export const DEFAULT_USER_ID = USERS[0].id;

export const getUser = (id) => USERS.find((u) => u.id === id) ?? USERS[0];
