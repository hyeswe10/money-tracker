import { supabase } from '../lib/supabase';

const TABLE = 'transactions';
const PAGE_SIZE = 1000; // Supabase 한 번 조회 최대 행 수

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// DB 행 → 앱 객체 (author → user, created_at → createdAt)
export const fromRow = (row) => ({
  id: row.id,
  date: row.date,
  type: row.type,
  amount: Number(row.amount),
  category: row.category,
  memo: row.memo ?? '',
  user: row.author,
  createdAt: new Date(row.created_at).getTime(),
  recurringId: row.recurring_id ?? null,
  recurringMonth: row.recurring_month ? row.recurring_month.slice(0, 7) : null, // 'YYYY-MM'
  skipped: Boolean(row.skipped),
});

// 앱 객체 → DB 행 (넘어온 필드만)
export const toRow = (data) => {
  const row = {};
  if (data.date !== undefined) row.date = data.date;
  if (data.type !== undefined) row.type = data.type;
  if (data.amount !== undefined) row.amount = data.amount;
  if (data.category !== undefined) row.category = data.category;
  if (data.memo !== undefined) row.memo = data.memo;
  if (data.user !== undefined) row.author = data.user;
  return row;
};

export const fetchAllTransactions = async () => {
  const rows = [];
  let from = 0;
  let done = false;
  while (!done) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('date')
      .order('created_at')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    from += PAGE_SIZE;
    done = data.length < PAGE_SIZE;
  }
  return rows.map(fromRow);
};

export const insertTransaction = async (data) => {
  const { data: row, error } = await supabase.from(TABLE).insert(toRow(data)).select().single();
  if (error) throw error;
  return fromRow(row);
};

export const updateTransaction = async (id, data) => {
  const { data: row, error } = await supabase.from(TABLE).update(toRow(data)).eq('id', id).select().single();
  if (error) throw error;
  return fromRow(row);
};

export const deleteTransaction = async (id) => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
};

// localStorage에 있던 내역을 한 번에 올리기. 기존 id가 uuid면 유지해서 중복 업로드를 막는다
export const importTransactions = async (list) => {
  const rows = list.map((t) => ({
    ...toRow(t),
    ...(UUID_RE.test(t.id) ? { id: t.id } : {}),
    ...(t.createdAt ? { created_at: new Date(t.createdAt).toISOString() } : {}),
  }));
  // defaultToNull: false → id/created_at이 없는 행은 DB 기본값으로 채움
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: true, defaultToNull: false })
    .select();
  if (error) throw error;
  return data.map(fromRow);
};

// 다른 사람이 입력/수정/삭제하면 바로 반영 (Realtime)
export const subscribeTransactions = ({ onUpsert, onDelete }) => {
  const channel = supabase
    .channel('transactions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
      if (payload.eventType === 'DELETE') onDelete(payload.old.id);
      else onUpsert(fromRow(payload.new));
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
};

// 고정 항목에서 생긴 내역은 지우지 않고 '이번 달만 건너뜀'으로 표시 (지우면 다음에 다시 생성되므로)
export const skipTransaction = async (id) => {
  const { data: row, error } = await supabase.from(TABLE).update({ skipped: true }).eq('id', id).select().single();
  if (error) throw error;
  return fromRow(row);
};

// 고정 항목의 월별 내역 생성. 이미 있는 (규칙, 월)은 건너뜀 → 두 사람이 동시에 열어도 중복 없음
// rows: [{ ...내역, recurringId, recurringMonth: 'YYYY-MM' }]
export const insertRecurringRows = async (rows) => {
  const payload = rows.map((t) => ({
    ...toRow(t),
    recurring_id: t.recurringId,
    recurring_month: `${t.recurringMonth}-01`,
  }));
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: 'recurring_id,recurring_month', ignoreDuplicates: true, defaultToNull: false })
    .select();
  if (error) throw error;
  return data.map(fromRow);
};

// 규칙을 고치면 아직 날짜가 안 된(오늘 이후) 내역에도 반영
export const updateUpcomingByRule = async (ruleId, data, todayKey) => {
  const { data: rows, error } = await supabase
    .from(TABLE)
    .update(toRow(data))
    .eq('recurring_id', ruleId)
    .gt('date', todayKey)
    .select();
  if (error) throw error;
  return rows.map(fromRow);
};

// 규칙을 지우면 아직 날짜가 안 된 내역은 함께 지운다 (지난 내역은 남김)
export const deleteUpcomingByRule = async (ruleId, todayKey) => {
  const { data: rows, error } = await supabase
    .from(TABLE)
    .delete()
    .eq('recurring_id', ruleId)
    .gt('date', todayKey)
    .select('id');
  if (error) throw error;
  return rows.map((r) => r.id);
};
