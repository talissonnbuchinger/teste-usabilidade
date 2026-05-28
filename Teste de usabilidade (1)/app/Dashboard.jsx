/* eslint-disable */
// Sessions list / dashboard.

function Dashboard({ state, setState, onOpen, syncStatus, onOpenSettings }) {
  const [query, setQuery] = React.useState('');
  const [newOpen, setNewOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const sessions = state.order.map(id => state.sessions[id]).filter(Boolean);
  const filtered = sessions.filter(s => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (s.header.participant || '').toLowerCase().includes(q)
      || (s.header.course || '').toLowerCase().includes(q)
      || (s.header.moderator || '').toLowerCase().includes(q);
  });

  function createSession() {
    const s = window.UTStore.blankSession();
    if (newName.trim()) s.header.participant = newName.trim();
    const savedMod = localStorage.getItem('usability_moderator');
    if (savedMod) s.header.moderator = savedMod;
    const next = {
      sessions: { ...state.sessions, [s.id]: s },
      order: [s.id, ...state.order],
    };
    setState(next);
    setNewOpen(false);
    setNewName('');
    onOpen(s.id);
  }

  function deleteSession(id) {
    const sessions = { ...state.sessions }; delete sessions[id];
    setState({ sessions, order: state.order.filter(x => x !== id) });
    setConfirmDelete(null);
  }

  function duplicateSession(id) {
    const original = state.sessions[id];
    if (!original) return;
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = window.UTStore.uid();
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    copy.header.participant = (original.header.participant || 'Sessão') + ' (cópia)';
    setState({
      sessions: { ...state.sessions, [copy.id]: copy },
      order: [copy.id, ...state.order],
    });
  }

  function exportAll() {
    const payload = { exportedAt: new Date().toISOString(), sessions: state.sessions, order: state.order };
    window.UTStore.download('usabilidade_elite_backup.json', JSON.stringify(payload, null, 2), 'application/json');
  }

  function importFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.sessions) { alert('Arquivo inválido.'); return; }
        const merged = { ...state.sessions };
        const newOrder = [...state.order];
        Object.values(parsed.sessions).forEach(s => {
          // Always give imported sessions new IDs to avoid collision.
          const newId = window.UTStore.uid();
          merged[newId] = { ...s, id: newId };
          newOrder.unshift(newId);
        });
        setState({ sessions: merged, order: newOrder });
        alert(`Importadas ${Object.keys(parsed.sessions).length} sessão(ões).`);
      } catch (err) { alert('Não foi possível ler o arquivo.'); }
    };
    reader.readAsText(f);
    e.target.value = '';
  }

  const meta = window.SESSION_META;

  return (
    <>
      <Topbar
        left={<Brand subtitle="Painel de sessões" />}
        right={
          <>
            <SyncBadge status={syncStatus} onClick={onOpenSettings} />
            <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importFile} />
            <button className="btn btn--ghost btn--sm" onClick={() => fileInputRef.current.click()}>
              <Icon name="upload" size={14} /> Importar
            </button>
            <button className="btn btn--outline btn--sm" onClick={exportAll} disabled={sessions.length === 0}>
              <Icon name="download" size={14} /> Backup
            </button>
            <button className="btn btn--ghost btn--icon" onClick={onOpenSettings} title="Configurações">
              <Icon name="settings" size={16} />
            </button>
            <button className="btn btn--primary" onClick={() => setNewOpen(true)}>
              <Icon name="plus" size={14} /> Nova sessão
            </button>
          </>
        }
      />

      <main className="dash">
        <div className="dash__header">
          <div>
            <h1 className="dash__title">Sessões de teste</h1>
            <p className="dash__sub">Crie uma sessão por participante. As respostas ficam salvas automaticamente no seu navegador.</p>
          </div>
        </div>

        <dl className="dash__meta">
          <div>
            <dt>Produto</dt>
            <dd>{meta.product}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{meta.type}</dd>
          </div>
          <div>
            <dt>Perfil</dt>
            <dd>Alunos Elite · Mesa de Estudo</dd>
          </div>
          <div>
            <dt>Tarefas no roteiro</dt>
            <dd>{(window.SESSION_TASKS || []).length}</dd>
          </div>
          <div className="dash__meta__obj">
            <dt>Objetivo</dt>
            <dd>{meta.objective}</dd>
          </div>
        </dl>

        <div className="dash__toolbar">
          <div className="dash__search">
            <Icon name="search" size={14} color="rgb(115,115,115)" />
            <input
              type="text"
              placeholder="Buscar por participante, curso ou moderador…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <span className="muted" style={{ fontSize: 12.5 }}>
            {filtered.length} {filtered.length === 1 ? 'sessão' : 'sessões'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-card">
            <div className="empty-card__icon"><Icon name="clipboard-list" size={20} /></div>
            <div className="empty-card__title">{sessions.length === 0 ? 'Nenhuma sessão ainda' : 'Sem resultados'}</div>
            <div className="empty-card__desc">
              {sessions.length === 0
                ? 'Crie a primeira sessão para começar a registrar um teste de usabilidade.'
                : 'Tente outro termo de busca.'}
            </div>
            {sessions.length === 0 && (
              <button className="btn btn--primary" onClick={() => setNewOpen(true)} style={{ marginTop: 6 }}>
                <Icon name="plus" size={14} /> Criar sessão
              </button>
            )}
          </div>
        ) : (
          <div className="session-grid">
            {filtered.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                onOpen={() => onOpen(s.id)}
                onDuplicate={() => duplicateSession(s.id)}
                onDelete={() => setConfirmDelete(s)}
              />
            ))}
          </div>
        )}
      </main>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nova sessão"
        description="Você pode preencher os dados do participante agora ou depois. O nome aparece no painel."
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setNewOpen(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={createSession}>Criar sessão</button>
          </>
        }
      >
        <div className="field">
          <label className="field__label">Nome / ID do participante</label>
          <input
            className="input"
            autoFocus
            placeholder="Ex.: Aluno 01 · Maria"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createSession(); }}
          />
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir sessão?"
        description={
          confirmDelete
            ? `A sessão "${confirmDelete.header.participant || 'Sem nome'}" será removida permanentemente. Esta ação não pode ser desfeita.`
            : ''
        }
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setConfirmDelete(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={() => deleteSession(confirmDelete.id)}>
              <Icon name="trash-2" size={14} /> Excluir
            </button>
          </>
        }
      />
    </>
  );
}

