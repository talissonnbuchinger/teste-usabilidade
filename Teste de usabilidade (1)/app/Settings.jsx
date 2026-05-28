/* eslint-disable */
// Settings modal — configure Supabase URL + anon key.

function SettingsModal({ open, onClose, onSynced }) {
  const initial = window.UTSupabase.getConfig() || { url: '', anonKey: '' };
  const [url, setUrl] = React.useState(initial.url);
  const [anonKey, setAnonKey] = React.useState(initial.anonKey);
  const [moderator, setModerator] = React.useState(localStorage.getItem('usability_moderator') || '');
  const [testing, setTesting] = React.useState(false);
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      const cur = window.UTSupabase.getConfig() || { url: '', anonKey: '' };
      setUrl(cur.url);
      setAnonKey(cur.anonKey);
      setModerator(localStorage.getItem('usability_moderator') || '');
      setResult(null);
    }
  }, [open]);

  async function test() {
    setTesting(true);
    setResult(null);
    const r = await window.UTSupabase.testConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setResult(r);
  }

  async function save() {
    const cfg = { url: url.trim(), anonKey: anonKey.trim() };
    if (!cfg.url || !cfg.anonKey) {
      setResult({ ok: false, error: 'Preencha URL e anon key.' });
      return;
    }
    setTesting(true);
    const r = await window.UTSupabase.testConnection(cfg.url, cfg.anonKey);
    setTesting(false);
    if (!r.ok) { setResult(r); return; }
    window.UTSupabase.setConfig(cfg);
    if (moderator.trim()) localStorage.setItem('usability_moderator', moderator.trim());
    setResult({ ok: true });
    onSynced && onSynced();
    setTimeout(onClose, 500);
  }

  function disconnect() {
    window.UTSupabase.setConfig(null);
    setUrl(''); setAnonKey('');
    setResult({ ok: true, msg: 'Desconectado. Voltando ao modo offline.' });
    onSynced && onSynced();
  }

  const [copiedInvite, setCopiedInvite] = React.useState(false);
  function copyInviteLink() {
    const cfg = window.UTSupabase.getConfig();
    if (!cfg) return;
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ url: cfg.url, anonKey: cfg.anonKey }))));
    const base = window.location.href.split('#')[0];
    const link = `${base}#invite=${payload}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2200);
    });
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.10)', color: 'rgb(34,197,94)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="cloud" size={16} />
          </span>
          <h2 className="modal__title" style={{ margin: 0 }}>Sincronização com Supabase</h2>
        </div>
        <p className="modal__desc">
          Conecte um projeto Supabase para compartilhar sessões em tempo real com outros moderadores no mesmo link.
          Os dados continuam salvos localmente como backup offline.
        </p>

        <details style={{ background: 'rgb(var(--muted))', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Primeira vez? Setup (≈ 2 min)</summary>
          <ol style={{ margin: '10px 0 4px 18px', padding: 0, lineHeight: 1.6 }}>
            <li>Crie um projeto grátis em <a href="https://supabase.com" target="_blank" rel="noopener" style={{ color: 'rgb(var(--primary))' }}>supabase.com</a>.</li>
            <li>No painel, abra <strong>SQL Editor</strong> → <strong>New query</strong> e cole o SQL abaixo. Run.</li>
            <li>Em <strong>Project Settings → API</strong>, copie a <strong>Project URL</strong> e a <strong>anon public key</strong>. Cole aqui.</li>
            <li>Mande este link para os outros moderadores — quando eles colarem as mesmas credenciais, todos veem as mesmas sessões.</li>
          </ol>
          <SqlBlock />
          <p style={{ fontSize: 12, color: 'rgb(var(--muted-foreground))', margin: '8px 0 0' }}>
            ⚠️ A política deste SQL é aberta — qualquer pessoa com as credenciais pode ler/editar. Apropriado para times pequenos durante pesquisa. Para produção, troque a RLS por auth real.
          </p>
        </details>

        <div className="field-stack" style={{ marginTop: 4 }}>
          <Field label="Supabase Project URL" hint="Algo como https://abc123.supabase.co">
            <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://xxxxx.supabase.co" autoComplete="off" />
          </Field>
          <Field label="anon public key" hint="Chave pública. Não use a service_role.">
            <input className="input" value={anonKey} onChange={e => setAnonKey(e.target.value)} type="password" placeholder="eyJhbGciOi…" autoComplete="off" />
          </Field>
          <Field label="Seu nome de moderador" hint="Será preenchido por padrão em novas sessões.">
            <input className="input" value={moderator} onChange={e => setModerator(e.target.value)} placeholder="Ex.: Ana Lima" />
          </Field>

          {result && (
            <div style={{
              fontSize: 13, padding: '8px 12px', borderRadius: 8,
              background: result.ok ? 'rgba(34,197,94,0.10)' : 'rgba(220,38,38,0.08)',
              color: result.ok ? 'rgb(20,100,50)' : 'rgb(var(--destructive))',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon name={result.ok ? 'check-circle-2' : 'alert-circle'} size={14} />
              {result.ok ? (result.msg || 'Conexão OK — credenciais válidas.') : `Erro: ${result.error}`}
            </div>
          )}
        </div>

        {window.UTSupabase.isConfigured() && (
          <div style={{
            background: 'rgba(254,97,18,0.05)',
            border: '1px solid rgba(254,97,18,0.20)',
            borderRadius: 10, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="link" size={14} color="rgb(var(--primary))" />
              <strong style={{ fontSize: 13 }}>Convidar outros moderadores</strong>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'rgb(var(--muted-foreground))', lineHeight: 1.5 }}>
              Gera um link com as credenciais embutidas. Quem abrir conecta automaticamente, sem precisar configurar nada.
              Compartilhe apenas com pessoas de confiança — qualquer um com o link consegue ler e editar as sessões.
            </p>
            <button className="btn btn--outline btn--sm" onClick={copyInviteLink} style={{ alignSelf: 'flex-start' }}>
              {copiedInvite
                ? <><Icon name="check" size={13} /> Link copiado — cole no e-mail / chat</>
                : <><Icon name="link" size={13} /> Copiar link de convite</>}
            </button>
          </div>
        )}

        <div className="modal__footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {window.UTSupabase.isConfigured() && (
              <button className="btn btn--danger btn--sm" onClick={disconnect}>
                <Icon name="cloud-off" size={13} /> Desconectar
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--outline" onClick={test} disabled={testing || !url || !anonKey}>
              {testing ? 'Testando…' : 'Testar conexão'}
            </button>
            <button className="btn btn--primary" onClick={save} disabled={testing}>
              Salvar & conectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SETUP_SQL = `-- Tabela única para sessões de teste de usabilidade
