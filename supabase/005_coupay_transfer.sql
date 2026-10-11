-- 쿠페이머니 충전용 유형 'transfer'(충전) 추가
-- 충전은 은행 → 쿠페이머니로 옮기는 돈이라 지출로 세지 않는다 (쿠팡에서 쓸 때 지출로 잡힘 → 이중 집계 방지)
-- Supabase 대시보드 > SQL Editor 에서 실행 (여러 번 실행해도 안전)

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions
  add constraint transactions_type_check check (type in ('income', 'expense', 'saving', 'transfer'));

-- 매달 자동충전도 고정 항목으로 등록할 수 있도록
alter table public.recurring_rules drop constraint if exists recurring_rules_type_check;
alter table public.recurring_rules
  add constraint recurring_rules_type_check check (type in ('income', 'expense', 'saving', 'transfer'));
