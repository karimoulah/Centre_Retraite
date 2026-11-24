import { AuditLog, Category } from '../../src/database/entities';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

describe('/categories (B6-01)', () => {
  let t: TestApp;
  let finance: SignedIn;
  beforeAll(async () => {
    t = await createTestApp();
    finance = await loginAs(t, 'FINANCE');
  });
  afterAll(() => t.app.close());

  it('lists the default categories by direction, donations flagged as system', async () => {
    const income = await as(t, finance).get('/categories').query({ direction: 'INCOME' }).expect(200);
    expect(income.body.every((c: { direction: string }) => c.direction === 'INCOME')).toBe(true);
    expect(income.body).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Dons', receiptEligible: true, system: true })]));
    const expense = await as(t, finance).get('/categories').query({ direction: 'EXPENSE' }).expect(200);
    expect(expense.body.length).toBeGreaterThan(0);
  });

  it('creates a category and records it', async () => {
    const res = await as(t, finance).post('/categories').send({ name: 'Ventes de pâtisseries', direction: 'INCOME' }).expect(201);
    expect(res.body).toMatchObject({ name: 'Ventes de pâtisseries', direction: 'INCOME', receiptEligible: false, active: true, system: false });
    expect(await t.dataSource.getRepository(AuditLog).countBy({ action: 'CATEGORY_CREATED', entityId: res.body.id })).toBe(1);
  });

  it('refuses a receipt flag on an expense category and a duplicate name in the same direction', async () => {
    const bad = await as(t, finance).post('/categories').send({ name: 'Essence', direction: 'EXPENSE', receiptEligible: true }).expect(422);
    expect(bad.body.details).toEqual([expect.objectContaining({ field: 'receiptEligible' })]);
    const dup = await as(t, finance).post('/categories').send({ name: 'frais BANCAIRES', direction: 'EXPENSE' }).expect(409);
    expect(dup.body).toMatchObject({ code: 'CATEGORY_EXISTS', details: [{ field: 'name' }] });
    await as(t, finance).post('/categories').send({ name: 'Frais bancaires', direction: 'INCOME' }).expect(201);
  });

  it('deactivates instead of deleting, and never changes the direction', async () => {
    const created = await as(t, finance).post('/categories').send({ name: 'Taxis', direction: 'EXPENSE' }).expect(201);
    const off = await as(t, finance).patch(`/categories/${created.body.id}`).send({ active: false }).expect(200);
    expect(off.body.active).toBe(false);
    const active = await as(t, finance).get('/categories').query({ active: 'true' }).expect(200);
    expect(active.body.map((c: { id: string }) => c.id)).not.toContain(created.body.id);
    await as(t, finance).patch(`/categories/${created.body.id}`).send({ direction: 'INCOME' }).expect(422);
    await expect(
      t.dataSource.getRepository(Category).update(created.body.id, { direction: 'INCOME' }),
    ).rejects.toThrow('category direction cannot change');
    expect(await t.dataSource.getRepository(AuditLog).countBy({ action: 'CATEGORY_DEACTIVATED', entityId: created.body.id })).toBe(1);
  });

  it('keeps the donation category active', async () => {
    const donation = await t.dataSource.getRepository(Category).findOneByOrFail({ code: 'DONATION' });
    const res = await as(t, finance).patch(`/categories/${donation.id}`).send({ active: false }).expect(409);
    expect(res.body.code).toBe('SYSTEM_CATEGORY');
    await as(t, finance).patch(`/categories/${donation.id}`).send({ name: 'Dons et legs' }).expect(200);
  });

  it('is reserved to the finance role', async () => {
    await as(t, await loginAs(t, 'ADMIN')).get('/categories').expect(403);
  });
});
