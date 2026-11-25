import { z } from 'zod';

const schema = z.object({ ELEVENLABS_API_KEY: z.string().trim().min(1) });

export function getElevenLabsApiKey() {
  const parsed = schema.safeParse({ ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY });
  return parsed.success ? parsed.data.ELEVENLABS_API_KEY : null;
}
