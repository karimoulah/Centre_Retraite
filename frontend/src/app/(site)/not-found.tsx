import { StatusPage } from '@/components/site/StatusPage';

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Page introuvable"
      message="La page que vous cherchez n'existe pas ou a été déplacée."
    />
  );
}
