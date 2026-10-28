-- 살 것을 달마다 기록: 살 달('YYYY-MM'), 비우면 '언제 살지 미정'
-- 006·007 을 실행한 뒤, 우리 집 가계부 Supabase 대시보드 > SQL Editor 에서 한 번 실행
-- (엄마 가계부는 계획 탭이 메모만이라 필요 없음). 여러 번 실행해도 안전
-- 예전에 추가한 항목은 모두 '미정'으로 들어간다. 예산(budgets) 테이블은 더 쓰지 않지만 지우지 않고 둔다

alter table public.shopping_items
  add column if not exists month text check (month ~ '^\d{4}-(0[1-9]|1[0-2])$');
