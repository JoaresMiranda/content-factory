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

export const sourceTypeSchema = z.enum([
  'institutional_site', 'scientific_journal', 'university', 'news_portal',
  'environmental_organization', 'rss_feed', 'api',
]);
export const topicStatusSchema = z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'archived']);

const slugify = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const httpUrlSchema = z.string().url().refine((url) => ['http:', 'https:'].includes(new URL(url).protocol), 'Use uma URL HTTP ou HTTPS.');

export const channelInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().default(''),
  description: z.string().trim().max(2000).optional().default(''),
  niche: z.string().trim().max(200).optional().default(''),
  language: z.string().trim().min(2).max(20).default('pt-BR'),
  countryCode: z.string().trim().length(2).default('BR'),
  timezone: z.string().trim().min(1).max(80).refine((value) => {
    try { Intl.DateTimeFormat('pt-BR', { timeZone: value }); return true; } catch { return false; }
  }, 'Use um fuso horário IANA válido.').default('America/Fortaleza'),
  isActive: z.boolean().default(true),
  visualPrimaryColor: z.string().regex(/^#[\da-f]{6}$/i).default('#087e8b'),
}).transform((value) => ({ ...value, slug: slugify(value.slug || value.name) }));
export type ChannelInput = z.input<typeof channelInputSchema>;

export const categoryInputSchema = z.object({
  id: z.string().uuid().optional(), channelId: z.string().uuid(),
  name: z.string().trim().min(2).max(100), description: z.string().trim().max(1000).optional().default(''),
  isActive: z.boolean().default(true),
}).transform((value) => ({ ...value, slug: slugify(value.name) }));
export type CategoryInput = z.input<typeof categoryInputSchema>;

export const sourceInputSchema = z.object({
  id: z.string().uuid().optional(), name: z.string().trim().min(2).max(160),
  url: httpUrlSchema,
  type: sourceTypeSchema, description: z.string().trim().max(2000).optional().default(''),
  categoryIds: z.array(z.string().uuid()).default([]), isActive: z.boolean().default(true),
});
export type SourceInput = z.input<typeof sourceInputSchema>;

export const topicInputSchema = z.object({
  id: z.string().uuid().optional(), channelId: z.string().uuid(), categoryId: z.string().uuid().optional().or(z.literal('')),
  title: z.string().trim().min(5).max(200), summary: z.string().trim().max(1000).optional().default(''),
  context: z.string().trim().max(10000).optional().default(''), sourceIds: z.array(z.string().uuid()).default([]),
  referenceUrl: httpUrlSchema.optional().or(z.literal('')),
  originalPublishedAt: z.string().refine((value) => value === '' || !Number.isNaN(Date.parse(value)), 'Informe uma data válida.').optional().or(z.literal('')),
  internalNotes: z.string().trim().max(5000).optional().default(''),
  status: z.enum(['draft', 'pending_approval']).default('draft'),
});
export type TopicInput = z.input<typeof topicInputSchema>;

export const rejectionReasonSchema = z.string().trim().min(5).max(1000);

export const researchStartSchema = z.object({ channelId: z.string().uuid() });
export const researchEvidenceSchema = z.object({
  url: httpUrlSchema,
  title: z.string().trim().min(1).max(500),
  publisher: z.string().trim().max(200).optional().default(''),
});
export const researchFindingSchema = z.object({
  title: z.string().trim().min(8).max(200),
  summary: z.string().trim().min(20).max(1000),
  context: z.string().trim().min(20).max(4000),
  categoryId: z.string().uuid(),
  relevanceScore: z.number().int().min(0).max(100),
  rationale: z.string().trim().min(20).max(1200),
  evidenceUrls: z.array(httpUrlSchema).min(2).max(8),
});
export const researchResponseSchema = z.object({ findings: z.array(researchFindingSchema).max(8) });
export type ResearchFinding = z.infer<typeof researchFindingSchema>;

