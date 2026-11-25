import { z } from 'zod';

const schema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().trim().min(1).default('gpt-5-mini'),
});

export function getOpenAIEnv() {
  const parsed = schema.safeParse({ OPENAI_API_KEY: process.env.OPENAI_API_KEY, OPENAI_MODEL: process.env.OPENAI_MODEL });
  return parsed.success ? parsed.data : null;
}
