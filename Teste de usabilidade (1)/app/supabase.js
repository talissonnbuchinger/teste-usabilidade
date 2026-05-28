/* eslint-disable */
// Supabase sync layer. Optional — app works offline if not configured.
// Stores credentials in localStorage. Uses single table `usability_sessions`.

(function () {
  const CFG_KEY = 'usability_supabase_cfg_v1';
  let client = null;
  let channel = null;

  function getConfig() {
    try {
      const raw = localStorage.getItem(CFG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function setConfig(cfg) {
    if (cfg) localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    else localStorage.removeItem(CFG_KEY);
    client = null; // reset on config change
  }
  function isConfigured() {
    const c = getConfig();
    return !!(c && c.url && c.anonKey);
  }
  function ensureClient() {
    const cfg = getConfig();
    if (!cfg || !cfg.url || !cfg.anonKey) return null;
    if (!window.supabase || !window.supabase.createClient) return null;
    if (!client) {
      try {
        client = window.supabase.createClient(cfg.url, cfg.anonKey, {
          realtime: { params: { eventsPerSecond: 10 } },
        });
      } catch (e) {
        console.error('Supabase init failed', e);
        return null;
      }
    }
    return client;
  }

  async function testConnection(url, anonKey) {
    try {
      if (!window.supabase) return { ok: false, error: 'SDK do Supabase não carregou.' };
      const c = window.supabase.createClient(url, anonKey);
      const { error } = await c.from('usability_sessions').select('id').limit(1);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || String(e) };
    }
  }

  async function fetchAll() {
    const c = ensureClient();
    if (!c) return [];
    const { data, error } = await c
      .from('usability_sessions')
      .select('id, data, updated_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => row.data).filter(Boolean);
  }

  function rowFromSession(session) {
    return {
      id: session.id,
      participant: session.header?.participant || null,
      course: session.header?.course || null,
      moderator: session.header?.moderator || null,
      status: session.status || 'in_progress',
      data: session,
      updated_at: new Date(session.updatedAt || Date.now()).toISOString(),
    };
  }

  async function upsert(session) {
    const c = ensureClient();
    if (!c) return { ok: false };
    const { error } = await c.from('usability_sessions').upsert(rowFromSession(session));
    if (error) throw error;
    return { ok: true };
  }

  async function remove(id) {
    const c = ensureClient();
    if (!c) return { ok: false };
    const { error } = await c.from('usability_sessions').delete().eq('id', id);
    if (error) throw error;
    return { ok: true };
  }

  function subscribe(onChange) {
    const c = ensureClient();
    if (!c) return null;
    if (channel) { try { c.removeChannel(channel); } catch (e) {} channel = null; }
    channel = c.channel('usability_sessions_rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'usability_sessions' },
        payload => onChange(payload))
      .subscribe();
    return channel;
  }

  function unsubscribe() {
    if (channel && client) {
      try { client.removeChannel(channel); } catch (e) {}
      channel = null;
    }
  }

  window.UTSupabase = {
    getConfig, setConfig, isConfigured,
    testConnection, fetchAll, upsert, remove,
    subscribe, unsubscribe,
  };
})();
