import type {
  AgeCategory,
  Consent,
  Member,
  MembershipApplication,
  MembershipRequest,
  MembershipSettings,
  UpdateConsentsRequest,
  UpdateMemberRequest,
  UpdateMyProfileRequest,
} from '../contracts';
import { actorOf, currentMockUser, guard, isResponse, unauthorized } from './auth';
import { recordAudit } from './audit';
import { created, fail, mockStore, ok, paginate, type MockRoute } from './types';

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
const consent = (granted: boolean, days = 30): Consent => ({ granted, updatedAt: granted ? daysAgo(days) : null });

const firstNames = ['Lise', 'Gérard', 'Jacqueline', 'Michel', 'Françoise', 'Yvon', 'Thérèse', 'Raymond', 'Huguette', 'Normand', 'Denise', 'Gilles', 'Claudette', 'Réjean', 'Pierrette', 'Marcel', 'Ginette', 'Jean-Guy', 'Louise', 'Roger', 'Suzanne', 'Bernard', 'Carmen', 'André'];
const lastNames = ['Gauthier', 'Morin', 'Lefebvre', 'Pelletier', 'Bélanger', 'Lévesque', 'Bergeron', 'Leblanc', 'Paquette', 'Girard', 'Simard', 'Boucher', 'Caron', 'Beaulieu', 'Cloutier', 'Dubé', 'Poirier', 'Fortin', 'Ouellet', 'Gagné', 'Roy', 'Côté', 'Tremblay', 'Martin'];
const categories: AgeCategory[] = ['50_64', '65_74', '75_84', '85_PLUS'];

export const members = () =>
  mockStore<Member[]>('members', () => [
    {
      id: 'm-member',
      memberNumber: 'M-0001',
      firstName: 'Robert',
      lastName: 'Lavoie',
      email: 'membre@lesaines.test',
      phone: '514 555-0142',
      address: '123, rue Exemple\nMontréal (Québec)',
      ageCategory: '75_84',
      birthDate: '1948-03-12',
      active: true,
      joinedAt: daysAgo(400),
      consents: { birthdayWishes: consent(true, 400), newsletter: consent(false), testimonialPublication: consent(true, 60) },
    },
    ...firstNames.map((firstName, i) => ({
      id: `m-${i + 2}`,
      memberNumber: `M-${String(i + 2).padStart(4, '0')}`,
      firstName,
      lastName: lastNames[i],
      email: `${firstName.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}.${lastNames[i].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}@exemple.org`,
      phone: i % 3 === 0 ? null : `514 555-${String(1000 + i * 37).slice(0, 4)}`,
      address: null,
      ageCategory: categories[i % 4],
      birthDate: i % 2 === 0 ? `19${45 + (i % 20)}-0${(i % 9) + 1}-1${i % 9}` : null,
      active: i !== 5,
      joinedAt: daysAgo(30 + i * 11),
      consents: { birthdayWishes: consent(i % 2 === 0), newsletter: consent(i % 3 === 0), testimonialPublication: consent(false) },
    })),
  ]);

