-- 카드 할부: 한 번 산 것을 회차별 지출로 나눠 기록
-- installment_id 가 같은 내역끼리 한 할부 (1회차 ~ 마지막 회차), amount 는 그 회차에 내는 돈(원금 + 수수료)
-- 우리 집·엄마 가계부 Supabase 대시보드 > SQL Editor 에서 각각 한 번 실행. 여러 번 실행해도 안전

alter table public.transactions
  add column if not exists installment_id     uuid,
  add column if not exists installment_no     smallint check (installment_no between 1 and 60),     -- 몇 회차
  add column if not exists installment_months smallint check (installment_months between 2 and 60), -- 전체 개월 수
  add column if not exists installment_fee    bigint not null default 0 check (installment_fee >= 0); -- 이 회차 수수료(이자)

create index if not exists transactions_installment_idx on public.transactions (installment_id)
  where installment_id is not null;
