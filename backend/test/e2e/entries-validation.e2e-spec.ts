import { AuditLog, Entry } from '../../src/database/entities';
import { createCategory, today } from '../factories/finance';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('POST /entries/:id/validate and /reverse (B6-10)', () => {
  let t: TestApp;
  let finance: SignedIn;
  let other: SignedIn;
  let income: string;
  let expense: string;
  beforeAll(async () => {
    t = await createTestApp();
    finance = await loginAs(t, 'FINANCE');
    other = await loginAs(t, 'FINANCE');
    income = (await createCategory(t.dataSource, 'INCOME')).id;
    expense = (await createCategory(t.dataSource, 'EXPENSE')).id;
    await as(t, await loginAs(t, 'ADMIN')).put('/settings/finance').send({ expenseApprovalThresholdCents: 50_000 }).expect(200);
  });
  afterAll(() => t.app.close());

  const newIncome = async (amountCents = 15_000) =>
    (await as(t, finance).post('/entries').send({ amountCents, entryDate: today(), categoryId: income, paymentMethod: 'CASH', description: 'Quête' }).expect(201)).body;
  const newExpense = async (amountCents: number) =>
    (
      await as(t, finance)
        .post('/expenses')
        .send({ amountCents, entryDate: today(), categoryId: expense, paymentMethod: 'CARD', supplier: 'Costco', description: 'Collations' })
        .expect(201)
    ).body;

  it('validates a draft: final, recorded with its author', async () => {
    const entry = await newIncome();
    const res = await as(t, finance).post(`/entries/${entry.id}/validate`).expect(200);
    expect(res.body).toMatchObject({ status: 'VALIDATED', validatedBy: { id: finance.user.id }, validatedAt: expect.any(String) });
    expect(await t.dataSource.getRepository(AuditLog).countBy({ action: 'ENTRY_VALIDATED', entityId: entry.id })).toBe(1);
    const again = await as(t, finance).post(`/entries/${entry.id}/validate`).expect(409);
    expect(again.body.code).toBe('ALREADY_VALIDATED');
    const edit = await as(t, finance).patch(`/entries/${entry.id}`).send({ amountCents: 1 }).expect(409);
    expect(edit.body.code).toBe('ENTRY_NOT_DRAFT');
  });

  it('validates an expense above the threshold only once approved', async () => {
    const entry = await newExpense(70_000);
    const blocked = await as(t, finance).post(`/entries/${entry.id}/validate`).expect(409);
    expect(blocked.body.code).toBe('APPROVAL_REQUIRED');
    await as(t, other).post(`/expenses/${entry.id}/approve`).expect(200);
    await t.dataSource.getRepository(Entry).update(entry.id, { attachmentKey: `entries/${entry.id}/f.pdf`, attachmentName: 'f.pdf' });
    await as(t, finance).post(`/entries/${entry.id}/validate`).expect(200);
  });

  it('sends a draft expense to approval when the threshold was lowered since', async () => {
    const entry = await newExpense(30_000);
    await as(t, await loginAs(t, 'ADMIN')).put('/settings/finance').send({ expenseApprovalThresholdCents: 20_000 }).expect(200);
    const res = await as(t, finance).post(`/entries/${entry.id}/validate`).expect(200);
    expect(res.body.status).toBe('SUBMITTED');
    await as(t, await loginAs(t, 'ADMIN')).put('/settings/finance').send({ expenseApprovalThresholdCents: 50_000 }).expect(200);
  });

  it('reverses a validated entry with the exact opposite amount; the net balance returns to zero', async () => {
    const entry = await newIncome(12_345);
    await as(t, finance).post(`/entries/${entry.id}/validate`).expect(200);
    await as(t, finance).post(`/entries/${entry.id}/reverse`).send({ reason: 'non' }).expect(422);
    const res = await as(t, finance).post(`/entries/${entry.id}/reverse`).send({ reason: 'Chèque sans provision' }).expect(201);
    expect(res.body).toMatchObject({
      status: 'VALIDATED',
      amountCents: -12_345,
      direction: 'INCOME',
      category: { id: income },
      reverses: { id: entry.id, reference: entry.reference },
      reversalReason: 'Chèque sans provision',
    });
    const original = await as(t, finance).get(`/entries/${entry.id}`).expect(200);
    expect(original.body.reversedBy).toEqual({ id: res.body.id, reference: res.body.reference });
    const net = await as(t, finance).get('/entries').query({ q: entry.reference }).expect(200);
    expect(net.body.totals).toMatchObject({ count: 2, incomeCents: 0, balanceCents: 0 });
  });

  it('refuses to reverse twice, to reverse a reversal or a draft', async () => {
    const entry = await newIncome();
    const draft = await as(t, finance).post(`/entries/${entry.id}/reverse`).send({ reason: 'Erreur de saisie' }).expect(409);
    expect(draft.body.code).toBe('NOT_VALIDATED');
    await as(t, finance).post(`/entries/${entry.id}/validate`).expect(200);
    const reversal = await as(t, finance).post(`/entries/${entry.id}/reverse`).send({ reason: 'Erreur de saisie' }).expect(201);
    const twice = await as(t, finance).post(`/entries/${entry.id}/reverse`).send({ reason: 'Encore une fois' }).expect(409);
    expect(twice.body.code).toBe('ALREADY_REVERSED');
    const ofReversal = await as(t, finance).post(`/entries/${reversal.body.id}/reverse`).send({ reason: 'Annuler la correction' }).expect(409);
    expect(ofReversal.body.code).toBe('CANNOT_REVERSE_REVERSAL');
  });
});
