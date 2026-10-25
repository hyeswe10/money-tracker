import { useState } from 'react';
import UserBadge from '../UserBadge/UserBadge';
import '../DayPanel/DayPanel.scss';
import '../Summary/Summary.scss';
import './Planner.scss';

const MAX_LENGTH = 2000;

const dateLabel = (time) => {
  const d = new Date(time);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

// 고정한 메모가 위, 그다음 최근에 고친 순
const sortNotes = (notes) => [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);

// 자유 메모: 이번 달 계획, 기억할 것 등
const NotesCard = ({ notes, defaultUser, onAdd, onUpdate, onDelete }) => {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    onAdd({ content, user: defaultUser, pinned: false });
    setDraft('');
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditDraft(note.content);
  };

  const saveEdit = () => {
    const content = editDraft.trim();
    if (content) onUpdate(editingId, { content });
    setEditingId(null);
  };

  const handleDelete = (note) => {
    if (window.confirm('이 메모를 지울까요?')) onDelete(note.id);
  };

  return (
    <section className="summary-card notes">
      <h2 className="summary-card__title">메모</h2>

      <form className="notes__form" onSubmit={handleAdd}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="이번 달 계획, 기억해 둘 것…"
          maxLength={MAX_LENGTH}
          rows={3}
          aria-label="새 메모"
        />
        <button type="submit" className="btn btn--primary" disabled={!draft.trim()}>
          메모 저장
        </button>
      </form>

      {notes.length > 0 && (
        <ul className="notes__list">
          {sortNotes(notes).map((note) => (
            <li key={note.id} className={`notes__item${note.pinned ? ' is-pinned' : ''}`}>
              {editingId === note.id ? (
                <>
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    maxLength={MAX_LENGTH}
                    rows={4}
                    aria-label="메모 수정"
                    autoFocus
                  />
                  <div className="tx-item__actions">
                    <button type="button" onClick={() => setEditingId(null)}>
                      취소
                    </button>
                    <button type="button" onClick={saveEdit}>
                      저장
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="notes__content">{note.content}</p>
                  <div className="notes__meta">
                    <span className="tx-item__meta">
                      {note.pinned && <span className="tx-item__tag tx-item__tag--upcoming">고정</span>}
                      <UserBadge userId={note.user} />
                      <span>{dateLabel(note.updatedAt)}</span>
                    </span>
                    <div className="tx-item__actions">
                      <button type="button" onClick={() => onUpdate(note.id, { pinned: !note.pinned })}>
                        {note.pinned ? '고정 해제' : '고정'}
                      </button>
                      <button type="button" onClick={() => startEdit(note)}>
                        수정
                      </button>
                      <button type="button" className="is-danger" onClick={() => handleDelete(note)}>
                        삭제
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default NotesCard;
