export const TRANSACTION_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income',
  SAVING: 'saving', // 적금·청약처럼 나가지만 모이는 돈. 지출 합계와 별도로 계산
};

export const TYPE_LABELS = {
  expense: '지출',
  income: '수입',
  saving: '저축',
};

export const CATEGORIES = {
  income: ['급여', '용돈', '부수입', '이자', '기타수입'],
  expense: [
    '식비',
    '카페/간식',
    '생필품',
    '교통',
    '주거/관리비',
    '통신',
    '쇼핑',
    '옷',
    '의료/건강',
    '문화/여가',
    '데이트',
    '친구',
    '교육',
    '경조사',
    '기타지출',
  ],
  saving: ['적금', '청약', '예금', '투자', '기타저축'],
};

// 카테고리별 아이콘(components/CategoryIcon/icons.jsx의 키)과 색상
export const CATEGORY_META = {
  급여: { icon: 'briefcase', color: '#2f6fde' },
  용돈: { icon: 'coins', color: '#f59f00' },
  부수입: { icon: 'trendingUp', color: '#12b886' },
  이자: { icon: 'percent', color: '#7048e8' },
  기타수입: { icon: 'plusCircle', color: '#868e96' },
  // 지출 색은 원형그래프에서 구분되도록 색각이상 검증을 거친 8색을 우선 사용
  식비: { icon: 'utensils', color: '#eb6834' },
  '카페/간식': { icon: 'coffee', color: '#a8541a' },
  교통: { icon: 'bus', color: '#2a78d6' },
  '주거/관리비': { icon: 'home', color: '#4a3aa7' },
  통신: { icon: 'smartphone', color: '#1baf7a' },
  쇼핑: { icon: 'bag', color: '#e87ba4' },
  '의료/건강': { icon: 'heartPulse', color: '#e34948' },
  '문화/여가': { icon: 'ticket', color: '#008300' },
  교육: { icon: 'book', color: '#0095c8' },
  경조사: { icon: 'envelope', color: '#eda100' },
  기타지출: { icon: 'more', color: '#868e96' },
  // 추가 카테고리: 기존 색과 겹치지 않는 색. 구분은 아이콘·이름으로도 함께 함
  생필품: { icon: 'basket', color: '#74b816' },
  옷: { icon: 'shirt', color: '#ae3ec9' },
  데이트: { icon: 'heart', color: '#d6336c' },
  친구: { icon: 'users', color: '#4dabf7' },
  적금: { icon: 'piggyBank', color: '#12a37f' },
  청약: { icon: 'building', color: '#0095c8' },
  예금: { icon: 'landmark', color: '#4a3aa7' },
  투자: { icon: 'barChart', color: '#eb6834' },
  기타저축: { icon: 'more', color: '#868e96' },
};

// 원형그래프에서 상위 카테고리 외 나머지를 묶은 조각
export const OTHERS_KEY = '그 외';
export const OTHERS_COLOR = '#c3c7cf';

const FALLBACK_META = { icon: 'more', color: '#868e96' };

// 목록에서 빠진 옛 카테고리가 저장돼 있어도 깨지지 않도록 기본값 반환
export const getCategoryMeta = (category) => CATEGORY_META[category] ?? FALLBACK_META;
