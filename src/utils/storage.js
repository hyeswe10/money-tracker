import { DEFAULT_USER_ID, HOUSEHOLD } from '../constants/users';
import { getHouseholdId } from '../config/households';

// 여러 가계부가 같은 사이트 도메인을 쓰므로, 우리 집(home) 외에는 저장 키를 따로 둔다
const householdId = getHouseholdId(import.meta.env.MODE);
const STORAGE_KEY = 'money-tracker:v1';
const PREFS_KEY = householdId === 'home' ? 'money-tracker:prefs' : `money-tracker:${householdId}:prefs`;

// 예전 id → 현재 id
const LEGACY_USER_IDS = { gyeju: 'kyeju' };

// 작성자 필드가 생기기 전에 저장된 내역은 기본 사용자로 채우고, 예전 id는 새 id로 바꾼다
const normalize = (t) => {
  if (!t.user) return { ...t, user: DEFAULT_USER_ID };
  return LEGACY_USER_IDS[t.user] ? { ...t, user: LEGACY_USER_IDS[t.user] } : t;
};

// Supabase로 옮기기 전 이 브라우저에 저장돼 있던 내역 (옮기기 용도로만 읽음)
export const loadLocalTransactions = () => {
  if (!HOUSEHOLD.importLegacyLocal) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalize) : [];
  } catch {
    return [];
  }
};

// 보기 필터, 마지막 작성자 같은 기기별 설정
export const loadPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) ?? {};
  } catch {
    return {};
  }
};

export const savePrefs = (prefs) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // 설정 저장 실패는 무시 (기능에는 영향 없음)
  }
};
