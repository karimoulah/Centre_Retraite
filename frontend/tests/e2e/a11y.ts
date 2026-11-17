import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Fails on any critical or serious WCAG 2.1 AA violation, with a readable summary. */
export async function expectNoA11yViolations(page: Page, options: { exclude?: string[] } = {}) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  for (const selector of options.exclude ?? []) builder = builder.exclude(selector);
  const { violations } = await builder.analyze();
  const blocking = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  const summary = blocking.map(
    (v) => `${v.impact} · ${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
  );
  expect(summary, summary.join('\n\n')).toEqual([]);
}
