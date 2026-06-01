/* eslint-disable */
// Roteiro completo do teste — Elite · Migração do novo ambiente de preparação
// Cada tarefa pode declarar:
//   prompt      — enunciado lido ao usuário (obrigatório)
//   hasResult   — exibe radio Sucesso/Parcial/Falha (default true)
//   hasObs      — exibe campo "Erros ou dificuldades observadas" (default true)
//   hasQuote    — exibe campo "Citação direta" (default true)
//   pathSteps   — número de campos numerados para caminho percorrido (0 = nenhum)
//   probes      — [{ id, trigger, q }]
//   extras      — campos especializados ('radio', 'list', 'rating10', 'yesno')
//   kind        — 'task' (padrão) | 'reflection' | 'rating' | 'probes-table'

window.SESSION_TASKS = [
  {
    id: 't1', n: 1, title: 'Rotina de estudo atual',
    prompt: 'Me conta como é a sua rotina de estudo hoje na plataforma? O que você abre primeiro quando entra? O que você usa com frequência, o que você raramente toca?',
    hasResult: false,
    hasObs: false,
    hasQuote: false,
  },

  {
    id: 't2', n: 2, title: 'Primeiro contato com o novo ambiente',
    prompt: 'Primeiro contato com o novo ambiente — o que você está vendo?',
    extras: [
      { id: 'firstElements', type: 'list', label: 'Primeiros elementos que o usuário citou (em ordem)', rows: 3, placeholder: 'Ex.: card de progresso, banner do curso, menu lateral…' },
    ],
  },
  {
    id: 't3', n: 3, title: 'Leitura de intenção da tela',
    prompt: 'O que essa tela parece querer te dizer?',
    probes: [
      { id: 'p1', trigger: 'Se não comparar espontaneamente com a Mesa', q: 'O que é diferente do que você estava esperando encontrar?' },
    ],
  },

  {
    id: 't4', n: 4, title: 'Assistir a próxima aula do curso',
    prompt: 'Você quer assistir a próxima aula do seu curso. Como você faria isso aqui?',
    pathSteps: 4,
    probes: [
      { id: 'p1', trigger: 'Se for direto para o curso esperando encontrar abas', q: 'O que você esperava encontrar quando entrou no curso?' },
      { id: 'p2', trigger: 'Quando perceber que não tem abas', q: 'O que você acha que aconteceu com as abas?' },
      { id: 'p3', trigger: 'Depois que se orientar — ou desistir', q: 'Como você se sentiu nesse momento em que não encontrou o que esperava?' },
      { id: 'p4', trigger: 'Depois que encontrar ou não encontrar', q: 'O que você acha que mudou na lógica de como acessar aulas aqui?' },
    ],
  },

  {
    id: 't5', n: 5, title: 'Entender o próprio desenvolvimento',
    prompt: 'Você precisa entender como está o seu desenvolvimento, quais disciplinas precisa estudar mais. Como faria isso?',
    pathSteps: 3,
  },
  {
    id: 't6', n: 6, title: 'Leitura do diagnóstico (geral vs. específico)',
    prompt: 'Esse diagnóstico que você está vendo — você acha que é geral ou específico do seu curso? Qual a leitura que você faz desses dados?',
    extras: [
      { id: 'leitura', type: 'radio', label: 'Leitura do usuário', options: ['Geral', 'Específico do curso', 'Não soube dizer'] },
    ],
  },
  {
    id: 't7', n: 7, title: 'Comparação com outros alunos do mesmo concurso',
    prompt: 'Você quer entender como está sua preparação em relação a outros alunos que estão fazendo o mesmo concurso que você. Como você faria isso?',
    pathSteps: 2,
    probes: [
      { id: 'p1', trigger: 'Se não encontrar', q: 'Onde você tentaria procurar?' },
      { id: 'p2', trigger: 'Depois — não encontrou', q: 'Isso é algo que você sentiria falta se não existisse?' },
      { id: 'p3', trigger: 'Encontrou', q: 'Isso muda alguma coisa na forma como você pensa a sua preparação?' },
    ],
  },
  {
    id: 't8', n: 8, title: 'Acessar questões do curso',
    prompt: 'Você precisa fazer questões do seu curso. Onde você poderia acessar?',
    pathSteps: 2,
    probes: [
      { id: 'p1', trigger: 'Depois que encontrar', q: 'Por que você acha que essas questões específicas estão sendo recomendadas pra você?' },
      { id: 'p2', trigger: 'Se não conectar com o contexto do curso', q: 'Você acha que essas recomendações mudariam se você estivesse em outro curso?' },
    ],
  },
  {
    id: 't9', n: 9, title: 'Disciplinas prioritárias / peso',
    prompt: 'Você precisa saber quais as disciplinas mais prioritárias, que têm o maior peso. Como você descobriria isso aqui?',
    pathSteps: 2,
    probes: [
      { id: 'p1', trigger: 'Se encontrar', q: 'O que esse dado está te dizendo?' },
      { id: 'p2', trigger: 'Se encontrar', q: 'Como você utilizaria essa informação?' },
      { id: 'p3', trigger: 'Se não encontrar', q: 'Onde você esperaria encontrar uma informação como essa na plataforma?' },
    ],
  },
  {
    id: 't10', n: 10, title: 'Percepção da mudança (Mesa × novo ambiente)',
    prompt: 'Agora que você explorou tudo: o que você acha que mudou de verdade entre a Mesa e isso aqui?',
    kind: 'reflection',
    probes: [
      { id: 'p1', trigger: 'Se ficar na superfície', q: 'E na forma como a plataforma organiza o que você precisa fazer — o que é diferente?' },
    ],
  },
  {
    id: 't11', n: 11, title: 'O que sumiu / sentiu falta',
    prompt: 'Tem alguma coisa que você usava antes e que parece ter sumido? Algo que você sentiu falta e não achou?',
    kind: 'reflection',
    extras: [
      { id: 'missing', type: 'list', label: 'Itens citados como ausentes', rows: 4, placeholder: 'Ex.: aba de questões, atalho da Mesa…' },
    ],
  },

  {
    id: 't12', n: 12, title: 'Avaliação 0 a 10 (nova versão × Mesa)',
    prompt: 'De 0 a 10, o quanto você avaliaria essa nova versão em relação à mesa? Me explica esse número.',
    kind: 'rating',
    hasResult: false,
    extras: [
      { id: 'score', type: 'rating10', label: 'Nota atribuída' },
    ],
  },

  {
    id: 't13', n: 13, title: 'Uma mudança (só uma)',
    prompt: 'Se você pudesse mudar uma coisa agora — só uma — o que seria?',
    hasResult: false,
    hasObs: false,
  },
  {
    id: 't14', n: 14, title: 'Espaço aberto',
    prompt: 'Tem alguma coisa que você queria falar e eu não perguntei?',
    hasResult: false,
    hasObs: false,
  },

];

window.SESSION_META = {
  product: 'Elite · Migração do novo ambiente de preparação',
  type: 'Moderado',
  objective: 'Avaliar a experiência de migração dos usuários da plataforma Elite do ambiente antigo (Mesa de Estudo) para o novo ambiente de preparação, identificando rupturas de modelo mental, dificuldades de navegação e percepção da mudança.',
  profile: 'Alunos da plataforma Elite que utilizam a Mesa de Estudo e estão migrando para o novo ambiente de preparação.',
};
