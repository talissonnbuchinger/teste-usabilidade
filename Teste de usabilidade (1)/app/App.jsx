/* eslint-disable */
// Root component: state, sync, routing.

function App() {
  const [state, setStateRaw] = React.useState(() => window.UTStore.load());
  const [currentId, setCurrentId] = React.useState(null);
  const [pending, setPending] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [invite, setInvite] = React.useState(null); // { url, anonKey, existing }
  const [syncStatus, setSyncStatus] = React.useState(
    window.UTSupabase.isConfigured() ? 'connecting' : 'offline'
  );

  // ----- Invite link handler ------
  React.useEffect(() => {
    const m = window.location.hash.match(/invite=([A-Za-z0-9+/=_-]+)/);
    if (!m) return;
    try {
      const json = decodeURIComponent(escape(atob(m[1])));
      const payload = JSON.parse(json);
      if (payload.url && payload.anonKey) {
        const existing = window.UTSupabase.getConfig();
        const sameAsExisting = existing && existing.url === payload.url && existing.anonKey === payload.anonKey;
        // Always strip the invite from the URL.
        const cleanHash = window.location.hash.replace(/invite=[^&]+&?/, '').replace(/^#$/, '');
        window.history.replaceState(null, '', window.location.pathname + window.location.search + cleanHash);
        if (!sameAsExisting) setInvite({ ...payload, existing });
      }
    } catch (e) { console.error('Invalid invite link', e); }
  }, []);

  function acceptInvite() {
    if (!invite) return;
    window.UTSupabase.setConfig({ url: invite.url, anonKey: invite.anonKey });
    setSyncStatus('connecting');
    setInvite(null);
  }
  const saveTimer = React.useRef(null);
  const remoteTimers = React.useRef({}); // per-session debounce for remote push
  const lastPushed = React.useRef({});  // per-session last updatedAt pushed
  const incomingIds = React.useRef(new Set()); // realtime ids to skip pushing back

  // Local persist (debounced).
  React.useEffect(() => {
    setPending(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.UTStore.save(state);
      setPending(false);
    }, 200);
    return () => clearTimeout(saveTimer.current);
  }, [state]);

  // Connect to Supabase: initial fetch + realtime subscription.
  React.useEffect(() => {
    if (!window.UTSupabase.isConfigured()) {
      setSyncStatus('offline');
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setSyncStatus('connecting');
      try {
        const remoteSessions = await window.UTSupabase.fetchAll();
        if (cancelled) return;
        // Merge: remote wins if newer.
        setStateRaw(prev => {
          const next = { sessions: { ...prev.sessions }, order: [...prev.order] };
          remoteSessions.forEach(s => {
            const local = next.sessions[s.id];
            if (!local || (s.updatedAt || 0) >= (local.updatedAt || 0)) {
              next.sessions[s.id] = s;
              if (!next.order.includes(s.id)) next.order.unshift(s.id);
              lastPushed.current[s.id] = s.updatedAt || 0;
            }
          });
          // Sort by updatedAt desc.
          next.order = Object.keys(next.sessions)
            .sort((a, b) => (next.sessions[b].updatedAt || 0) - (next.sessions[a].updatedAt || 0));
          return next;
        });
        setSyncStatus('online');
      } catch (e) {
        console.error('Bootstrap sync failed', e);
        setSyncStatus('error');
      }
    }

    bootstrap();

    const sub = window.UTSupabase.subscribe(payload => {
      if (payload.eventType === 'DELETE') {
        const id = payload.old?.id;
        if (!id) return;
        incomingIds.current.add(id);
        setStateRaw(prev => {
          if (!prev.sessions[id]) return prev;
          const sessions = { ...prev.sessions }; delete sessions[id];
          return { sessions, order: prev.order.filter(x => x !== id) };
        });
        setTimeout(() => incomingIds.current.delete(id), 1500);
        return;
      }
      const row = payload.new;
      if (!row || !row.data) return;
      const incoming = row.data;
      const incomingTs = incoming.updatedAt || 0;
      incomingIds.current.add(incoming.id);
      setStateRaw(prev => {
        const local = prev.sessions[incoming.id];
        // Don't downgrade if we have newer.
        if (local && (local.updatedAt || 0) > incomingTs) return prev;
        const sessions = { ...prev.sessions, [incoming.id]: incoming };
        const order = prev.order.includes(incoming.id) ? prev.order : [incoming.id, ...prev.order];
        order.sort((a, b) => (sessions[b].updatedAt || 0) - (sessions[a].updatedAt || 0));
        lastPushed.current[incoming.id] = incomingTs;
        return { sessions, order };
      });
      setTimeout(() => incomingIds.current.delete(incoming.id), 1500);
    });

    return () => {
      cancelled = true;
      window.UTSupabase.unsubscribe();
    };
  }, [syncStatus === 'offline' ? null : 'connected']);
  // The dep above re-runs when (re)connecting via settings.

  // Push changed sessions remotely (debounced per session).
  React.useEffect(() => {
    if (syncStatus !== 'online' && syncStatus !== 'connecting') return;
    if (!window.UTSupabase.isConfigured()) return;

    Object.values(state.sessions).forEach(s => {
      const ts = s.updatedAt || 0;
      const last = lastPushed.current[s.id] || 0;
      if (ts <= last) return;
      if (incomingIds.current.has(s.id)) return; // came from realtime
      clearTimeout(remoteTimers.current[s.id]);
      remoteTimers.current[s.id] = setTimeout(async () => {
        try {
          await window.UTSupabase.upsert(s);
          lastPushed.current[s.id] = ts;
          setSyncStatus('online');
        } catch (e) {
          console.error('Push failed', e);
          setSyncStatus('error');
        }
      }, 600);
    });
  }, [state, syncStatus]);

  const setState = React.useCallback((next) => {
    if (typeof next === 'function') setStateRaw(prev => next(prev));
    else setStateRaw(next);
  }, []);

  const updateSession = React.useCallback((updater) => {
    setStateRaw(prev => {
      const cur = prev.sessions[currentId];
      if (!cur) return prev;
      const updated = typeof updater === 'function' ? updater(cur) : updater;
      return { ...prev, sessions: { ...prev.sessions, [currentId]: updated } };
    });
  }, [currentId]);

  // Custom delete handler: also delete remotely.
  const setStateWithRemoteDelete = React.useCallback((next) => {
    setStateRaw(prev => {
      const newState = typeof next === 'function' ? next(prev) : next;
      const removed = Object.keys(prev.sessions).filter(id => !newState.sessions[id]);
      removed.forEach(id => {
        if (window.UTSupabase.isConfigured() && !incomingIds.current.has(id)) {
          window.UTSupabase.remove(id).catch(e => console.error('Remote delete failed', e));
        }
      });
      return newState;
    });
  }, []);

  // URL hash routing.
  React.useEffect(() => {
    function fromHash() {
      const m = window.location.hash.match(/session=([\w]+)/);
      if (m && state.sessions[m[1]]) setCurrentId(m[1]);
      else setCurrentId(null);
    }
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [state.sessions]);

  function openSession(id) {
    window.location.hash = 'session=' + id;
    setCurrentId(id);
  }
  function backToDashboard() {
    window.location.hash = '';
    setCurrentId(null);
    window.scrollTo({ top: 0 });
  }

  function onSettingsSynced() {
    // Force the connect effect to re-run by toggling status.
    if (window.UTSupabase.isConfigured()) setSyncStatus('connecting');
    else setSyncStatus('offline');
  }

  const current = currentId ? state.sessions[currentId] : null;

  return (
    <>
      {current ? (
        <Editor
          session={current}
          onUpdate={updateSession}
          onBack={backToDashboard}
          pending={pending}
          syncStatus={syncStatus}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <Dashboard
          state={state}
          setState={setStateWithRemoteDelete}
          onOpen={openSession}
          syncStatus={syncStatus}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSynced={onSettingsSynced}
      />
      <InviteModal
        invite={invite}
        onAccept={acceptInvite}
        onDismiss={() => setInvite(null)}
      />
    </>
  );
}

function InviteModal({ invite, onAccept, onDismiss }) {
  if (!invite) return null;
  const hostName = (() => { try { return new URL(invite.url).host; } catch (e) { return invite.url; } })();
  return (
    <div className="modal-backdrop" onClick={onDismiss}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(254,97,18,0.10)', color: 'rgb(var(--primary))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="link" size={16} />
          </span>
          <h2 className="modal__title" style={{ margin: 0 }}>Convite recebido</h2>
        </div>
        <p className="modal__desc">
          Você foi convidado a colaborar nesta base de pesquisa.
          {invite.existing && (
            <> Você já está conectado a um outro projeto — aceitar substitui as credenciais atuais.</>
          )}
        </p>
        <div style={{
          background: 'rgb(var(--muted))', borderRadius: 8,
          padding: '10px 12px', fontSize: 12.5,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          wordBreak: 'break-all',
        }}>
          <div style={{ color: 'rgb(var(--muted-foreground))', marginBottom: 2 }}>Projeto Supabase</div>
          <strong>{hostName}</strong>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'rgb(var(--muted-foreground))' }}>
          Aceite apenas se reconhece quem enviou. Suas sessões locais não serão apagadas — só serão mescladas com as do projeto compartilhado.
        </p>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onDismiss}>Agora não</button>
          <button className="btn btn--primary" onClick={onAccept}>
            <Icon name="check" size={14} /> Aceitar & conectar
          </button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
