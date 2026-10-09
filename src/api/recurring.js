import { supabase } from '../lib/supabase';

const TABLE = 'recurring_rules';

// DB 행 → 앱 객체 (start_month 'YYYY-MM-01' → 'YYYY-MM')
export const fromRuleRow = (row) => ({
  id: row.id,
  type: row.type,
  amount: Number(row.amount),
  category: row.category,
  memo: row.memo ?? '',
  user: row.author,
  dayOfMonth: row.day_of_month,
  startMonth: row.start_month.slice(0, 7),
  createdAt: new Date(row.created_at).getTime(),
});

const toRuleRow = (data) => {
  const row = {};
  if (data.type !== undefined) row.type = data.type;
  if (data.amount !== undefined) row.amount = data.amount;
  if (data.category !== undefined) row.category = data.category;
  if (data.memo !== undefined) row.memo = data.memo;
  if (data.user !== undefined) row.author = data.user;
  if (data.dayOfMonth !== undefined) row.day_of_month = data.dayOfMonth;
  if (data.startMonth !== undefined) row.start_month = `${data.startMonth}-01`;
  return row;
};

export const fetchRules = async () => {
  const { data, error } = await supabase.from(TABLE).select('*').order('day_of_month').order('created_at');
  if (error) throw error;
  return data.map(fromRuleRow);
};

export const insertRule = async (data) => {
  const { data: row, error } = await supabase.from(TABLE).insert(toRuleRow(data)).select().single();
  if (error) throw error;
  return fromRuleRow(row);
};

export const updateRule = async (id, data) => {
  const { data: row, error } = await supabase.from(TABLE).update(toRuleRow(data)).eq('id', id).select().single();
  if (error) throw error;
  return fromRuleRow(row);
};

export const deleteRule = async (id) => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
};

export const subscribeRules = ({ onUpsert, onDelete }) => {
  const channel = supabase
    .channel('recurring-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
      if (payload.eventType === 'DELETE') onDelete(payload.old.id);
      else onUpsert(fromRuleRow(payload.new));
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
};
