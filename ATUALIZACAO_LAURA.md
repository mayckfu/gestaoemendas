# Atualizacao Laura

## Objetivo

Fazer a Laura evoluir de uma assistente que apenas consulta dados atuais para uma assistente com memoria, aprendizado controlado e melhor capacidade de apoiar a gestao de emendas parlamentares.

Hoje a Laura ja consegue responder usando dados das emendas e o historico recente da conversa. O proximo passo e permitir que ela lembre preferencias, regras, correcoes e decisoes importantes entre conversas.

## Situacao atual

- A Laura chama a Edge Function `laura-chat`.
- A funcao busca emendas no Supabase e monta um contexto para o Gemini.
- O prompt orienta a Laura a nao inventar dados e responder com base no contexto.
- O frontend envia apenas o historico recente do chat aberto.
- As tabelas de memoria ja existem no banco:
  - `laura_conversations`
  - `laura_memories`
  - `laura_learning_suggestions`

## O que falta para a Laura aprender

### 1. Identificar o usuario na Edge Function

A funcao `laura-chat` precisa descobrir o usuario autenticado usando o token recebido no header `Authorization`.

Isso e necessario para salvar e buscar memorias separadas por usuario.

### 2. Salvar conversas

Cada mensagem importante deve ser gravada em `laura_conversations`.

Salvar:

- mensagem do usuario;
- resposta da Laura;
- metadados uteis, como modelo usado, data, origem da resposta e quantidade de emendas no contexto.

### 3. Buscar memorias antes de responder

Antes de chamar o Gemini, a Laura deve consultar `laura_memories` com:

- `user_id` do usuario atual;
- `status = active`;
- ordenacao por `importance` e `created_at`.

Essas memorias devem entrar no `systemPrompt` em uma secao propria.

Exemplo:

```text
MEMORIAS DO USUARIO:
- Quando o usuario disser MAC, interpretar como propostas de Media e Alta Complexidade.
- O usuario prefere respostas curtas com acao recomendada no final.
```

### 4. Criar comando explicito de aprendizado

A Laura deve reconhecer frases como:

```text
Laura, lembre que...
Laura, considere sempre...
Laura, quando eu disser X, entenda Y...
```

Quando detectar esse padrao, a funcao deve salvar uma memoria em `laura_memories`.

Tipos possiveis:

- `preference`
- `rule`
- `synonym`
- `decision`
- `follow_up`
- `correction`

### 5. Confirmar aprendizado ao usuario

Depois de salvar uma memoria, a Laura deve responder de forma simples:

```text
Entendido. Vou lembrar disso nas proximas conversas.
```

Se nao conseguir salvar, deve avisar:

```text
Entendi a instrucao, mas nao consegui salvar essa memoria agora.
```

### 6. Sugerir aprendizados

Depois da memoria explicita estar funcionando, a Laura pode sugerir aprendizados.

Exemplo:

```text
Percebi que voce costuma tratar propostas MAC separadamente das PAP. Quer que eu lembre essa preferencia?
```

Essas sugestoes devem ser salvas em `laura_learning_suggestions` com status `pending`.

### 7. Criar painel de memorias

Criar uma tela administrativa ou uma secao no perfil do usuario para gerenciar o que a Laura sabe.

Funcoes esperadas:

- listar memorias ativas;
- editar texto da memoria;
- alterar importancia;
- arquivar memoria;
- excluir memoria;
- aprovar ou rejeitar sugestoes de aprendizado.

### 8. Diferenciar dados oficiais de memorias

A Laura deve deixar claro quando esta usando:

- dados oficiais do sistema;
- memoria/preferencia do usuario;
- inferencia gerada pela propria analise.

Regra importante:

Memorias nao podem substituir dados oficiais de emendas, valores, status ou datas.

## Tutorial: como criar um cerebro forte e economico para a Laura

O objetivo nao e mandar tudo para a IA em toda pergunta. Isso gasta muitos tokens e pode deixar a resposta mais lenta.

O ideal e criar um "cerebro" em camadas:

1. Memoria curta: conversa recente.
2. Memoria permanente: preferencias, regras, sinonimos e decisoes.
3. Conhecimento do sistema: resumo das emendas, status, pendencias e dados oficiais.
4. Busca inteligente: trazer somente os dados que combinam com a pergunta.
5. Resumos consolidados: tabelas prontas com totais e indicadores para nao recalcular tudo no prompt.

### Camada 1: memoria curta

Serve para a Laura entender o assunto atual da conversa.

Como fazer:

- usar no maximo as ultimas 6 a 10 mensagens;
- remover mensagens repetidas ou muito longas;
- resumir conversas grandes antes de enviar para a IA;
- guardar o resumo em `laura_conversations.metadata`.

Exemplo de resumo:

```text
Resumo da conversa: usuario esta analisando emendas MAC de 2026, pediu foco em pendencias de pagamento e prefere respostas objetivas.
```

