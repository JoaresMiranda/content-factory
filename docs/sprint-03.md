# Sprint 03 — Pesquisa, classificação e aprovação

## Fluxo

- Em `/research`, owner/admin/editor podem iniciar a pesquisa para um canal ativo. A interface mostra as últimas 20 execuções e seus resultados/falhas.
- A busca é feita pelo OpenAI Responses API com `web_search`, limitada aos domínios das fontes ativas cadastradas. Fontes associadas a categorias são usadas quando a categoria pertence ao canal; fontes sem categorias associadas funcionam como referências gerais do workspace.
- A saída é JSON Schema e passa novamente pela validação Zod. Evidências só são mantidas quando a URL aparece na lista de fontes que a própria busca retornou. A classificação recebe uma justificativa e uma nota de relevância editorial.
- Achados precisam apresentar pelo menos duas URLs de hosts distintos para virar pauta. Títulos repetidos ou muito próximos de pautas já existentes (incluindo outros achados da mesma execução) são descartados.
- Pautas novas entram diretamente em `pending_approval`, vinculadas à execução, com categoria, score, justificativa, evidências e fontes. A aprovação/rejeição humana continua pelo detalhe de cada pauta em `/topics`; nada é publicado automaticamente.
- Uma execução por canal pode estar ativa por vez. O índice único no PostgreSQL impede cliques simultâneos e execuções duplicadas do cron.

## Execução agendada

`vercel.json` agenda uma chamada diária a `/api/cron/research` às 13:00 UTC. A rota exige `Authorization: Bearer $CRON_SECRET`, usa a chave `SUPABASE_SERVICE_ROLE_KEY` somente no servidor e processa cada canal ativo. O segredo e a chave do Supabase devem ser configurados no ambiente de produção. Sem qualquer uma das configurações, o endpoint retorna erro explícito e não chama a OpenAI.

O disparo manual é autenticado por Supabase e protegido pelas roles owner/admin/editor e pelas políticas RLS do workspace. O cron, autenticado pelo segredo, usa service role para executar em todos os workspaces.

## Custo e limites

Cada execução faz uma chamada ao Responses API, com busca web, limite de saída, máximo de oito pautas e timeout de 90 segundos. A busca pode gerar cobrança da OpenAI. A frequência diária foi escolhida para reduzir execuções repetitivas; ela pode ser alterada no `vercel.json`. Não há retentativas automáticas, filas, workers ou pesquisa em segundo plano nesta sprint.

Domínios diferentes não provam independência editorial: veículos podem republicar a mesma matéria. A IA recebe instruções para procurar evidência primária e distinguir republicações; mesmo assim, seu score não é garantia de veracidade. A pessoa responsável deve examinar as evidências antes de aprovar.

## Configuração local

Copie `OPENAI_API_KEY` e, se desejado, `OPENAI_MODEL` para `apps/web/.env.local`. O endpoint agendado requer ainda `CRON_SECRET` e `SUPABASE_SERVICE_ROLE_KEY`. Nunca use prefixo `NEXT_PUBLIC_` nessas credenciais. Sem chave OpenAI, `/research` informa que a integração está pendente e mantém o botão desabilitado.

Migration: `20261125180142_sprint_03_research.sql`.
