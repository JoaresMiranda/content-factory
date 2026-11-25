# Integrations

Integrações externas são implementadas neste workspace sem carregar credenciais no navegador.

## ElevenLabs

`listElevenLabsVoices` consulta as vozes da conta e `synthesizeSpeech` gera áudio MP3 em português a partir do texto de uma cena. A velocidade é validada entre 0,7× e 1,2×. A aplicação chama essas funções somente em Route Handlers; configure `ELEVENLABS_API_KEY` no ambiente de servidor. O pedido usa a configuração normal de histórico da API; zero retention mode é um recurso restrito a contas Enterprise.

A escolha de voz e a síntese dependem de uma chave ElevenLabs válida. As chamadas consomem créditos da conta; a interface pede confirmação antes de cada geração ou regeneração.

## YouTube

`buildGoogleAuthorizationUrl`, `exchangeGoogleCode` e `refreshGoogleAccessToken` implementam OAuth web server com acesso offline; `uploadYouTubeVideo` cria um upload resumível e retoma pelo estado da sessão. O worker envia somente vídeos aprovados, mantém uploads privados por padrão e usa `publishAt` para agendamentos. Consulte a [referência de `videos.insert`](https://developers.google.com/youtube/data/reference/rest/v3/videos/insert) e o [OAuth web server](https://developers.google.com/identity/protocols/oauth2/web-server).

## TikTok

A Sprint 07 cobre OAuth server-side, renovação/revogação de tokens e conexão da conta; não simula nem envia publicações TikTok. O Content Posting API exige escopo `video.publish`, consentimento, consulta das opções de privacidade do criador e auditoria do aplicativo para remover restrições de visibilidade. Veja [Direct Post](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post) e os [escopos TikTok](https://developers.tiktok.com/docs/en/tiktok-api-scopes).

Tokens OAuth e sessões resumíveis são cifrados com AES-256-GCM. `OAUTH_TOKEN_ENCRYPTION_KEY` aceita 32 bytes hex (64 dígitos) ou Base64; `OAUTH_STATE_SECRET` deve ser independente e ter ao menos 32 caracteres. Mantenha ambos somente nos ambientes server-side.
