'use client';

import Link from 'next/link';
import { ChevronDown, Globe, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLE_LABELS, type SessionUser } from '@/lib/api/contracts';

/** Name, roles, link to the public site and logout (submits the layout's logout form). */
export function UserMenu({ user, logoutFormId }: { user: SessionUser; logoutFormId: string }) {
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-brand-900 text-sm text-text-on-dark">
            {initials}
          </span>
          <span className="hidden sm:inline">
            {user.firstName} {user.lastName}
          </span>
          <span className="sr-only">: menu du compte</span>
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuLabel>
          <span className="block font-medium">
            {user.firstName} {user.lastName}
          </span>
          <span className="block text-sm font-normal text-text-muted">{user.email}</span>
          <span className="block text-sm font-normal text-text-muted">
            {user.roles.map((role) => ROLE_LABELS[role]).join(', ')}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-11">
          <Link href="/">
            <Globe aria-hidden />
            Voir le site public
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-11">
          <button type="submit" form={logoutFormId} className="w-full">
            <LogOut aria-hidden />
            Se déconnecter
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
