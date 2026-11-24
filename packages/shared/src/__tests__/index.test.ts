import { describe, expect, it } from 'vitest';
import { channelSchema, workspaceRoleSchema } from '../index';

describe('shared foundation schemas', () => {
  it('accepts the supported workspace roles', () => {
    expect(workspaceRoleSchema.parse('owner')).toBe('owner');
    expect(workspaceRoleSchema.safeParse('superuser').success).toBe(false);
  });

  it('validates channel identifiers and required names', () => {
    const parsed = channelSchema.safeParse({
      id: '3f2c6446-9d8c-4baf-8efb-07ddcb71c4e2',
      workspaceId: 'b3ec1689-6ab5-4c0e-80c5-37e3d62e76f3',
      name: 'Mergulho Curioso',
      niche: 'Vida marinha',
      createdAt: '2026-11-24T10:00:00.000Z',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.language).toBe('pt-BR');
    expect(channelSchema.safeParse({ id: 'bad', name: '' }).success).toBe(false);
  });
});
