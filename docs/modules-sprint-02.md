# Módulos administrativos — Sprint 02

## Canais e categorias

Em `/channels`, owner/admin podem criar e editar canais, configurar slug, idioma, país, fuso horário, descrição, nicho e cor principal, além de ativar/desativar sem apagar registros. A mesma área lista e administra categorias editoriais por canal. As categorias iniciais do Mergulho Curioso são semeadas pela migration.

## Pesquisa e fontes

Em `/sources`, usuários com papel owner/admin/editor podem buscar, cadastrar, editar, ativar e desativar fontes. Tipos: site institucional, revista científica, universidade, portal de notícias, organização ambiental, feed RSS e API. Fontes podem ser relacionadas a categorias. Não há leitura ou coleta automática nesta sprint.

## Pautas

Em `/topics`, usuários owner/admin/editor criam, editam e consultam pautas, filtram por canal, categoria e status e pesquisam por título. A pauta inclui resumo, contexto, fontes, URL de referência, data original e notas internas. Para decisão, uma pauta deve estar em `pending_approval`. Rejeição exige motivo; aprovação e rejeição registram a conta autenticada e horário. Arquivamento pede confirmação.

O menu mantém roteiros, produções, publicações, analytics, biblioteca e configurações como itens em desenvolvimento. O item de pesquisa abre a administração manual de fontes; pesquisa automática ainda não existe.

## Testes e limitações

Schemas Zod e regras puras de transição têm testes unitários em `packages/shared`. Policies e constraints de isolamento foram inspecionadas no banco remoto; um teste de API que simule duas sessões em workspaces distintos ainda requer usuários de teste separados. Workspace selecionado pela aplicação é a primeira associação da conta; seletor de workspace é trabalho posterior.

O arquivo de tipos em `packages/database/src/types.ts` foi gerado a partir do schema remoto. Nesta versão, os wrappers Supabase passam `any` para o genérico do schema porque o tipo de consultas do SDK em uso infere `never` para selects e mutations com este schema. Formulários e decisões continuam validados com Zod e PostgreSQL/RLS controla o acesso, mas o retorno dos queries e nomes de tabelas não recebem a checagem estática completa do SDK. Remover esse escape e testar CRUD autenticado continuam pendências técnicas da fundação.