export const scriptVersionStatusSchema = z.enum(['draft', 'pending_approval', 'approved', 'rejected']);
export const scriptSceneSchema = z.object({
  durationSeconds: z.number().int().min(2).max(30),
  narration: z.string().trim().min(1).max(1000),
  visualDescription: z.string().trim().min(1).max(1200),
  imageSearchTerms: z.array(z.string().trim().min(3).max(100)).min(1).max(6),
});
export const scriptReferenceSchema = z.object({ url: httpUrlSchema, claim: z.string().trim().min(5).max(500) });
export const scriptContentSchema = z.object({
  title: z.string().trim().min(5).max(120),
  hook: z.string().trim().min(5).max(500),
  development: z.string().trim().min(20).max(4000),
  conclusion: z.string().trim().min(5).max(800),
  cta: z.string().trim().min(3).max(300),
  estimatedDurationSeconds: z.number().int().min(15).max(180),
  scenes: z.array(scriptSceneSchema).min(3).max(12),
  factualReferences: z.array(scriptReferenceSchema).min(1).max(8),
});
export const scriptGenerationRequestSchema = z.object({ topicId: z.string().uuid() });
export const scriptVersionEditSchema = z.object({
  scriptId: z.string().uuid(),
  content: scriptContentSchema.omit({ factualReferences: true }),
});
export type ScriptContent = z.infer<typeof scriptContentSchema>;

export const mediaAssetKindSchema = z.enum(['image', 'video', 'audio']);
export const mediaAssetSearchSchema = z.object({ q: z.string().trim().max(120).optional().default(''), kind: mediaAssetKindSchema.optional() });
export const mediaAssetMetadataSchema = z.object({
  channelId: z.string().uuid(),
  origin: z.string().trim().min(2).max(240),
  sourceUrl: httpUrlSchema.optional().or(z.literal('')),
  licenseName: z.string().trim().min(2).max(240),
  author: z.string().trim().min(2).max(200),
  attribution: z.string().trim().max(1000).optional().default(''),
  notes: z.string().trim().max(2000).optional().default(''),
});
export const narrationGenerationSchema = z.object({
  voiceId: z.string().trim().min(1).max(160),
  speed: z.coerce.number().min(0.7).max(1.2),
});
export const mediaAssetLinkSchema = z.object({
  mediaAssetId: z.string().uuid(),
  sceneId: z.string().uuid(),
});

export const productionJobStatusSchema = z.enum(['queued', 'rendering', 'completed', 'failed', 'cancelled']);
export const videoReviewStatusSchema = z.enum(['pending_approval', 'approved', 'rejected', 'revision_requested']);
export const startProductionSchema = z.object({ scriptVersionId: z.string().uuid() });
export const videoDecisionSchema = z.object({
  videoId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'revision_requested']),
  reason: z.string().trim().max(1000).optional().default(''),
}).superRefine((value, context) => {
  if (value.decision !== 'approved' && value.reason.trim().length < 5) {
    context.addIssue({ code: 'custom', path: ['reason'], message: 'Informe o motivo com pelo menos 5 caracteres.' });
  }
});
export const renderQueueMessageSchema = z.object({ jobId: z.string().uuid(), workspaceId: z.string().uuid() });
export const renderSceneInputSchema = z.object({
  position: z.number().int().min(1).max(12),
  durationSeconds: z.number().int().min(2).max(30),
  narration: z.string().trim().min(1).max(1000),
  visualPath: z.string().min(1).max(512).refine((value) => !value.includes('..')),
  visualKind: z.enum(['image', 'video']),
  audioPath: z.string().min(1).max(512).refine((value) => !value.includes('..')),
});
export const renderInputSchema = z.object({
  jobId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  channelName: z.string().trim().min(1).max(160),
  primaryColor: z.string().regex(/^#[\da-fA-F]{6}$/),
  scenes: z.array(renderSceneInputSchema).min(3).max(12),
});

const titleWords = (title: string) => new Set(title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
  .filter((word) => word.length > 2 && !['com', 'para', 'uma', 'dos', 'das', 'que', 'por', 'como', 'mais', 'sobre'].includes(word)));

export function isDuplicateTopic(candidate: string, existingTitles: string[]) {
  const candidateWords = titleWords(candidate);
  if (!candidateWords.size) return false;
  return existingTitles.some((title) => {
    const existingWords = titleWords(title);
    if (candidateWords.size === existingWords.size && [...candidateWords].every((word) => existingWords.has(word))) return true;
    const overlap = [...candidateWords].filter((word) => existingWords.has(word)).length;
    return overlap / new Set([...candidateWords, ...existingWords]).size >= 0.78;
  });
}

export function canDecideTopic(status: z.infer<typeof topicStatusSchema>, decision: 'approved' | 'rejected' | 'archived') {
  if (decision === 'archived') return status !== 'archived';
  return status === 'pending_approval';
}

export function canDecideScript(status: z.infer<typeof scriptVersionStatusSchema>, decision: 'pending_approval' | 'approved' | 'rejected') {
  if (decision === 'pending_approval') return status === 'draft';
  return status === 'pending_approval';
}
