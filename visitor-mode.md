# Plano de Implementação: Modo Visitante (Sandbox)

## Visão Geral
Este plano descreve a implementação da **Opção B (Isolamento no Frontend via Mock)** para o Modo Visitante. O objetivo é permitir que cerca de 100+ visitantes simultâneos acessem e utilizem o sistema livremente (operações de Criar, Ler, Atualizar, Excluir) sem tocar no banco de dados real (Supabase). O estado de cada visitante será isolado no seu próprio navegador via `localStorage` e mock de API, garantindo segurança total dos dados oficiais.

## Tipo do Projeto
**WEB** (Gerenciado primariamente pelo `frontend-specialist`).

## Critérios de Sucesso (Verificação)
- [ ] O usuário consegue entrar no sistema clicando em "Acessar como Visitante" sem precisar de senha.
- [ ] Os dados visualizados nas telas são puramente fictícios (provenientes de um arquivo de *seed* local).
- [ ] O visitante consegue adicionar, editar e excluir registros. Essas mudanças persistem ao navegar entre as páginas.
- [ ] Nenhuma chamada de gravação (`POST`, `PUT`, `DELETE`) chega ao Supabase enquanto o modo visitante está ativo.
- [ ] Ao clicar em "Sair" ou após 1 hora de inatividade, o `localStorage` do visitante é limpo, e os dados fictícios retornam ao seu estado inicial.
- [ ] Um banner fixo informa claramente: "Modo Visitante Ativo. Alterações são temporárias."

## Stack Tecnológico
- **Interceptador de API / Mock:** Wrapper em cima do cliente do Supabase/Fetch para redirecionar operações para a memória local.
- **Persistência:** `localStorage` do navegador do usuário.
- **Temporizador:** Timestamp no `localStorage` verificado via Context/Zustand ou Hook personalizado.

## Estrutura de Arquivos
```text
src/
├── lib/
│   ├── visitor/
│   │   ├── visitorMockData.ts      # Dados fictícios originais (permanentes no código)
│   │   ├── visitorStorageManager.ts# Lógica de salvar/ler do localStorage com expiração de 1h
│   │   └── visitorInterceptor.ts   # Intercepta as chamadas do banco e desvia para o storage local
├── hooks/
│   └── useVisitorSession.ts        # Gerencia o estado de logado como visitante e o timer
└── components/
    ├── auth/
    │   └── VisitorLoginButton.tsx  # Botão na tela de login
    └── layout/
        └── VisitorBanner.tsx       # Aviso visual fixo no topo
```

## Detalhamento das Tarefas (Task Breakdown)

### Tarefa 1: Criação da Base de Dados Fictícia
- **Agente:** `frontend-specialist`
- **Skill:** `clean-code`
- **INPUT:** Arquivos de tipos/schemas atuais do sistema.
- **OUTPUT:** Arquivo `visitorMockData.ts` contendo arrays de objetos fictícios (Propostas, Usuários, etc.) com volume suficiente para simular o uso real.
- **VERIFY:** O arquivo compila sem erros de tipagem e contém dados consistentes com as tabelas reais.

### Tarefa 2: Gerenciador de Estado e Expiração (Storage Manager)
- **Agente:** `frontend-specialist`
- **Skill:** `clean-code`
- **INPUT:** Estratégia de expiração de 1 hora.
- **OUTPUT:** Arquivo `visitorStorageManager.ts` com funções `initVisitorData()`, `getVisitorData()`, `setVisitorData()`, e `checkExpiration()`.
- **VERIFY:** Ao chamar `initVisitorData()`, o `localStorage` é populado. Ao passar 1 hora, `checkExpiration()` retorna `true` e limpa os dados.

### Tarefa 3: Interceptador de Banco de Dados (O "Coração" do Mock)
- **Agente:** `backend-specialist` (atuando no frontend)
- **Skill:** `api-patterns`
- **INPUT:** Chamadas atuais do Supabase feitas pelo cliente.
- **OUTPUT:** Um Client customizado do Supabase (ou um middleware) em `visitorInterceptor.ts` que checa: "É visitante?". Se SIM, lê/grava no `visitorStorageManager`. Se NÃO, passa para o Supabase real.
- **VERIFY:** Criar/editar/excluir propostas altera o `localStorage` e a tela, mas nada aparece no painel do Supabase.

### Tarefa 4: Interface do Usuário (Login e Banner)
- **Agente:** `frontend-specialist`
- **Skill:** `frontend-design`
- **INPUT:** Tela de login atual e layout principal.
- **OUTPUT:** `VisitorLoginButton.tsx` (botão destacado na tela de login) e `VisitorBanner.tsx` (barra no topo do app avisando sobre o ambiente temporário e botão de resetar/sair).
- **VERIFY:** Design condizente com a identidade visual (sem tons de roxo, conforme regra), responsivo, funcional e visível.

## ✅ FASE X: Checklist de Verificação
- [ ] **Lint:** `npm run lint` passou.
- [ ] **Segurança (Isolamento):** Validado manualmente via console de rede que *nenhuma* requisição com método MUTATION vaza para o backend.
- [ ] **UX/UI:** Botão e banner não quebram o layout mobile/desktop.
- [ ] **Build:** `npm run build` sucesso sem erros de tipagem.
- Data de criação: 16 de Abril de 2026.
