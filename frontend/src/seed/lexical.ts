/** Minimal Lexical JSON builders for seed content. */
const text = (value: string) => ({ type: 'text', text: value, format: 0, detail: 0, mode: 'normal', style: '', version: 1 });

const block = (type: string, value: string, extra: Record<string, unknown> = {}) => ({
  type,
  children: [text(value)],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
  ...extra,
});

export const paragraph = (value: string) => block('paragraph', value, { textFormat: 0, textStyle: '' });
export const heading = (value: string, tag: 'h2' | 'h3' = 'h2') => block('heading', value, { tag });

export function richText(...children: ReturnType<typeof block>[]) {
  return {
    root: { type: 'root', children, direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 },
  };
}
