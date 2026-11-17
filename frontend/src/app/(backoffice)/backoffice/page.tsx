import { LogoutButton } from '@/features/auth/components/LogoutButton';
import { requireRole } from '@/lib/session';

// Placeholder: the back-office shell (sidebar, role filtering) is built in F2-01.
export default async function BackofficeHomePage() {
  const user = await requireRole('ADMIN', 'FINANCE', 'TESTIMONIALS');
  return (
    <main id="contenu" className="p-8">
      <h1 className="text-3xl">Bonjour {user.firstName}</h1>
      <LogoutButton className="mt-6" variant="outline" />
    </main>
  );
}
