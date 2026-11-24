import request from 'supertest';

import { AuditLog, Entry } from '../../src/database/entities';
import { createCategory, createEntry } from '../factories/finance';
import { createTestApp, type TestApp } from '../setup/app';
import { as, loginAs, type SignedIn } from '../setup/auth';

const PDF = Buffer.from('%PDF-1.4\n% reçu de test\n%%EOF');
const path = (url: string) => new URL(url).pathname;

describe('Receipts on entries (B6-08)', () => {
  let t: TestApp;
  let finance: SignedIn;
  let expenseCategory: string;
  beforeAll(async () => {
    t = await createTestApp();
    finance = await loginAs(t, 'FINANCE');
    expenseCategory = (await createCategory(t.dataSource, 'EXPENSE')).id;
  });
  afterAll(() => t.app.close());

  const draftExpense = () => createEntry(t.dataSource, { direction: 'EXPENSE', categoryId: expenseCategory, supplier: 'Hydro-Québec', amountCents: 8000 });
  const upload = async (entryId: string, contentType = 'application/pdf', body = PDF) => {
    const signed = await as(t, finance).post(`/entries/${entryId}/attachment`).send({ fileName: 'Facture été.pdf', contentType, size: body.length }).expect(201);
    expect(signed.body).toMatchObject({ method: 'PUT', key: expect.stringMatching(new RegExp(`^entries/${entryId}/.+-Facture-ete\\.pdf$`)) });
    await request(t.http).put(path(signed.body.uploadUrl)).set('content-type', contentType).send(body).expect(200);
    return signed.body.key as string;
  };

  it('signs an upload URL, receives the file, attaches it and serves it through a short link', async () => {
    const entry = await draftExpense();
    const key = await upload(entry.id);
    const res = await as(t, finance).post(`/entries/${entry.id}/attachment/confirm`).send({ key, fileName: 'Facture été.pdf' }).expect(200);
    expect(res.body.attachment).toMatchObject({ name: 'Facture été.pdf', type: 'application/pdf', size: PDF.length, url: expect.any(String) });
    const file = await request(t.http).get(path(res.body.attachment.url)).expect(200);
    expect(file.headers['content-disposition']).toContain('Facture%20%C3%A9t%C3%A9.pdf');
    expect(Buffer.from(file.body).toString()).toContain('%PDF-1.4');
    expect(await t.dataSource.getRepository(AuditLog).countBy({ action: 'ATTACHMENT_ADDED', entityId: entry.id })).toBe(1);
  });

  it('accepts only PDF, JPG or PNG of 10 MB or less', async () => {
    const entry = await draftExpense();
    const type = await as(t, finance).post(`/entries/${entry.id}/attachment`).send({ fileName: 'a.exe', contentType: 'application/x-msdownload', size: 10 }).expect(422);
    expect(type.body.details).toEqual([expect.objectContaining({ field: 'contentType' })]);
    await as(t, finance).post(`/entries/${entry.id}/attachment`).send({ fileName: 'gros.pdf', contentType: 'application/pdf', size: 10 * 1024 * 1024 + 1 }).expect(422);
  });

  it('refuses a forged or mismatched upload and a confirmation without file', async () => {
    const entry = await draftExpense();
    const signed = await as(t, finance).post(`/entries/${entry.id}/attachment`).send({ fileName: 'r.png', contentType: 'image/png', size: 4 }).expect(201);
    await request(t.http).put(path(signed.body.uploadUrl)).set('content-type', 'text/html').send('<b>x</b>').expect(422);
    await request(t.http).put(`${path(signed.body.uploadUrl)}x`).set('content-type', 'image/png').send(Buffer.from('abcd')).expect(403);
    const missing = await as(t, finance).post(`/entries/${entry.id}/attachment/confirm`).send({ key: signed.body.key, fileName: 'r.png' }).expect(422);
    expect(missing.body.code).toBe('UPLOAD_MISSING');
    const other = await draftExpense();
    await as(t, finance).post(`/entries/${other.id}/attachment/confirm`).send({ key: signed.body.key, fileName: 'r.png' }).expect(422);
  });

  it('requires the receipt to validate an expense, then locks it', async () => {
    const entry = await draftExpense();
    const blocked = await as(t, finance).post(`/entries/${entry.id}/validate`).expect(409);
    expect(blocked.body.code).toBe('ATTACHMENT_REQUIRED');
    const key = await upload(entry.id);
    await as(t, finance).post(`/entries/${entry.id}/attachment/confirm`).send({ key, fileName: 'f.pdf' }).expect(200);
    await as(t, finance).post(`/entries/${entry.id}/validate`).expect(200);
    const locked = await as(t, finance).delete(`/entries/${entry.id}/attachment`).expect(409);
    expect(locked.body.code).toBe('ENTRY_LOCKED');
    expect((await t.dataSource.getRepository(Entry).findOneByOrFail({ id: entry.id })).attachmentName).toBe('f.pdf');
  });

  it('lets finance remove the receipt of a draft', async () => {
    const entry = await draftExpense();
    const key = await upload(entry.id);
    await as(t, finance).post(`/entries/${entry.id}/attachment/confirm`).send({ key, fileName: 'f.pdf' }).expect(200);
    await as(t, finance).delete(`/entries/${entry.id}/attachment`).expect(204);
    expect((await as(t, finance).get(`/entries/${entry.id}`).expect(200)).body.attachment).toBeNull();
  });
});
