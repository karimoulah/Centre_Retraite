import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { logoutAction } from '../actions';

/** Plain form so logging out works even before JavaScript loads. */
export function LogoutButton({ className, variant = 'ghost' }: { className?: string; variant?: 'ghost' | 'ghostOnDark' | 'outline' }) {
  return (
    <form action={logoutAction} className={cn(className)}>
      <Button type="submit" variant={variant} className="w-full justify-start">
        <LogOut aria-hidden />
        Se déconnecter
      </Button>
    </form>
  );
}