function SessionCard({ session, onOpen, onDuplicate, onDelete }) {
  const p = window.UTStore.progressOf(session);
  const updated = new Date(session.updatedAt);
  const dateStr = updated.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  const status = session.status === 'done' ? 'done' : (p.pct > 0 ? 'progress' : 'idle');
  const statusLabel = status === 'done' ? 'Concluída' : (status === 'progress' ? 'Em andamento' : 'Não iniciada');

  return (
    <div className="session-card" role="button" tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter') onOpen(); }}>
      <div className="session-card__row">
        <div style={{ minWidth: 0 }}>
          <div className="session-card__name">{session.header.participant || 'Sem nome'}</div>
          <div className="session-card__meta">
            {session.header.course || 'Curso não informado'}
          </div>
        </div>
        <span className={'pill ' + (status === 'done' ? 'is-done' : status === 'progress' ? 'is-progress' : '')}>
          <span className="pill__dot" />
          {statusLabel}
        </span>
      </div>

      <div>
        <div className="session-card__bar">
          <div className="session-card__fill" style={{ width: `${p.pct * 100}%` }} />
        </div>
        <div className="session-card__footer" style={{ marginTop: 6 }}>
          <span>{p.done} de {p.total} tarefas</span>
          <span>Atualizada {dateStr}</span>
        </div>
      </div>

      <div className="session-card__footer" style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: 10, marginTop: 'auto' }}>
        <button className="btn btn--ghost btn--sm" onClick={e => { e.stopPropagation(); onDuplicate(); }}>
          <Icon name="copy" size={13} /> Duplicar
        </button>
        <button className="btn btn--ghost btn--sm" onClick={e => { e.stopPropagation(); onDelete(); }} style={{ color: 'rgb(var(--destructive))' }}>
          <Icon name="trash-2" size={13} /> Excluir
        </button>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
