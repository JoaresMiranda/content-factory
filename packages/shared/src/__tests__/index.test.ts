import { describe, expect, it } from 'vitest';
import { channelSchema, workspaceRoleSchema, channelInputSchema, categoryInputSchema, sourceInputSchema, topicInputSchema, rejectionReasonSchema, canDecideTopic, isDuplicateTopic, researchFindingSchema, researchStartSchema, scriptContentSchema, scriptVersionStatusSchema, canDecideScript, mediaAssetMetadataSchema, narrationGenerationSchema, mediaAssetLinkSchema } from '../index';

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

  it('validates research requests and keeps near duplicate topics out', () => {
    expect(researchStartSchema.safeParse({ channelId: '3f2c6446-9d8c-4baf-8efb-07ddcb71c4e2' }).success).toBe(true);
    expect(researchStartSchema.safeParse({ channelId: 'invalid' }).success).toBe(false);
    expect(isDuplicateTopic('Como os polvos mudam de cor', ['Como os polvos mudam de cor'])).toBe(true);
    expect(isDuplicateTopic('De cor mudam os polvos', ['Os polvos mudam de cor'])).toBe(true);
    expect(isDuplicateTopic('Como os polvos mudam de cor', ['A migração anual das baleias'])) .toBe(false);
    expect(researchFindingSchema.safeParse({ title: 'Título', summary: 'Resumo', context: 'Contexto', categoryId: '3f2c6446-9d8c-4baf-8efb-07ddcb71c4e2', relevanceScore: 72, rationale: 'Justificativa adequada.', evidenceUrls: ['https://one.org/a', 'https://two.org/b'] }).success).toBe(false);
  });

  it('validates script scenes and version decisions', () => {
    const content = scriptContentSchema.parse({
      title: 'O mistério das águas-vivas', hook: 'Elas não têm cérebro — então como sobrevivem?',
      development: 'Uma descrição com base nas referências fornecidas para contar o fato com clareza.',
      conclusion: 'A resposta está nas adaptações desse animal.', cta: 'Siga para mais curiosidades do oceano.',
      estimatedDurationSeconds: 45, factualReferences: [{ url: 'https://example.org/study', claim: 'O estudo descreve o comportamento da espécie.' }],
      scenes: Array.from({ length: 3 }, () => ({ durationSeconds: 5, narration: 'Texto narrado da cena.', visualDescription: 'Descrição visual da cena.', imageSearchTerms: ['águas-vivas oceano'] })),
    });
    expect(content.scenes).toHaveLength(3);
    expect(scriptVersionStatusSchema.safeParse('approved').success).toBe(true);
    expect(scriptVersionStatusSchema.safeParse('published').success).toBe(false);
    expect(canDecideScript('draft', 'pending_approval')).toBe(true);
    expect(canDecideScript('pending_approval', 'approved')).toBe(true);
    expect(canDecideScript('approved', 'rejected')).toBe(false);
    expect(scriptContentSchema.safeParse({ ...content, scenes: [] }).success).toBe(false);
  });

  it('validates media provenance, scene links, and ElevenLabs speed', () => {
    const workspaceChannel = '3f2c6446-9d8c-4baf-8efb-07ddcb71c4e2';
    expect(mediaAssetMetadataSchema.safeParse({ channelId: workspaceChannel, origin: 'Wikimedia Commons', sourceUrl: 'https://commons.wikimedia.org/example', licenseName: 'CC BY 4.0', author: 'Marine Institute' }).success).toBe(true);
    expect(mediaAssetMetadataSchema.safeParse({ channelId: workspaceChannel, origin: 'site', licenseName: '', author: 'Unknown' }).success).toBe(false);
    expect(narrationGenerationSchema.safeParse({ voiceId: 'voice-id', speed: 1.2 }).success).toBe(true);
    expect(narrationGenerationSchema.safeParse({ voiceId: 'voice-id', speed: 1.21 }).success).toBe(false);
    expect(mediaAssetLinkSchema.safeParse({ mediaAssetId: workspaceChannel, sceneId: workspaceChannel }).success).toBe(true);
  });
});
