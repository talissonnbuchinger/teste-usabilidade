/* eslint-disable */
// Storage + export helpers. Plain JS — attached to window.

(function () {
  const KEY = 'usability_sessions_v1';

  function uid() {
    return 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function blankTaskState(t) {
    const probes = {};
    (t.probes || []).forEach(p => probes[p.id] = { applied: false, answer: '' });
    const universal = {};
    (t.universalProbes || []).forEach(p => universal[p.id] = { applied: false, answer: '' });
    const extras = {};
    (t.extras || []).forEach(e => {
      if (e.type === 'list') extras[e.id] = Array(e.rows || 3).fill('');
      else if (e.type === 'rating10') extras[e.id] = null;
      else extras[e.id] = '';
    });
    return {
      result: null,
      answer: '',
      observations: '',
      quote: '',
      path: t.pathSteps ? Array(t.pathSteps).fill('') : null,
      probes,
      universal,
      extras,
    };
  }

  function blankSession() {
    const tasks = {};
    (window.SESSION_TASKS || []).forEach(t => tasks[t.id] = blankTaskState(t));
    return {
      id: uid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'in_progress',
      header: {
        participant: '',
        course: '',
        mesaTime: '',
        date: new Date().toISOString().slice(0, 10),
        startTime: '',
        endTime: '',
        moderator: '',
        observer: '',
        channel: '',
        recordingConsent: '',
        lgpdConsent: '',
        setup: '',
        initialMood: '',
      },
      tasks,
      synthesis: {
        frictions: [
          { where: '', what: '', severity: '' },
          { where: '', what: '', severity: '' },
          { where: '', what: '', severity: '' },
        ],
        fluidity: '',
        missingFromMesa: '',
        mentalModel: '',
        keyQuotes: ['', '', ''],
        nextSteps: ['', '', ''],
        recommendations: [
          { priority: '', text: '', origin: '' },
          { priority: '', text: '', origin: '' },
          { priority: '', text: '', origin: '' },
        ],
      },
      moderatorNotes: {
        behavior: '',
        patterns: '',
        scriptReview: '',
        freeNotes: '',
      },
      checklist: {
        thanked: false,
        nextSteps: false,
        recordingSaved: false,
        notesReviewed: false,
        quotesTranscribed: false,
        synthesisFilled: false,
        insightsConsolidated: false,
      },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { sessions: {}, order: [] };
      const parsed = JSON.parse(raw);
      if (!parsed.sessions) return { sessions: {}, order: [] };
      return parsed;
    } catch (e) {
      console.error('Load failed', e);
      return { sessions: {}, order: [] };
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function progressOf(session) {
    const tasks = window.SESSION_TASKS || [];
    let touched = 0;
    tasks.forEach(t => {
      const s = session.tasks[t.id];
      if (!s) return;
      const hasContent =
        s.result ||
        (s.answer && s.answer.trim()) ||
        (s.observations && s.observations.trim()) ||
        (s.quote && s.quote.trim()) ||
        (s.path && s.path.some(x => x && x.trim())) ||
        Object.values(s.probes || {}).some(p => p.applied || (p.answer && p.answer.trim())) ||
        Object.values(s.universal || {}).some(p => p.applied || (p.answer && p.answer.trim())) ||
        Object.values(s.extras || {}).some(e => {
          if (Array.isArray(e)) return e.some(x => x && x.trim && x.trim());
          if (e === null || e === undefined) return false;
          return String(e).trim().length > 0;
        });
      if (hasContent) touched++;
    });
    return { done: touched, total: tasks.length, pct: tasks.length ? touched / tasks.length : 0 };
  }

  // ---------- Markdown export ----------
  function mdEscape(s) { return (s || '').toString(); }
  function resultLabel(r) {
    return ({
      success: '✅ Sucesso',
      partial: '⚠️ Parcial',
      fail: '❌ Falha',
      na: '➖ N/A',
    })[r] || '_(não marcado)_';
  }

  function toMarkdown(session) {
    const tasks = window.SESSION_TASKS || [];
    const meta = window.SESSION_META || {};
    const h = session.header;
    const lines = [];
    const fmtDate = (d) => {
      if (!d) return '_______________________________';
      try {
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
      } catch (e) { return d; }
    };
    const v = (s) => s && s.trim() ? s : '_______________________________';
    const mlv = (s) => s && s.trim() ? s : '_(em branco)_';

    lines.push(`# Teste de Usabilidade — ${meta.product || ''}`);
    lines.push('');
    lines.push(`> Sessão registrada via app. Exportada em ${new Date().toLocaleString('pt-BR')}.`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## 1. Cabeçalho da Sessão');
    lines.push('');
    lines.push(`| Campo | Valor |`);
    lines.push(`|---|---|`);
    lines.push(`| **Produto / Feature** | ${meta.product || ''} |`);
    lines.push(`| **Tipo de teste** | ${meta.type || ''} |`);
    lines.push(`| **Objetivo** | ${meta.objective || ''} |`);
    lines.push(`| **Perfil do usuário** | ${meta.profile || ''} |`);
    lines.push(`| **Participante** | ${v(h.participant)} |`);
    lines.push(`| **Curso / concurso** | ${v(h.course)} |`);
    lines.push(`| **Tempo de uso da Mesa** | ${v(h.mesaTime)} |`);
    lines.push(`| **Data** | ${fmtDate(h.date)} |`);
    lines.push(`| **Início → Fim** | ${v(h.startTime)} → ${v(h.endTime)} |`);
    lines.push(`| **Moderador** | ${v(h.moderator)} |`);
    lines.push(`| **Observador(es)** | ${v(h.observer)} |`);
    lines.push(`| **Canal / ferramenta** | ${v(h.channel)} |`);
    lines.push(`| **Gravação autorizada?** | ${v(h.recordingConsent)} |`);
    lines.push(`| **LGPD assinado?** | ${v(h.lgpdConsent)} |`);
    lines.push('');
    lines.push('**Setup técnico observado**:');
    lines.push(`> ${mlv(h.setup)}`);
    lines.push('');
    lines.push('**Estado emocional inicial**:');
    lines.push(`> ${mlv(h.initialMood)}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## 2. Tarefas');
    lines.push('');

    tasks.forEach(t => {
      const s = session.tasks[t.id] || {};
      lines.push(`### Tarefa ${t.n} — ${t.title}`);
      lines.push('');
      lines.push(`**Enunciado:** ${t.prompt}`);
      lines.push('');
      if (t.hasResult !== false) {
        lines.push(`**Resultado:** ${resultLabel(s.result)}`);
        lines.push('');
      }
      if (t.pathSteps) {
        lines.push(`**Caminho percorrido:**`);
        (s.path || []).forEach((step, i) => {
          lines.push(`${i + 1}. ${step && step.trim() ? step : '_______________________________'}`);
        });
        lines.push('');
      }
      if (t.kind !== 'probes-table') {
        lines.push(`**Resposta / anotação:**`);
        lines.push(`> ${mlv(s.answer)}`);
        lines.push('');
      }
      (t.extras || []).forEach(e => {
        const val = s.extras ? s.extras[e.id] : null;
        if (e.type === 'radio') {
          lines.push(`**${e.label}:** ${val || '_(não marcado)_'}`);
          lines.push('');
        } else if (e.type === 'list') {
          lines.push(`**${e.label}:**`);
          (val || []).forEach((it, i) => {
            lines.push(`${i + 1}. ${it && it.trim() ? it : '_______________________________'}`);
          });
          lines.push('');
        } else if (e.type === 'rating10') {
          lines.push(`**${e.label}:** ${val !== null && val !== undefined ? `**${val} / 10**` : '_(não atribuída)_'}`);
          lines.push('');
        }
      });
      (t.probes || []).forEach(p => {
        const ps = (s.probes || {})[p.id] || {};
        if (ps.applied || (ps.answer && ps.answer.trim())) {
          lines.push(`**Probe — [${p.trigger}]:** _${p.q}_`);
          lines.push(`> ${mlv(ps.answer)}`);
          lines.push('');
        }
      });
      if (t.kind === 'probes-table') {
        (t.universalProbes || []).forEach(p => {
          const ps = (s.universal || {})[p.id] || {};
          if (ps.applied || (ps.answer && ps.answer.trim())) {
            lines.push(`- **[${p.trigger}]** — _${p.q}_`);
            lines.push(`  > ${mlv(ps.answer)}`);
          }
        });
        lines.push('');
      }
      if (t.hasObs !== false) {
        lines.push(`**Erros ou dificuldades observadas:**`);
        lines.push(`> ${mlv(s.observations)}`);
        lines.push('');
      }
      if (t.hasQuote !== false) {
        lines.push(`**Citação direta:**`);
        lines.push(`> "${(s.quote || '').trim() || '_______________________________'}"`);
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    });

    lines.push('## 3. Síntese da Sessão');
    lines.push('');
    lines.push('### 3.1 Pontos de atrito');
    lines.push('');
    lines.push('| # | Onde | O que aconteceu | Severidade |');
    lines.push('|---|---|---|---|');
    (session.synthesis.frictions || []).forEach((f, i) => {
      lines.push(`| ${i + 1} | ${f.where || '_(em branco)_'} | ${f.what || '_(em branco)_'} | ${f.severity || '_(não marcada)_'} |`);
    });
    lines.push('');
    lines.push('### 3.2 Momentos de fluidez');
    lines.push(`> ${mlv(session.synthesis.fluidity)}`);
    lines.push('');
    lines.push('### 3.3 Itens da Mesa que sentiu falta');
    lines.push(`> ${mlv(session.synthesis.missingFromMesa)}`);
    lines.push('');
    lines.push('### 3.4 Modelo mental observado');
    lines.push(`> ${mlv(session.synthesis.mentalModel)}`);
    lines.push('');
    lines.push('### 3.5 Citações-chave');
    (session.synthesis.keyQuotes || []).forEach(q => {
      if (q && q.trim()) lines.push(`> "${q}"\n>`);
    });
    lines.push('');
    lines.push('### 3.6 Próximos passos');
    (session.synthesis.nextSteps || []).forEach(n => { if (n && n.trim()) lines.push(`- ${n}`); });
    lines.push('');
    lines.push('### 3.7 Recomendações');
    lines.push('');
    lines.push('| Prioridade | Recomendação | Origem |');
    lines.push('|---|---|---|');
    (session.synthesis.recommendations || []).forEach(r => {
      lines.push(`| ${r.priority || '_(?)_'} | ${r.text || '_(em branco)_'} | ${r.origin || '—'} |`);
    });
    lines.push('');
    lines.push('## 4. Observações do Moderador');
    lines.push('');
    lines.push('**Comportamento / linguagem corporal:**');
    lines.push(`> ${mlv(session.moderatorNotes.behavior)}`);
    lines.push('');
    lines.push('**Padrões observados:**');
    lines.push(`> ${mlv(session.moderatorNotes.patterns)}`);
    lines.push('');
    lines.push('**Revisão do roteiro:**');
    lines.push(`> ${mlv(session.moderatorNotes.scriptReview)}`);
    lines.push('');
    lines.push('**Notas livres:**');
    lines.push(`> ${mlv(session.moderatorNotes.freeNotes)}`);
    lines.push('');
    lines.push('### Checklist de encerramento');
    const cl = session.checklist || {};
    const items = [
      ['thanked', 'Agradeci o participante'],
      ['nextSteps', 'Confirmei próximos passos / incentivo'],
      ['recordingSaved', 'Gravação salva e renomeada'],
      ['notesReviewed', 'Anotações revisadas a quente'],
      ['quotesTranscribed', 'Citações transcritas literais'],
      ['synthesisFilled', 'Síntese preenchida'],
      ['insightsConsolidated', 'Insights levados para a planilha'],
    ];
    items.forEach(([k, label]) => lines.push(`- [${cl[k] ? 'x' : ' '}] ${label}`));
    lines.push('');
    return lines.join('\n');
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  function safeName(s) {
    return (s || 'sessao').trim().replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 60) || 'sessao';
  }

  window.UTStore = {
    KEY, uid, blankSession, blankTaskState, load, save, progressOf,
    toMarkdown, download, safeName,
  };
})();
