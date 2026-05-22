# Plano - Laura como Cerebro Tecnico Institucional

Este plano cria a base do "segundo cerebro" da Laura no Supabase. A ideia e separar conversa bruta, memoria consolidada e banco oficial, permitindo que a Laura leia o sistema inteiro quando o usuario estiver autenticado, mas escreva apenas na propria memoria tecnica.

## Regra-matriz

Banco oficial continua sendo a fonte da verdade.

Laura pode:

- ler dados oficiais quando o usuario esta autenticado;
- consultar fatos, notas, vinculos, tags e contexto ativo;
- criar memoria tecnica propria;
- atualizar memoria propria quando o banco oficial mudar;
- marcar memoria velha como `obsoleto`;
- registrar eventos de aprendizado e auditoria;
- sugerir inferencias como `pendente_confirmacao`.

Laura nao pode:

- excluir emendas, propostas, repasses, despesas, anexos, pendencias ou historico oficial;
- alterar valores, status, CNES, portarias, datas ou documentos oficiais;
- validar inferencia como se fosse dado oficial;
- tratar historico bruto de chat como conhecimento validado;
- usar memoria antiga contra dado atualizado do banco oficial.

## Arquivos criados

Migration SQL pronta:

`supabase/migrations/20260522120000_create_laura_institutional_knowledge.sql`

Ela cria:

- `knowledge_notes`
- `knowledge_facts`
- `knowledge_fact_versions`
- `knowledge_links`
- `knowledge_tags`
- `knowledge_note_tags`
- `chat_sessions`
- `chat_messages`
- `ai_memory_events`
- `laura_active_contexts`
- `knowledge_audit_logs`
- funcoes RPC para contexto e escrita segura
- trigger para sincronizar fatos oficiais de `emendas`
- RLS e permissoes
- tags iniciais

## Tabelas do cerebro

### `knowledge_notes`

Guarda notas tecnicas, resumos, modelos, decisoes e registros consolidados.

Uso:

- resumo de proposta;
- nota sobre diligencia;
- modelo de resposta;
- regra operacional aprendida;
- relacao tecnica entre PAS/PMS/CIB/portaria/proposta.

Campos principais:

- `title`
- `slug`
- `content`
- `note_type`
- `source_type`
- `source_table`
- `source_id`
- `entity_type`
- `entity_id`
- `municipality`
- `created_by`
- `created_by_ai`
- `status`
- `confidence`
- `last_confirmed_at`
- `metadata`

Status:

- `rascunho`
- `validado`
- `pendente_confirmacao`
- `obsoleto`
- `rejeitado`

### `knowledge_facts`

Guarda fatos objetivos reutilizaveis. Ha uma restricao unica para:

`entity_type + entity_id + fact_key`

Isso impede duplicidade e faz a Laura substituir a informacao velha pela nova, sem criar varias verdades concorrentes.

Exemplo:

```sql
entity_type = 'proposta'
entity_id = '11447284000126012'
fact_key = 'valor_total'
fact_value = '390222.00'
source_type = 'banco_oficial'
source_table = 'emendas'
status = 'validado'
confidence = 1.00
```

### `knowledge_fact_versions`

Guarda historico das mudancas dos fatos.

Quando o valor, status ou fonte muda, o fato atual e atualizado em `knowledge_facts`, e o valor antigo fica preservado em `knowledge_fact_versions`.

### `knowledge_links`

Guarda relacoes entre notas, fatos e entidades.

Exemplos:

- proposta `vinculada_a` unidade;
- portaria `fundamenta` proposta;
- diligencia `responde_a` proposta;
- nota tecnica `usa_modelo_de` modelo;
- fato novo `substitui` fato antigo.

### `knowledge_tags` e `knowledge_note_tags`

Criam a logica tipo Obsidian dentro do Supabase.

Tags iniciais:

- CER
- APS
- MAC
- PAP
- CIB
- PAS
- PMS
- Diligencia
- Equipamento
- Transporte Sanitario
- Emenda Parlamentar
- Atencao Especializada
- Portaria
- CNES

