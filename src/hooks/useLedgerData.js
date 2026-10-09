import { useEffect, useMemo, useRef, useState } from 'react';
import * as txApi from '../api/transactions';
import * as ruleApi from '../api/recurring';
import { getTodayKey } from '../utils/calendar';
import { findMissingRecurring } from '../utils/recurring';

const GENERATE_DELAY_MS = 1500;

const toMessage = (err) => `저장소 오류: ${err?.message ?? '알 수 없는 오류'}`;

// id 기준으로 넣거나 바꾸기 (내가 저장한 결과와 Realtime 이벤트가 둘 다 들어오므로)
const upsertById = (list, item) =>
  list.some((p) => p.id === item.id) ? list.map((p) => (p.id === item.id ? item : p)) : [...list, item];

// 거래 내역 + 고정 항목 규칙을 Supabase와 동기화
export const useLedgerData = (userKey) => {
  const [rows, setRows] = useState([]); // 건너뜀 처리된 내역까지 포함
  const [rules, setRules] = useState([]);
  const [loaded, setLoaded] = useState({ rows: false, rules: false });
  const [error, setError] = useState('');
  const attemptedRef = useRef('');

  const upsertRow = (t) => setRows((prev) => upsertById(prev, t));
  const removeRow = (id) => setRows((prev) => prev.filter((p) => p.id !== id));
  const upsertRule = (r) => setRules((prev) => upsertById(prev, r));
  const removeRule = (id) => setRules((prev) => prev.filter((p) => p.id !== id));

  useEffect(() => {
    if (!userKey) return undefined;
    let cancelled = false;
    const fail = (err) => !cancelled && setError(toMessage(err));

    txApi
      .fetchAllTransactions()
      .then((list) => !cancelled && setRows(list))
      .catch(fail)
      .finally(() => !cancelled && setLoaded((p) => ({ ...p, rows: true })));
    ruleApi
      .fetchRules()
      .then((list) => !cancelled && setRules(list))
      .catch(fail)
      .finally(() => !cancelled && setLoaded((p) => ({ ...p, rules: true })));

    const unsubTx = txApi.subscribeTransactions({ onUpsert: upsertRow, onDelete: removeRow });
    const unsubRules = ruleApi.subscribeRules({ onUpsert: upsertRule, onDelete: removeRule });
    return () => {
      cancelled = true;
      unsubTx();
      unsubRules();
    };
  }, [userKey]);

  const ready = loaded.rows && loaded.rules;

  // 고정 항목: 시작 월 ~ 이번 달 중 아직 없는 달의 내역을 만든다
  // 다른 사람이 규칙을 지울 때 실시간 이벤트가 하나씩 도착하므로, 잠깐 기다렸다가 판단한다
  useEffect(() => {
    if (!ready) return undefined;
    const timer = setTimeout(() => {
      const currentMonthKey = getTodayKey().slice(0, 7);
      const missing = findMissingRecurring(rules, rows, currentMonthKey);
      if (missing.length === 0) return;
      // 같은 목록으로 여러 번 요청하지 않도록 (실패 시 무한 재시도 방지)
      const signature = missing.map((m) => `${m.recurringId}|${m.recurringMonth}`).join(',');
      if (attemptedRef.current === signature) return;
      attemptedRef.current = signature;
      txApi
        .insertRecurringRows(missing)
        .then((saved) => saved.forEach(upsertRow))
        .catch((err) => setError(toMessage(err)));
    }, GENERATE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ready, rules, rows]);

  const run = async (task) => {
    try {
      setError('');
      return await task();
    } catch (err) {
      setError(toMessage(err));
      return null;
    }
  };

  const transactions = useMemo(() => rows.filter((t) => !t.skipped), [rows]);

  const addTransaction = (data) => run(async () => upsertRow(await txApi.insertTransaction(data)));

  const updateTransaction = (id, data) => run(async () => upsertRow(await txApi.updateTransaction(id, data)));

  // 고정 항목에서 생긴 내역은 '이번 달만 건너뜀', 일반 내역은 삭제
  const deleteTransaction = (id) =>
    run(async () => {
      const target = rows.find((t) => t.id === id);
      if (target?.recurringId) {
        upsertRow(await txApi.skipTransaction(id));
      } else {
        await txApi.deleteTransaction(id);
        removeRow(id);
      }
    });

  const importTransactions = (list) =>
    run(async () => {
      const saved = await txApi.importTransactions(list);
      saved.forEach(upsertRow);
      return saved.length;
    });

  const addRule = (data) => run(async () => upsertRule(await ruleApi.insertRule(data)));

  // 규칙 수정은 앞으로 생성될 내역 + 아직 날짜가 안 된 내역에 반영 (지난 내역은 그대로)
  const updateRule = (id, data) =>
    run(async () => {
      upsertRule(await ruleApi.updateRule(id, data));
      const { type, amount, category, memo, user } = data;
      const changed = await txApi.updateUpcomingByRule(id, { type, amount, category, memo, user }, getTodayKey());
      changed.forEach(upsertRow);
    });

  // 규칙 삭제: 아직 날짜가 안 된 내역은 함께 삭제, 지난 내역은 일반 내역으로 남김
  // 화면에서 규칙을 먼저 빼야 지워진 달을 '빠진 달'로 보고 다시 만들지 않는다
  const deleteRule = (id) => {
    const rule = rules.find((r) => r.id === id);
    removeRule(id);
    return run(async () => {
      try {
        const removedIds = await txApi.deleteUpcomingByRule(id, getTodayKey());
        removedIds.forEach(removeRow);
        await ruleApi.deleteRule(id);
        setRows((prev) => prev.map((t) => (t.recurringId === id ? { ...t, recurringId: null } : t)));
      } catch (err) {
        if (rule) upsertRule(rule); // 실패하면 화면에 되돌린다
        throw err;
      }
    });
  };

  return {
    transactions,
    rules,
    loading: !ready,
    error,
    clearError: () => setError(''),
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    addRule,
    updateRule,
    deleteRule,
  };
};
