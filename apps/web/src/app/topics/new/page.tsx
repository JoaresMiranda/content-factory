import { TopicFormPage } from '../topic-form';

export default function NewTopicPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  return <TopicFormPage searchParams={searchParams} />;
}
