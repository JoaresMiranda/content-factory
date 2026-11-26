# Content Factory

Plataforma web para organizar a pesquisa, criação, produção, revisão e publicação de vídeos curtos. O projeto é um monorepo TypeScript com aplicação Next.js, worker independente e serviços compartilhados.

## Capacidades

- Gerenciamento de workspaces, canais, fontes e pautas editoriais.
- Pesquisa assistida e classificação de pautas com OpenAI, sujeitas à aprovação humana.
- Roteiros versionados, cenas editáveis e fluxo de aprovação.
- Biblioteca privada de mídia e geração de narração por cena com ElevenLabs.
- Renderização vertical de vídeo e miniaturas usando FFmpeg.
- Revisão de produções e publicação no YouTube, privada por padrão, imediata após ação explícita ou agendada.
- Conexão OAuth com YouTube e TikTok. A publicação no TikTok ainda não está implementada.
- Coleta diária de métricas do YouTube e visualização de snapshots em Analytics.

## Arquitetura

| Caminho | Responsabilidade |
| --- | --- |
| `apps/web` | Interface Next.js, Route Handlers, autenticação, operações de domínio e endpoints de cron. |
| `apps/worker` | Processo Node contínuo que consome filas, renderiza vídeos e processa publicações. |
| `packages/ai` | Integrações de pesquisa e geração assistidas por IA. |
| `packages/database` | Tipos do banco e fábricas de clientes Supabase. |
| `packages/integrations` | Integrações externas, OAuth, uploads e proteção de tokens. |
| `packages/shared` | Tipos, schemas e contratos compartilhados. |
| `packages/video-engine` | Composição de vídeos e miniaturas com FFmpeg/ffprobe. |
| `supabase/migrations` | Histórico versionado do schema, funções, filas, permissões e políticas RLS. |

O repositório usa npm workspaces e Turborepo. A Vercel hospeda a aplicação web e os crons; o worker roda separadamente como serviço de container contínuo. O worker não deve ser executado como função serverless.

## Requisitos

- Node.js `>=22.12.0` e npm 11.
- Docker para construir e executar a imagem do worker.
- Supabase CLI para ambiente local e migrations.
- Projeto Supabase com Auth, Postgres, Storage e filas habilitados.

## Instalação e execução local

Na raiz do repositório:

```bash
npm install
cp .env.example apps/web/.env.local
npm run dev
```

A aplicação local fica disponível em `http://localhost:3000`. Preencha `apps/web/.env.local` antes de usar autenticação, banco ou integrações. A chave pública do Supabase pode ser usada no cliente; chaves de servidor devem permanecer sem prefixo `NEXT_PUBLIC_`.

## Banco de dados

Para iniciar o Supabase local e aplicar todas as migrations ao banco local:

```bash
npx supabase start
npx supabase db reset
```

Para vincular um projeto remoto e aplicar as migrations pendentes:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

O cadastro público de usuários está desativado. Usuários e a associação inicial ao workspace precisam ser provisionados administrativamente. As tabelas de negócio usam RLS, com acesso limitado à associação e ao papel no workspace.

## Variáveis de ambiente

Use `.env.example` como referência para a aplicação web. Cadastre os mesmos nomes no ambiente do provedor em produção.

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave publicável/anon para operações sujeitas a RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de servidor para callbacks OAuth, jobs protegidos e operações administrativas. Nunca exponha ao navegador. |
| `CRON_SECRET` | Protege os endpoints de cron. |
| `OAUTH_STATE_SECRET` | Assina o estado dos fluxos OAuth. |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | Criptografa tokens OAuth armazenados; use 32 bytes em hexadecimal ou Base64. |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI` | OAuth do YouTube. O callback é `/api/oauth/youtube/callback`. |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Pesquisa e geração assistidas; o modelo tem valor padrão. |
| `ELEVENLABS_API_KEY` | Consulta de vozes e geração de narração. |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` | OAuth do TikTok. |

Não versione arquivos `.env.local` nem compartilhe chaves em logs, issues ou mensagens. Use valores diferentes para `CRON_SECRET`, `OAUTH_STATE_SECRET` e `OAUTH_TOKEN_ENCRYPTION_KEY`.

## Worker

Configure o processo com as variáveis listadas em `.env.worker.example`. Construa a imagem a partir da raiz do monorepo:

```bash
docker build -f apps/worker/Dockerfile -t content-factory-worker .
```

Execute o container como serviço privado e contínuo. O worker instala FFmpeg/ffprobe e consome as filas de renderização e publicação. A imagem e o workflow de CI não fazem deploy automático do worker.

## Deploy e jobs agendados

- Na Vercel, conecte o repositório como monorepo e configure `apps/web` como Root Directory, mantendo os pacotes do workspace acessíveis ao build.
- Configure as variáveis de produção necessárias para os módulos habilitados. Registre o callback OAuth de produção no Google e use a mesma URL em `YOUTUBE_REDIRECT_URI`.
- `vercel.json` agenda pesquisa diária às 13:00 UTC e Analytics às 14:00 UTC. Os endpoints validam `Authorization: Bearer <CRON_SECRET>` e os crons da Vercel executam em produção.
- O worker exige deploy separado em um provedor de containers.

## Verificações

Execute na raiz do repositório:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

O workflow `.github/workflows/ci.yml` executa lint, typecheck, testes, build web e build da imagem do worker em pushes e pull requests.

## Documentação complementar

- [Especificação do projeto](PROJECT_SPEC.md)
- [Documentação do banco](docs/database.md)
- [Documentação do deploy e Analytics](docs/sprint-08.md)
- [Integrações externas](packages/integrations/README.md)
- [Worker](apps/worker/README.md)