### `chat_sessions` e `chat_messages`

Guardam historico bruto de chat.

Importante: isso nao e memoria validada. Serve para auditoria, continuidade e rastreio.

### `ai_memory_events`

Guarda cada evento de aprendizado da IA:

- pergunta do usuario;
- resposta da IA;
- aprendizado extraido;
- fontes consultadas;
- acao tomada;
- entidade relacionada;
- confianca.

### `laura_active_contexts`

Guarda o contexto ativo da tela.

Exemplo:

```json
{
  "active_entity_type": "proposta",
  "active_entity_id": "11447284000126012",
  "numero_proposta": "11447284000126012",
  "current_screen": "emenda_detail",
  "last_record_type": "emenda"
}
```

Com isso, perguntas como "qual valor?", "essa proposta esta em diligencia?" e "qual CNES?" priorizam o registro aberto.

### `knowledge_audit_logs`

Auditoria da memoria:

- quem alterou;
- se foi Laura, sistema ou usuario;
- tabela;
- registro;
- antes/depois;
- data.

## Estrategia de velocidade

Para Laura ficar rapida, ela nao deve procurar tudo em todos os lugares a cada pergunta. Ela deve usar uma busca em funil: primeiro o dado mais provavel e mais barato, depois fontes maiores apenas se ainda faltar informacao.

### Onde Laura deve procurar primeiro

Ordem recomendada para perguntas comuns:

1. `active_context` recebido da tela.
2. `knowledge_facts` com `status = 'validado'` e `entity_type/entity_id` do contexto ativo.
3. `knowledge_notes` vinculadas ao mesmo `entity_type/entity_id`.
4. `knowledge_links` para descobrir relacoes diretas.
5. banco oficial, mas com busca exata por `id`, `numero_proposta`, `numero_emenda`, CNES, portaria ou unidade.
6. documentos anexados, quando a pergunta exigir justificativa, CIB, PAS, PMS, oficio, parecer ou resposta de diligencia.
7. busca textual ampla apenas quando nao houver contexto ativo ou quando o usuario pedir pesquisa geral.
8. historico de chat apenas para continuidade da conversa, nunca como fonte validada.

### Regras de velocidade por tipo de pergunta

Perguntas simples e objetivas:

- "qual valor?";
- "qual unidade?";
- "qual status?";
- "qual portaria?";
- "qual parlamentar?";
- "qual objeto?";

Fluxo rapido:

1. usar `active_context`;
2. buscar o fato exato em `knowledge_facts`;
3. se o fato estiver `validado`, responder direto;
4. se estiver ausente, buscar a linha oficial em `emendas`;
5. salvar ou atualizar `knowledge_facts`;
6. responder.

Perguntas de documento oficial:

- justificativa;
- CIB;
- oficio;
- parecer;
- resposta de diligencia;
- texto para envio;
- documento administrativo.

Fluxo seguro:

1. usar `active_context`;
2. buscar fatos validados;
3. confirmar dados criticos no banco oficial;
4. buscar anexos/documentos relacionados;
5. usar notas e modelos como apoio;
6. gerar resposta citando fonte.

Perguntas abertas ou comparativas:

- "quais propostas estao em diligencia?";
- "essa diligencia parece com alguma anterior?";
- "qual gargalo principal?";
- "compare propostas parecidas";

Fluxo analitico:

1. buscar tags, notas e links relacionados;
2. buscar fatos consolidados;
3. fazer consulta oficial filtrada por ano, status, tipo, municipio ou parlamentar;
4. evitar carregar todas as emendas sem filtro;
5. se o filtro estiver ambiguo, pedir esclarecimento.

### Regras para nao ficar lenta

