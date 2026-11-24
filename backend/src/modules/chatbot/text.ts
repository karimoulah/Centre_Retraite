/** Keys of a Payload page whose string values are reader-facing text. */
const TEXT_KEYS = new Set([
  'title',
  'text',
  'description',
  'quote',
  'caption',
  'body',
  'label',
  'name',
  'role',
]);
/** Never text: technical fields, links, media. */
const SKIP_KEYS = new Set([
  'id',
  'blockType',
  'blockName',
  'anchor',
  'slug',
  'url',
  'href',
  'image',
  'media',
  'icon',
  'version',
  'format',
  'direction',
  'indent',
  'mode',
  'style',
  'type',
  'tag',
  'meta',
  '_status',
  'createdAt',
  'updatedAt',
]);
const BLOCK_NODES = new Set(['paragraph', 'heading', 'listitem', 'quote']);

/**
 * Plain text of a page: block fields and Lexical rich text (one line per paragraph or heading).
 * The layout of Payload pages is generic JSON, so the walk does not depend on each block type.
 */
export function extractText(page: {
  title?: string;
  layout?: unknown;
  meta?: { description?: string };
}): string {
  const lines: string[] = [];
  let line = '';
  const flush = () => {
    if (line.trim()) lines.push(line.trim());
    line = '';
  };
  const walk = (node: unknown, key?: string): void => {
    if (Array.isArray(node)) return node.forEach((n) => walk(n));
    if (typeof node === 'string') {
      if (key && TEXT_KEYS.has(key) && node.trim()) {
        flush();
        lines.push(node.trim());
      }
      return;
    }
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    if (record.type === 'text' && typeof record.text === 'string') {
      line += record.text;
      return;
    }
    if (record.type === 'linebreak') {
      line += ' ';
      return;
    }
    if (Array.isArray(record.children)) {
      walk(record.children);
      if (BLOCK_NODES.has(String(record.type))) flush();
      return;
    }
    for (const [k, v] of Object.entries(record)) if (!SKIP_KEYS.has(k)) walk(v, k);
  };
  walk(page.layout);
  flush();
  return [page.title, page.meta?.description, ...lines].filter(Boolean).join('\n');
}

/**
 * Chunks of about 1 200 characters made of whole paragraphs, each prefixed with the page title
 * so a chunk keeps its context when it is retrieved alone.
 */
export function chunk(title: string, text: string, max = 1200): string[] {
  const paragraphs = text
    .split('\n')
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p && p !== title);
  const chunks: string[] = [];
  let current = '';
  for (const p of paragraphs) {
    if (current && current.length + p.length + 1 > max) {
      chunks.push(current);
      current = '';
    }
    current = current ? `${current}\n${p}` : p.slice(0, max);
  }
  if (current) chunks.push(current);
  return chunks.map((c) => `${title}\n${c}`);
}