const application = (id: string, status: MembershipRequest['status'], firstName: string, lastName: string, days: number, extra: Partial<MembershipRequest> = {}): MembershipRequest => ({
  id,
  status,
  firstName,
  lastName,
  email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@exemple.org`.normalize('NFD').replace(/[̀-ͯ]/g, ''),
  phone: '514 555-0199',
  address: undefined,
  ageCategory: '65_74',
  birthDate: null,
  birthdayWishesConsent: true,
  newsletterConsent: false,
  submittedAt: daysAgo(days),
  decidedAt: status === 'PENDING' ? null : daysAgo(days - 1),
  decidedBy: status === 'PENDING' ? null : 'Aminata Diallo',
  rejectionReason: null,
  memberId: null,
  ...extra,
});

export const membershipRequests = () =>
  mockStore<MembershipRequest[]>('membership-requests', () => [
    application('r-1', 'PENDING', 'Hélène', 'Martel', 1, { ageCategory: '75_84', birthDate: '1949-06-02' }),
    application('r-2', 'PENDING', 'Antoine', 'Rioux', 2),
    application('r-3', 'PENDING', 'Monique', 'Sauvé', 3, { ageCategory: '85_PLUS' }),
    application('r-4', 'APPROVED', 'Paulette', 'Gingras', 12, { memberId: 'm-2' }),
    application('r-5', 'REJECTED', 'Test', 'Robot', 15, { rejectionReason: 'Demande en double.' }),
  ]);

export const membershipSettings = () =>
  mockStore<MembershipSettings>('membership-settings', () => ({ autoApprove: false, updatedAt: null, updatedBy: null }));

function createMember(request: MembershipRequest): Member {
  const list = members();
  const member: Member = {
    id: `m-${Date.now()}`,
    memberNumber: `M-${String(list.length + 1).padStart(4, '0')}`,
    firstName: request.firstName,
    lastName: request.lastName,
    email: request.email,
    phone: request.phone ?? null,
    address: request.address ?? null,
    ageCategory: request.ageCategory,
    birthDate: request.birthDate ?? null,
    active: true,
    joinedAt: new Date().toISOString(),
    consents: {
      birthdayWishes: consent(request.birthdayWishesConsent, 0),
      newsletter: consent(request.newsletterConsent, 0),
      testimonialPublication: consent(false),
    },
  };
  list.push(member);
  return member;
}

const label = (r: { firstName: string; lastName: string }) => `${r.firstName} ${r.lastName}`;
const myMember = (email: string) => members().find((m) => m.email === email);

export const membershipRoutes: MockRoute[] = [
  {
    method: 'POST',
    path: '/memberships',
    handler: ({ body }) => {
      const data = body as MembershipApplication;
      if (!data.turnstileToken) return fail(400, 'CAPTCHA_REQUIRED', 'La vérification anti-robot a échoué.');
      if (members().some((m) => m.email.toLowerCase() === data.email.toLowerCase())) {
        return fail(409, 'ALREADY_MEMBER', 'Cette adresse est déjà celle d’un membre.', [{ field: 'email', message: 'Cette adresse est déjà celle d’un membre. Connectez-vous à votre espace.' }]);
      }
      const { turnstileToken: _t, ...rest } = data;
      const request: MembershipRequest = { ...rest, id: `r-${Date.now()}`, status: 'PENDING', submittedAt: new Date().toISOString(), decidedAt: null, decidedBy: null, rejectionReason: null, memberId: null };
      if (membershipSettings().autoApprove) {
        const member = createMember(request);
        Object.assign(request, { status: 'APPROVED', decidedAt: request.submittedAt, decidedBy: 'Approbation automatique', memberId: member.id });
      }
      membershipRequests().unshift(request);
      recordAudit({ actor: null, action: 'MEMBERSHIP_SUBMITTED', entityType: 'MembershipRequest', entityId: request.id, entityLabel: label(request), after: { status: request.status } });
      return created({ id: request.id, status: request.status });
    },
  },
  {
    method: 'GET',
    path: '/memberships',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const status = request.query.get('status');
      const items = membershipRequests()
        .filter((r) => !status || r.status === status)
        .map((r) => ({ ...r, name: `${r.lastName} ${r.firstName}` }));
      return ok(paginate(items, request.query, ['firstName', 'lastName', 'email']));
    },
  },
  {
    method: 'GET',
    path: '/memberships/:id',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const found = membershipRequests().find((r) => r.id === request.params.id);
      return found ? ok(found) : fail(404, 'NOT_FOUND', 'Demande introuvable.');
    },
  },
  ...(['approve', 'reject'] as const).map(
    (decision): MockRoute => ({
      method: 'POST',
      path: `/memberships/:id/${decision}`,
      handler: (request) => {
        const me = guard(request, 'ADMIN');
        if (isResponse(me)) return me;
        const found = membershipRequests().find((r) => r.id === request.params.id);
        if (!found) return fail(404, 'NOT_FOUND', 'Demande introuvable.');
        if (found.status !== 'PENDING') {
          return fail(409, 'ALREADY_DECIDED', `Cette demande a déjà été traitée (${found.status === 'APPROVED' ? 'approuvée' : 'refusée'} par ${found.decidedBy}).`);
        }
        const reason = (request.body as { reason?: string } | undefined)?.reason?.trim();
        if (decision === 'reject' && (!reason || reason.length < 5)) {
          return fail(422, 'VALIDATION_FAILED', 'Le motif est obligatoire.', [{ field: 'reason', message: 'Le motif est obligatoire.' }]);
        }
        Object.assign(found, {
          status: decision === 'approve' ? 'APPROVED' : 'REJECTED',
          decidedAt: new Date().toISOString(),
          decidedBy: actorOf(me).name,
          rejectionReason: decision === 'reject' ? reason : null,
          memberId: decision === 'approve' ? createMember(found).id : null,
        });
        recordAudit({ actor: actorOf(me), action: decision === 'approve' ? 'MEMBERSHIP_APPROVED' : 'MEMBERSHIP_REJECTED', entityType: 'MembershipRequest', entityId: found.id, entityLabel: label(found), before: { status: 'PENDING' }, after: { status: found.status, ...(reason ? { reason } : {}) } });
        return ok(found);
      },
    }),
  ),
  {
    method: 'GET',
    path: '/settings/membership',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      return isResponse(me) ? me : ok(membershipSettings());
    },
  },
  {
    method: 'PUT',
    path: '/settings/membership',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const settings = membershipSettings();
      const before = { autoApprove: settings.autoApprove };
      Object.assign(settings, { autoApprove: !!(request.body as MembershipSettings).autoApprove, updatedAt: new Date().toISOString(), updatedBy: actorOf(me).name });
      recordAudit({ actor: actorOf(me), action: 'SETTINGS_UPDATED', entityType: 'Settings', entityId: 'membership', entityLabel: 'Adhésions', before, after: { autoApprove: settings.autoApprove } });
      return ok(settings);
    },
  },
  {
    method: 'GET',
    path: '/members',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const status = request.query.get('status');
      const age = request.query.get('ageCategory');
      const items = members()
        .filter((m) => !status || (status === 'active' ? m.active : !m.active))
        .filter((m) => !age || m.ageCategory === age)
        .map((m) => ({ ...m, name: `${m.lastName} ${m.firstName}` }));
      return ok(paginate(items, request.query, ['firstName', 'lastName', 'email', 'memberNumber']));
    },
  },
  {
    method: 'GET',
    path: '/members/:id',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const found = members().find((m) => m.id === request.params.id);
      return found ? ok(found) : fail(404, 'NOT_FOUND', 'Membre introuvable.');
    },
  },
  {
    method: 'PATCH',
    path: '/members/:id',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const found = members().find((m) => m.id === request.params.id);
      if (!found) return fail(404, 'NOT_FOUND', 'Membre introuvable.');
      const body = request.body as UpdateMemberRequest;
      const before = Object.fromEntries(Object.keys(body).map((k) => [k, found[k as keyof Member]]));
      Object.assign(found, body);
      recordAudit({ actor: actorOf(me), action: 'MEMBER_UPDATED', entityType: 'Member', entityId: found.id, entityLabel: label(found), before, after: { ...body } });
      return ok(found);
    },
  },
  {
    method: 'POST',
    path: '/members/:id/deactivate',
    handler: (request) => {
      const me = guard(request, 'ADMIN');
      if (isResponse(me)) return me;
      const found = members().find((m) => m.id === request.params.id);
      if (!found) return fail(404, 'NOT_FOUND', 'Membre introuvable.');
      if (!found.active) return fail(409, 'ALREADY_INACTIVE', 'Ce membre est déjà désactivé.');
      found.active = false;
      recordAudit({ actor: actorOf(me), action: 'MEMBER_DEACTIVATED', entityType: 'Member', entityId: found.id, entityLabel: label(found), before: { active: true }, after: { active: false } });
      return ok(found);
    },
  },
  {
    method: 'GET',
    path: '/me/profile',
    handler: (request) => {
      const account = currentMockUser(request);
      if (!account) return unauthorized();
      const member = myMember(account.email);
      return member ? ok(member) : fail(404, 'NOT_A_MEMBER', 'Aucune fiche de membre pour ce compte.');
    },
  },
  {
    method: 'PATCH',
    path: '/me/profile',
    handler: (request) => {
      const account = currentMockUser(request);
      if (!account) return unauthorized();
      const member = myMember(account.email);
      if (!member) return fail(404, 'NOT_A_MEMBER', 'Aucune fiche de membre pour ce compte.');
      const { phone, address } = request.body as UpdateMyProfileRequest;
      const before = { phone: member.phone, address: member.address };
      Object.assign(member, { phone: phone || null, address: address || null });
      recordAudit({ actor: actorOf(account), action: 'PROFILE_UPDATED', entityType: 'Member', entityId: member.id, entityLabel: label(member), before, after: { phone: member.phone, address: member.address } });
      return ok(member);
    },
  },
  {
    method: 'GET',
    path: '/me/consents',
    handler: (request) => {
      const account = currentMockUser(request);
      if (!account) return unauthorized();
      const member = myMember(account.email);
      return member ? ok(member.consents) : fail(404, 'NOT_A_MEMBER', 'Aucune fiche de membre pour ce compte.');
    },
  },
  {
    method: 'PUT',
    path: '/me/consents',
    handler: (request) => {
      const account = currentMockUser(request);
      if (!account) return unauthorized();
      const member = myMember(account.email);
      if (!member) return fail(404, 'NOT_A_MEMBER', 'Aucune fiche de membre pour ce compte.');
      const body = request.body as UpdateConsentsRequest;
      const before = Object.fromEntries(Object.keys(body).map((k) => [k, member.consents[k as keyof Member['consents']].granted]));
      for (const [key, granted] of Object.entries(body)) {
        const current = member.consents[key as keyof Member['consents']];
        if (current && current.granted !== granted) {
          member.consents[key as keyof Member['consents']] = { granted: !!granted, updatedAt: new Date().toISOString() };
        }
      }
      recordAudit({ actor: actorOf(account), action: 'CONSENTS_UPDATED', entityType: 'Member', entityId: member.id, entityLabel: label(member), before, after: { ...body } });
      return ok(member.consents);
    },
  },
];
