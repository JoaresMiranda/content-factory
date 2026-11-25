export type ElevenLabsVoice = { id: string; name: string; category: string; description: string };

export class ElevenLabsError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ElevenLabsError';
  }
}

export async function listElevenLabsVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
  const response = await fetch('https://api.elevenlabs.io/v2/voices?page_size=100&include_total_count=false', {
    headers: { 'xi-api-key': apiKey },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new ElevenLabsError('Não foi possível carregar as vozes da ElevenLabs.', response.status);

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !('voices' in payload) || !Array.isArray(payload.voices)) {
    throw new ElevenLabsError('A ElevenLabs retornou uma lista de vozes inválida.');
  }
  return payload.voices.flatMap((item): ElevenLabsVoice[] => {
    if (!item || typeof item !== 'object' || !('voice_id' in item) || typeof item.voice_id !== 'string' || !('name' in item) || typeof item.name !== 'string') return [];
    return [{
      id: item.voice_id,
      name: item.name,
      category: 'category' in item && typeof item.category === 'string' ? item.category : 'voice',
      description: 'description' in item && typeof item.description === 'string' ? item.description : '',
    }];
  });
}

export async function synthesizeSpeech(apiKey: string, voiceId: string, text: string, speed: number): Promise<Uint8Array> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { speed, stability: 0.5, similarity_boost: 0.75 },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new ElevenLabsError('A chave ElevenLabs não foi aceita ou não tem permissão para síntese.', response.status);
    if (response.status === 429) throw new ElevenLabsError('Limite de uso da ElevenLabs atingido. Tente novamente mais tarde.', response.status);
    throw new ElevenLabsError('A ElevenLabs não conseguiu gerar este áudio.', response.status);
  }
  return new Uint8Array(await response.arrayBuffer());
}
