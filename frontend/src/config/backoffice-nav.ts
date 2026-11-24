import {
  BookOpenCheck,
  ClipboardList,
  HandCoins,
  Tags,
  FileText,
  History,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { Role } from '@/lib/api/contracts';

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles that see the item; the page itself still checks with requireRole(). */
  roles: Role[];
  external?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

const STAFF: Role[] = ['ADMIN', 'FINANCE', 'TESTIMONIALS'];

export const backofficeNav: NavGroup[] = [
  {
    label: 'Général',
    items: [{ href: '/backoffice', label: 'Accueil', icon: LayoutDashboard, roles: STAFF }],
  },
  {
    label: 'Membres',
    items: [
      { href: '/backoffice/memberships', label: "Demandes d'adhésion", icon: ClipboardList, roles: ['ADMIN'] },
      { href: '/backoffice/members', label: 'Membres', icon: Users, roles: ['ADMIN'] },
    ],
  },
  {
    label: 'Finances',
    items: [
      { href: '/backoffice/finance/entries', label: 'Écritures', icon: BookOpenCheck, roles: ['FINANCE'] },
      { href: '/backoffice/finance/categories', label: 'Catégories', icon: Tags, roles: ['FINANCE'] },
      { href: '/backoffice/finance/contributors', label: 'Contributeurs', icon: HandCoins, roles: ['FINANCE'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/backoffice/users', label: 'Utilisateurs', icon: UserCog, roles: ['ADMIN'] },
      { href: '/backoffice/audit', label: "Journal d'audit", icon: History, roles: ['ADMIN'] },
      { href: '/backoffice/settings', label: 'Paramètres', icon: Settings, roles: ['ADMIN'] },
      { href: '/admin', label: 'Contenu du site', icon: FileText, roles: ['ADMIN'], external: true },
    ],
  },
];

/** Breadcrumb labels for path segments; unknown segments (ids) read "Détail". */
export const segmentLabels: Record<string, string> = {
  backoffice: 'Back-office',
  memberships: "Demandes d'adhésion",
  members: 'Membres',
  users: 'Utilisateurs',
  audit: "Journal d'audit",
  settings: 'Paramètres',
  new: 'Nouveau',
  finance: 'Finances',
  categories: 'Catégories',
  contributors: 'Contributeurs',
  entries: 'Écritures',
  expenses: 'Dépenses',
};

export function navFor(roles: Role[]): NavGroup[] {
  return backofficeNav
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.some((r) => roles.includes(r))) }))
    .filter((group) => group.items.length > 0);
}
