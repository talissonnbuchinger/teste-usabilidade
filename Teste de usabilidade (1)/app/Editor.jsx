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
            <span className="nav-item__n"><Icon name="sparkles" size={12} /></span>
            <span className="nav-item__title">Síntese</span>
          </button>
          <button
            className="nav-item"
            data-active={activeAnchor === 'mod-notes'}
            onClick={() => scrollTo('mod-notes')}
          >
            <span className="nav-item__n"><Icon name="pencil-line" size={12} /></span>
            <span className="nav-item__title">Notas do moderador</span>
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
  const setFriction = (idx, field) => (e) => {
    const arr = synthesis.frictions.slice();
    arr[idx] = { ...arr[idx], [field]: e.target ? e.target.value : e };
    patch(['synthesis', 'frictions'], arr);
  };
  const addFriction = () => {
    patch(['synthesis', 'frictions'], [...synthesis.frictions, { where: '', what: '', severity: '' }]);
  };
  const removeFriction = (idx) => {
    patch(['synthesis', 'frictions'], synthesis.frictions.filter((_, i) => i !== idx));
  };

  const setList = (field) => (idx) => (e) => {
    const arr = (synthesis[field] || []).slice();
    arr[idx] = e.target ? e.target.value : e;
    patch(['synthesis', field], arr);
  };
  const addListItem = (field) => () => {
    patch(['synthesis', field], [...(synthesis[field] || []), '']);
  };

  const setRec = (idx, field) => (e) => {
    const arr = synthesis.recommendations.slice();
    arr[idx] = { ...arr[idx], [field]: e.target ? e.target.value : e };
    patch(['synthesis', 'recommendations'], arr);
  };
  const addRec = () => {
    patch(['synthesis', 'recommendations'], [...synthesis.recommendations, { priority: '', text: '', origin: '' }]);
  };
  const removeRec = (idx) => {
    patch(['synthesis', 'recommendations'], synthesis.recommendations.filter((_, i) => i !== idx));
  };

  return (
    <section className="card card--task" id="anchor-synthesis">
      <div className="card__head">
        <div>
          <div className="card__num"><Icon name="sparkles" size={12} /> Síntese</div>
          <h2 className="card__title">Síntese da sessão</h2>
        </div>
      </div>

      <div className="field-stack">
        <Field label="Pontos de atrito" hint="Fricções, rupturas de modelo mental, erros.">
          <div className="frictions-table">
            {synthesis.frictions.map((f, i) => (
              <div key={i} className="friction-row">
                <input className="input" placeholder={`Onde (tarefa ${i + 1})`} value={f.where} onChange={setFriction(i, 'where')} />
                <input className="input" placeholder="O que aconteceu" value={f.what} onChange={setFriction(i, 'what')} />
                <select className="select" value={f.severity} onChange={setFriction(i, 'severity')}>
                  <option value="">Severidade…</option>
                  <option>Baixa</option><option>Média</option><option>Alta</option><option>Crítica</option>
                </select>
                <button className="btn btn--ghost btn--sm btn--icon" onClick={() => removeFriction(i)} title="Remover">
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
            <button className="btn btn--outline btn--sm" onClick={addFriction} style={{ alignSelf: 'flex-start' }}>
              <Icon name="plus" size={13} /> Adicionar atrito
            </button>
          </div>
        </Field>

        <Field label="Momentos de fluidez" hint="O que funcionou, o que foi natural.">
          <textarea className="textarea" rows={3} value={synthesis.fluidity} onChange={(e) => patch(['synthesis', 'fluidity'], e.target.value)} />
        </Field>

        <Field label="Itens da Mesa que o usuário sentiu falta">
          <textarea className="textarea" rows={3} value={synthesis.missingFromMesa} onChange={(e) => patch(['synthesis', 'missingFromMesa'], e.target.value)} />
        </Field>

        <Field label="Modelo mental observado" hint="Como o usuário descreveu o novo ambiente, com as palavras dele.">
          <textarea className="textarea" rows={3} value={synthesis.mentalModel} onChange={(e) => patch(['synthesis', 'mentalModel'], e.target.value)} />
        </Field>

        <Field label="Citações-chave da sessão" hint="Para insights / decks. Literais.">
          <div className="list-input">
            {synthesis.keyQuotes.map((q, i) => (
              <div key={i} className="list-input__row">
                <span className="list-input__n"><Icon name="quote" size={11} /></span>
                <input className="input" style={{ fontStyle: 'italic' }} value={q} onChange={setList('keyQuotes')(i)} placeholder="Citação literal" />
              </div>
            ))}
            <button className="btn btn--ghost btn--sm" onClick={addListItem('keyQuotes')} style={{ alignSelf: 'flex-start' }}>
              <Icon name="plus" size={13} /> Adicionar citação
            </button>
          </div>
        </Field>

        <Field label="Próximos passos / hipóteses">
          <div className="list-input">
            {synthesis.nextSteps.map((q, i) => (
              <div key={i} className="list-input__row">
                <span className="list-input__n">{i + 1}</span>
                <input className="input" value={q} onChange={setList('nextSteps')(i)} placeholder="Próximo passo" />
              </div>
            ))}
            <button className="btn btn--ghost btn--sm" onClick={addListItem('nextSteps')} style={{ alignSelf: 'flex-start' }}>
              <Icon name="plus" size={13} /> Adicionar passo
            </button>
          </div>
        </Field>

        <Field label="Recomendações imediatas">
          <div className="frictions-table">
            {synthesis.recommendations.map((r, i) => (
              <div key={i} className="friction-row">
                <select className="select" value={r.priority} onChange={setRec(i, 'priority')}>
                  <option value="">Prioridade…</option>
                  <option>Alta</option><option>Média</option><option>Baixa</option>
                </select>
                <input className="input" placeholder="Recomendação" value={r.text} onChange={setRec(i, 'text')} />
                <input className="input" placeholder="Origem (tarefa)" value={r.origin} onChange={setRec(i, 'origin')} />
                <button className="btn btn--ghost btn--sm btn--icon" onClick={() => removeRec(i)} title="Remover">
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
            <button className="btn btn--outline btn--sm" onClick={addRec} style={{ alignSelf: 'flex-start' }}>
              <Icon name="plus" size={13} /> Adicionar recomendação
            </button>
          </div>
        </Field>
      </div>
    </section>
  );
}

// ---------------- Moderator notes + checklist ----------------
function ModeratorNotesCard({ notes, checklist, patch }) {
  const items = [
    ['thanked', 'Agradeci o participante'],
    ['nextSteps', 'Confirmei próximos passos / incentivo (se aplicável)'],
    ['recordingSaved', 'Gravação salva e renomeada'],
    ['notesReviewed', 'Anotações revisadas a quente (até 30 min após)'],
    ['quotesTranscribed', 'Citações transcritas literais (sem paráfrase)'],
    ['synthesisFilled', 'Síntese preenchida'],
    ['insightsConsolidated', 'Insights levados para a planilha / board'],
  ];

  return (
    <section className="card card--task" id="anchor-mod-notes">
      <div className="card__head">
        <div>
          <div className="card__num"><Icon name="pencil-line" size={12} /> Moderador</div>
          <h2 className="card__title">Observações & encerramento</h2>
        </div>
      </div>

      <div className="field-stack">
        <Field label="Comportamento e linguagem corporal">
          <textarea className="textarea" rows={3} value={notes.behavior} onChange={e => patch(['moderatorNotes', 'behavior'], e.target.value)} />
        </Field>
        <Field label="Padrões observados" hint="Hesitação, dúvida, frustração, surpresa, alívio.">
          <textarea className="textarea" rows={3} value={notes.patterns} onChange={e => patch(['moderatorNotes', 'patterns'], e.target.value)} />
        </Field>
        <Field label="Aspectos a revisar no próprio roteiro" hint="Perguntas confusas, ordem, vieses.">
          <textarea className="textarea" rows={3} value={notes.scriptReview} onChange={e => patch(['moderatorNotes', 'scriptReview'], e.target.value)} />
        </Field>
        <Field label="Notas livres">
          <textarea className="textarea" rows={4} value={notes.freeNotes} onChange={e => patch(['moderatorNotes', 'freeNotes'], e.target.value)} />
        </Field>

        <hr className="divider" />

        <div>
          <div className="section-title">Checklist de encerramento</div>
          <div className="checklist">
            {items.map(([k, label]) => {
              const checked = !!checklist[k];
              return (
                <label key={k} className="checklist__item" data-checked={checked}>
                  <button
                    className="checklist__box"
                    data-checked={checked}
                    onClick={() => patch(['checklist', k], !checked)}
                    aria-label={label}
                  >
                    {checked && <Icon name="check" size={12} />}
                  </button>
                  {label}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------- Field wrapper + radio ----------------
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