- Nunca carregar todas as emendas por padrao.
- Nunca mandar 1000 registros para o prompt se a pergunta fala de uma proposta especifica.
- Primeiro tentar busca exata por `numero_proposta`, `numero_emenda`, `id`, CNES ou portaria.
- Usar `limit` baixo no contexto, normalmente entre 8 e 15 itens.
- Selecionar apenas colunas necessarias para a pergunta.
- Usar `knowledge_facts` como cache tecnico de fatos oficiais ja confirmados.
- Atualizar fatos em segundo plano quando o banco oficial mudar.
- Usar `ilike` e busca textual somente depois das buscas exatas.
- Para perguntas repetidas, reaproveitar `knowledge_facts` e `knowledge_notes` antes de consultar tabelas grandes.

### Regra de ouro

Laura deve ser rapida para responder perguntas simples, mas conservadora para documentos oficiais.

Se a pergunta for simples e o fato estiver validado na memoria, ela pode responder pela memoria consolidada.

Se a resposta for usada em documento oficial ou decisao administrativa, Laura deve confirmar no banco oficial antes de responder.

## Funcoes principais

### `laura_build_context(question, active_context, limit)`

Monta o pacote de contexto do chat.

Ordem:

1. interpreta `active_context`;
2. busca `knowledge_facts` exatos e validados;
3. busca `knowledge_notes` vinculadas;
4. busca `knowledge_links` diretos;
5. busca registros oficiais em `emendas` com filtro exato;
6. se necessario, faz busca textual limitada;
7. retorna fontes, confianca, status e origem.

Exemplo:

```sql
select public.laura_build_context(
  'qual valor dessa proposta?',
  '{"numero_proposta":"11447284000126012","active_entity_type":"proposta","active_entity_id":"11447284000126012"}'::jsonb,
  10
);
```

### `laura_upsert_knowledge_fact(...)`

Permite que a Laura crie ou atualize um fato da memoria sem mexer no banco oficial.

Regra importante:

Se tentar marcar como `validado`, a fonte precisa ser `banco_oficial` ou `documento_anexado`. Caso contrario, cai para `pendente_confirmacao`.

Exemplo:

```sql
select public.laura_upsert_knowledge_fact(
  'proposta',
  '11447284000126012',
  'objeto',
  'Aquisicao de equipamentos e materiais permanentes',
  'banco_oficial',
  'emendas',
  'ID-DA-EMENDA-AQUI',
  1.00,
  'validado',
  true,
  'Confirmado na tabela oficial de emendas'
);
```

### `laura_log_memory_event(...)`

Registra o que a Laura aprendeu depois de responder.

Exemplo:

```sql
select public.laura_log_memory_event(
  null,
  'Qual valor dessa proposta?',
  'O valor da proposta e R$ 390.222,00.',
  '{"fact_key":"valor_total","fact_value":"390222.00"}'::jsonb,
  'fact',
  'proposta',
  '11447284000126012',
  true,
  'updated_fact',
  '[{"type":"banco_oficial","table":"emendas"}]'::jsonb,
  1.00
);
```

### Trigger `sync_emenda_knowledge_facts`

Quando `emendas` mudar, a migration sincroniza fatos principais:

- `numero_proposta`
- `numero_emenda`
- `valor_total`
- `valor_repasse`
- `objeto`
- `parlamentar`
- `autor`
- `situacao`
- `status_interno`
- `tipo`
- `tipo_recurso`
- `destino_recurso`
- `portaria`
- `data_repasse`
- `situacao_recurso`

Se o dado oficial muda, a memoria e atualizada como `validado`, `confidence = 1.00`, fonte `banco_oficial`.

## Permissoes

### Leitura

Usuarios autenticados podem ler a base de conhecimento.

Laura deve consultar dados oficiais usando o token autenticado do usuario ou uma funcao controlada. A leitura oficial precisa respeitar RLS.

As tabelas oficiais atuais ja possuem politicas de leitura para usuarios autenticados em varias migrations. Se precisar garantir leitura total em ambiente novo, rode com cuidado:

