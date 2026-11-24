import type {
  Category,
  Contributor,
  ContributorRequest,
  CreateCategoryRequest,
  EntryDirection,
  UpdateCategoryRequest,
} from '../contracts';
import { guard, isResponse } from './auth';
import { recordAudit } from './audit';
import { created, fail, mockStore, ok, paginate, type MockRoute } from './types';

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const category = (
  id: string,
  name: string,
  direction: EntryDirection,
  extra: Partial<Category> = {},
): Category => ({
  id,
  name,
  direction,
  receiptEligible: false,
  active: true,
  system: false,
  createdAt: daysAgo(90),
  updatedAt: daysAgo(90),
  ...extra,
});

/** Same default categories as the API migration. */
export const categories = () =>
  mockStore<Category[]>('categories', () => [
    category('c-dons', 'Dons', 'INCOME', { receiptEligible: true, system: true }),
    category('c-cotisations', 'Cotisations des membres', 'INCOME'),
    category('c-subventions', 'Subventions', 'INCOME'),
    category('c-activites-r', 'Activités et sorties', 'INCOME'),
    category('c-loyer', 'Loyer et charges', 'EXPENSE'),
    category('c-fournitures', 'Fournitures de bureau', 'EXPENSE'),
    category('c-activites-d', 'Activités et sorties', 'EXPENSE'),
    category('c-communication', 'Communication et impression', 'EXPENSE'),
    category('c-frais', 'Frais bancaires', 'EXPENSE'),
    category('c-ancienne', 'Bingo (ancien)', 'INCOME', { active: false }),
  ]);

const contributor = (id: string, name: string, extra: Partial<Contributor> = {}): Contributor => ({
  id,
  kind: 'INDIVIDUAL',
  name,
  email: null,
  phone: null,
  address: null,
  notes: null,
  member: null,
  createdAt: daysAgo(60),
  ...extra,
});

export const contributors = () =>
  mockStore<Contributor[]>('contributors', () => [
    contributor('k-lavoie', 'Robert Lavoie', {
      email: 'membre@lesaines.test',
      member: { id: 'm-member', memberNumber: 'M-0001', name: 'Robert Lavoie' },
    }),
    contributor('k-caisse', 'Caisse populaire du quartier', {
      kind: 'ORGANIZATION',
      email: 'dons@caisse.example',
      phone: '514 555-0400',
    }),
    contributor('k-ville', 'Ville de Montréal — arrondissement', { kind: 'ORGANIZATION' }),
    contributor('k-gingras', 'Paulette Gingras', { email: 'paulette.gingras@exemple.org' }),
    contributor('k-morin', 'Gérard Morin', {
      email: 'gerard.morin@exemple.org',
      phone: '514 555-1037',
    }),
  ]);

const sortCategories = (list: Category[]) =>
  [...list].sort(
    (a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'fr-CA'),
  );

export const categoryRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/categories',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const direction = request.query.get('direction');
      const active = request.query.get('active');
      return ok(
        sortCategories(categories()).filter(
          (c) =>
            (!direction || c.direction === direction) && (!active || String(c.active) === active),
        ),
      );
    },
  },
  {
    method: 'POST',
    path: '/categories',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const body = request.body as CreateCategoryRequest;
      if (body.receiptEligible && body.direction !== 'INCOME') {
        return fail(422, 'VALIDATION_FAILED', 'Certains champs sont invalides.', [
          {
            field: 'receiptEligible',
            message: 'Seule une catégorie de recette peut donner droit à un reçu.',
          },
        ]);
      }
      if (
        categories().some(
          (c) =>
            c.direction === body.direction &&
            c.name.toLowerCase() === body.name.trim().toLowerCase(),
        )
      ) {
        return fail(409, 'CATEGORY_EXISTS', 'Une catégorie porte déjà ce nom dans ce sens.', [
          { field: 'name', message: 'Une catégorie porte déjà ce nom dans ce sens.' },
        ]);
      }
      const item = category(`c-${Date.now()}`, body.name.trim(), body.direction, {
        receiptEligible: !!body.receiptEligible,
        createdAt: new Date().toISOString(),
      });
      categories().push(item);
      recordAudit({
        actor: { id: me.id, name: `${me.firstName} ${me.lastName}` },
        action: 'CATEGORY_CREATED',
        entityType: 'Category',
        entityId: item.id,
        entityLabel: item.name,
        after: { ...body },
      });
      return created(item);
    },
  },
  {
    method: 'PATCH',
    path: '/categories/:id',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const item = categories().find((c) => c.id === request.params.id);
      if (!item) return fail(404, 'NOT_FOUND', 'Catégorie introuvable.');
      const body = request.body as UpdateCategoryRequest;
      if (item.system && (body.active === false || body.receiptEligible === false)) {
        return fail(
          409,
          'SYSTEM_CATEGORY',
          'Cette catégorie est utilisée par les dons en ligne : elle reste active.',
        );
      }
      const before = Object.fromEntries(
        Object.keys(body).map((k) => [k, item[k as keyof Category]]),
      );
      Object.assign(item, body, { updatedAt: new Date().toISOString() });
      recordAudit({
        actor: { id: me.id, name: `${me.firstName} ${me.lastName}` },
        action: body.active === false ? 'CATEGORY_DEACTIVATED' : 'CATEGORY_UPDATED',
        entityType: 'Category',
        entityId: item.id,
        entityLabel: item.name,
        before,
        after: { ...body },
      });
      return ok(item);
    },
  },
];