Isso evita mandar a conversa inteira para o Gemini toda vez.

### Camada 2: memoria permanente

Serve para coisas que a Laura deve lembrar sempre.

Tipos mais importantes:

- `preference`: como o usuario prefere receber respostas;
- `rule`: regra de trabalho definida pelo usuario;
- `synonym`: significado de siglas e apelidos;
- `decision`: decisao tomada que deve ser respeitada;
- `correction`: correcao feita pelo usuario;
- `follow_up`: acompanhamento pendente.

Boas memorias devem ser curtas, claras e reutilizaveis.

Memoria ruim:

```text
O usuario falou bastante sobre MAC hoje e parecia preocupado.
```

Memoria boa:

```text
Quando o usuario disser MAC, interpretar como propostas de Media e Alta Complexidade.
```

### Camada 3: cerebro de informacoes do sistema

A Laura nao deve receber todas as emendas completas em toda pergunta.

Criar resumos internos para ela consultar:

- total de emendas por ano;
- total por parlamentar;
- total por status interno;
- total por situacao oficial;
- total por tipo de recurso;
- emendas com pendencias;
- emendas proximas de vencimento;
- maiores valores;
- propostas sem documentacao;
- gargalos por fase.

Esses resumos podem ficar em views, funcoes SQL ou tabelas atualizadas periodicamente.

Sugestao de estrutura:

```sql
create table public.laura_knowledge_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  scope text not null,
  title text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Exemplos de `scope`:

- `global_summary`
- `year_summary`
- `parliamentarian_summary`
- `pending_summary`
- `financial_summary`
- `risk_summary`

Assim a Laura recebe um resumo pequeno em vez de centenas de registros completos.

### Camada 4: busca inteligente antes da IA

Antes de chamar o Gemini, a Edge Function deve entender a intencao da pergunta.

Exemplos:

- Pergunta sobre "2026": buscar dados de 2026.
- Pergunta sobre "MAC": usar memoria de sinonimo e filtrar propostas MAC.
- Pergunta sobre "pendentes": buscar status internos relacionados a pendencia.
- Pergunta sobre um parlamentar: filtrar pelo nome do parlamentar.
- Pergunta geral: usar resumo consolidado, nao registros completos.

Regra de economia:

Enviar para a IA apenas o minimo necessario para responder bem.

### Camada 5: busca semantica com embeddings

Para deixar a memoria mais forte, vale implementar busca semantica.

Ideia:

- gerar embeddings das memorias;
- gerar embeddings de resumos importantes;
- salvar em tabelas com vetor;
- quando o usuario perguntar algo, buscar memorias e conhecimentos parecidos com a pergunta.

Isso faz a Laura encontrar informacoes pelo significado, nao apenas por palavra exata.

Exemplo:

O usuario pergunta:

```text
Como estao aquelas propostas de alta complexidade?
```

Mesmo sem dizer `MAC`, a Laura pode encontrar a memoria:

```text
MAC significa Media e Alta Complexidade.
```

Para isso, avaliar uso de `pgvector` no Supabase.

### Camada 6: compactacao automatica de conversas

Quando uma conversa ficar grande, a Laura deve criar um resumo e usar esse resumo nas proximas respostas.

Fluxo:

1. Usuario conversa varias vezes.
2. Ao passar de um limite, por exemplo 20 mensagens, a funcao gera um resumo.
3. O resumo e salvo como mensagem `system` ou em `metadata`.
4. Nas proximas chamadas, a Laura usa o resumo e so as ultimas mensagens.

Resultado:

- menos tokens;
- mais velocidade;
- menos repeticao;
- contexto mais limpo.

### Camada 7: cache de respostas e calculos

Algumas perguntas vao se repetir.

Exemplos:

- "Qual o total de emendas de 2026?"
- "Quantas estao pendentes?"
- "Qual parlamentar tem mais valor indicado?"

Criar cache para respostas baseadas em dados que nao mudam a cada segundo.

Sugestao:

```sql
create table public.laura_query_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  question_fingerprint text not null,
  answer_data jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

A Laura pode usar cache por alguns minutos ou horas, dependendo do tipo de dado.

### Camada 8: ferramentas antes de texto livre

Sempre que a pergunta envolver numero, status, filtro, soma ou ranking, o sistema deve calcular primeiro no banco.

A IA deve receber o resultado pronto para explicar.

Exemplo ruim:

Enviar 1000 emendas para a IA e pedir que ela conte.

Exemplo bom:

O banco calcula:

```text
2026: 38 emendas pendentes, total R$ 12.400.000,00.
```

A IA apenas transforma isso em resposta clara.

Isso reduz tokens e evita erro de contagem.

## Regras de ouro para gastar menos tokens

