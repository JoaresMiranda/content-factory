# Sprint 08 — analytics, qualidade e deploy

## Entrega

- `/analytics` resume snapshots recentes por publicação, com filtro de 7, 30 ou 90 dias, visualizações, curtidas, comentários, compartilhamentos, tempo assistido, retenção média e inscritos conquistados.
- O dashboard apresenta contagens reais de pautas, aprovações, renderizações e publicações, com resumo dos snapshots de Analytics mais recentes.
- O job diário `/api/cron/analytics` valida `Authorization: Bearer $CRON_SECRET`, renova tokens expirados no servidor, coleta contagens pela YouTube Data API e métricas de retenção pela YouTube Analytics API e faz upsert idempotente de um snapshot por publicação/dia.
- As migrations `20261125212622_sprint_08_analytics` e `20261125212917_sprint_08_analytics_fk_indexes` criam `video_metrics`, os índices de consulta/chaves estrangeiras, RLS por workspace e escrita somente via `service_role`. Snapshots preservam o histórico da coleta; valores da API podem ser processados com atraso.
- OAuth YouTube inclui agora `yt-analytics.readonly`. Contas que autorizavam a Sprint 07 precisam ser reconectadas em Configurações para conceder esse novo acesso.
- `.github/workflows/ci.yml` valida lint, typecheck, testes, build Next.js e build da imagem Docker do worker para PRs e pushes.

## Coleta e interpretação

Views/likes/comentários atuais vêm de `videos.list`; compartilhamentos, tempo assistido, duração/percentual médio assistido e inscritos vêm de `reports.query`. Se a Analytics API estiver indisponível ou ainda sem dados para o período, o job mantém as contagens da Data API e salva as métricas adicionais como ausentes. A coleta ignora vídeos enviados no dia corrente, pois os relatórios Analytics encerram no dia anterior. A tabela contém snapshots acumulados por vídeo na data da coleta; o gráfico de views exibe a soma dos snapshots daquele dia, não a variação diária de views.

As chamadas respeitam o canal autorizado em cada conta. Tokens cifrados ficam no servidor; o endpoint do cron nunca retorna tokens e remove URLs/segredos de mensagens de erro. Usuários autenticados só leem métricas pertencentes aos workspaces dos quais são membros.

## Configuração de deploy

### Web na Vercel

1. Vincule o repositório à Vercel como monorepo e selecione `apps/web` como projeto Next.js; mantenha os pacotes do workspace acessíveis no build.
2. Configure variáveis de produção: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`, `OAUTH_STATE_SECRET` e `OAUTH_TOKEN_ENCRYPTION_KEY`. Não use prefixo `NEXT_PUBLIC_` para segredos.
3. Registre o callback de produção `/api/oauth/youtube/callback` no Google Cloud OAuth e habilite YouTube Data API v3 e YouTube Analytics API. As contas conectadas devem ser reconectadas para incluir `yt-analytics.readonly`.
4. O `vercel.json` configura os crons diários de pesquisa às 13:00 UTC e Analytics às 14:00 UTC. Cron Jobs Vercel são acionados em deploys de produção; use `CRON_SECRET` também nas chamadas manuais.

### Worker

Construa a imagem a partir da raiz do repositório com `docker build -f apps/worker/Dockerfile -t content-factory-worker .`. Execute como serviço privado e contínuo (não como função serverless) com `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` e `OAUTH_TOKEN_ENCRYPTION_KEY`, usando os valores de `.env.worker.example`. A imagem instala FFmpeg/ffprobe e consome filas de renderização e publicação. Não configure as credenciais service role na Vercel nem no frontend.

O workflow executa o build da imagem como verificação; ele não publica imagens nem realiza deploy. A publicação exige secrets e configuração de Git/deploy no provedor escolhido para Vercel e worker.

## Testes e pendências

Cobertura unitária acrescentada para agregação de snapshots por publicação/dia e conversão dos relatórios YouTube. Checks locais: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `docker build` (quando Docker estiver instalado). Integrações remotas exigem contas com acesso ao YouTube Analytics API; APIs sem métricas disponíveis não são simuladas.

Pendências de validação de ambiente: credenciais reais YouTube, execução do primeiro cron em produção, teste de isolamento com usuários de workspaces diferentes, configuração dos projetos Vercel/worker e confirmação da construção Docker local. O deploy não foi realizado neste trabalho.
