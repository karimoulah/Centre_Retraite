export const ROLES = ['ADMIN', 'FINANCE', 'TESTIMONIALS', 'MEMBER'] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES: Role[] = ['ADMIN', 'FINANCE', 'TESTIMONIALS'];

export const AGE_CATEGORIES = ['50_64', '65_74', '75_84', '85_PLUS'] as const;
export type AgeCategory = (typeof AGE_CATEGORIES)[number];

export const MEMBERSHIP_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const CONSENT_TYPES = ['BIRTHDAY_WISHES', 'NEWSLETTER', 'TESTIMONIAL_PUBLICATION'] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];
export const CONSENT_CHANNELS = ['EMAIL', 'SMS', 'ANY'] as const;
export type ConsentChannel = (typeof CONSENT_CHANNELS)[number];

export const TOKEN_PURPOSES = ['RESET', 'INVITATION'] as const;
export type TokenPurpose = (typeof TOKEN_PURPOSES)[number];

/** QUEUED → SENT; FAILED = an attempt failed and another is planned; ABANDONED = every attempt failed. */
export const NOTIFICATION_STATUSES = ['QUEUED', 'SENT', 'FAILED', 'ABANDONED'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const ENTRY_DIRECTIONS = ['INCOME', 'EXPENSE'] as const;
export type EntryDirection = (typeof ENTRY_DIRECTIONS)[number];

export const CONTRIBUTOR_KINDS = ['INDIVIDUAL', 'ORGANIZATION'] as const;
export type ContributorKind = (typeof CONTRIBUTOR_KINDS)[number];

/** DRAFT → VALIDATED; an expense above the threshold goes SUBMITTED → APPROVED (or REJECTED) first. */
export const ENTRY_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'VALIDATED'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];
export const PAYMENT_METHODS = ['CASH', 'CHEQUE', 'CARD', 'TRANSFER', 'ONLINE', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const ENTRY_SOURCES = ['MANUAL', 'ONLINE'] as const;
export type EntrySource = (typeof ENTRY_SOURCES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
