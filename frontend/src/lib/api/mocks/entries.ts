import type { Entry, EntryDetail, EntryDirection, EntryStatus, PaymentMethod } from '../contracts';
import { guard, isResponse } from './auth';
import { auditLog } from './audit';
import { categories, contributors } from './finance';
import { fail, mockStore, ok, paginate, type MockRoute } from './types';

const day = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
const at = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
const people = {
  finance: { id: 'u-finance', name: 'Marc Tremblay' },
  direction: { id: 'u-multi', name: 'Claire Bouchard' },
} as const;

let counter = 0;
export const nextReference = () =>
  `E-${new Date().getFullYear()}-${String(100 + (counter += 1)).padStart(5, '0')}`;

type Seed = Partial<Entry> & {
  direction: EntryDirection;
  amountCents: number;
  categoryId: string;
  days: number;
  status: EntryStatus;
};

function entry({ direction, amountCents, categoryId, days, status, ...rest }: Seed): Entry {
  const cat = categories().find((c) => c.id === categoryId)!;
  const validated = status === 'VALIDATED';
  return {
    id: `e-${(counter += 1)}`,
    reference: `E-${new Date().getFullYear()}-${String(counter).padStart(5, '0')}`,
    direction,
    status,
    amountCents,
    entryDate: day(days),
    category: { id: cat.id, name: cat.name },
    contributor: null,
    supplier: null,
    paymentMethod: 'CHEQUE' as PaymentMethod,
    project: null,
    description: 'Écriture',
    source: 'MANUAL',
    attachment: null,
    reverses: null,
    reversedBy: null,
    reversalReason: null,
    createdBy: people.finance,
    createdAt: at(days),
    decidedBy: null,
    decidedAt: null,
    rejectionReason: null,
    validatedBy: validated ? people.finance : null,
    validatedAt: validated ? at(days - 1) : null,
    ...rest,
  };
}

const contributorRef = (id: string) => {
  const c = contributors().find((k) => k.id === id)!;
  return { id: c.id, name: c.name };
};
const receipt = { name: 'facture.pdf', type: 'application/pdf', size: 48_213 };

/** Demo books: validated income and expenses, drafts, an expense to approve, a reversal. */
export const entries = () =>
  mockStore<Entry[]>('entries', () => {
    const list: Entry[] = [
      entry({
        direction: 'INCOME',
        amountCents: 250_000,
        categoryId: 'c-subventions',
        days: 40,
        status: 'VALIDATED',
        paymentMethod: 'TRANSFER',
        description: 'Subvention de fonctionnement',
        contributor: contributorRef('k-ville'),
      }),
      entry({
        direction: 'INCOME',
        amountCents: 5_000,
        categoryId: 'c-dons',
        days: 12,
        status: 'VALIDATED',
        paymentMethod: 'ONLINE',
        source: 'ONLINE',
        description: 'Don en ligne — Paulette Gingras',
        contributor: contributorRef('k-gingras'),
        createdBy: null,
        validatedBy: null,
      }),
      entry({
        direction: 'INCOME',
        amountCents: 2_500,
        categoryId: 'c-cotisations',
        days: 9,
        status: 'VALIDATED',
        paymentMethod: 'CASH',
        description: 'Cotisation annuelle',
        contributor: contributorRef('k-lavoie'),
      }),
      entry({
        direction: 'INCOME',
        amountCents: 50_000,
        categoryId: 'c-dons',
        days: 6,
        status: 'VALIDATED',
        description: 'Don de fin d’année',
        contributor: contributorRef('k-caisse'),
        project: 'Fête de Noël',
      }),
      entry({
        direction: 'INCOME',
        amountCents: 1_200,
        categoryId: 'c-activites-r',
        days: 2,
        status: 'DRAFT',
        paymentMethod: 'CASH',
        description: 'Billets — sortie au musée',
        project: 'Sorties',
      }),
      entry({
        direction: 'EXPENSE',
        amountCents: 120_000,
        categoryId: 'c-loyer',
        days: 30,
        status: 'VALIDATED',
        paymentMethod: 'TRANSFER',
        supplier: 'Gestion Immobilière Centre-Sud',
        description: 'Loyer de novembre',
        attachment: receipt,
      }),
      entry({
        direction: 'EXPENSE',
        amountCents: 8_745,
        categoryId: 'c-fournitures',
        days: 8,
        status: 'VALIDATED',
        paymentMethod: 'CARD',
        supplier: 'Bureau en Gros',
        description: 'Papier et cartouches',
        attachment: receipt,
      }),
      entry({
        direction: 'EXPENSE',
        amountCents: 64_000,
        categoryId: 'c-activites-d',
        days: 4,
        status: 'SUBMITTED',
        paymentMethod: 'CHEQUE',
        supplier: 'Autobus Laval',
        description: 'Autobus — sortie au Biodôme',
        project: 'Sorties',
        attachment: receipt,
      }),
      entry({
        direction: 'EXPENSE',
        amountCents: 75_500,
        categoryId: 'c-communication',
        days: 3,
        status: 'SUBMITTED',
        paymentMethod: 'CARD',
        supplier: 'Imprimerie du Plateau',
        description: 'Dépliants du 25e anniversaire',
        createdBy: people.direction,
        attachment: receipt,
      }),
      entry({
        direction: 'EXPENSE',
        amountCents: 1_850,
        categoryId: 'c-frais',
        days: 1,
        status: 'DRAFT',
        paymentMethod: 'OTHER',
        supplier: 'Desjardins',
        description: 'Frais de tenue de compte',
      }),
    ];
    // A validated entry corrected by its reversal.
    const original = entry({
      direction: 'INCOME',
      amountCents: 3_000,
      categoryId: 'c-cotisations',
      days: 15,
      status: 'VALIDATED',
      paymentMethod: 'CHEQUE',
      description: 'Cotisation (chèque refusé)',
      contributor: contributorRef('k-morin'),
    });
    const reversal = entry({
      direction: 'INCOME',
      amountCents: -3_000,
      categoryId: 'c-cotisations',
      days: 14,
      status: 'VALIDATED',
      paymentMethod: 'CHEQUE',
      description: `Contrepassation de ${original.reference}`,
      contributor: contributorRef('k-morin'),
      reverses: { id: original.id, reference: original.reference },
      reversalReason: 'Chèque sans provision',
    });
    original.reversedBy = { id: reversal.id, reference: reversal.reference };
    list.push(original, reversal);
    counter = 100;
    return list;
  });

