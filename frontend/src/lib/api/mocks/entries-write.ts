import {
  ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  type Entry,
  type EntryRequest,
  type FinanceSettings,
} from '../contracts';
import { actorOf, guard, isResponse } from './auth';
import { recordAudit } from './audit';
import { entries, entryDetail, findEntry, nextReference } from './entries';
import { categories, contributors } from './finance';
import { created, fail, mockStore, ok, type MockRoute } from './types';
import { mockUploads } from './uploads';

export const financeSettings = () =>
  mockStore<FinanceSettings>('financeSettings', () => ({
    expenseApprovalThresholdCents: 50_000,
    updatedAt: null,
    updatedBy: null,
  }));

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
const snapshot = (e: Entry) => ({
  status: e.status,
  amountCents: e.amountCents,
  categoryId: e.category.id,
  entryDate: e.entryDate,
  description: e.description,
});

function invalid(body: Partial<EntryRequest>, direction: Entry['direction']) {
  const details: { field: string; message: string }[] = [];
  if (!Number.isInteger(body.amountCents) || (body.amountCents ?? 0) <= 0)
    details.push({ field: 'amountCents', message: 'Le montant doit être supérieur à 0 $.' });
  if (!body.entryDate || body.entryDate > today())
    details.push({ field: 'entryDate', message: 'La date ne peut pas être dans le futur.' });
  if (direction === 'EXPENSE' && !body.supplier?.trim())
    details.push({ field: 'supplier', message: 'Le fournisseur est obligatoire.' });
  const cat = categories().find((c) => c.id === body.categoryId);
  if (!cat) details.push({ field: 'categoryId', message: 'Choisissez une catégorie.' });
  else if (cat.direction !== direction)
    return fail(
      422,
      'CATEGORY_DIRECTION_MISMATCH',
      'Cette catégorie ne correspond pas au sens de l’écriture.',
      [
        {
          field: 'categoryId',
          message:
            direction === 'INCOME'
              ? 'Choisissez une catégorie de recette.'
              : 'Choisissez une catégorie de dépense.',
        },
      ],
    );
  else if (!cat.active)
    return fail(422, 'CATEGORY_INACTIVE', 'Cette catégorie est désactivée.', [
      { field: 'categoryId', message: 'Cette catégorie est désactivée.' },
    ]);
  return details.length
    ? fail(422, 'VALIDATION_FAILED', 'Certains champs sont invalides.', details)
    : null;
}

function build(
  body: EntryRequest,
  direction: Entry['direction'],
  me: { id: string; name: string },
): Entry {
  const cat = categories().find((c) => c.id === body.categoryId)!;
  const contributor = body.contributorId
    ? contributors().find((c) => c.id === body.contributorId)
    : null;
  return {
    id: `e-${Date.now()}`,
    reference: nextReference(),
    direction,
    status: 'DRAFT',
    amountCents: body.amountCents,
    entryDate: body.entryDate,
    category: { id: cat.id, name: cat.name },
    contributor: contributor ? { id: contributor.id, name: contributor.name } : null,
    supplier: direction === 'EXPENSE' ? (body.supplier?.trim() ?? null) : null,
    paymentMethod: body.paymentMethod,
    project: body.project || null,
    description: body.description.trim(),
    source: 'MANUAL',
    attachment: null,
    reverses: null,
    reversedBy: null,
    reversalReason: null,
    createdBy: me,
    createdAt: new Date().toISOString(),
    decidedBy: null,
    decidedAt: null,
    rejectionReason: null,
    validatedBy: null,
    validatedAt: null,
  };
}

const needsApproval = (cents: number) => cents > financeSettings().expenseApprovalThresholdCents;

function record(
  e: Entry,
  actor: { id: string; name: string },
  action: string,
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
) {
  recordAudit({
    actor,
    action,
    entityType: 'Entry',
    entityId: e.id,
    entityLabel: e.reference,
    before: before ?? null,
    after: after ?? null,
  });
}

