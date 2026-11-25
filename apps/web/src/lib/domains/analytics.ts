import { aggregateLatestMetrics, analyticsPeriodSchema, buildDailyViewSeries, latestSnapshotsByPublication, type AnalyticsSnapshot } from '@content-factory/shared';
import type { ContentContext } from './content';

export async function getAnalytics(ctx: ContentContext, periodInput?: string) {
  const period = analyticsPeriodSchema.parse(periodInput);
  const from = new Date(); from.setUTCDate(from.getUTCDate() - Number(period) + 1);
  const fromDate = from.toISOString().slice(0, 10);
  const [{ data: metrics, error: metricsError }, { data: publications, error: publicationsError }] = await Promise.all([
    ctx.supabase.from('video_metrics').select('publication_id,captured_on,views,likes,comments,shares,watch_time_minutes,average_view_duration_seconds,average_view_percentage,subscribers_gained')
      .eq('workspace_id', ctx.workspaceId).gte('captured_on', fromDate).order('captured_on', { ascending: true }).limit(5000),
    ctx.supabase.from('publications').select('id,channel_id,title,external_url,status,uploaded_at,created_at')
      .eq('workspace_id', ctx.workspaceId).eq('platform', 'youtube').not('external_id', 'is', null).order('uploaded_at', { ascending: false }).limit(200),
  ]);
  if (metricsError || publicationsError) return { error: 'Não foi possível carregar as métricas deste workspace.' };
  const rows = (metrics ?? []) as AnalyticsSnapshot[];
  const latest = latestSnapshotsByPublication(rows);
  const totals = aggregateLatestMetrics(rows);
  const publicationById = new Map((publications ?? []).map((publication) => [publication.id, publication]));
  const latestVideos = latest.flatMap((metric) => {
    const publication = publicationById.get(metric.publication_id);
    return publication ? [{ ...metric, title: publication.title, externalUrl: publication.external_url, status: publication.status, uploadedAt: publication.uploaded_at ?? publication.created_at }] : [];
  }).sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  return { data: { period, fromDate, totals, dailyViews: buildDailyViewSeries(rows), latestVideos, snapshotCount: rows.length } };
}
