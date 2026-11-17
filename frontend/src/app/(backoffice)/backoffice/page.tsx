import { PageHeader } from '@/components/backoffice/PageHeader';
import { requireRole } from '@/lib/session';

// Replaced by the role-based shortcuts in F2-05.
export default async function BackofficeHomePage() {
  const user = await requireRole('ADMIN', 'FINANCE', 'TESTIMONIALS');
  return <PageHeader title={`Bonjour ${user.firstName}`} />;
}