```sql
grant select on public.emendas to authenticated;
grant select on public.repasses to authenticated;
grant select on public.despesas to authenticated;
grant select on public.anexos to authenticated;
grant select on public.historico to authenticated;
grant select on public.pendencias to authenticated;
grant select on public.acoes_emendas to authenticated;
grant select on public.destinacoes_recursos to authenticated;
grant select on public.pre_lancamentos to authenticated;
grant select on public.limites_exercicio to authenticated;
grant select on public.configuracoes_anos to authenticated;
```

Se alguma tabela acima nao existir no banco, rode apenas as que existirem.

### Escrita

Laura escreve somente em:

- `knowledge_notes`
- `knowledge_facts`
- `knowledge_fact_versions`
- `knowledge_links`
- `chat_sessions`
- `chat_messages`
- `ai_memory_events`
- `laura_active_contexts`

Mesmo assim, a regra e atualizar ou marcar obsoleto, nao apagar fisicamente.

### Exclusao

Nao foi dado `DELETE` para `knowledge_notes`, `knowledge_facts` ou `knowledge_links`.

Remocao logica:

```sql
update public.knowledge_facts
set status = 'obsoleto',
    obsolete_reason = 'Substituido por dado oficial mais recente'
where entity_type = 'proposta'
  and entity_id = '11447284000126012'
  and fact_key = 'situacao';
```

## Comandos para rodar no Supabase

### Opcao 1 - Supabase CLI

No PowerShell, dentro da pasta do projeto:

```powershell
cd "C:\Users\rcmay\Desktop\rick emendas\Gestãoemendas"
```

Se ainda nao estiver logado:

```powershell
npx supabase login
```

Vincule o projeto remoto:

```powershell
npx supabase link --project-ref SEU_PROJECT_REF
```

Aplicar migrations no Supabase:

```powershell
npx supabase db push
```

Verificar status das migrations:

```powershell
npx supabase migration list
```

Depois, se o chat for alterado para usar as novas RPCs, publicar a Edge Function:

```powershell
npx supabase functions deploy laura-chat
```

Configurar secrets da IA, se necessario:

```powershell
npx supabase secrets set GEMINI_API_KEY="SUA_CHAVE"
npx supabase secrets set GEMINI_MODEL="gemini-2.5-flash"
```

### Opcao 2 - SQL Editor do Supabase

1. Abra o projeto no Supabase.
2. Va em `SQL Editor`.
3. Crie uma nova query.
4. Cole o conteudo de:

```text
supabase/migrations/20260522120000_create_laura_institutional_knowledge.sql
```

5. Clique em `Run`.

## Verificacoes apos rodar

Confirmar tabelas:

```sql
select
  to_regclass('public.knowledge_notes') as knowledge_notes,
  to_regclass('public.knowledge_facts') as knowledge_facts,
  to_regclass('public.knowledge_links') as knowledge_links,
  to_regclass('public.chat_messages') as chat_messages,
  to_regclass('public.ai_memory_events') as ai_memory_events;
```

Confirmar tags:

```sql
select name, slug
from public.knowledge_tags
order by name;
```

Testar contexto:

```sql
select public.laura_build_context(
  'qual valor dessa proposta?',
  '{"numero_proposta":"11447284000126012","active_entity_type":"proposta","active_entity_id":"11447284000126012"}'::jsonb,
  10
);
```

Testar criacao de fato pendente:

```sql
select public.laura_upsert_knowledge_fact(
  'proposta',
  '11447284000126012',
  'regra_contexto',
  'Quando o usuario disser essa proposta, priorizar a proposta ativa da tela.',
  'inferencia_ia',
  null,
  null,
  0.70,
  'pendente_confirmacao',
  true,
  'Aprendizado operacional extraido de conversa'
);
```

Ver o fato:

```sql
select *
from public.knowledge_facts
where entity_type = 'proposta'
  and entity_id = '11447284000126012';
```

## Fluxo final da Laura

