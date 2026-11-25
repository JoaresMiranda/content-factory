import { NextResponse } from 'next/server';
import { researchStartSchema } from '@content-factory/shared';
import { getOpenAIEnv } from '@/lib/ai/env';
import { getContentContext } from '@/lib/domains/content';
import { executeResearch } from '@/lib/domains/research';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: Request) {
  const ctx = await getContentContext();
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 });
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return NextResponse.json({ error: 'Seu papel não permite iniciar pesquisas.' }, { status: 403 });
  const openai = getOpenAIEnv();
  if (!openai) return NextResponse.json({ error: 'Integração OpenAI pendente. Configure OPENAI_API_KEY no ambiente do servidor.' }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Envie um JSON válido.' }, { status: 400 }); }
  const input = researchStartSchema.safeParse(body);
  if (!input.success) return NextResponse.json({ error: 'Selecione um canal válido.' }, { status: 400 });

  try {
    const result = await executeResearch({ ...ctx, channelId: input.data.channelId, startedBy: ctx.user.id, apiKey: openai.OPENAI_API_KEY, model: openai.OPENAI_MODEL });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível concluir a pesquisa.';
    return NextResponse.json({ error: message }, { status: /em andamento/.test(message) ? 409 : 422 });
  }
}
