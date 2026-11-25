import { NextResponse } from 'next/server';
import { listElevenLabsVoices } from '@content-factory/integrations';
import { getContentContext } from '@/lib/domains/content';
import { getElevenLabsApiKey } from '@/lib/ai/elevenlabs-env';

export async function GET() {
  const ctx = await getContentContext();
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 });
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return NextResponse.json({ error: 'Seu papel não permite gerar narração.' }, { status: 403 });
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) return NextResponse.json({ error: 'Configure ELEVENLABS_API_KEY no servidor.' }, { status: 503 });
  try {
    return NextResponse.json({ voices: await listElevenLabsVoices(apiKey) });
  } catch {
    return NextResponse.json({ error: 'Não foi possível carregar as vozes da ElevenLabs.' }, { status: 502 });
  }
}
