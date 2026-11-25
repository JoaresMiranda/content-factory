# Integrations

Integrações externas são implementadas neste workspace sem carregar credenciais no navegador.

## ElevenLabs

`listElevenLabsVoices` consulta as vozes da conta e `synthesizeSpeech` gera áudio MP3 em português a partir do texto de uma cena. A velocidade é validada entre 0,7× e 1,2×. A aplicação chama essas funções somente em Route Handlers; configure `ELEVENLABS_API_KEY` no ambiente de servidor. O pedido usa a configuração normal de histórico da API; zero retention mode é um recurso restrito a contas Enterprise.

A escolha de voz e a síntese dependem de uma chave ElevenLabs válida. As chamadas consomem créditos da conta; a interface pede confirmação antes de cada geração ou regeneração.
