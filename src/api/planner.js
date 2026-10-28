import { supabase } from '../lib/supabase';

// 계획 탭(메모·살 것) 테이블. 행 변환만 다르고 읽기/쓰기/실시간은 같은 모양
export const fromNoteRow = (row) => ({
  id: row.id,
  content: row.content,
  user: row.author,
  pinned: Boolean(row.pinned),
  createdAt: new Date(row.created_at).getTime(),
  updatedAt: new Date(row.updated_at).getTime(),
});

const toNoteRow = (data) => {
  const row = {};
  if (data.content !== undefined) row.content = data.content;
  if (data.user !== undefined) row.author = data.user;
  if (data.pinned !== undefined) row.pinned = data.pinned;
  return row;
};

export const fromItemRow = (row) => ({
  id: row.id,
  name: row.name,
  amount: row.amount === null ? null : Number(row.amount),
  category: row.category ?? null,
  memo: row.memo ?? '',
  month: row.month ?? null, // 'YYYY-MM', 없으면 언제 살지 미정
  user: row.author,
  done: Boolean(row.done),
  createdAt: new Date(row.created_at).getTime(),
});

const toItemRow = (data) => {
  const row = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.amount !== undefined) row.amount = data.amount;
  if (data.category !== undefined) row.category = data.category;
  if (data.memo !== undefined) row.memo = data.memo;
  if (data.month !== undefined) row.month = data.month;
  if (data.user !== undefined) row.author = data.user;
  if (data.done !== undefined) row.done = data.done;
  return row;
};

const makeTable = (table, fromRow, toRow) => ({
  fetchAll: async () => {
    const { data, error } = await supabase.from(table).select('*').order('created_at');
    if (error) throw error;
    return data.map(fromRow);
  },
  insert: async (data) => {
    const { data: row, error } = await supabase.from(table).insert(toRow(data)).select().single();
    if (error) throw error;
    return fromRow(row);
  },
  update: async (id, data) => {
    const { data: row, error } = await supabase.from(table).update(toRow(data)).eq('id', id).select().single();
    if (error) throw error;
    return fromRow(row);
  },
  remove: async (id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  },
  subscribe: ({ onUpsert, onDelete }) => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.eventType === 'DELETE') onDelete(payload.old.id);
        else onUpsert(fromRow(payload.new));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
});

export const notesApi = makeTable('notes', fromNoteRow, toNoteRow);
export const itemsApi = makeTable('shopping_items', fromItemRow, toItemRow);
