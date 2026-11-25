# Worker

Workspace reservado para o processo Node independente que consumirá filas e renderizará vídeos nas sprints 06–08. Nenhum worker ou processamento assíncrono é iniciado na Sprint 01.
# Worker de renderização

Processo Node independente que consome somente `render_jobs` no PGMQ, baixa assets privados, executa FFmpeg, envia o MP4 e a miniatura ao bucket `content-factory-media` e registra o resultado para revisão humana.

## Executar

Copie `.env.worker.example` para as variáveis de ambiente do serviço e configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente do worker. A chave service role nunca deve ser configurada no Next.js, no browser ou em repositório.

```sh
npm install
npm run build --workspace=@content-factory/video-engine
npm run build --workspace=@content-factory/worker
npm run start --workspace=@content-factory/worker
```

A imagem de produção pode ser construída da raiz com `docker build -f apps/worker/Dockerfile .`. O container instala FFmpeg e DejaVu Sans. A execução tem backoff da fila, heartbeat durante renderizações longas, três tentativas e limpeza dos arquivos temporários.
