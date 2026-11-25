import { SourceFormPage } from '../source-form';

export default async function EditSourcePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const { id } = await params;
  return <SourceFormPage id={id} searchParams={searchParams} />;
}
