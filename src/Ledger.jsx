import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header/Header';
import UserFilter from './components/UserFilter/UserFilter';
import Calendar from './components/Calendar/Calendar';
import DayPanel from './components/DayPanel/DayPanel';
import MonthlySummary from './components/Summary/MonthlySummary';
import CategorySummary from './components/Summary/CategorySummary';
import SavingsSummary from './components/Summary/SavingsSummary';
import AverageSummary from './components/Summary/AverageSummary';
import { useLedgerData } from './hooks/useLedgerData';
import RecurringPanel from './components/Recurring/RecurringPanel';
import { ALL_USERS, DEFAULT_USER_ID, USERS, getUser } from './constants/users';
import { addMonth, getDaysInMonth, getPreviousMonths, getTodayKey, toDateKey, toMonthKey } from './utils/calendar';
import { buildPlannedRows } from './utils/recurring';
import { averageOverMonths, cumulativeSaving, filterByUser, summarizeByUser, summarizeMonth } from './utils/summary';
import { loadLocalTransactions, loadPrefs, savePrefs } from './utils/storage';
import './Ledger.scss';

const getInitialView = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
};

const isValidUser = (id) => USERS.some((u) => u.id === id);

const Ledger = ({ session, memberId, onSignOut }) => {
  const [view, setView] = useState(getInitialView);
  const [selectedDate, setSelectedDate] = useState(getTodayKey);
  // 기기별로 기억: 보기 필터와 마지막으로 입력한 사람
  const [prefs, setPrefs] = useState(() => {
    const saved = loadPrefs();
    return {
      userFilter: saved.userFilter === ALL_USERS || isValidUser(saved.userFilter) ? saved.userFilter : ALL_USERS,
      lastUser: isValidUser(saved.lastUser) ? saved.lastUser : DEFAULT_USER_ID,
      localImportDone: Boolean(saved.localImportDone),
    };
  });
  const {
    transactions,
    loading,
    error,
    clearError,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    rules,
    addRule,
    updateRule,
    deleteRule,
  } = useLedgerData(session.user.id);

  // Supabase 전환 전에 이 브라우저에만 저장돼 있던 내역
  const [localTransactions] = useState(loadLocalTransactions);
  const [importing, setImporting] = useState(false);
  const showImport = !prefs.localImportDone && localTransactions.length > 0;

  const handleImport = async () => {
    setImporting(true);
    const count = await importTransactions(localTransactions);
    setImporting(false);
    if (count !== null) setPrefs((p) => ({ ...p, localImportDone: true }));
  };

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const { year, month } = view;
  const { userFilter, lastUser } = prefs;
  const monthKey = toMonthKey(year, month);
  const viewLabel = userFilter === ALL_USERS ? '전체' : getUser(userFilter).name;

  // 필터가 특정 사람이면 그 사람, 전체면 로그인한 본인(없으면 마지막 작성자)을 입력 기본값으로
  const defaultUser = userFilter === ALL_USERS ? (memberId ?? lastUser) : userFilter;
  const me = memberId ? getUser(memberId).name : session.user.email;

  // 월이 바뀌면 같은 '일'을 유지하되, 그 달에 없는 날(예: 31일)이면 말일로 맞춘다
  const changeView = (nextYear, nextMonth) => {
    const currentDay = Number(selectedDate.slice(8, 10));
    const day = Math.min(currentDay, getDaysInMonth(nextYear, nextMonth));
    setView({ year: nextYear, month: nextMonth });
    setSelectedDate(toDateKey(nextYear, nextMonth, day));
  };

  const handleMove = (delta) => {
    const next = addMonth(year, month, delta);
    changeView(next.year, next.month);
  };

  const handleToday = () => {
    setView(getInitialView());
    setSelectedDate(getTodayKey());
  };

  // 이전/다음 달 칸을 누르면 그 달로 이동
  const handleSelect = (cell) => {
    if (!cell.inMonth) {
      const [y, m] = cell.dateKey.split('-').map(Number);
      setView({ year: y, month: m - 1 });
    }
    setSelectedDate(cell.dateKey);
  };

  const handleAdd = (data) => {
    addTransaction(data);
    setPrefs((prev) => ({ ...prev, lastUser: data.user }));
  };

  // 다음 달 이후를 보고 있으면 고정 항목을 '예정'으로 미리 보여준다 (저장하지 않음, 최대 10년치)
  const todayMonthKey = getTodayKey().slice(0, 7);
  const planned = useMemo(() => {
    if (monthKey <= todayMonthKey) return [];
    const [ty, tm] = todayMonthKey.split('-').map(Number);
    const next = addMonth(ty, tm - 1, 1);
    const cap = addMonth(year, month, -119);
    const fromKey = [toMonthKey(next.year, next.month), toMonthKey(cap.year, cap.month)].sort().pop();
    return buildPlannedRows(rules, fromKey, monthKey);
  }, [rules, monthKey, todayMonthKey, year, month]);

  const visible = useMemo(
    () => filterByUser([...transactions, ...planned], userFilter, ALL_USERS),
    [transactions, planned, userFilter],
  );
  const visibleRules = useMemo(() => filterByUser(rules, userFilter, ALL_USERS), [rules, userFilter]);

  const dailyTotals = useMemo(
    () =>
      visible.reduce((acc, t) => {
        const entry = acc[t.date] ?? { income: 0, expense: 0, saving: 0 };
        entry[t.type] += t.amount;
        acc[t.date] = entry;
        return acc;
      }, {}),
    [visible],
  );

  const prev = addMonth(year, month, -1);
  const prevMonthKey = toMonthKey(prev.year, prev.month);

  const monthly = useMemo(() => summarizeMonth(visible, monthKey), [visible, monthKey]);
  const prevMonthly = useMemo(() => summarizeMonth(visible, prevMonthKey), [visible, prevMonthKey]);
  // 보고 있는 달 직전 3개월 평균 (진행 중인 이번 달은 제외)
  const avgMonths = getPreviousMonths(year, month, 3);
  const average = useMemo(
    () => averageOverMonths(visible, getPreviousMonths(year, month, 3).map((m) => toMonthKey(m.year, m.month))),
    [visible, year, month],
  );
  const savingTotal = useMemo(() => cumulativeSaving(visible, monthKey), [visible, monthKey]);
  // 사람별 표는 필터와 상관없이 항상 두 사람 모두 보여준다
  const userSummary = useMemo(() => summarizeByUser(transactions, monthKey), [transactions, monthKey]);

  const dayTransactions = useMemo(
    () => visible.filter((t) => t.date === selectedDate).sort((a, b) => a.createdAt - b.createdAt),
    [visible, selectedDate],
  );

  return (
    <div className="app">
      <Header year={year} month={month} onMove={handleMove} onChange={changeView} onToday={handleToday} />
      <div className="app__toolbar">
        <UserFilter value={userFilter} onChange={(id) => setPrefs((p) => ({ ...p, userFilter: id }))} />
        <div className="app__account">
          {loading && <span className="app__loading">불러오는 중…</span>}
          <span>{me}</span>
          <button type="button" className="app__signout" onClick={onSignOut}>
            로그아웃
          </button>
        </div>
      </div>

      {error && (
        <div className="app__notice app__notice--error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="닫기">
            ✕
          </button>
        </div>
      )}

      {showImport && (
        <div className="app__notice">
          <span>
            이 브라우저에 예전에 저장한 내역 <strong>{localTransactions.length}건</strong>이 있습니다. Supabase로 옮길까요?
          </span>
          <div className="app__notice-actions">
            <button type="button" className="btn btn--primary" onClick={handleImport} disabled={importing}>
              {importing ? '옮기는 중…' : '옮기기'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setPrefs((p) => ({ ...p, localImportDone: true }))}
              disabled={importing}
            >
              무시
            </button>
          </div>
        </div>
      )}
      {/* 넓은 화면: 왼쪽(달력+카테고리+3개월 평균+저축) / 오른쪽(날짜 패널+월 합계), 좁은 화면: order로 한 줄 정렬 */}
      <main className="app__main">
        <div className="app__col">
          <div className="app__calendar">
            <Calendar
              year={year}
              month={month}
              selectedDate={selectedDate}
              dailyTotals={dailyTotals}
              onSelect={handleSelect}
            />
          </div>
          <div className="app__category">
            <CategorySummary
              key={`${monthKey}-${userFilter}`}
              items={monthly.categories}
              total={monthly.expense}
              prevByCategory={prevMonthly.byCategory}
              viewLabel={viewLabel}
            />
          </div>
          <div className="app__average">
            <AverageSummary year={year} months={avgMonths} viewLabel={viewLabel} average={average} current={monthly} />
          </div>
          <div className="app__savings">
            <SavingsSummary
              year={year}
              month={month}
              viewLabel={viewLabel}
              monthTotal={monthly.saving}
              monthByCategory={monthly.savingByCategory}
              cumulative={savingTotal}
            />
          </div>
        </div>
        <div className="app__col">
          <div className="app__day">
            <DayPanel
              key={`${selectedDate}-${userFilter}`}
              date={selectedDate}
              transactions={dayTransactions}
              defaultUser={defaultUser}
              onAdd={handleAdd}
              onAddRule={addRule}
              onUpdate={updateTransaction}
              onDelete={deleteTransaction}
            />
          </div>
          <div className="app__recurring">
            <RecurringPanel
              rules={visibleRules}
              viewLabel={viewLabel}
              defaultUser={defaultUser}
              onAdd={addRule}
              onUpdate={updateRule}
              onDelete={deleteRule}
            />
          </div>
          <div className="app__monthly">
            <MonthlySummary
              month={month}
              prevMonth={prev.month}
              viewLabel={viewLabel}
              totals={monthly}
              userSummary={userSummary}
              activeUser={userFilter}
              prevExpense={prevMonthly.expense}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Ledger;