export const entryWriteRoutes: MockRoute[] = [
  ...(['INCOME', 'EXPENSE'] as const).map((direction): MockRoute => ({
    method: 'POST',
    path: direction === 'INCOME' ? '/entries' : '/expenses',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const body = request.body as EntryRequest;
      const error = invalid(body, direction);
      if (error) return error;
      const e = build(body, direction, actorOf(me));
      entries().unshift(e);
      record(e, actorOf(me), 'ENTRY_CREATED', null, snapshot(e));
      if (direction === 'EXPENSE' && needsApproval(e.amountCents)) {
        e.status = 'SUBMITTED';
        record(e, actorOf(me), 'EXPENSE_SUBMITTED', null, {
          status: 'SUBMITTED',
          amountCents: e.amountCents,
          thresholdCents: financeSettings().expenseApprovalThresholdCents,
        });
      }
      return created(e);
    },
  })),
  {
    method: 'PATCH',
    path: '/entries/:id',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const e = findEntry(request.params.id);
      if (!e) return fail(404, 'NOT_FOUND', 'Écriture introuvable.');
      if (e.status !== 'DRAFT')
        return fail(409, 'ENTRY_NOT_DRAFT', 'Seul un brouillon peut être modifié ou supprimé.');
      const body = {
        ...snapshot(e),
        contributorId: e.contributor?.id,
        supplier: e.supplier ?? undefined,
        paymentMethod: e.paymentMethod,
        project: e.project,
        ...(request.body as Partial<EntryRequest>),
      } as EntryRequest;
      const error = invalid(body, e.direction);
      if (error) return error;
      const before = snapshot(e);
      const next = build(body, e.direction, e.createdBy ?? actorOf(me));
      Object.assign(e, {
        ...next,
        id: e.id,
        reference: e.reference,
        createdAt: e.createdAt,
        status: 'DRAFT',
        attachment: e.attachment,
      });
      if (e.direction === 'EXPENSE' && needsApproval(e.amountCents)) e.status = 'SUBMITTED';
      record(e, actorOf(me), 'ENTRY_UPDATED', before, snapshot(e));
      return ok(e);
    },
  },
  {
    method: 'DELETE',
    path: '/entries/:id',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const e = findEntry(request.params.id);
      if (!e) return fail(404, 'NOT_FOUND', 'Écriture introuvable.');
      if (e.status !== 'DRAFT')
        return fail(409, 'ENTRY_NOT_DRAFT', 'Seul un brouillon peut être modifié ou supprimé.');
      entries().splice(entries().indexOf(e), 1);
      record(e, actorOf(me), 'ENTRY_DELETED', snapshot(e));
      return { status: 204 };
    },
  },
  {
    method: 'POST',
    path: '/entries/:id/attachment',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const e = findEntry(request.params.id);
      if (!e) return fail(404, 'NOT_FOUND', 'Écriture introuvable.');
      if (e.status === 'VALIDATED' || e.status === 'REJECTED')
        return fail(
          409,
          'ENTRY_LOCKED',
          'La pièce d’une écriture validée ou refusée ne peut plus changer.',
        );
      const { fileName, contentType, size } = request.body as {
        fileName: string;
        contentType: string;
        size: number;
      };
      if (!(ATTACHMENT_TYPES as readonly string[]).includes(contentType))
        return fail(422, 'VALIDATION_FAILED', 'Formats acceptés : PDF, JPG ou PNG.', [
          { field: 'contentType', message: 'Formats acceptés : PDF, JPG ou PNG.' },
        ]);
      if (size > MAX_ATTACHMENT_BYTES)
        return fail(422, 'VALIDATION_FAILED', 'Le fichier dépasse 10 Mo.', [
          { field: 'size', message: 'Le fichier dépasse 10 Mo.' },
        ]);
      const key = `entries/${e.id}/${Date.now()}-${encodeURIComponent(fileName)}`;
      return created({
        key,
        uploadUrl: `/mock-upload/${key}`,
        method: 'PUT',
        headers: { 'content-type': contentType },
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      });
    },
  },
  {
    method: 'POST',
    path: '/entries/:id/attachment/confirm',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const e = findEntry(request.params.id);
      if (!e) return fail(404, 'NOT_FOUND', 'Écriture introuvable.');
      const { key, fileName } = request.body as { key: string; fileName: string };
      const stored = mockUploads().get(key);
      if (!stored)
        return fail(422, 'UPLOAD_MISSING', 'Le fichier n’a pas été reçu. Recommencez l’envoi.');
      e.attachment = { name: fileName, type: stored.type, size: stored.size };
      record(e, actorOf(me), 'ATTACHMENT_ADDED', null, {
        attachment: fileName,
        size: stored.size,
        type: stored.type,
      });
      return ok(entryDetail(e));
    },
  },
  {
    method: 'DELETE',
    path: '/entries/:id/attachment',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const e = findEntry(request.params.id);
      if (!e) return fail(404, 'NOT_FOUND', 'Écriture introuvable.');
      if (e.status === 'VALIDATED' || e.status === 'REJECTED')
        return fail(
          409,
          'ENTRY_LOCKED',
          'La pièce d’une écriture validée ou refusée ne peut plus changer.',
        );
      record(e, actorOf(me), 'ATTACHMENT_REMOVED', { attachment: e.attachment?.name });
      e.attachment = null;
      return { status: 204 };
    },
  },
  {
    method: 'GET',
    path: '/settings/finance',
    handler: (request) => {
      const me = guard(request, 'ADMIN', 'FINANCE');
      return isResponse(me) ? me : ok(financeSettings());
    },
  },
];

