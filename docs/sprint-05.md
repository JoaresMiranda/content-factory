# Sprint 05 — Narração ElevenLabs e biblioteca de mídia

## Biblioteca

- `/media` lista e pesquisa assets pelo nome, origem, autoria e licença; filtra por imagem, vídeo ou áudio. O limite da consulta é 200 registros por vez.
- Owner/admin/editor podem importar JPEG, PNG, WebP, GIF, MP4, WebM ou MOV até 50 MB. O formulário exige origem/provedor, licença e autoria; URL de origem, atribuição e observações podem ser registradas. Assets existentes podem ser vinculados ou substituídos em uma cena.
- Arquivos são enviados do navegador direto ao Supabase Storage (sem passar pelo limite de corpo das Server Actions) e ficam no bucket privado `content-factory-media`, sob um prefixo com o UUID do workspace. A página e o roteiro usam URLs assinadas temporárias para pré-visualização. Membros do workspace leem e apenas owner/admin/editor gravam arquivos e metadados.
- A consulta de biblioteca é do catálogo cadastrado; não faz busca externa de fornecedores de mídia. Origem e licença precisam ser registradas antes do uso. Não use materiais sem permissão adequada.

## Narração

- Em roteiros aprovados, owner/admin/editor selecionam uma voz da conta ElevenLabs, ajustam velocidade de 0,7× a 1,2×, geram e escutam MP3 por cena. Regenerar substitui o áudio ativo e mantém o arquivo anterior no catálogo.
- Síntese só ocorre em Route Handler com `ELEVENLABS_API_KEY` server-only. A UI solicita confirmação de uso de créditos. A API usa seu histórico padrão; zero retention mode da ElevenLabs é restrito a contas Enterprise e não é forçado pela aplicação.
- RPCs autorizadas reservam uma geração por cena, validam o estado aprovado, a role e o workspace. Uma reserva abandonada pode ser recuperada após 10 minutos.
- A interface informa configuração pendente quando a chave está ausente ou a conta não retorna vozes. Os testes não chamam a API real.
- O advisor Supabase sinaliza os três novos RPCs `SECURITY DEFINER` por serem invocáveis por sessões autenticadas. É intencional: cada RPC valida a role, o workspace, o estado aprovado e a identidade da reserva; nenhum grant de escrita direta foi dado em `script_scenes`. O aviso anterior de proteção contra senhas vazadas desativada continua no projeto.

## Migrações e validação

- `20261125185157_sprint_05_media_and_voice.sql` cria metadados, vínculos, bucket privado e policies Storage/RLS.
- `20261125185304_sprint_05_voice_generation_rpc.sql` cria reserva, conclusão e cancelamento das gerações de narração.
- Ambas as migrations foram aplicadas ao Supabase remoto e os tipos foram gerados pelo schema remoto.
- Verificações executadas na entrega: `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`.

## Pendências operacionais

- Definir `ELEVENLABS_API_KEY` em cada ambiente de servidor antes de listar vozes ou gerar narração.
- A busca externa de imagens/vídeos e conexões com provedores de stock não fazem parte desta sprint; a busca atual opera no catálogo importado.
- FFmpeg, jobs/fila, montagem audiovisual e publicação pertencem às sprints seguintes.
