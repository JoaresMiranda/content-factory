import { z } from 'zod';

export const workspaceRoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer']);
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

export const channelSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  name: z.string().min(1),
  niche: z.string().nullable(),
  language: z.string().default('pt-BR'),
  createdAt: z.string().datetime(),
});
export type Channel = z.infer<typeof channelSchema>;
