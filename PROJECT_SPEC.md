# PROJECT SPECIFICATION — CONTENT FACTORY

## 1. CONTEXTO DO PROJETO

Desenvolver uma aplicação web chamada Content Factory, destinada à pesquisa, criação, produção e publicação automatizada de vídeos curtos para redes sociais.

O primeiro canal administrado pela plataforma será:

**Nome:** Mergulho Curioso

**Nicho:** Vida marinha, curiosidades dos oceanos, criaturas extraordinárias, fenômenos submarinos e descobertas científicas.

**Plataformas:** YouTube Shorts e TikTok.

**Idioma:** Português brasileiro.

**Objetivo:** Construir uma plataforma de produção audiovisual automatizada, utilizando inteligência artificial, que permita produzir vídeos originais com mínima intervenção operacional.

O sistema deve começar com um único canal, mas possuir arquitetura preparada para adicionar outros canais no futuro.

## 2. STACK OBRIGATÓRIA

Frontend:

- Next.js com App Router.
- React.
- TypeScript.
- Tailwind CSS.
- Componentes reutilizáveis.

Backend:

- Next.js Route Handlers.
- Server Actions quando apropriado.
- Zod para validação.
- Serviços organizados por domínio.

Infraestrutura:

- Vercel para aplicação web.
- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Supabase Queues.
- Supabase CLI.

Inteligência artificial:

- OpenAI API para pesquisa assistida, classificação e roteiros.
- ElevenLabs para narração.

Processamento:

- Node.js.
- FFmpeg.
- Docker.
- Worker independente.

Distribuição:

- YouTube Data API.
- TikTok Content Posting API.

Organização:

- Monorepo.
- npm workspaces.
- Turborepo.

## 3. ARQUITETURA

Separar a aplicação em:

1. apps/web: interface e backend HTTP.
2. apps/worker: processamento assíncrono e renderização.
3. packages/shared: tipos, schemas e constantes.
4. packages/database: clientes e tipos do Supabase.
5. packages/ai: serviços de inteligência artificial.
6. packages/integrations: integrações externas.
7. packages/video-engine: motor de renderização.

A Vercel não deverá executar renderizações pesadas.

O Worker deverá consumir tarefas das filas do Supabase, executar FFmpeg e armazenar os arquivos finalizados no Supabase Storage.

Utilizar processamento idempotente, controle de tentativas e logs estruturados.

## 4. MÓDULOS FUNCIONAIS

### 4.1. Dashboard

Apresentar:

- Pautas encontradas.
- Pautas aguardando aprovação.
- Roteiros aprovados.
- Vídeos em produção.
- Vídeos aguardando aprovação.
- Publicações realizadas.
- Visualizações.
- Retenção.
- Custos de produção.

### 4.2. Pesquisa de curiosidades

Criar um módulo que permita:

- Executar pesquisas manualmente.
- Executar pesquisas agendadas.
- Consultar fontes previamente cadastradas.
- Identificar curiosidades relevantes.
- Classificar temas com IA.
- Identificar duplicidades.
- Registrar fontes e evidências.
- Aprovar ou rejeitar pautas.

Categorias editoriais:

- Criaturas das profundezas.
- Tubarões.
- Polvos e lulas.
- Bioluminescência.
- Corais.
- Fenômenos oceânicos.
- Recordes marinhos.
- Descobertas científicas.
- Animais extraordinários.
- Ecossistemas submarinos.

A IA deverá apresentar justificativa e evidências para suas avaliações.

Não considerar uma informação verdadeira apenas por sua repetição em diferentes sites.

### 4.3. Roteirização

Gerar roteiros em português brasileiro.

Cada roteiro deverá conter:

- Título.
- Gancho inicial.
- Desenvolvimento.
- Conclusão.
- CTA.
- Duração estimada.
- Cenas.
- Narração por cena.
- Descrição visual por cena.
- Termos para pesquisa de imagens.
- Referências factuais.