export function totals(list: Entry[]) {
  const income = list
    .filter((e) => e.direction === 'INCOME')
    .reduce((s, e) => s + e.amountCents, 0);
  const expense = list
    .filter((e) => e.direction === 'EXPENSE')
    .reduce((s, e) => s + e.amountCents, 0);
  return {
    count: list.length,
    incomeCents: income,
    expenseCents: expense,
    balanceCents: income - expense,
  };
}

export const findEntry = (id: string) => entries().find((e) => e.id === id);

export const entryDetail = (e: Entry): EntryDetail => ({
  ...e,
  attachment: e.attachment && { ...e.attachment, url: `/mock-upload/${e.id}` },
  history: auditLog()
    .filter((a) => a.entityType === 'Entry' && a.entityId === e.id)
    .reverse()
    .map((a) => ({ at: a.at, action: a.action, actor: a.actor, before: a.before, after: a.after })),
});

export const entryReadRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/entries',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const q = request.query;
      const get = (key: string) => q.get(key) || null;
      const search = get('q')?.toLowerCase();
      const project = get('project')?.toLowerCase();
      const filtered = entries().filter(
        (e) =>
          (!get('from') || e.entryDate >= get('from')!) &&
          (!get('to') || e.entryDate <= get('to')!) &&
          (!get('categoryId') || e.category.id === get('categoryId')) &&
          (!get('contributorId') || e.contributor?.id === get('contributorId')) &&
          (!get('direction') || e.direction === get('direction')) &&
          (!get('status') || e.status === get('status')) &&
          (!get('paymentMethod') || e.paymentMethod === get('paymentMethod')) &&
          (!project || e.project?.toLowerCase().includes(project)) &&
          (!search ||
            [e.reference, e.description, e.supplier ?? ''].some((v) =>
              v.toLowerCase().includes(search),
            )),
      );
      const params = new URLSearchParams(q);
      params.delete('q');
      const sort = params.get('sort') ?? 'entryDate';
      params.set('sort', sort === 'amount' ? 'amountCents' : sort);
      if (!q.get('order')) params.set('order', 'desc');
      const rows = filtered as unknown as Record<string, unknown>[];
      if (sort === 'amount')
        rows.sort(
          (a, b) =>
            (Number(a.amountCents) - Number(b.amountCents)) *
            (params.get('order') === 'desc' ? -1 : 1),
        );
      const page =
        sort === 'amount'
          ? paginate(
              rows,
              new URLSearchParams({
                page: params.get('page') ?? '1',
                pageSize: params.get('pageSize') ?? '25',
              }),
            )
          : paginate(rows, params);
      return ok({ ...page, totals: totals(filtered) });
    },
  },
  {
    method: 'GET',
    path: '/entries/:id',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const found = findEntry(request.params.id);
      return found ? ok(entryDetail(found)) : fail(404, 'NOT_FOUND', 'Écriture introuvable.');
    },
  },
];
