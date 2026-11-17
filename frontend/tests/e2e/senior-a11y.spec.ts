import { expect, test } from '@playwright/test';

const pages = ['/', '/a-propos', '/login'];

test.describe('accessibilité pour les aînés', () => {
  for (const path of pages) {
    test(`${path} : texte de base 18 px et zones cliquables d'au moins 44 px`, async ({ page }) => {
      await page.goto(path);
      const fontSize = await page.evaluate(() => getComputedStyle(document.body).fontSize);
      expect(fontSize).toBe('18px');

      // Inline links inside running text are exempt (WCAG 2.5.8 inline exception).
      const tooSmall = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [role="button"]')]
          .filter((el) => {
            const style = getComputedStyle(el);
            if (style.visibility === 'hidden' || style.display === 'none' || el.closest('[aria-hidden="true"], .sr-only')) return false;
            if (el.classList.contains('skip-link')) return false;
            // Stretched links: the whole card is the target (::after covers it).
            if (el.classList.contains('after:inset-0')) return false;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            if (el.tagName === 'A' && el.closest('p') && !el.closest('nav')) return false;
            return rect.height < 43.5 || rect.width < 43.5;
          })
          .map((el) => `${el.tagName.toLowerCase()} « ${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40)} » ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`),
      );
      expect(tooSmall).toEqual([]);
    });
  }

  test('le focus est toujours visible (anneau lime)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Clavier physique seulement');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const shadow = await page.evaluate(() => getComputedStyle(document.activeElement as Element).boxShadow);
    expect(shadow).toContain('229, 252, 98');
  });

  test('le médaillon tournant s’arrête si la personne réduit les animations', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Le médaillon est masqué sur petit écran');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const animation = await page.locator('svg.motion-reduce\\:animate-none').evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe('none');
  });
});
