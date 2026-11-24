import { BrevoMailService, parseAddress } from './brevo-mail.service';

describe('BrevoMailService', () => {
  const ok = () => Promise.resolve(new Response('{}', { status: 201 }));

  it('calls the transactional API with the sandbox header in sandbox mode', async () => {
    const fetchImpl = jest.fn(ok) as unknown as typeof fetch;
    const service = new BrevoMailService({ apiKey: 'k', from: 'Les Aînés <info@lesaines.test>', sandbox: true, fetchImpl });
    await service.send({ to: 'a@b.c', subject: 'Bonjour', text: 'Texte', replyTo: 'r@b.c' });
    const [url, init] = (fetchImpl as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.headers['api-key']).toBe('k');
    expect(JSON.parse(init.body)).toEqual({
      sender: { name: 'Les Aînés', email: 'info@lesaines.test' },
      to: [{ email: 'a@b.c' }],
      subject: 'Bonjour',
      textContent: 'Texte',
      replyTo: { email: 'r@b.c' },
      headers: { 'X-Sib-Sandbox': 'drop' },
    });
  });

  it('throws when Brevo refuses the e-mail, so the queue retries it', async () => {
    const fetchImpl = jest.fn(() => Promise.resolve(new Response('bad key', { status: 401 }))) as unknown as typeof fetch;
    const service = new BrevoMailService({ apiKey: 'k', from: 'x@y.z', sandbox: false, fetchImpl });
    await expect(service.send({ to: 'a@b.c', subject: 's', text: 't' })).rejects.toThrow(/401/);
  });

  it('parses sender addresses', () => {
    expect(parseAddress('x@y.z')).toEqual({ email: 'x@y.z' });
  });
});
