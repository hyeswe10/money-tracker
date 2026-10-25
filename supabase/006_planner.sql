-- 계획 탭: 메모, 살 것 체크리스트, 예산
-- Supabase 대시보드 > SQL Editor 에서 한 번 실행 (우리 집·엄마 가계부 프로젝트 각각). 여러 번 실행해도 안전

-- =========================================================
-- 1) 메모
-- =========================================================
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  content    text not null check (char_length(content) between 1 and 2000),
  author     text not null references public.members (id) on update cascade,
  pinned     boolean not null default false,              -- 위에 고정
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- =========================================================
-- 2) 살 것 체크리스트 (금액·카테고리는 선택. 금액이 있으면 예산으로 '살 만한지' 판단)
-- =========================================================
create table if not exists public.shopping_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 50),
  amount     bigint check (amount > 0),                   -- 예상 금액 (모르면 비움)
  category   text check (char_length(category) between 1 and 30),
  author     text not null references public.members (id) on update cascade,
  done       boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists shopping_items_set_updated_at on public.shopping_items;
create trigger shopping_items_set_updated_at
  before update on public.shopping_items
  for each row execute function public.set_updated_at();

-- =========================================================
-- 3) 한 달 예산: id = 지출 카테고리 이름, 또는 'total' (전체 예산)
--    매달 같은 예산을 쓴다
-- =========================================================
create table if not exists public.budgets (
  id         text primary key check (char_length(id) between 1 and 30),
  amount     bigint not null check (amount > 0),
  updated_at timestamptz not null default now()
);

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

-- =========================================================
-- 4) 보안 (RLS): 구성원만 읽기/쓰기
-- =========================================================
alter table public.notes enable row level security;
alter table public.shopping_items enable row level security;
alter table public.budgets enable row level security;

drop policy if exists "notes_all" on public.notes;
create policy "notes_all" on public.notes
  for all to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));

drop policy if exists "shopping_items_all" on public.shopping_items;
create policy "shopping_items_all" on public.shopping_items
  for all to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));

drop policy if exists "budgets_all" on public.budgets;
create policy "budgets_all" on public.budgets
  for all to authenticated
  using ((select public.is_member())) with check ((select public.is_member()));

-- =========================================================
-- 5) 실시간 동기화 (이미 추가돼 있다는 오류는 무시해도 됨)
-- =========================================================
alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.shopping_items;
alter publication supabase_realtime add table public.budgets;
