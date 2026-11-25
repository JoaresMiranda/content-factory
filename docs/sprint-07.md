# Sprint 07 — integração YouTube e preparação TikTok

## Entrega

- `/settings` conecta contas Google/YouTube e TikTok a um canal do workspace. OAuth usa `state` HMAC, cookie `HttpOnly`, `SameSite=Lax` e callback cadastrado no provedor.
- `platform_accounts` guarda metadados; access/refresh tokens e sessões resumíveis ficam cifrados em AES-256-GCM. As tabelas de segredos não concedem acesso a `authenticated`.
- `/publications` oferece somente vídeos aprovados e contas YouTube conectadas. A ação pública imediata é explícita; upload sem agenda permanece privado; uma data futura usa `publishAt` no YouTube.
- O worker consome `publish_jobs`, renova tokens OAuth, faz upload resumível em partes, retoma por sessão cifrada, registra ID/URL externos e aplica backoff com até três tentativas.
- Desconectar uma conta revoga a autorização no provedor e remove os tokens locais.
- A preparação TikTok cobre OAuth e armazenamento seguro de tokens. A aplicação não envia conteúdo ao TikTok nesta sprint.

## Configuração

Use os valores de [.env.example](../.env.example) no ambiente privado do Next.js e os de [.env.worker.example](../.env.worker.example) no worker. Gere segredos independentes com `openssl rand -base64 32` para `OAUTH_STATE_SECRET` e `openssl rand -hex 32` para `OAUTH_TOKEN_ENCRYPTION_KEY`.

No Google Cloud, habilite YouTube Data API v3, configure OAuth Web Client e consent screen e registre `/api/oauth/youtube/callback`. O app solicita `youtube.readonly` e `youtube.upload`; OAuth server-side pede acesso offline para upload agendado.

No TikTok for Developers, adicione Content Posting API, registre `/api/oauth/tiktok/callback` e aprove o scope `video.publish`. Direct Post também requer consentimento explícito e consulta das opções atuais do criador. Clientes ainda não auditados têm restrição de visibilidade; confira os [requisitos oficiais](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post).

## Privacidade e estados

`videos.insert` pode publicar imediatamente; por isso o worker sempre define `privacyStatus`. A agenda do YouTube exige que o vídeo esteja privado com `status.publishAt`. Upload privado termina como `uploaded_private`; publicação futura fica `scheduled`; publicação pública imediata fica `published` após confirmação do YouTube. Veja a [referência oficial `videos.insert`](https://developers.google.com/youtube/data/reference/rest/v3/videos/insert).

O escopo de publicação e a auditoria do TikTok dependem da análise do app pelo provedor. A interface expõe essa dependência e não finge que um post foi criado.

## Validação e pendências

As migrations `20261125193709_sprint_07_youtube_publications` e `20261125194410_sprint_07_publication_sessions` foram aplicadas ao Supabase; RLS e grants foram conferidos. Tipos TypeScript foram regenerados. As dependências existentes foram reutilizadas, sem nova biblioteca externa.

Lint, typecheck, testes unitários e build do monorepo passaram. Ainda faltam testes de ponta a ponta com credenciais OAuth reais, um upload privado de teste e construção da imagem Docker; Docker e credenciais dos provedores não estão disponíveis neste ambiente. Registre credenciais e redirect URIs no painel do Google e TikTok antes de conectar contas.
