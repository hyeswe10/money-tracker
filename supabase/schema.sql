-- 만년 가계부 Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 한 번 실행

-- =========================================================
-- 1) 구성원 (정우, 계주)
-- =========================================================
create table if not exists public.members (
  id         text primary key,          -- 앱 코드 USERS의 id와 동일 ('jungwoo', 'kyeju')
  name       text not null,
  color      text not null default '#5a5fe8',
  email      text unique,               -- 로그인 계정 이메일. 이 목록에 있는 사람만 데이터 접근 가능
  created_at timestamptz not null default now()
);

insert into public.members (id, name, color) values
  ('jungwoo', '정우', '#5a5fe8'),
  ('kyeju',   '계주', '#e8780c')
on conflict (id) do nothing;

-- =========================================================
-- 2) 거래 내역
-- =========================================================
create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,                                         -- 'YYYY-MM-DD'
  type       text not null check (type in ('income', 'expense', 'saving')),
  amount     bigint not null check (amount > 0),                    -- 원 단위 정수
  category   text not null check (char_length(category) between 1 and 30),
  memo       text not null default '' check (char_length(memo) <= 100),
  author     text not null references public.members (id) on update cascade, -- 앱의 user 필드
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 월별 조회(date 범위), 사람별 조회용
create index if not exists transactions_date_idx on public.transactions (date);
create index if not exists transactions_author_date_idx on public.transactions (author, date);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- =========================================================
-- 3) 보안 (RLS): members에 이메일이 등록된 로그인 사용자만 읽기/쓰기
-- =========================================================
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.members
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

revoke execute on function public.is_member() from anon;

alter table public.members enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "members_select" on public.members;
create policy "members_select" on public.members
  for select to authenticated
  using ((select public.is_member()));

drop policy if exists "transactions_select" on public.transactions;
create policy "transactions_select" on public.transactions
  for select to authenticated
  using ((select public.is_member()));

drop policy if exists "transactions_insert" on public.transactions;
create policy "transactions_insert" on public.transactions
  for insert to authenticated
  with check ((select public.is_member()));

drop policy if exists "transactions_update" on public.transactions;
create policy "transactions_update" on public.transactions
  for update to authenticated
  using ((select public.is_member()))
  with check ((select public.is_member()));

drop policy if exists "transactions_delete" on public.transactions;
create policy "transactions_delete" on public.transactions
  for delete to authenticated
  using ((select public.is_member()));

-- =========================================================
-- 4) (선택) 실시간 동기화: 한 사람이 입력하면 다른 사람 화면에 바로 반영
--    이미 추가돼 있다는 오류가 나면 무시해도 됨
-- =========================================================
alter publication supabase_realtime add table public.transactions;

-- =========================================================
-- 5) 로그인 계정 이메일 등록 (Authentication에서 계정을 만든 뒤 실제 이메일로 바꿔 실행)
-- =========================================================
-- update public.members set email = '정우이메일@example.com' where id = 'jungwoo';
-- update public.members set email = '계주이메일@example.com' where id = 'kyeju';
