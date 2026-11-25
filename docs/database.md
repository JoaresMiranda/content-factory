# Banco de dados — estrutura do Content Factory

O schema Supabase permanece multi-workspace. `channels` foi ampliada; o canal Mergulho Curioso existente foi mantido. As novas tabelas têm `workspace_id`, RLS, UUIDs e timestamps:

- `categories`: categorias editoriais pertencentes a canal e workspace.
- `sources`: fontes manuais, com enum `source_type`, URL única no workspace e acesso opcional.
- `source_categories`: vínculo N:N entre fontes e categorias.
- `topics`: pautas com canal, categoria opcional, contexto, referência, status, notas e dados de decisão.
- `topic_sources`: vínculo N:N entre pautas e fontes.

Chaves estrangeiras compostas impedem vincular canais, categorias, fontes ou pautas de workspaces diferentes; a categoria de uma pauta também precisa pertencer ao canal selecionado. Índices cobrem workspace/status, canal/categoria, fontes ativas e pesquisa textual por título. O campo `updated_at` é atualizado por trigger.

## Autorização

Membros autenticados leem dados apenas dos workspaces dos quais participam. Owner/admin gerenciam canais e categorias. Owner/admin/editor gerenciam fontes, pautas e vínculos. Viewer não tem operações de escrita. As tabelas estão em RLS e não usam `USING (true)`. As Server Actions também verificam sessão e papel; as policies continuam sendo a barreira efetiva no PostgreSQL/PostgREST.

## Estados da pauta

`draft` (Rascunho), `pending_approval` (Aguardando aprovação), `approved`, `rejected` e `archived`. Aprovação/rejeição só ocorre enquanto a pauta aguarda aprovação. Decisões registram `decision_by` e `decision_at`; rejeição também exige `rejection_reason`. Arquivamento solicita confirmação na interface.

## Migration

`supabase/migrations/20261124192316_sprint_02_channel_sources_topics.sql` ampliou `channels`, criou estruturas, triggers, índices e policies, e inseriu as oito categorias iniciais do canal de slug `mergulho-curioso` de forma idempotente. `supabase/migrations/20261125175050_sprint_02_restrict_channel_management_to_admins.sql` alinhou a policy anterior de canais à regra de owner/admin. Ambas foram aplicadas e conferidas com `list_migrations`.

A migration `supabase/migrations/20261125180142_sprint_03_research.sql` cria `research_runs` com RLS por workspace, leitura para membros e escrita de owner/admin/editor. Também acrescenta score editorial, justificativa, evidências e referência à execução de pesquisa em `topics`. O vínculo composto impede cruzar workspaces. A migration foi aplicada ao projeto remoto; `packages/database/src/types.ts` foi regenerado a partir do schema resultante.

A migration `supabase/migrations/20261125181713_sprint_04_scripts.sql` cria `scripts`, `script_versions`, `script_scenes` e `script_generation_runs`, com vínculos compostos de workspace e políticas de leitura para membros. Escritas são executadas por RPCs autorizadas por role e workspace; clientes autenticados não recebem grant de escrita direta nestas tabelas. `begin_script_generation` bloqueia execuções simultâneas por pauta; `create_script_version` cria de forma atômica a versão imutável e suas cenas; `decide_script_version` controla transições e grava a decisão editorial.

A migration `supabase/migrations/20261125185157_sprint_05_media_and_voice.sql` adiciona `media_assets` com canal, tipo, caminho de Storage, MIME, tamanho e metadados obrigatórios de origem, licença e autoria. `scene_media_assets` permite um asset visual substituível por cena, com chave estrangeira composta de workspace. O bucket `content-factory-media` é privado, limita uploads a 50 MB e restringe MIME a imagens, vídeo e áudio MP3. Policies de `storage.objects` limitam leitura a membros e gravação a owner/admin/editor pelo primeiro segmento UUID do caminho. As cenas passam a guardar a voz, velocidade entre 0,7 e 1,2 e referência ao áudio gerado.

A migration `supabase/migrations/20261125185304_sprint_05_voice_generation_rpc.sql` adiciona uma reserva de geração por cena e três RPCs restritas a authenticated. Só cenas de versões aprovadas podem iniciar síntese; a conclusão valida workspace, canal, autoria da reserva e tipo do asset. As cenas seguem sem grants de escrita direta, preservando conteúdo imutável do roteiro. Tipos TypeScript foram regenerados depois das migrations remotas.

A migration `supabase/migrations/20261125191828_sprint_06_video_production.sql` instala PGMQ e cria `research_jobs`, `render_jobs` e `publish_jobs`. Nesta sprint só `render_jobs` tem consumidor. `production_jobs` controla a fila, tentativas (até três) e erros; `videos` registra o arquivo privado 1080×1920 e o estado de aprovação. RLS permite leitura apenas a membros do workspace e não há escrita direta por authenticated.

`start_video_production` exige owner/admin/editor, roteiro aprovado e versão mais recente, e verifica áudio e visual em cada cena antes de enfileirar. Os RPCs de claim, heartbeat, conclusão e falha são concedidos somente a `service_role`; a fila não é exposta à API do browser. `decide_video` registra aprovação, rejeição ou solicitação de ajustes, exigindo motivo nas duas últimas opções. Aprovar não publica o vídeo.

Os renders e miniaturas usam o bucket privado `content-factory-media`, sob `<workspace UUID>/renders/<job UUID>/`. As policies de Storage existentes restringem acesso ao workspace. Os links de reprodução são assinados por uma hora; o MP4 precisa respeitar o limite de 50 MB.

As migrations `20261125193709_sprint_07_youtube_publications.sql` e `20261125194410_sprint_07_publication_sessions.sql` adicionam `platform_accounts`, `platform_account_secrets`, `publications` e `publication_upload_sessions`. Metadados e publicações usam RLS por workspace. As tabelas de tokens e sessões também têm RLS, mas não concedem grants a `authenticated`; somente `service_role` lê ou altera os ciphertexts.

`start_youtube_publication` aceita vídeos aprovados e contas conectadas do mesmo canal/workspace, e envia uma mensagem idempotente à PGMQ. Os RPCs de upload, sessão e retentativa ficam restritos a `service_role`. `disconnect_platform_account` valida owner/admin/editor, remove os tokens locais e registra a desconexão. As migrations foram conferidas no Supabase e os tipos foram regenerados.

As migrations `20261125212622_sprint_08_analytics.sql` e `20261125212917_sprint_08_analytics_fk_indexes.sql` criam `video_metrics`, snapshots diários dos números por publicação no YouTube. RLS permite leitura apenas aos membros do workspace; `authenticated` não recebe escrita e o cron usa somente `service_role`. Os índices cobrem workspace/data, canal/data e as chaves estrangeiras compostas.

No ambiente local, aplique com `npx supabase db reset` (apaga e recria o banco local) ou use o fluxo de migrações configurado do Supabase CLI. Não rode reset contra a produção.
