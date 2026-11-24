import { chunk, extractText } from './text';

const lexical = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    children: paragraphs.map((text) => ({ type: 'paragraph', children: [{ type: 'text', text }] })),
  },
});

describe('extractText', () => {
  it('keeps block titles and rich text, one line per paragraph, and drops technical fields', () => {
    const text = extractText({
      title: 'Qui sommes-nous ?',
      meta: { description: 'Vision, mission et valeurs.' },
      layout: [
        {
          blockType: 'content',
          anchor: 'mission',
          title: 'Notre mission',
          body: lexical('Briser l’isolement.', 'Soutenir l’autonomie.'),
        },
        {
          blockType: 'cards',
          items: [
            { title: 'Cafés-rencontres', text: 'Tous les mardis matin.', image: { url: '/media/x.jpg' } },
          ],
        },
      ],
    });
    expect(text.split('\n')).toEqual([
      'Qui sommes-nous ?',
      'Vision, mission et valeurs.',
      'Notre mission',
      'Briser l’isolement.',
      'Soutenir l’autonomie.',
      'Cafés-rencontres',
      'Tous les mardis matin.',
    ]);
    expect(text).not.toContain('mission\n'.repeat(2));
    expect(text).not.toContain('/media/x.jpg');
  });
});

describe('chunk', () => {
  it('cuts on whole paragraphs and prefixes each chunk with the page title', () => {
    const paragraphs = Array.from({ length: 6 }, (_, i) => `Paragraphe ${i} ${'x'.repeat(500)}`);
    const chunks = chunk('Activités', paragraphs.join('\n'));
    expect(chunks.length).toBe(3);
    for (const c of chunks) {
      expect(c.startsWith('Activités\n')).toBe(true);
      expect(c.length).toBeLessThanOrEqual(1200 + 'Activités\n'.length);
    }
    expect(chunks.join('\n')).toContain('Paragraphe 5');
  });

  it('gives nothing for an empty page', () => {
    expect(chunk('Vide', '')).toEqual([]);
  });
});
