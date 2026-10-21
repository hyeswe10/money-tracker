-- 엄마 가계부(만년형 가계부) 전용 Supabase 프로젝트 설정
-- 새 프로젝트의 SQL Editor 에서 아래 순서대로 실행:
--   1) schema.sql  2) 002_recurring.sql  3) 003_subscription_yearly.sql  4) 005_coupay_transfer.sql  5) 이 파일
-- (004_shared_member.sql 은 우리 집 가계부의 '공용' 작성자라서 실행하지 않음)
-- 여러 번 실행해도 안전

-- schema.sql 이 넣은 우리 집 구성원(정우·계주·공용)은 빼고 엄마만 둔다
delete from public.members where id in ('jungwoo', 'kyeju', 'shared');

insert into public.members (id, name, color) values
  ('mom', '엄마', '#5a5fe8')   -- 앱 코드 src/config/households.js 의 mom.users id와 동일
on conflict (id) do nothing;

-- Authentication > Users 에서 엄마 계정을 만든 뒤, 실제 이메일로 바꿔 실행
-- update public.members set email = '엄마이메일@example.com' where id = 'mom';
