import { NextResponse } from 'next/server';
import { scriptGenerationRequestSchema } from '@content-factory/shared';
import { getOpenAIEnv } from '@/lib/ai/env';
import { getContentContext } from '@/lib/domains/content';
import { generateAndSaveScript } from '@/lib/domains/scripts';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: Request) {
  const ctx = await getContentContext();
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 });
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return NextResponse.json({ error: 'Seu papel não permite gerar roteiros.' }, { status: 403 });
  const openai = getOpenAIEnv();
  if (!openai) return NextResponse.json({ error: 'Integração OpenAI pendente. Configure OPENAI_API_KEY no servidor.' }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Envie um JSON válido.' }, { status: 400 }); }
  const parsed = scriptGenerationRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Selecione uma pauta válida.' }, { status: 400 });

  const result = await generateAndSaveScript(ctx, parsed.data.topicId, openai.OPENAI_API_KEY, openai.OPENAI_MODEL);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json(result.data, { status: 201 });
}
