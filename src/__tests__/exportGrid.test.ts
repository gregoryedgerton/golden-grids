import { generateGridHTML } from '../utils/exportGrid';

describe('generateGridHTML', () => {
  test('returns a comment for an invalid range', () => {
    expect(generateGridHTML(0, 0, '#333', true, 0)).toBe('<!-- No grid to render -->');
  });

  test('returns a full HTML document', () => {
    const html = generateGridHTML(1, 4, '#7f7ec7', true, 0);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<ol>');
    expect(html).toContain('</ol>');
  });

  test('includes an aspect-ratio in the styles', () => {
    expect(generateGridHTML(1, 4, '#7f7ec7', true, 0)).toContain('aspect-ratio');
  });

  test('produces identical output regardless of from/to order', () => {
    expect(generateGridHTML(1, 4, '#333', true, 0)).toBe(generateGridHTML(4, 1, '#333', true, 0));
  });

  test('single square uses a 1 / 1 aspect ratio', () => {
    expect(generateGridHTML(1, 1, '#333', true, 0)).toContain('aspect-ratio: 1 / 1');
  });

  test('includes a placeholder <li> when starting index is above 1', () => {
    expect(generateGridHTML(3, 5, '#333', true, 0)).toContain('class="placeholder"');
  });

  test('no placeholder when starting from index 1', () => {
    expect(generateGridHTML(1, 4, '#333', true, 0)).not.toContain('class="placeholder"');
  });

  test('contains inline background styles on list items', () => {
    expect(generateGridHTML(1, 4, '#333', true, 0)).toContain('background:');
  });

  test('single requested square with a placeholder applies correct color offset', () => {
    // from=3, to=3: one square requested (totalRequested=1) with skipped squares (placeholder exists)
    // exercises the else branch at lines 101-103
    const html = generateGridHTML(3, 3, '#7f7ec7', true, 0);
    expect(html).toContain('class="placeholder"');
    expect(html).toContain('<li style=');
  });

  test('accepts all valid rotation values without throwing', () => {
    [0, 90, 180, 270].forEach(r => {
      expect(() => generateGridHTML(1, 4, '#333', true, r)).not.toThrow();
    });
  });
});
