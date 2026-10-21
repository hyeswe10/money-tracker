import { getHousehold } from '../config/households';

export const HOUSEHOLD = getHousehold(import.meta.env.MODE);

export const USERS = HOUSEHOLD.users;

// 혼자 쓰는 가계부면 작성자 선택·사람별 표·보기 필터를 숨긴다
export const IS_SINGLE_USER = USERS.length === 1;

// 보기 필터에서 '전체'를 뜻하는 값
export const ALL_USERS = 'all';

// 작성자 정보가 없는 예전 데이터는 첫 번째 사용자로 본다
export const DEFAULT_USER_ID = USERS[0].id;

export const getUser = (id) => USERS.find((u) => u.id === id) ?? USERS[0];
