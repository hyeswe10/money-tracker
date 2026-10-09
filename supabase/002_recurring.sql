-- 고정 항목(매달 반복) 기능
-- schema.sql 을 실행한 뒤, Supabase 대시보드 > SQL Editor 에서 한 번 실행

-- =========================================================
-- 1) 고정 항목 규칙: 통신비, 보험료, OTT 구독료, 월급, 적금 등
-- =========================================================
create table if not exists public.recurring_rules (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('income', 'expense', 'saving')),
  amount       bigint not null check (amount > 0),
  category     text not null check (char_length(category) between 1 and 30),
  memo         text not null default '' check (char_length(memo) <= 100),   -- 이름 (예: 넷플릭스)
  author       text not null references public.members (id) on update cascade,
  day_of_month smallint not null check (day_of_month between 1 and 31),     -- 짧은 달은 말일로 처리
  start_month  date not null check (extract(day from start_month) = 1),    -- 시작 달의 1일
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists recurring_rules_set_updated_at on public.recurring_rules;
create trigger recurring_rules_set_updated_at
  before update on public.recurring_rules
  for each row execute function public.set_updated_at();

-- =========================================================
-- 2) 거래 내역에 고정 항목 연결 정보 추가
--    recurring_id + recurring_month 로 '어느 규칙의 몇 월분'인지 기록 → 같은 달 중복 생성 방지
--    skipped = true 면 그 달만 건너뜀 (화면·합계에서 제외, 다시 생성되지 않음)
-- =========================================================
alter table public.transactions
  add column if not exists recurring_id    uuid references public.recurring_rules (id) on delete set null,
  add column if not exists recurring_month date,
  add column if not exists skipped         boolean not null default false;

create unique index if not exists transactions_recurring_unique
  on public.transactions (recurring_id, recurring_month);

-- =========================================================
-- 3) 보안 (RLS): 구성원만
-- =========================================================
alter table public.recurring_rules enable row level security;

drop policy if exists "recurring_select" on public.recurring_rules;
create policy "recurring_select" on public.recurring_rules
  for select to authenticated using ((select public.is_member()));

drop policy if exists "recurring_insert" on public.recurring_rules;
create policy "recurring_insert" on public.recurring_rules
  for insert to authenticated with check ((select public.is_member()));

drop policy if exists "recurring_update" on public.recurring_rules;
create policy "recurring_update" on public.recurring_rules
  for update to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));

drop policy if exists "recurring_delete" on public.recurring_rules;
create policy "recurring_delete" on public.recurring_rules
  for delete to authenticated using ((select public.is_member()));

-- =========================================================
-- 4) 실시간 동기화 (이미 추가돼 있다는 오류는 무시해도 됨)
-- =========================================================
alter publication supabase_realtime add table public.recurring_rules;