export const contributorRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/contributors',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const kind = request.query.get('kind');
      const params = new URLSearchParams(request.query);
      if (!params.get('sort')) params.set('sort', 'name');
      return ok(
        paginate(
          contributors().filter((c) => !kind || c.kind === kind) as unknown as Record<
            string,
            unknown
          >[],
          params,
          ['name', 'email'],
        ),
      );
    },
  },
  {
    method: 'GET',
    path: '/contributors/:id',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const item = contributors().find((c) => c.id === request.params.id);
      return item ? ok(item) : fail(404, 'NOT_FOUND', 'Contributeur introuvable.');
    },
  },
  {
    method: 'POST',
    path: '/contributors',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const body = request.body as ContributorRequest;
      const email = body.email?.trim().toLowerCase() || null;
      if (email && contributors().some((c) => c.email === email)) {
        return fail(409, 'EMAIL_TAKEN', 'Un contributeur existe déjà avec ce courriel.', [
          { field: 'email', message: 'Un contributeur existe déjà avec ce courriel.' },
        ]);
      }
      const item = contributor(`k-${Date.now()}`, body.name.trim(), {
        kind: body.kind,
        email,
        phone: body.phone || null,
        address: body.address || null,
        notes: body.notes || null,
        createdAt: new Date().toISOString(),
      });
      contributors().push(item);
      recordAudit({
        actor: { id: me.id, name: `${me.firstName} ${me.lastName}` },
        action: 'CONTRIBUTOR_CREATED',
        entityType: 'Contributor',
        entityId: item.id,
        entityLabel: item.name,
        after: { name: item.name, email },
      });
      return created(item);
    },
  },
  {
    method: 'PATCH',
    path: '/contributors/:id',
    handler: (request) => {
      const me = guard(request, 'FINANCE');
      if (isResponse(me)) return me;
      const item = contributors().find((c) => c.id === request.params.id);
      if (!item) return fail(404, 'NOT_FOUND', 'Contributeur introuvable.');
      const body = request.body as Partial<ContributorRequest>;
      const email =
        body.email === undefined ? item.email : body.email?.trim().toLowerCase() || null;
      if (email && contributors().some((c) => c.id !== item.id && c.email === email)) {
        return fail(409, 'EMAIL_TAKEN', 'Un contributeur existe déjà avec ce courriel.', [
          { field: 'email', message: 'Un contributeur existe déjà avec ce courriel.' },
        ]);
      }
      const before = { name: item.name, email: item.email, phone: item.phone };
      Object.assign(item, {
        ...body,
        email,
        phone: body.phone === undefined ? item.phone : body.phone || null,
        address: body.address === undefined ? item.address : body.address || null,
        notes: body.notes === undefined ? item.notes : body.notes || null,
      });
      recordAudit({
        actor: { id: me.id, name: `${me.firstName} ${me.lastName}` },
        action: 'CONTRIBUTOR_UPDATED',
        entityType: 'Contributor',
        entityId: item.id,
        entityLabel: item.name,
        before,
        after: { name: item.name, email: item.email, phone: item.phone },
      });
      return ok(item);
    },
  },
];
