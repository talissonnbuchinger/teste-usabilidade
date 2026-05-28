/* eslint-disable */
// Session editor — main authoring view.

function Editor({ session, onUpdate, onBack, pending, syncStatus, onOpenSettings }) {
  const tasks = window.SESSION_TASKS || [];
  const [activeAnchor, setActiveAnchor] = React.useState('header');

  // ScrollSpy
  React.useEffect(() => {
    const main = document.querySelector('.editor__main');
    if (!main) return;
    const anchors = ['header', ...tasks.map(t => t.id), 'synthesis', 'mod-notes'];
    function onScroll() {
      const scroll = main.scrollTop + 120;
      let current = anchors[0];
      anchors.forEach(a => {
        const el = document.getElementById('anchor-' + a);
        if (el && el.offsetTop <= scroll) current = a;
      });
      setActiveAnchor(current);
    }
    main.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      main.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, [tasks.length]);

  function scrollTo(anchor) {
    const el = document.getElementById('anchor-' + anchor);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  function patch(path, value) {
    // path: ['header', 'participant'] or ['tasks', 't1', 'answer']
    onUpdate((s) => {
      const next = JSON.parse(JSON.stringify(s));
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (obj[path[i]] === undefined) obj[path[i]] = {};
        obj = obj[path[i]];
      }
      obj[path[path.length - 1]] = value;
      next.updatedAt = Date.now();
      return next;
    });
  }

  function exportMarkdown() {
    const md = window.UTStore.toMarkdown(session);
    const name = window.UTStore.safeName(session.header.participant || 'sessao');
    window.UTStore.download(`teste_${name}.md`, md, 'text/markdown;charset=utf-8');
  }
  function exportJSON() {
    window.UTStore.download(
      `teste_${window.UTStore.safeName(session.header.participant || 'sessao')}.json`,
      JSON.stringify(session, null, 2),
      'application/json'
    );
  }
  function copyMarkdown() {
    const md = window.UTStore.toMarkdown(session);
    navigator.clipboard.writeText(md).then(() => {
      // simple toast via title flash
      const el = document.querySelector('.ut-topbar');
      if (el) {
        el.style.transition = 'background 300ms';
        const orig = el.style.background;
        el.style.background = 'rgba(34, 197, 94, 0.08)';
        setTimeout(() => { el.style.background = orig; }, 600);
      }
    });
  }

  function markStatus(newStatus) {
    patch(['status'], newStatus);
  }

  const progress = window.UTStore.progressOf(session);
  const participantName = session.header.participant || 'Sessão sem nome';

  return (
    <>
      <Topbar
        left={
          <>
            <button className="btn btn--ghost btn--sm" onClick={onBack}>
              <Icon name="arrow-left" size={14} /> Painel
            </button>
            <div style={{ borderLeft: '1px solid rgb(var(--border))', height: 28 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{participantName}</div>
              <div style={{ fontSize: 11.5, color: 'rgb(var(--muted-foreground))', marginTop: 2 }}>
                {progress.done}/{progress.total} tarefas · {session.header.course || 'Sem curso'}
              </div>
            </div>
          </>
        }
        right={
          <>
            <SyncBadge status={syncStatus} onClick={onOpenSettings} />
            <SavedIndicator pending={pending} />
            {session.status === 'done' ? (
              <button className="btn btn--ghost btn--sm" onClick={() => markStatus('in_progress')}>
                <Icon name="undo-2" size={14} /> Reabrir
              </button>
            ) : (
              <button className="btn btn--outline btn--sm" onClick={() => markStatus('done')}>
                <Icon name="check" size={14} /> Marcar concluída
              </button>
            )}
            <Menu trigger={<><Icon name="download" size={14} /> Exportar</>}>
              <button className="menu__item" onClick={exportMarkdown}>
                <Icon name="file-text" size={14} /> Baixar Markdown (.md)
              </button>
              <button className="menu__item" onClick={copyMarkdown}>
                <Icon name="clipboard" size={14} /> Copiar Markdown
              </button>
              <div className="menu__sep" />
              <button className="menu__item" onClick={exportJSON}>
                <Icon name="braces" size={14} /> Baixar JSON (.json)
              </button>
            </Menu>
          </>
        }
      />

      <div className="editor">
        <aside className="editor__nav">
          <h3>Sessão</h3>
          <div className="nav-progress">
            <div className="nav-progress__bar">
              <div className="nav-progress__fill" style={{ width: `${progress.pct * 100}%` }} />
            </div>
            <div className="nav-progress__label">{Math.round(progress.pct * 100)}% preenchido</div>
          </div>

          <button
            className="nav-item"
            data-active={activeAnchor === 'header'}
            onClick={() => scrollTo('header')}
          >
            <span className="nav-item__n"><Icon name="user" size={12} /></span>
            <span className="nav-item__title">Cabeçalho</span>
          </button>

          <hr className="nav-divider" />
          <h3>Tarefas</h3>
          {tasks.map(t => {
            const s = session.tasks[t.id] || {};
            const status = s.result || (s.answer && s.answer.trim() ? 'filled' : null);
            return (
              <button
                key={t.id}
                className="nav-item"
                data-active={activeAnchor === t.id}
                data-status={status || ''}
                onClick={() => scrollTo(t.id)}
                title={t.title}
              >
                <span className="nav-item__n">{t.n}</span>
                <span className="nav-item__title">{t.title}</span>
              </button>
            );
          })}

        <hr className="nav-divider" />
          <h3>Encerramento</h3>
          <button
            className="nav-item"
            data-active={activeAnchor === 'synthesis'}
            onClick={() => scrollTo('synthesis')}
          >
            <span className="nav-item__n"><Icon name="pencil-line" size={12} /></span>
            <span className="nav-item__title">Anotações gerais</span>
          </button>
        </aside>

        <section className="editor__main">
          <div className="editor__main__inner">
            <HeaderCard header={session.header} patch={patch} />
            {tasks.map(t => (
              <TaskCard
                key={t.id}
                task={t}
                state={session.tasks[t.id] || window.UTStore.blankTaskState(t)}
                patch={patch}
              />
            ))}
            <SynthesisCard synthesis={session.synthesis} patch={patch} />
            <ModeratorNotesCard notes={session.moderatorNotes} checklist={session.checklist} patch={patch} />
          </div>
        </section>
      </div>
    </>
  );
}

// ---------------- Header card ----------------
function HeaderCard({ header, patch }) {
  const meta = window.SESSION_META;
  const set = (key) => (e) => patch(['header', key], e.target ? e.target.value : e);

  return (
    <section className="card" id="anchor-header">
      <div className="card__head">
        <div>
          <div className="card__num"><Icon name="user-round" size={12} /> Cabeçalho</div>
          <h2 className="card__title">Dados da sessão</h2>
        </div>
      </div>

      <div className="prompt-box" style={{ background: 'rgb(var(--muted))', borderLeftColor: 'rgb(var(--muted-foreground))' }}>
        <em>Contexto fixo</em>
        <strong>{meta.product}</strong> · {meta.type} — {meta.profile}
      </div>

      <div className="field-stack">
        <div className="grid-2">
          <Field label="Participante (ID / pseudônimo)">
            <input className="input" value={header.participant} onChange={set('participant')} placeholder="Aluno 01 · Maria" />
          </Field>
          <Field label="Curso / concurso em preparação">
            <input className="input" value={header.course} onChange={set('course')} placeholder="Ex.: TJ-SP Escrevente" />
          </Field>
        </div>
        <div className="grid-3">
          <Field label="Tempo de uso da Mesa de Estudo">
            <input className="input" value={header.mesaTime} onChange={set('mesaTime')} placeholder="Ex.: 6 meses" />
          </Field>
          <Field label="Data">
            <input className="input" type="date" value={header.date} onChange={set('date')} />
          </Field>
          <Field label="Canal / ferramenta">
            <input className="input" value={header.channel} onChange={set('channel')} placeholder="Google Meet · Lookback…" />
          </Field>
        </div>
        <div className="grid-3">
          <Field label="Horário início">
            <input className="input" type="time" value={header.startTime} onChange={set('startTime')} />
          </Field>
          <Field label="Horário fim">
            <input className="input" type="time" value={header.endTime} onChange={set('endTime')} />
          </Field>
          <Field label="Moderador">
            <input className="input" value={header.moderator} onChange={set('moderator')} placeholder="Nome" />
          </Field>
        </div>
        <Field label="Observador(es) / notetaker">
          <input className="input" value={header.observer} onChange={set('observer')} placeholder="Nomes separados por vírgula" />
        </Field>
        <div className="grid-2">
          <Field label="Gravação autorizada?">
            <RadioRow
              value={header.recordingConsent}
              options={['Sim', 'Não', 'Apenas áudio']}
              onChange={(v) => patch(['header', 'recordingConsent'], v)}
            />
          </Field>
          <Field label="Consentimento (LGPD) assinado?">
            <RadioRow
              value={header.lgpdConsent}
              options={['Sim', 'Não']}
              onChange={(v) => patch(['header', 'lgpdConsent'], v)}
            />
          </Field>
        </div>
        <Field label="Setup técnico observado">
          <textarea
            className="textarea"
            value={header.setup}
            onChange={set('setup')}
            placeholder="Dispositivo, navegador, resolução, conexão"
          />
        </Field>
        <Field label="Estado emocional / disposição inicial do participante">
          <textarea className="textarea" value={header.initialMood} onChange={set('initialMood')} placeholder="Como o participante chegou — tranquilo, ansioso, curioso…" />
        </Field>
      </div>
    </section>
  );
}

// ---------------- Task card ----------------
function TaskCard({ task, state, patch }) {
  const tid = task.id;
  const showResult = task.hasResult !== false;
  const showObs = task.hasObs !== false;
  const showQuote = task.hasQuote !== false;

  const setField = (field) => (v) => patch(['tasks', tid, field], v && v.target ? v.target.value : v);
  const setExtra = (extraId) => (v) => patch(['tasks', tid, 'extras', extraId], v && v.target ? v.target.value : v);
  const setPath = (idx) => (v) => {
    const arr = (state.path || Array(task.pathSteps).fill('')).slice();
    arr[idx] = v.target ? v.target.value : v;
    patch(['tasks', tid, 'path'], arr);
  };
  const setProbe = (pid, key) => (v) => patch(['tasks', tid, 'probes', pid, key], v && v.target ? v.target.value : v);
  const setUniversal = (uid, key) => (v) => patch(['tasks', tid, 'universal', uid, key], v && v.target ? v.target.value : v);
  const setListItem = (extraId, idx) => (v) => {
    const arr = (state.extras[extraId] || []).slice();
    arr[idx] = v.target ? v.target.value : v;
    patch(['tasks', tid, 'extras', extraId], arr);
  };

  return (
    <section className="card card--task" id={'anchor-' + tid}>
      <div className="card__head">
        <div style={{ flex: 1 }}>
          <div className="card__num">Tarefa <strong>{String(task.n).padStart(2, '0')}</strong></div>
          <h2 className="card__title">{task.title}</h2>
        </div>
        {state.result && (
          <span className={'pill ' + (state.result === 'success' ? 'is-done' : state.result === 'fail' ? '' : 'is-progress')}>
            <span className="pill__dot" />
            {({
              success: 'Sucesso',
              partial: 'Parcial',
              fail: 'Falha',
              na: 'N/A',
            })[state.result]}
          </span>
        )}
      </div>

      <div className="prompt-box">
        <em>Enunciado (ler ao usuário)</em>
        "{task.prompt}"
      </div>

      <div className="field-stack">
        {showResult && (
          <Field label="Resultado">
            <div className="result-row">
              {[
                { k: 'success', label: 'Sucesso', icon: 'check' },
                { k: 'partial', label: 'Parcial', icon: 'alert-triangle' },
                { k: 'fail', label: 'Falha', icon: 'x' },
                { k: 'na', label: 'N/A', icon: 'minus' },
              ].map(o => (
                <button
                  key={o.k}
                  className="result-chip"
                  data-selected={state.result === o.k}
                  data-kind={o.k}
                  onClick={() => setField('result')(state.result === o.k ? null : o.k)}
                >
                  <span className="result-chip__icon"><Icon name={o.icon} size={10} /></span>
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        {task.pathSteps > 0 && (
          <Field label="Caminho percorrido (cliques na ordem)">
            <div className="list-input">
              {Array.from({ length: task.pathSteps }, (_, i) => (
                <div key={i} className="list-input__row">
                  <span className="list-input__n">{i + 1}</span>
                  <input
                    className="input"
                    placeholder={`Passo ${i + 1}`}
                    value={(state.path || [])[i] || ''}
                    onChange={setPath(i)}
                  />
                </div>
              ))}
            </div>
          </Field>
        )}

        {(task.extras || []).map(e => {
          if (e.type === 'radio') {
            return (
              <Field key={e.id} label={e.label}>
                <RadioRow value={state.extras[e.id] || ''} options={e.options} onChange={setExtra(e.id)} />
              </Field>
            );
          }
          if (e.type === 'list') {
            const items = state.extras[e.id] || Array(e.rows || 3).fill('');
            return (
              <Field key={e.id} label={e.label}>
                <div className="list-input">
                  {items.map((it, i) => (
                    <div key={i} className="list-input__row">
                      <span className="list-input__n">{i + 1}</span>
                      <input
                        className="input"
                        placeholder={e.placeholder || ''}
                        value={it}
                        onChange={setListItem(e.id, i)}
                      />
                    </div>
                  ))}
                </div>
              </Field>
            );
          }
          if (e.type === 'rating10') {
            const v = state.extras[e.id];
            return (
              <Field key={e.id} label={e.label}>
                <div className="rating10">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      className="rating10__btn"
                      data-selected={v === i}
                      onClick={() => setExtra(e.id)(v === i ? null : i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </Field>
            );
          }
          return null;
        })}

        {task.kind !== 'probes-table' && (
          <Field label={task.kind === 'reflection' ? 'Resposta / reflexão' : 'Resposta / anotação da pergunta aberta'}>
            <textarea
              className="textarea"
              value={state.answer}
              onChange={setField('answer')}
              placeholder="Transcreva ao máximo as palavras do participante."
              rows={4}
            />
          </Field>
        )}

        {(task.probes || []).map(p => {
          const ps = state.probes[p.id] || { applied: false, answer: '' };
          return (
            <div key={p.id} className="probe">
              <div className="probe__head">
                <div className="probe__trig">Probe — [{p.trigger}]</div>
                <button
                  className="probe__check"
                  data-applied={ps.applied}
                  onClick={() => setProbe(p.id, 'applied')(!ps.applied)}
                >
                  <Icon name={ps.applied ? 'check' : 'plus'} size={11} />
                  {ps.applied ? 'Aplicado' : 'Aplicar'}
                </button>
              </div>
              <div className="probe__q"><em>"</em>{p.q}<em>"</em></div>
              {ps.applied && (
                <textarea
                  className="textarea probe__answer"
                  value={ps.answer}
                  onChange={setProbe(p.id, 'answer')}
                  placeholder="Resposta do participante a este probe"
                  rows={2}
                />
              )}
            </div>
          );
        })}

        {task.kind === 'probes-table' && (
          <Field label="Probes universais — marque os que aplicou e anote a resposta">
            <div className="probes-table">
              {(task.universalProbes || []).map(p => {
                const ps = state.universal[p.id] || { applied: false, answer: '' };
                return (
                  <div key={p.id} className="probes-table__row" data-applied={ps.applied}>
                    <button
                      className="probes-table__check"
                      data-applied={ps.applied}
                      onClick={() => setUniversal(p.id, 'applied')(!ps.applied)}
                      title={ps.applied ? 'Desmarcar' : 'Marcar como aplicado'}
                    >
                      {ps.applied && <Icon name="check" size={13} />}
                    </button>
                    <div className="probes-table__meta">
                      <div className="probes-table__trig">{p.trigger}</div>
                      <div className="probes-table__q"><em>"</em>{p.q}<em>"</em></div>
                    </div>
                    <textarea
                      className="textarea"
                      placeholder="Anotação"
                      rows={2}
                      value={ps.answer}
                      onChange={setUniversal(p.id, 'answer')}
                    />
                  </div>
                );
              })}
            </div>
          </Field>
        )}

        {showObs && (
          <Field label="Erros ou dificuldades observadas">
            <textarea
              className="textarea"
              value={state.observations}
              onChange={setField('observations')}
              placeholder="Hesitação, clique errado, dúvida verbal, frustração…"
              rows={2}
            />
          </Field>
        )}

        {showQuote && (
          <Field label="Citação direta do usuário">
            <textarea
              className="textarea"
              value={state.quote}
              onChange={setField('quote')}
              placeholder='Transcreva literal. Ex.: "Achei que era só uma tela de status, não dava pra clicar."'
              rows={2}
              style={{ fontStyle: 'italic' }}
            />
          </Field>
        )}
      </div>
    </section>
  );
}

// ---------------- Synthesis ----------------
function SynthesisCard({ synthesis, patch }) {
  return (
    <section className="card card--task" id="anchor-synthesis">
      <div className="card__head">
        <div>
          <div className="card__num"><Icon name="pencil-line" size={12} /> Encerramento</div>
          <h2 className="card__title">Anotações gerais</h2>
        </div>
      </div>
      <div className="field-stack">
        <Field label="Anotações livres" hint="Observações, padrões, citações, próximos passos — anote o que for relevante.">
          <textarea
            className="textarea"
            rows={10}
            value={synthesis.fluidity || ''}
            onChange={(e) => patch(['synthesis', 'fluidity'], e.target.value)}
            placeholder="Use esse espaço livremente para registrar o que observou durante a sessão..."
          />
        </Field>
      </div>
    </section>
  );
}

function ModeratorNotesCard({ notes, checklist, patch }) {
  return null;
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label className="field__label">{label}</label>
      {children}
      {hint && <div className="field__hint">{hint}</div>}
    </div>
  );
}

function RadioRow({ value, options, onChange }) {
  return (
    <div className="radio-row">
      {options.map(o => (
        <button
          key={o}
          className="radio-chip"
          data-selected={value === o}
          onClick={() => onChange(value === o ? '' : o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { Editor, HeaderCard, TaskCard, SynthesisCard, ModeratorNotesCard, Field, RadioRow });
