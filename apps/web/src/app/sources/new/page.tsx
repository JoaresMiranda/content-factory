import { SourceFormPage } from '../source-form';

export default function NewSourcePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  return <SourceFormPage searchParams={searchParams} />;
}
