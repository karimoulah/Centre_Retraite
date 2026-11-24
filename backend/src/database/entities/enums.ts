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