- Nao enviar todas as emendas se a pergunta pede apenas um ano, parlamentar ou status.
- Preferir resumo SQL a lista completa.
- Enviar no maximo os registros diretamente relevantes.
- Usar historico resumido, nao conversa inteira.
- Buscar apenas memorias ativas e relacionadas a pergunta.
- Limitar memorias por importancia, por exemplo as 10 mais relevantes.
- Criar respostas estruturadas com dados calculados pelo banco.
- Guardar resumos prontos de indicadores importantes.
- Usar cache para perguntas repetidas.
- Separar raciocinio da IA de calculos exatos do sistema.

## Como a Laura deve montar o prompt ideal

O prompt deve ser pequeno e organizado.

Modelo recomendado:

```text
VOCE E:
Laura, assistente de gestao publica e emendas parlamentares.

REGRAS:
- Use dados oficiais para numeros e status.
- Use memorias apenas como preferencia, regra ou contexto.
- Se faltar dado, diga qual dado falta.

MEMORIAS RELEVANTES:
{somente memorias relacionadas a pergunta}

RESUMO OFICIAL:
{resumo calculado pelo banco}

DADOS ESPECIFICOS:
{apenas registros filtrados, quando necessario}

HISTORICO CURTO:
{ultimas mensagens ou resumo}

PERGUNTA:
{mensagem do usuario}
```

Com esse modelo, a Laura fica mais precisa e usa menos tokens.

## O que vale muito a pena implementar

Prioridade alta:

- busca de memorias ativas por usuario;
- comando `Laura, lembre que...`;
- resumo persistente de conversas longas;
- filtros SQL antes da chamada da IA;
- resumos consolidados por ano, status, parlamentar e pendencia.

Prioridade media:

- cache de perguntas frequentes;
- painel visual de memorias;
- sugestoes de aprendizado;
- classificacao automatica de intencao da pergunta.

Prioridade avancada:

- embeddings com `pgvector`;
- busca semantica de memorias;
- tabelas de conhecimento com snapshots;
- agente planejador que decide quais dados buscar antes de chamar a IA principal.

## Ordem recomendada de implementacao

### Fase 1: Memoria basica

- Atualizar `supabase/functions/laura-chat/index.ts`.
- Buscar usuario autenticado.
- Salvar mensagem do usuario.
- Buscar memorias ativas.
- Incluir memorias no prompt.
- Salvar resposta da Laura.

### Fase 2: Comando "Laura, lembre que"

- Detectar comando explicito.
- Classificar tipo da memoria.
- Salvar em `laura_memories`.
- Responder confirmando o aprendizado.

### Fase 3: Historico persistente

- Buscar ultimas conversas no banco.
- Usar historico persistente mesmo depois de atualizar a pagina.
- Limitar quantidade para nao deixar o prompt grande demais.

### Fase 4: Sugestoes de aprendizado

- Detectar correcoes e preferencias repetidas.
- Salvar sugestoes pendentes.
- Pedir confirmacao antes de transformar em memoria ativa.

### Fase 5: Painel da Laura

- Criar tela de memorias.
- Criar tela de sugestoes.
- Permitir editar, arquivar e excluir.

### Fase 6: Economia de tokens

- Criar resumos consolidados de emendas.
- Filtrar dados no SQL antes de chamar a IA.
- Enviar apenas dados relevantes para a pergunta.
- Criar compactacao automatica de historico.
- Limitar memorias enviadas ao prompt.

### Fase 7: Cerebro de informacoes

- Criar `laura_knowledge_snapshots`.
- Salvar resumos por ano, parlamentar, status e risco.
- Atualizar snapshots quando dados importantes mudarem.
- Usar snapshots no prompt em vez de listas completas.

### Fase 8: Busca semantica avancada

- Avaliar `pgvector`.
- Criar embeddings para memorias.
- Criar embeddings para snapshots.
- Buscar informacoes por significado.
- Usar somente os resultados mais relevantes no prompt.

## Criterios de sucesso

A Laura sera considerada capaz de aprender quando:

- lembrar instrucoes entre conversas diferentes;
- respeitar preferencias do usuario;
- reconhecer sinonimos definidos pelo usuario;
- registrar correcoes importantes;
- permitir revisar e apagar memorias;
- nao misturar memoria pessoal com dado oficial do sistema;
- responder usando menos contexto bruto;
- consultar resumos e filtros antes de chamar a IA;
- reduzir custo de tokens sem perder qualidade;
- encontrar memorias relevantes mesmo quando o usuario usa palavras diferentes.

## Primeiro teste esperado

Usuario pergunta:

```text
Laura, lembre que quando eu disser MAC estou falando de propostas de Media e Alta Complexidade.
```

Laura responde:

```text
Entendido. Vou lembrar disso nas proximas conversas.
```

Em outra conversa, usuario pergunta:

```text
Quantas MAC estao pendentes?
```

Laura deve entender `MAC` usando a memoria salva e responder com base nos dados oficiais disponiveis.
