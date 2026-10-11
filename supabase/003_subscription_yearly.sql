-- 정기구독 표시 + 연 결제(매년 반복)
-- 002_recurring.sql 을 실행한 뒤, Supabase 대시보드 > SQL Editor 에서 실행 (여러 번 실행해도 안전)

-- 정기구독 여부: 넷플릭스처럼 고정비이면서 구독인 항목 (적금은 고정비지만 구독 아님)
alter table public.recurring_rules
  add column if not exists is_subscription boolean not null default false;

-- 반복 주기: monthly(매월) / yearly(매년 month_of_year월)
alter table public.recurring_rules
  add column if not exists frequency text not null default 'monthly';

alter table public.recurring_rules
  add column if not exists month_of_year smallint;

-- 제약 조건 (이미 있으면 지우고 다시 추가)
alter table public.recurring_rules drop constraint if exists recurring_rules_frequency_check;
alter table public.recurring_rules
  add constraint recurring_rules_frequency_check check (frequency in ('monthly', 'yearly'));

alter table public.recurring_rules drop constraint if exists recurring_rules_month_of_year_check;
alter table public.recurring_rules
  add constraint recurring_rules_month_of_year_check check (
    (frequency = 'monthly' and month_of_year is null)
    or (frequency = 'yearly' and month_of_year between 1 and 12)
  );