1. Usuario autentica.
2. Front envia mensagem + contexto ativo da tela.
3. Edge Function chama `laura_build_context`.
4. `laura_build_context` procura primeiro no contexto ativo e em fatos validados.
5. Se nao encontrar informacao suficiente, busca notas, links e banco oficial filtrado.
6. Laura recebe:
   - fatos consolidados;
   - notas tecnicas;
   - links;
   - registros oficiais;
   - confianca;
   - fonte.
7. Laura responde indicando fonte:
   - memoria consolidada;
   - banco oficial;
   - documento anexado;
   - historico;
   - inferencia.
8. Depois da resposta, Laura avalia:
   - tem fato reutilizavel?
   - tem fonte?
   - ja existe?
   - atualiza algo antigo?
   - cria nota, fato ou link?
   - precisa marcar algo obsoleto?
9. Se for fato oficial, salva como `validado`.
10. Se for inferencia, salva como `pendente_confirmacao`.
11. Se for conversa casual, nao salva como memoria.

## Prompt interno recomendado para a Laura

Use estas regras no system prompt quando conectar o chat ao cerebro:

```text
Voce e Laura, assistente tecnica institucional.

Antes de responder, use o pacote de contexto recebido.
Prioridade de velocidade:
1. active_context da tela;
2. knowledge_facts validado da entidade ativa;
3. knowledge_notes vinculadas;
4. knowledge_links diretos;
5. banco oficial filtrado por id, numero_proposta, numero_emenda, CNES ou portaria;
6. documentos anexados;
7. busca textual ampla somente se necessario.

Prioridade de verdade:
1. banco oficial para fatos criticos;
2. documentos anexados originais;
3. knowledge_facts validado;
4. knowledge_notes validadas;
5. historico de chat somente como continuidade, nunca como verdade validada;
6. inferencia apenas quando identificada como inferencia.

Para perguntas simples, responda pela memoria consolidada se o fato estiver validado.
Para documento oficial ou decisao administrativa, confirme dados criticos no banco oficial.
Nao carregue todas as emendas quando houver proposta ativa ou identificador claro.
Use busca exata antes de busca textual.

Se houver conflito entre memoria e banco oficial, o banco oficial prevalece.
Se a pergunta for ambigua e houver contexto ativo, priorize o contexto ativo.
Se nao houver contexto ativo suficiente, pergunte qual proposta, emenda, unidade ou documento o usuario quer.

Nunca invente valor, data, CNES, portaria, status, prazo ou numero de proposta.
Para documento oficial, confirme dados criticos no banco oficial antes de gerar texto.

Apos responder, avalie se ha aprendizado reutilizavel.
Nao salve conversa casual.
Nao salve pergunta bruta como memoria.
Extraia fatos objetivos, regras operacionais, correcoes e vinculos.
Fatos vindos do banco oficial podem ser validado.
Inferencias, modelos e resumos devem ser pendente_confirmacao.
```

## Proximas etapas de implementacao

1. Conectar `laura-chat` a `laura_build_context`.
2. Fazer o frontend enviar contexto ativo da tela.
3. Trocar ou sincronizar `laura_conversations` com `chat_sessions/chat_messages`.
4. Criar pagina `Memoria Tecnica`.
5. Criar tela de aprovacao/rejeicao de sugestoes.
6. Fazer Laura salvar fatos via `laura_upsert_knowledge_fact`.
7. Fazer Laura registrar auditoria via `laura_log_memory_event`.
8. Criar leitura de documentos anexados.
9. Fase futura: adicionar `pgvector` e embeddings.

## Observacao sobre a memoria antiga

As tabelas ja existentes:

- `laura_conversations`
- `laura_memories`
- `laura_learning_suggestions`

continuam funcionando.

A nova estrutura `knowledge_*` e o cerebro institucional refinado. A memoria antiga pode continuar servindo para preferencias simples da usuaria, enquanto `knowledge_facts`, `knowledge_notes` e `knowledge_links` passam a guardar conhecimento tecnico estruturado.