create table if not exists public.usability_sessions (
  id text primary key,
  participant text,
  course text,
  moderator text,
  status text default 'in_progress',
  data jsonb not null,
  updated_at timestamptz default now()
);

create index if not exists usability_sessions_updated_idx
  on public.usability_sessions (updated_at desc);

-- Realtime
alter publication supabase_realtime add table public.usability_sessions;

-- RLS aberta (troque por auth real em produção)
alter table public.usability_sessions enable row level security;

drop policy if exists "open_read"  on public.usability_sessions;
drop policy if exists "open_write" on public.usability_sessions;
drop policy if exists "open_update" on public.usability_sessions;
drop policy if exists "open_delete" on public.usability_sessions;

create policy "open_read"   on public.usability_sessions for select using (true);
create policy "open_write"  on public.usability_sessions for insert with check (true);
create policy "open_update" on public.usability_sessions for update using (true);
create policy "open_delete" on public.usability_sessions for delete using (true);`;

function SqlBlock() {
  const [copied, setCopied] = React.useState(false);
  function copy() {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div style={{ position: 'relative', marginTop: 10 }}>
      <pre style={{
        background: 'white', border: '1px solid rgb(var(--border))', borderRadius: 8,
        padding: '12px 14px', margin: 0, fontSize: 11.5, lineHeight: 1.45,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        maxHeight: 220, overflow: 'auto', whiteSpace: 'pre',
      }}>{SETUP_SQL}</pre>
      <button
        className="btn btn--outline btn--sm"
        onClick={copy}
        style={{ position: 'absolute', top: 8, right: 8 }}
      >
        {copied ? <><Icon name="check" size={12} /> Copiado</> : <><Icon name="copy" size={12} /> Copiar SQL</>}
      </button>
    </div>
  );
}

window.SettingsModal = SettingsModal;
