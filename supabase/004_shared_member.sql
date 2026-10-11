-- '공용' 작성자 추가 (두 사람이 같이 쓰는 돈)
-- Supabase 대시보드 > SQL Editor 에서 실행 (여러 번 실행해도 안전)
-- 로그인 계정이 아니므로 email은 비워 둔다 → 이 행으로는 로그인/데이터 접근 불가

insert into public.members (id, name, color) values
  ('shared', '공용', '#1098ad')
on conflict (id) do nothing;
