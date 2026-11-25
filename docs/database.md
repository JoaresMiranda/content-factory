# Banco de dados — Sprints 02 e 03

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

No ambiente local, aplique com `npx supabase db reset` (apaga e recria o banco local) ou use o fluxo de migrações configurado do Supabase CLI. Não rode reset contra a produção.
