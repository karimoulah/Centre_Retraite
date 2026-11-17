import { StatusPage } from '@/components/site/StatusPage';

export default function BackofficeNotFound() {
  return (
    <StatusPage
      code="404"
      title="Élément introuvable"
      message="Cet élément n'existe pas ou a été supprimé."
      action={{ href: '/backoffice', label: 'Retour au back-office' }}
    />
  );
}
