import type { Entry, User } from '../../../database/entities';
import { fullName } from '../../users/user.mapper';

const person = (u?: User | null) => (u ? { id: u.id, name: fullName(u) } : null);
const link = (e?: Entry | null) => (e ? { id: e.id, reference: e.reference } : null);

/** GET /entries items and GET /entries/:id (detail adds attachment URL, reversal and history). */
export const toEntry = (e: Entry, reversedBy?: Entry | null) => ({
  id: e.id,
  reference: e.reference,
  direction: e.direction,
  status: e.status,
  amountCents: e.amountCents,
  entryDate: e.entryDate,
  category: e.category ? { id: e.category.id, name: e.category.name } : { id: e.categoryId, name: '' },
  contributor: e.contributor ? { id: e.contributor.id, name: e.contributor.name } : null,
  supplier: e.supplier,
  paymentMethod: e.paymentMethod,
  project: e.project,
  description: e.description,
  source: e.source,
  attachment: e.attachmentKey ? { name: e.attachmentName, type: e.attachmentType, size: e.attachmentSize } : null,
  reverses: link(e.reverses),
  reversedBy: link(reversedBy),
  reversalReason: e.reversalReason,
  createdBy: person(e.createdBy),
  createdAt: e.createdAt.toISOString(),
  decidedBy: person(e.decidedBy),
  decidedAt: e.decidedAt?.toISOString() ?? null,
  rejectionReason: e.rejectionReason,
  validatedBy: person(e.validatedBy),
  validatedAt: e.validatedAt?.toISOString() ?? null,
});
export type EntryView = ReturnType<typeof toEntry>;
