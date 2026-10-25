import { useEffect, useMemo, useState } from 'react';
import { budgetsApi, itemsApi, notesApi } from '../api/planner';

// 007_shopping_memo.sql 을 아직 실행하지 않아 메모 칸이 없을 때는 할 일을 알려준다
const toMessage = (err) =>
  err?.code === 'PGRST204' && err.message?.includes("'memo'")
    ? '살 것 메모를 저장하려면 Supabase SQL Editor에서 supabase/007_shopping_memo.sql을 실행해주세요.'
    : `저장소 오류: ${err?.message ?? '알 수 없는 오류'}`;

// 006_planner.sql 을 아직 실행하지 않은 프로젝트 (테이블 없음)
const isMissingTable = (err) => err?.code === 'PGRST205' || err?.code === '42P01';

const upsertById = (list, item) =>
  list.some((p) => p.id === item.id) ? list.map((p) => (p.id === item.id ? item : p)) : [...list, item];

// 하나의 테이블 목록을 Supabase와 동기화
const useSyncedList = (api, userKey, onError) => {
  const [list, setList] = useState([]);
  const upsert = (item) => setList((prev) => upsertById(prev, item));
  const remove = (id) => setList((prev) => prev.filter((p) => p.id !== id));

  useEffect(() => {
    if (!userKey) return undefined;
    let cancelled = false;
    api
      .fetchAll()
      .then((rows) => !cancelled && setList(rows))
      .catch((err) => !cancelled && onError(err));
    const unsubscribe = api.subscribe({ onUpsert: upsert, onDelete: remove });
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // api·onError는 바뀌지 않는 값이라 로그인 사용자가 바뀔 때만 다시 불러온다
  }, [userKey]);

  return { list, setList, upsert, remove };
};

// 메모 + 살 것 체크리스트 + 예산
export const usePlannerData = (userKey) => {
  const [error, setError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const fail = (err) => (isMissingTable(err) ? setNeedsSetup(true) : setError(toMessage(err)));

  const notes = useSyncedList(notesApi, userKey, fail);
  const items = useSyncedList(itemsApi, userKey, fail);
  const budgetRows = useSyncedList(budgetsApi, userKey, fail);

  const run = async (task) => {
    try {
      setError('');
      return await task();
    } catch (err) {
      fail(err);
      return null;
    }
  };

  const crud = (api, synced) => ({
    add: (data) => run(async () => synced.upsert(await api.insert(data))),
    update: (id, data) => run(async () => synced.upsert(await api.update(id, data))),
    remove: (id) =>
      run(async () => {
        await api.remove(id);
        synced.remove(id);
      }),
  });

  // { total: 1000000, 식비: 400000, ... }
  const budgets = useMemo(
    () => Object.fromEntries(budgetRows.list.map((b) => [b.id, b.amount])),
    [budgetRows.list],
  );

  const saveBudgets = (next) =>
    run(async () => {
      const saved = await budgetsApi.saveAll(
        next,
        budgetRows.list.map((b) => b.id),
      );
      budgetRows.setList(saved);
    });

  return {
    notes: notes.list,
    items: items.list,
    budgets,
    error,
    needsSetup,
    clearError: () => setError(''),
    noteActions: crud(notesApi, notes),
    itemActions: crud(itemsApi, items),
    saveBudgets,
  };
};
