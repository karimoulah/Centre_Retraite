/** Readable French labels for audit actions, entities and fields. */
export const ACTION_LABELS: Record<string, string> = {
  USER_CREATED: 'Compte créé (invitation)',
  USER_UPDATED: 'Compte modifié',
  USER_ROLES_CHANGED: 'Rôles modifiés',
  USER_DEACTIVATED: 'Compte désactivé',
  MEMBERSHIP_SUBMITTED: 'Demande d’adhésion reçue',
  MEMBERSHIP_APPROVED: 'Adhésion approuvée',
  MEMBERSHIP_REJECTED: 'Adhésion refusée',
  MEMBER_UPDATED: 'Fiche de membre modifiée',
  MEMBER_DEACTIVATED: 'Membre désactivé',
  PROFILE_UPDATED: 'Profil modifié par le membre',
  CONSENTS_UPDATED: 'Consentements modifiés',
  SETTINGS_UPDATED: 'Paramètre modifié',
};

export const ENTITY_LABELS: Record<string, string> = {
  User: 'Utilisateur',
  MembershipRequest: 'Demande d’adhésion',
  Member: 'Membre',
  Settings: 'Paramètres',
};

export const FIELD_LABELS: Record<string, string> = {
  status: 'Statut',
  reason: 'Motif',
  roles: 'Rôles',
  active: 'Actif',
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'Courriel',
  phone: 'Téléphone',
  address: 'Adresse',
  ageCategory: 'Catégorie d’âge',
  birthDate: 'Date de naissance',
  autoApprove: 'Approbation automatique',
  birthdayWishes: 'Vœux d’anniversaire',
  newsletter: 'Nouvelles',
  testimonialPublication: 'Diffusion des témoignages',
};

const VALUE_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  ADMIN: 'Administration',
  FINANCE: 'Finances',
  TESTIMONIALS: 'Témoignages',
  MEMBER: 'Membre',
};

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) return value.map(formatValue).join(', ') || '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return VALUE_LABELS[String(value)] ?? String(value);
}
