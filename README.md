# Content Factory

Monorepo para a plataforma de produção audiovisual do canal Mergulho Curioso. A fundação da Sprint 01 inclui Next.js App Router, autenticação Supabase, modelo inicial multi-workspace com RLS e dashboard administrativo.

## Requisitos

- Node.js 22.12 ou superior (inclui o requisito do Vitest 5 usado nos testes)
- npm 11 (versão declarada em `packageManager`)
- Supabase CLI (para migrations e ambiente local)

## Instalação

```bash
npm install
cp .env.example apps/web/.env.local
```

Edite `apps/web/.env.local` com a URL e a chave anon/public do projeto Supabase. Não coloque a service role key em variáveis `NEXT_PUBLIC_*` nem a use no navegador.

## Banco de dados

Para iniciar Supabase localmente e aplicar migrations:

```bash
npx supabase start
npx supabase db reset
```

Para um projeto Supabase remoto, associe o projeto com `npx supabase link` e aplique migrations com `npx supabase db push`. Ative e configure os provedores de autenticação desejados no painel Supabase. O cadastro pela interface da aplicação não está habilitado; usuários e acesso inicial ao workspace devem ser provisionados administrativamente.

A migration inicial cria workspaces, perfis, associações com papéis e canais. Todas as tabelas têm RLS habilitada e as políticas verificam associação ao workspace e papel. O primeiro workspace e sua associação owner devem ser provisionados por um fluxo administrativo seguro; não há usuário ou credencial padrão.

## Desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000. Sem as variáveis do Supabase, o dashboard informa que a integração está pendente e o login fica desabilitado.

Na Sprint 02, as rotas disponíveis são `/channels` (canais e categorias), `/sources` (cadastro manual de fontes) e `/topics` (pautas e decisões). O menu mantém os demais módulos identificados como em desenvolvimento.

## Verificações

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

O build do workspace web usa `next build --webpack`: nesta execução de auditoria o Turbopack falhou ao abrir uma porta local interna do ambiente; o build Webpack, suportado pelo Next.js, compilou a aplicação com sucesso.

## Workspaces

- `apps/web`: aplicação Next.js, Route Handlers e interface administrativa.
- `apps/worker`: limite de workspace reservado para o worker futuro; ainda sem processo ou consumidor de filas.
- `packages/shared`: schemas Zod e tipos compartilhados.
- `packages/database`: tipos e fábricas tipadas de clientes Supabase; adaptadores de cookies Next ficam em `apps/web`.
- `packages/ai`: workspace reservado para serviços de IA, sem funcionalidades nesta sprint.
- `packages/integrations`: workspace reservado para provedores externos, sem integrações nesta sprint.
- `packages/video-engine`: workspace reservado para FFmpeg, sem renderizador nesta sprint.
- `supabase/migrations`: migrations versionadas e alinhadas ao histórico remoto do projeto.

## Estado da Sprint 01

O login Supabase usa a chave publishable pública e a URL em `apps/web/.env.local`; a chave `service_role` não é usada pelo frontend. A conta Auth inicial já está vinculada ao workspace `Content Factory` como owner e ao canal `Mergulho Curioso`.

Todas as tabelas públicas iniciais têm RLS. Os auxiliares `SECURITY DEFINER` ficam no schema `private`, não exposto pela API, e os administradores não podem atribuir ou remover papéis owner. As rotas protegidas redirecionam usuários sem sessão para `/login`.

Os workspaces sem código são apenas limites arquiteturais para sprints futuras; não iniciam AI, pesquisa, integrações, filas ou renderização.

A configuração Supabase atual tem a proteção de senha comprometida desativada (aviso do Security Advisor). Habilite-a nas configurações de Auth do projeto antes de convidar outros usuários.

## Auditoria técnica da Sprint 01

Auditoria realizada em 24/11/2026. Confirmados npm workspaces e Turborepo com sete workspaces, dependências instaladas sem conflitos, build de produção Next.js, renderização do dashboard em desktop e viewport móvel, rotas `/` e `/login`, e console do navegador sem erros ou avisos. O fluxo de login não foi reenviado nesta auditoria; a sessão autenticada existente carregou o dashboard e `/login` redirecionou para `/`.

As quatro migrations locais correspondem ao histórico aplicado no Supabase. As tabelas públicas `workspaces`, `profiles`, `workspace_members` e `channels` têm RLS habilitada. As políticas usam associação e papel no workspace; administradores não podem promover membros a owner nem remover ou editar o owner. O Security Advisor não reporta outros achados de segurança além da proteção de senha comprometida desativada, descrita acima.

Resultados da última execução: `npm run lint`, `npm run typecheck`, `npm run test` (2 testes existentes aprovados) e `npm run build` passaram. `npm audit --omit=dev --offline` reportou zero vulnerabilidades em dependências de produção; a instalação completa do lockfile também terminou sem vulnerabilidades. A auditoria não adicionou testes de fluxo de autenticação, isolamento multi-workspace ou interface; esses cenários continuam como cobertura futura.

## Sprint 02 — canais, fontes e pautas

Implementados canais e categorias editoriais, fontes manuais e pautas com status, filtros, fontes vinculadas e registro de decisões. Não há pesquisa automática, integrações externas, geração de conteúdo nem publicação. As migrations `20261124192316_sprint_02_channel_sources_topics.sql` e `20261125175050_sprint_02_restrict_channel_management_to_admins.sql` foram aplicadas ao Supabase; elas ampliam `channels` sem duplicar o canal inicial e criam `categories`, `sources`, `source_categories`, `topics` e `topic_sources`, todas com RLS. A role `viewer` só lê; owner/admin gerenciam canais/categorias; owner/admin/editor gerenciam fontes e pautas.

Veja [documentação do banco](docs/database.md) e [módulos da Sprint 02](docs/modules-sprint-02.md). A proteção contra senhas comprometidas no Supabase Auth continua pendente, conforme o aviso de auditoria da Sprint 01.

Pendências de validação: ainda não foi executado um teste E2E de CRUD com sessão autenticada nem uma simulação de dois workspaces. Os tipos do banco são gerados do schema remoto, mas a integração de tipos do cliente Supabase usa `any` no schema genérico temporariamente porque o SDK atual infere `never` nas operações deste schema; detalhes em `docs/modules-sprint-02.md`.

Nenhuma funcionalidade da Sprint 03 ou posterior foi iniciada.
