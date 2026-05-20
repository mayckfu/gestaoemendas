# Plano da Laura IA Evolutiva

## Objetivo

Transformar a Laura em uma assistente mais confiavel, util e contextual para a gestao de emendas parlamentares, com capacidade de:

- responder usando dados atuais do Supabase;
- manter historico de conversas;
- guardar preferencias e regras aprendidas;
- sugerir proximas acoes;
- operar com fallback entre APIs de IA;
- evoluir com seguranca, sem alterar dados ou codigo sem autorizacao.

## Ideia central

A Laura nao "aprende" automaticamente dentro do modelo Gemini/OpenRouter a cada conversa. Modelos de API nao mudam seu conhecimento interno com o uso normal.

O jeito correto de fazer a Laura evoluir e criar uma memoria propria no sistema:

```txt
Usuario conversa
->
Laura responde
->
Sistema identifica aprendizados uteis
->
Aprendizados sao salvos no Supabase
->
Na proxima conversa, Laura recupera essas memorias
->
Resposta fica mais personalizada e inteligente
```

Ou seja: a evolucao acontece no banco de dados e na arquitetura da aplicacao, nao dentro do modelo em si.

## O que a Laura pode aprender

### Preferencias do usuario

Exemplos:

- prefere respostas curtas;
- quer valores agrupados por ano;
- prefere linguagem executiva;
- quer alertas de risco no inicio da resposta;
- costuma analisar primeiro emendas com maior valor.

### Regras internas de gestao

Exemplos:

- status `AGUARDANDO_AUTORIZACAO_FNS` deve ser tratado como gargalo;
- emenda paga com pendencia deve entrar em alerta;
- propostas sem portaria devem aparecer como prioridade de acompanhamento;
- para `INCREMENTO_MAC`, sugerir conferencia de documentacao tecnica.

### Correcoes e sinonimos

Exemplos:

- "MAC" significa `INCREMENTO_MAC` ou `CUSTEIO_MAC`, dependendo do contexto;
- nomes de parlamentares podem aparecer com abreviacoes;
- "paga" pode corresponder a `PROPOSTA_PAGA`, `PAGA` ou status similar;
- "FNS" deve ser interpretado como Fundo Nacional de Saude.

### Historico util

Exemplos:

- decisoes tomadas em conversas anteriores;
- perguntas frequentes;
- pendencias que o usuario pediu para acompanhar;
- comparativos usados em reunioes;
- conclusoes importantes geradas pela Laura.

## O que a Laura nao deve fazer sozinha

Para seguranca, a Laura nao deve:

- alterar emendas sem confirmacao;
- apagar registros;
- criar usuarios;
- mudar permissoes;
- editar codigo do sistema automaticamente em producao;
- gravar qualquer conversa inteira como "verdade";
- inventar regras internas sem aprovacao do usuario.

Ela pode sugerir mudancas. A aplicacao deve pedir confirmacao antes de salvar ou executar algo importante.

## Arquitetura recomendada

```txt
Frontend React
  ChatWidget
    ->
Supabase Edge Function
  laura-chat
    ->
Busca dados atuais:
  emendas
  memorias da Laura
  historico recente
  preferencias do usuario
    ->
Chama IA principal:
  Gemini 2.5 Flash
    -> se falhar
Chama fallback:
  OpenRouter ou Groq
    ->
Retorna resposta para o frontend
    ->
Opcionalmente salva conversa e aprendizados
```

## Por que usar Supabase Edge Function

Hoje, quando a chave esta em `VITE_GEMINI_API_KEY`, ela fica exposta no navegador. Funciona, mas nao e o ideal para producao.

Com Edge Function:

- a chave da IA fica protegida em Supabase Secrets;
- o frontend nao conversa diretamente com Gemini/OpenRouter;
- da para implementar fallback entre APIs;
- da para centralizar logs e erros;
- da para aplicar regras de seguranca;
- da para salvar memoria e historico no mesmo fluxo.

## Tabelas sugeridas

### `laura_conversations`

Guarda historico de mensagens.

