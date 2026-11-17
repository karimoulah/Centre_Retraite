import 'server-only';

import { api } from '@/lib/api/api';
import type { Member } from '@/lib/api/contracts';

export const getMyProfile = () => api<Member>('/me/profile');
export const getMyConsents = () => api<Member['consents']>('/me/consents');
