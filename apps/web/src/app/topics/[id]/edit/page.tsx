import { TopicFormPage } from '../../topic-form';

export default async function EditTopicPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const { id } = await params;
  return <TopicFormPage id={id} searchParams={searchParams} />;
}