```sql
create table public.laura_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

Uso:

- recuperar ultimas conversas;
- auditar respostas;
- entender duvidas frequentes;
- melhorar contexto sem depender apenas da aba aberta.

### `laura_memories`

Guarda aprendizados permanentes.

```sql
create table public.laura_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  content text not null,
  source_message_id uuid null references public.laura_conversations(id) on delete set null,
  importance integer not null default 3 check (importance between 1 and 5),
  status text not null default 'active' check (status in ('active', 'archived', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Tipos possiveis:

- `preference`;
- `rule`;
- `synonym`;
- `decision`;
- `follow_up`;
- `correction`.

### `laura_learning_suggestions`

Guarda sugestoes de aprendizado antes de virarem memoria permanente.

```sql
create table public.laura_learning_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  suggested_type text not null,
  suggested_content text not null,
  reason text null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null
);
```

Isso permite que a Laura diga:

```txt
Posso guardar como preferencia que voce quer priorizar emendas pagas com pendencia?
```

So depois da confirmacao isso vira memoria ativa.

## Fluxo de aprendizado seguro

### 1. Aprendizado explicito

Quando o usuario escrever:

```txt
Laura, lembre que...
Laura, considere sempre...
Laura, quando eu disser X, entenda Y...
```

A Laura salva ou sugere salvar uma memoria.

### 2. Aprendizado sugerido

Quando a Laura perceber um padrao, ela pode perguntar:

```txt
Percebi que voce costuma analisar primeiro as emendas com pendencia. Quer que eu use isso como prioridade nas proximas respostas?
```

Se o usuario aprovar, salva.

### 3. Aprendizado automatico limitado

Pode salvar automaticamente apenas dados de baixo risco, por exemplo:

- preferencia de formato;
- idioma;
- tamanho de resposta;
- ultimos filtros usados.

Nao deve salvar automaticamente regras de negocio, decisoes ou alteracoes operacionais.

## Fluxo de resposta da Laura

Para cada pergunta:

1. Validar usuario autenticado.
2. Buscar emendas relevantes.
3. Buscar memorias ativas do usuario.
4. Buscar historico recente.
5. Montar resumo dos dados.
6. Montar prompt com regras, memorias e contexto.
7. Chamar Gemini.
8. Se falhar, chamar fallback.
9. Salvar pergunta e resposta.
10. Detectar possivel aprendizado.
11. Retornar resposta ao usuario.

## Prompt base sugerido

```txt
Voce e a Laura, assistente de IA especialista em gestao publica e emendas parlamentares.

Use apenas os dados fornecidos para afirmar fatos sobre emendas.
Use as memorias do usuario como preferencias e regras internas, mas nunca como substituto dos dados reais.
Se houver conflito entre memoria e dados atuais, priorize os dados atuais e avise o usuario.
Nao invente valores, datas, portarias, nomes ou situacoes.
Quando a pergunta envolver risco, prioridade ou gargalo, explique o criterio usado.
Quando a pergunta indicar uma preferencia nova, sugira salvar como memoria.
Quando a resposta depender de dados ausentes, diga qual dado falta.
```

## Fallback entre APIs

Ordem recomendada:

```txt
1. Gemini 2.5 Flash
2. OpenRouter modelo gratuito
3. Groq modelo gratuito
4. Mensagem amigavel de indisponibilidade
```

Exemplo de resposta final se todas falharem:

```txt
Nao consegui acessar a IA agora. Os dados do sistema continuam disponiveis, mas a analise automatica esta temporariamente indisponivel. Tente novamente em alguns instantes.
```

## Painel de memorias

Criar uma tela administrativa ou item no perfil do usuario:

```txt
Configuracoes da Laura
```

Funcionalidades:

- ver memorias salvas;
- editar memoria;
- arquivar memoria;
- aprovar sugestoes pendentes;
- apagar historico antigo;
- definir estilo de resposta;
- ativar/desativar aprendizado automatico limitado.

## Laura modificando coisas no sistema

E possivel fazer a Laura executar acoes, mas deve ser por etapas e com confirmacao.

### Nivel 1: leitura

Ela apenas responde perguntas.

Exemplo:

```txt
Quais emendas estao com maior risco?
```

### Nivel 2: sugestao

Ela sugere uma acao.

Exemplo:

```txt
Sugiro revisar as 3 emendas com status aguardando FNS e maior valor.
```

### Nivel 3: preparacao

Ela prepara uma acao, mas nao executa.

Exemplo:

```txt
Posso montar uma lista de acompanhamento para essas emendas. Deseja criar?
```

### Nivel 4: execucao com confirmacao

Ela executa apenas depois do usuario confirmar.

Exemplo:

```txt
Confirmar criacao de 3 pendencias de acompanhamento?
```

### Nivel 5: automacao controlada

Somente para acoes seguras e reversiveis.

Exemplo:

- criar rascunho de relatorio;
- criar lembrete;
- marcar memoria como arquivada;
- gerar resumo semanal.

## Laura modificando codigo

Tecnicamente seria possivel criar um fluxo onde a Laura sugere melhorias no sistema e abre tarefas ou pull requests.

Mas ela nao deve alterar codigo em producao sozinha.

Fluxo seguro:

```txt
Laura identifica melhoria
->
Cria sugestao em tabela laura_system_suggestions
->
Administrador aprova
->
Desenvolvedor ou agente de codigo implementa
->
Build/testes
->
Deploy
```

Tabela opcional:

```sql
create table public.laura_system_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null,
  area text null,
  priority text not null default 'medium',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## Fases de implementacao

### Fase 1: Edge Function da Laura

Objetivo:

- mover chamada da IA para Supabase Edge Function;
- proteger chave;
- manter resposta atual funcionando.

Entregas:

- `supabase/functions/laura-chat/index.ts`;
- frontend usando `supabase.functions.invoke('laura-chat')`;
- secrets no Supabase:
  - `GEMINI_API_KEY`;
  - `GEMINI_MODEL`;
  - `OPENROUTER_API_KEY`, opcional.

### Fase 2: fallback de IA

Objetivo:

- reduzir erros quando Gemini falhar.

Entregas:

- tentativa principal com Gemini;
- fallback com OpenRouter ou Groq;
- mensagem amigavel quando todas falharem;
- logs de erro sem expor chaves.

### Fase 3: historico de conversas

Objetivo:

- Laura entender conversas anteriores mesmo depois de atualizar a pagina.

Entregas:

- tabela `laura_conversations`;
- salvamento de pergunta/resposta;
- recuperacao das ultimas mensagens por usuario.

### Fase 4: memoria permanente

Objetivo:

- Laura lembrar preferencias, regras e correcoes.

Entregas:

- tabela `laura_memories`;
- comando "Laura, lembre que...";
- busca de memorias ativas no prompt.

### Fase 5: sugestoes de aprendizado

Objetivo:

- Laura propor aprendizados, mas pedir confirmacao.

Entregas:

- tabela `laura_learning_suggestions`;
- fluxo de aprovar/rejeitar;
- mensagens de confirmacao no chat.

### Fase 6: painel da Laura

Objetivo:

- usuario controlar o que a Laura sabe.

Entregas:

- tela de memorias;
- editar/arquivar memorias;
- limpar historico;
- configurar estilo de resposta.

### Fase 7: acoes assistidas

Objetivo:

- Laura ajudar a operar o sistema, com confirmacao.

Entregas:

- criar lembretes;
- gerar relatorios;
- sugerir pendencias;
- preparar acompanhamento de emendas;
- registrar decisoes.

## Riscos e cuidados

### Privacidade

Nao salvar dados sensiveis sem necessidade.

### Alucinacao

Laura deve sempre diferenciar:

- dados reais do sistema;
- memorias/preferencias;
- sugestoes;
- inferencias.

### Memorias erradas

Toda memoria deve poder ser editada, arquivada ou apagada.

### Custo e limite de API

Implementar:

- limite por usuario;
- fallback;
- cache de resumo;
- mensagens amigaveis.

### Seguranca

Nunca expor:

- `GEMINI_API_KEY`;
- `OPENROUTER_API_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- tokens de usuario.

## Decisao recomendada

Implementar primeiro:

1. `laura-chat` como Supabase Edge Function.
2. Fallback Gemini -> OpenRouter.
3. Historico de conversas.
4. Memoria permanente com comando explicito "Laura, lembre que...".

Depois evoluir para sugestoes automaticas e acoes assistidas.

## Resumo final

Sim, a Laura pode evoluir como uma IA mais inteligente dentro do sistema.

Mas o caminho seguro nao e deixar o modelo se modificar sozinho. O caminho correto e dar a ela:

- memoria no Supabase;
- historico de conversas;
- regras aprovadas;
- fallback de API;
- painel para o usuario controlar o aprendizado;
- permissoes claras para qualquer acao.

Assim ela passa a se comportar como uma assistente que aprende com o uso, sem perder controle, seguranca e confiabilidade.
