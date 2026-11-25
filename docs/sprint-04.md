# Sprint 04 — Geração, edição e aprovação de roteiros

## Fluxo editorial

- Em `/scripts`, owner/admin/editor podem gerar roteiros apenas para pautas aprovadas que tenham ao menos uma referência factual registrada.
- A geração usa o Responses API com saída JSON Schema validada por Zod. O modelo recebe o título, contexto, categoria, evidências e URLs já vinculadas à pauta; esta etapa não executa nova busca web.
- Título, gancho, desenvolvimento, conclusão, CTA, duração estimada, cenas, narração, descrição visual, termos de pesquisa de imagem e referências factuais são guardados no roteiro. URLs geradas são confrontadas com as referências da pauta e qualquer URL não cadastrada é descartada.
- Roteiro gerado nasce como rascunho. A edição manual cria uma nova versão; conteúdo anterior permanece imutável no histórico. Para alterar uma versão aprovada ou pendente, salve uma nova versão antes de enviá-la para aprovação.
- `script_generation_runs` reserva uma geração por pauta por vez. Cliques simultâneos são rejeitados antes da chamada à OpenAI; reservas abandonadas são liberadas como expiradas após 10 minutos.
- Estados por versão: `draft` → `pending_approval` → `approved` ou `rejected`. Rejeitar exige motivo. A decisão guarda usuário autenticado e horário. O PostgreSQL só permite decidir a versão mais recente e valida a transição por RPC com `SECURITY DEFINER`; as tabelas são somente leitura direta para clientes autenticados.
- A aprovação é humana e não aciona renderização ou publicação. A cena guarda apenas texto e termos de pesquisa; ingestão de mídia e áudio pertencem a outras sprints.

## Segurança e banco

Migration `20261125181713_sprint_04_scripts.sql` cria `scripts`, `script_versions`, `script_scenes` e `script_generation_runs`, todas com RLS, vínculo composto de workspace e grants de leitura. A reserva idempotente, criação atômica de script/versão/cenas e decisões editoriais são feitas por RPCs que verificam a role owner/admin/editor e o workspace da pauta. As credenciais OpenAI continuam somente no servidor.

## Custo e configuração

Gerar ou regenerar uma versão chama a OpenAI e pode gerar cobrança. A tela diferencia a ação de geração e a edição local, que não chama a API. A chave `OPENAI_API_KEY` configurada para a Sprint 03 também é usada aqui.

## Limites

O roteiro usa somente o material já cadastrado na pauta. Se não houver referências, a geração é bloqueada. A validação de URL confirma que a referência já estava associada à pauta, mas não certifica por si só a veracidade científica do texto; a revisão humana continua obrigatória. Não há edição no lugar, retentativas automáticas, filas, assets, ElevenLabs ou renderização nesta sprint.

## Validação da entrega

- Migration aplicada no projeto Supabase conectado; `list_migrations` confirmou `sprint_04_scripts`.
- Conferência remota confirmou RLS habilitada nas quatro tabelas e acesso direto de `authenticated` somente para `SELECT`.
- `npm run test`: 7 testes passaram. `npm run lint`, `npm run typecheck` e `npm run build` concluíram sem erros.
- O advisor de segurança reporta os quatro RPCs `SECURITY DEFINER` por serem invocáveis por usuários autenticados. Isso é intencional para escrita transacional: cada função exige sessão e role owner/admin/editor, limita a pauta ao workspace e valida transições/referências. O advisor também reporta proteção contra senhas vazadas desativada no projeto; essa configuração é anterior e independente da sprint.