export const entryDecisionRoutes: MockRoute[] = [
  {
    method: 'POST',
    path: '/entries/:id/validate',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const e = findEntry(request.params.id);
      if (!e) return fail(404, 'NOT_FOUND', 'Écriture introuvable.');
      if (e.status === 'VALIDATED')
        return fail(409, 'ALREADY_VALIDATED', 'Cette écriture est déjà validée.');
      if (e.status === 'SUBMITTED')
        return fail(
          409,
          'APPROVAL_REQUIRED',
          'Cette dépense doit d’abord être approuvée par une autre personne.',
        );
      if (e.status === 'REJECTED')
        return fail(
          409,
          'ENTRY_REJECTED',
          'Cette dépense a été refusée : elle ne peut pas être validée.',
        );
      if (e.direction === 'EXPENSE' && !e.attachment)
        return fail(
          409,
          'ATTACHMENT_REQUIRED',
          'Joignez la facture ou le reçu avant de valider cette dépense.',
        );
      const before = e.status;
      Object.assign(e, {
        status: 'VALIDATED',
        validatedBy: actorOf(me),
        validatedAt: new Date().toISOString(),
      });
      record(e, actorOf(me), 'ENTRY_VALIDATED', { status: before }, snapshot(e));
      return ok(e);
    },
  },
  {
    method: 'POST',
    path: '/entries/:id/reverse',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const e = findEntry(request.params.id);
      if (!e) return fail(404, 'NOT_FOUND', 'Écriture introuvable.');
      const reason = (request.body as { reason?: string })?.reason?.trim() ?? '';
      if (reason.length < 5)
        return fail(422, 'VALIDATION_FAILED', 'Le motif est obligatoire.', [
          { field: 'reason', message: 'Le motif est obligatoire (5 caractères minimum).' },
        ]);
      if (e.status !== 'VALIDATED')
        return fail(
          409,
          'NOT_VALIDATED',
          'Seule une écriture validée se contrepasse ; un brouillon se modifie.',
        );
      if (e.reverses)
        return fail(409, 'CANNOT_REVERSE_REVERSAL', 'Une contrepassation ne se contrepasse pas.');
      if (e.reversedBy)
        return fail(409, 'ALREADY_REVERSED', 'Cette écriture a déjà été contrepassée.');
      const now = new Date().toISOString();
      const reversal: Entry = {
        ...e,
        id: `e-${Date.now()}`,
        reference: nextReference(),
        amountCents: -e.amountCents,
        entryDate: today(),
        description: `Contrepassation de ${e.reference}`,
        attachment: null,
        reverses: { id: e.id, reference: e.reference },
        reversedBy: null,
        reversalReason: reason,
        createdBy: actorOf(me),
        createdAt: now,
        decidedBy: null,
        decidedAt: null,
        validatedBy: actorOf(me),
        validatedAt: now,
      };
      e.reversedBy = { id: reversal.id, reference: reversal.reference };
      entries().unshift(reversal);
      record(e, actorOf(me), 'ENTRY_REVERSED', null, {
        reversalId: reversal.id,
        reversalReference: reversal.reference,
        reason,
      });
      record(reversal, actorOf(me), 'ENTRY_CREATED', null, {
        ...snapshot(reversal),
        reverses: e.reference,
        reason,
      });
      return created(reversal);
    },
  },
];

