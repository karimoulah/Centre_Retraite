import { redirect } from 'next/navigation';

import { PageView, pageMetadata } from '@/features/pages/PageView';

type Props = { params: Promise<{ slug: string[] }> };

const toSlug = async (params: Props['params']) => (await params).slug.map(decodeURIComponent).join('/');

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await toSlug(params));
}

export default async function CmsPage({ params }: Props) {
  const slug = await toSlug(params);
  if (slug === 'home') redirect('/');
  return <PageView slug={slug} />;
}
