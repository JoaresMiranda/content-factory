import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getOpenAIEnv } from '@/lib/ai/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { executeResearch } from '@/lib/domains/research';

export const runtime = 'nodejs';
export const maxDuration = 120;

function authorized(request: Request, secret: string) {
  const provided = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authorized(request, secret)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const openai = getOpenAIEnv();
  if (!openai) return NextResponse.json({ error: 'Integração OpenAI pendente.' }, { status: 503 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor.' }, { status: 503 });
  const { data: channels, error } = await supabase.from('channels').select('id,workspace_id').eq('is_active', true);
  if (error) return NextResponse.json({ error: 'Não foi possível carregar os canais ativos.' }, { status: 500 });

  const results = [];
  for (const channel of channels ?? []) {
    try {
      results.push({ channelId: channel.id, ...(await executeResearch({ supabase, workspaceId: channel.workspace_id, channelId: channel.id, startedBy: null, apiKey: openai.OPENAI_API_KEY, model: openai.OPENAI_MODEL })) });
    } catch (error) {
      results.push({ channelId: channel.id, error: error instanceof Error ? error.message : 'Falha na pesquisa.' });
    }
  }
  return NextResponse.json({ processed: results.length, results });
}