Utilizar saída estruturada em JSON e validação com Zod.

Permitir edição manual, versionamento e aprovação.

### 4.4. Biblioteca de mídia

Permitir:

- Pesquisar imagens e vídeos.
- Importar arquivos.
- Armazenar no Supabase Storage.
- Vincular mídia às cenas.
- Registrar origem.
- Registrar licença.
- Registrar autoria e atribuição.
- Substituir assets.

Não utilizar materiais sem autorização ou licença adequada.

### 4.5. Narração

Integrar ElevenLabs.

Permitir:

- Gerar narração.
- Selecionar voz.
- Configurar velocidade.
- Armazenar arquivos.
- Reproduzir prévias.
- Regenerar áudio.

### 4.6. Renderização

Desenvolver motor próprio com FFmpeg.

Configuração inicial:

- Formato vertical 9:16.
- Resolução 1080x1920.
- 30 FPS.
- MP4.
- H.264.
- AAC.
- Legendas embutidas.
- Identidade visual do canal.

Permitir:

- Montagem de cenas.
- Sincronização de narração.
- Inserção de legendas.
- Transições.
- Trilha sonora licenciada.
- Logo e identidade visual.
- Geração de thumbnail.

O motor deverá utilizar templates configuráveis.

### 4.7. Aprovação

Nenhuma pauta, roteiro ou vídeo deverá ser publicado sem aprovação humana no MVP.

O usuário deverá visualizar o material e aprovar, rejeitar ou solicitar ajustes.

### 4.8. Publicação

Implementar integração OAuth com YouTube.

Permitir:

- Upload de vídeos.
- Configuração de título.
- Descrição.
- Hashtags.
- Agendamento.
- Registro do ID externo.
- Registro da URL.
- Tratamento de falhas.

Preparar integração TikTok utilizando Content Posting API, respeitando permissões e requisitos de aprovação da aplicação.

Não simular publicações reais.

### 4.9. Analytics

Coletar métricas disponibilizadas pelas APIs:

- Visualizações.
- Curtidas.
- Comentários.
- Compartilhamentos.
- Tempo médio assistido.
- Percentual assistido.
- Inscritos conquistados, quando disponível.

Armazenar snapshots históricos.

### 4.10. Controle financeiro

Registrar custos estimados de:

- OpenAI.
- ElevenLabs.
- Pesquisa.
- Materiais visuais.
- Renderização.
- Armazenamento.

Apresentar custo estimado por vídeo e por canal.

## 5. BANCO DE DADOS

Utilizar Supabase PostgreSQL.

Entidades principais:

- channels
- profiles
- workspaces
- workspace_members
- platform_accounts
- sources
- topics
- topic_sources
- scripts
- script_scenes
- media_assets
- production_jobs
- videos
- publications
- video_metrics
- automation_logs

Criar migrations SQL versionadas.

Utilizar UUID, timestamps, índices, constraints e relacionamentos adequados.

Habilitar RLS em todas as tabelas expostas.

Implementar autorização por workspace e perfil de acesso. Não utilizar políticas genéricas que permitam acesso indiscriminado a todos os usuários autenticados.

Armazenar arquivos no Supabase Storage, mantendo apenas referências e metadados no PostgreSQL.

Credenciais OAuth deverão ser armazenadas em ambiente seguro, criptografadas e nunca expostas no frontend.

## 6. FILAS

Criar três filas:

- research_jobs
- render_jobs
- publish_jobs

Utilizar Supabase Queues.

Implementar:

- Reserva de mensagens.
- Controle de visibilidade.
- Idempotência.
- Tentativas limitadas.
- Backoff exponencial.
- Registro de erros.
- Recuperação de tarefas interrompidas.
- Monitoramento do Worker.

## 7. INTERFACE

Criar interface administrativa moderna, responsiva e intuitiva.

Identidade visual da aplicação:

- Estética SaaS.
- Layout limpo.
- Navegação lateral.
- Cards informativos.
- Tabelas funcionais.
- Estados de carregamento.
- Mensagens de erro.
- Feedback de sucesso.
- Componentes reutilizáveis.

Menu:

1. Dashboard.
2. Pesquisa.
3. Pautas.
4. Roteiros.
5. Produções.
6. Publicações.
7. Analytics.
8. Biblioteca de mídia.
9. Configurações.

A identidade visual do canal Mergulho Curioso deverá ser configurável separadamente da identidade da aplicação.

## 8. SEGURANÇA

- Não expor chaves privadas.
- Utilizar variáveis de ambiente.
- Validar dados com Zod.
- Implementar autenticação.
- Implementar autorização.
- Proteger endpoints internos.
- Validar chamadas Cron.
- Registrar operações.
- Proteger tokens OAuth.
- Implementar tratamento de erros.
- Não registrar segredos nos logs.

## 9. CRITÉRIOS DE QUALIDADE

Todo código deverá:

- Utilizar TypeScript.
- Seguir princípios de separação de responsabilidades.
- Possuir tipagem adequada.
- Evitar duplicação.
- Utilizar serviços reutilizáveis.
- Possuir tratamento de erros.
- Possuir testes para regras críticas.
- Possuir documentação.
- Manter compatibilidade entre os pacotes do monorepo.

Não implementar funcionalidades apenas visualmente.

Botões e formulários deverão estar conectados às funcionalidades reais.

Quando uma integração externa não estiver configurada, apresentar claramente o estado de configuração pendente.

## 10. ESTRATÉGIA DE DESENVOLVIMENTO

Desenvolver em sprints:

SPRINT 01:
Fundação, monorepo, Supabase, autenticação e dashboard.

SPRINT 02:
Cadastro do canal, fontes e gerenciamento de pautas.

SPRINT 03:
Pesquisa automatizada, classificação e aprovação.

SPRINT 04:
Geração, edição e aprovação de roteiros.

SPRINT 05:
ElevenLabs, biblioteca de mídia e preparação dos assets.

SPRINT 06:
Worker, FFmpeg, renderização e aprovação de vídeos.

SPRINT 07:
Integração YouTube e preparação TikTok.

SPRINT 08:
Analytics, testes e deploy.

## 11. REGRAS PARA O CODEX

Antes de começar:

1. Analise este documento.
2. Verifique se existe código no repositório.
3. Identifique dependências e configurações existentes.
4. Apresente o plano de implementação.
5. Identifique eventuais inconsistências técnicas.

Durante o desenvolvimento:

1. Trabalhe uma sprint por vez.
2. Não sobrescreva arquivos sem analisar seu conteúdo.
3. Crie migrations versionadas.
4. Atualize a documentação.
5. Execute lint.
6. Execute typecheck.
7. Execute testes.
8. Corrija erros antes de avançar.
9. Não invente credenciais ou integrações.
10. Não considere uma tarefa concluída sem validar seu funcionamento.

Ao terminar cada sprint, apresentar:

- Arquivos criados.
- Arquivos alterados.
- Funcionalidades implementadas.
- Testes executados.
- Resultado dos testes.
- Configurações pendentes.
- Próximas atividades.

## 12. PRIMEIRA SOLICITAÇÃO

Comece exclusivamente pela SPRINT 01.

Entregue:

- Estrutura completa do monorepo.
- Configuração npm workspaces e Turborepo.
- Aplicação Next.js.
- TypeScript.
- Tailwind CSS.
- Integração inicial Supabase.
- Configuração de autenticação.
- Migrations iniciais.
- Estrutura de layout administrativo.
- Dashboard inicial.
- Arquivo .env.example.
- README com instruções de instalação e execução.

Não implemente ainda pesquisa, geração de roteiros ou renderização.

Primeiro garanta uma fundação consistente, executável e testada.

Após concluir, aguarde a validação antes de iniciar a SPRINT 02.
