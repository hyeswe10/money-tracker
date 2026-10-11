// 메모(이름)에 들어간 단어로 알아보는 서비스 아이콘
// 공식 로고 대신 브랜드 색 + 글자로 만든 간단한 마크 (로고는 각 회사의 상표라 그대로 쓰지 않음)
export const BRANDS = [
  { id: 'netflix', name: '넷플릭스', keywords: ['넷플릭스', 'netflix', '넷플'], bg: '#141414', fg: '#e50914', mark: 'N' },
  { id: 'tving', name: '티빙', keywords: ['티빙', 'tving'], bg: '#ff153c', fg: '#ffffff', mark: 'T' },
  { id: 'baemin', name: '배민', keywords: ['배민', '배달의민족', 'baemin'], bg: '#2ac1bc', fg: '#ffffff', mark: '배' },
  { id: 'coupang', name: '쿠팡', keywords: ['쿠팡', 'coupang', '로켓와우'], bg: '#ffffff', fg: '#346aff', mark: 'C', ring: '#dfe6f5' },
  {
    id: 'naverplus',
    name: '네이버플러스',
    keywords: ['네이버플러스', '네이버 플러스', '네플', 'naverplus', 'naver plus', '네이버멤버십'],
    bg: '#03c75a',
    fg: '#ffffff',
    mark: 'N+',
  },
];

// 공백·대소문자 무시하고 키워드 포함 여부로 찾기
const normalize = (text) => text.toLowerCase().replace(/\s+/g, '');

export const detectBrand = (memo) => {
  if (!memo) return null;
  const text = normalize(memo);
  return BRANDS.find((b) => b.keywords.some((k) => text.includes(normalize(k)))) ?? null;
};
