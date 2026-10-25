-- 살 것 항목마다 메모 (어디서 살지, 크기·색, 이사 준비 메모 등)
-- 006_planner.sql 을 실행한 뒤, Supabase 대시보드 > SQL Editor 에서 한 번 실행 (우리 집·엄마 프로젝트 각각)
-- 여러 번 실행해도 안전

alter table public.shopping_items
  add column if not exists memo text not null default '' check (char_length(memo) <= 500);
