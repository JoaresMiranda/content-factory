# Sprint 06 — worker, renderização e aprovação de vídeos

## Entrega

- A tela `/productions` mostra roteiros aprovados, prontidão por cena, jobs e vídeos renderizados.
- A ação de renderização passa por `start_video_production`, que valida papel, versão mais recente, aprovação e áudio/visual em cada cena antes de enviar uma mensagem PGMQ.
- O worker em `apps/worker` usa service role apenas no processo de servidor; faz polling da fila com visibilidade renovável, baixa os assets privados, cria os arquivos temporários, envia MP4/miniatura e registra o resultado.
- `packages/video-engine` usa FFmpeg para compor vídeo vertical 1080×1920 a 30 fps, H.264/AAC, aplicar cor do canal/legendas, concatenar cenas e extrair miniatura. Duração máxima total: 180 segundos; MP4 até 50 MB.
- `/productions/[id]` disponibiliza player com URL assinada por 1 hora e permite aprovar, rejeitar ou pedir ajustes. Rejeição e ajuste exigem comentário. A revisão é humana; não existe publicação automática.
- A migration cria `research_jobs`, `render_jobs` e `publish_jobs`; somente a fila de renderização é consumida nesta sprint. Tabelas seguem RLS por workspace; RPCs de worker são concedidos só a `service_role`.

## Configuração de execução

1. Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente privado do worker, com `WORKER_POLL_INTERVAL_MS` e `WORKER_VISIBILITY_SECONDS` opcionais. Nunca configure a service role no frontend.
2. Build local: `npm run build --workspace=@content-factory/video-engine` e `npm run build --workspace=@content-factory/worker`.
3. Container: `docker build -f apps/worker/Dockerfile .` executado na raiz do monorepo; a imagem instala FFmpeg, ffprobe e DejaVu Sans.
4. Execute `npm run start --workspace=@content-factory/worker` como processo contínuo.

## Validação e pendências

A migration `20261125191828_sprint_06_video_production` foi aplicada ao Supabase em 25/11/2026 e conferida no histórico. PGMQ está instalado no schema `pgmq`; tabelas `production_jobs` e `videos` foram criadas com RLS.

O ambiente de desenvolvimento atual não tem executáveis FFmpeg nem Docker, e o acesso ao npm registry está indisponível. Portanto, não foi possível construir/testar uma renderização real nem montar a imagem neste ambiente. O teste unitário do filtro FFmpeg verifica apenas a composição de argumentos/filtros; depende de instalar dependências antes da execução. São necessárias essas verificações num ambiente com rede e FFmpeg/Docker antes de considerar o worker operacional.

O limite do bucket reaproveitado é 50 MB. O renderizador limita o bitrate e recusa MP4 acima do tamanho, mas assets de visualização são baixados integralmente para disco temporário. Configure volume temporário e memória adequados na plataforma de worker. `research_jobs` e `publish_jobs` são preparadas para sprints futuras e ainda não têm consumidor.
