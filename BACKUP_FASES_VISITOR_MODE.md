# BACKUP DE ESTADO - MODO VISITANTE

## Contexto Atual (16/04/2026)
O PC do usuário está desligando sozinho. Este arquivo serve como um "save state" (ponto de restauração) da nossa conversa e do progresso do plano do Modo Visitante.

## O Que Já Foi Decidido
1. Vamos implementar o **Modo Visitante (Opção B - Isolamento via Mock)**.
2. O sistema não gravará dados reais no Supabase durante o acesso como visitante.
3. Serão criados dados fictícios (`visitorMockData.ts`), porém baseados em **dados reais** e na **estrutura real** do banco de dados atual.
4. O `orchestrator` irá coordenar as tarefas, acionando o `frontend-specialist`, `backend-specialist` e agora o `database-architect` (para a modelagem realista dos dados fictícios).

## O Que Está Sendo Feito Agora (Fase de Análise de Dados)
- Estamos mapeando a estrutura atual do projeto na pasta `src/`.
- Estamos nos conectando ao Supabase para extrair a estrutura das tabelas e analisar quais dados reais existem lá.
- O objetivo dessa análise é montar um banco de dados fictício que seja o mais próximo possível da realidade do projeto (com as mesmas colunas, tipos e preenchimentos típicos).

## Próximos Passos
1. Concluir a análise das tabelas no Supabase.
2. Gerar o `visitorMockData.ts` de forma realista (Tarefa 1).
3. Implementar o `visitorStorageManager.ts` (Tarefa 2).
4. Implementar a interceptação de banco de dados (Tarefa 3).
5. Criar a UI de acesso do visitante (Tarefa 4).

## Análise de Dados Realizada (Supabase)
- **Tabelas Encontradas:** `emendas`, `profiles`, `cargos`, `repasses`, `despesas`, `anexos`, `pendencias`, `acoes_emendas`, etc.
- **Dados Reais Analisados:**
  - `emendas`: Contém valores como `numero_emenda` (ex: "71270009"), `tipo` ("bancada", "individual"), `tipo_recurso` ("INCREMENTO_PAP", "EQUIPAMENTO"), `valor_total` (ex: 5917360.00), e `status_interno` (ex: "PROPOSTA_PAGA", "AGUARDANDO_AUTORIZACAO_FNS").
  - `profiles`: Contém dados de usuários como nome, email, cargo e perfil de acesso ("CONSULTA", "GESTOR").
- **Conclusão:** Usaremos essa exata estrutura e estilo de preenchimento (ex: "P. GM/MS Nº 8.108" para portarias) para criar o nosso `visitorMockData.ts`. Os dados fictícios parecerão 100% reais, com números de propostas e descrições técnicas na área da saúde.