export const expenseApprovalRoutes: MockRoute[] = [
  ...(['approve', 'reject'] as const).map((decision): MockRoute => ({
    method: 'POST',
    path: `/expenses/:id/${decision}`,
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const e = findEntry(request.params.id);
      if (!e) return fail(404, 'NOT_FOUND', 'Écriture introuvable.');
      if (e.direction !== 'EXPENSE' || e.status !== 'SUBMITTED')
        return fail(
          409,
          'NOT_AWAITING_APPROVAL',
          'Cette dépense n’est pas en attente d’approbation.',
        );
      if (e.createdBy?.id === me.id)
        return fail(
          403,
          'SELF_APPROVAL',
          'Une autre personne doit approuver une dépense que vous avez saisie.',
        );
      const reason = (request.body as { reason?: string } | undefined)?.reason?.trim();
      if (decision === 'reject' && (!reason || reason.length < 5))
        return fail(422, 'VALIDATION_FAILED', 'Le motif est obligatoire.', [
          { field: 'reason', message: 'Le motif est obligatoire (5 caractères minimum).' },
        ]);
      Object.assign(e, {
        status: decision === 'approve' ? 'APPROVED' : 'REJECTED',
        decidedBy: actorOf(me),
        decidedAt: new Date().toISOString(),
        rejectionReason: decision === 'reject' ? reason : null,
      });
      record(
        e,
        actorOf(me),
        decision === 'approve' ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED',
        { status: 'SUBMITTED' },
        { status: e.status, ...(reason ? { reason } : {}) },
      );
      return ok(e);
    },
  })),
  {
    method: 'PUT',
    path: '/settings/finance',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const value = (request.body as { expenseApprovalThresholdCents?: number })
        .expenseApprovalThresholdCents;
      if (!Number.isInteger(value) || value! < 0)
        return fail(422, 'VALIDATION_FAILED', 'Seuil invalide.', [
          { field: 'expenseApprovalThresholdCents', message: 'Entrez un montant positif.' },
        ]);
      const settings = financeSettings();
      const before = { expenseApprovalThresholdCents: settings.expenseApprovalThresholdCents };
      Object.assign(settings, {
        expenseApprovalThresholdCents: value,
        updatedAt: new Date().toISOString(),
        updatedBy: actorOf(me).name,
      });
      recordAudit({
        actor: actorOf(me),
        action: 'SETTINGS_UPDATED',
        entityType: 'Settings',
        entityId: 'finance',
        entityLabel: 'Finances',
        before,
        after: { expenseApprovalThresholdCents: value },
      });
      return ok(settings);
    },
  },
];
