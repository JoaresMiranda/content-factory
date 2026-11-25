import { describe, expect, it } from 'vitest';
import { channelSchema, workspaceRoleSchema, channelInputSchema, categoryInputSchema, sourceInputSchema, topicInputSchema, rejectionReasonSchema, canDecideTopic } from '../index';

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

  it('validates and normalizes channel and category forms', () => {
    const channel = channelInputSchema.parse({ name: 'Mergulho Curioso', countryCode: 'BR' });
    expect(channel.slug).toBe('mergulho-curioso');
    expect(channelInputSchema.safeParse({ name: 'x', countryCode: 'BR' }).success).toBe(false);
    expect(channelInputSchema.safeParse({ name: 'Canal', countryCode: 'BR', timezone: 'Mars/Olympus' }).success).toBe(false);
    const category = categoryInputSchema.parse({ channelId: '3f2c6446-9d8c-4baf-8efb-07ddcb71c4e2', name: 'Polvos e lulas' });
    expect(category.slug).toBe('polvos-e-lulas');
    expect(categoryInputSchema.safeParse({ channelId: 'invalid', name: '' }).success).toBe(false);
  });

  it('validates sources and related categories', () => {
    const parsed = sourceInputSchema.parse({ name: 'Instituto', url: 'https://example.org', type: 'institutional_site', categoryIds: [] });
    expect(parsed.isActive).toBe(true);
    expect(sourceInputSchema.safeParse({ name: 'Site', url: 'javascript:alert(1)', type: 'api' }).success).toBe(false);
    expect(sourceInputSchema.safeParse({ name: 'Site', url: 'https://example.org', type: 'unknown' }).success).toBe(false);
  });

  it('validates topics and editorial decision rules', () => {
    const parsed = topicInputSchema.parse({ channelId: '3f2c6446-9d8c-4baf-8efb-07ddcb71c4e2', title: 'Como os polvos mudam de cor' });
    expect(parsed.status).toBe('draft');
    expect(topicInputSchema.safeParse({ channelId: 'bad', title: 'oi' }).success).toBe(false);
    expect(topicInputSchema.safeParse({ channelId: '3f2c6446-9d8c-4baf-8efb-07ddcb71c4e2', title: 'Título de pauta válido', referenceUrl: 'ftp://example.org' }).success).toBe(false);
    expect(rejectionReasonSchema.safeParse('Informação sem referência').success).toBe(true);
    expect(rejectionReasonSchema.safeParse('não').success).toBe(false);
    expect(canDecideTopic('pending_approval', 'approved')).toBe(true);
    expect(canDecideTopic('draft', 'rejected')).toBe(false);
    expect(canDecideTopic('approved', 'archived')).toBe(true);
  });
});
