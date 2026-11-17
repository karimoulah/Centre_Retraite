import { PageView, pageMetadata } from '@/features/pages/PageView';

export const generateMetadata = () => pageMetadata('home');

export default function HomePage() {
  return <PageView slug="home" />;
}
