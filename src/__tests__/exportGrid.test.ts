import { generateGridHTML } from '../utils/exportGrid';

describe('generateGridHTML', () => {
  test('returns a comment for an invalid range', () => {
    expect(generateGridHTML(0, 0, '#333', true, 0)).toBe('<!-- No grid to render -->');
  });

  test('returns a full HTML document', () => {
    const html = generateGridHTML(1, 4, '#7f7ec7', true, 0);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<div class="golden-grid__box"');
    expect(html).toContain('</div>');
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

  test('includes a placeholder box when starting index is above 1', () => {
    expect(generateGridHTML(3, 5, '#333', true, 0)).toContain('class="golden-grid__box golden-grid__box--placeholder"');
  });

  test('no placeholder when starting from index 1', () => {
    expect(generateGridHTML(1, 4, '#333', true, 0)).not.toContain('class="golden-grid__box golden-grid__box--placeholder"');
  });

  test('contains inline background styles on list items', () => {
    expect(generateGridHTML(1, 4, '#333', true, 0)).toContain('background:');
  });

  test('single requested square with a placeholder applies correct color offset', () => {
    // from=3, to=3: one square requested (totalRequested=1) with skipped squares (placeholder exists)
    // exercises the else branch at lines 101-103
    const html = generateGridHTML(3, 3, '#7f7ec7', true, 0);
    expect(html).toContain('class="golden-grid__box golden-grid__box--placeholder"');
    expect(html).toContain('<div class="golden-grid__box" style=');
  });

  test('accepts all valid rotation values without throwing', () => {
    [0, 90, 180, 270].forEach(r => {
      expect(() => generateGridHTML(1, 4, '#333', true, r)).not.toThrow();
    });
  });

  test('omits background styles when color is undefined', () => {
    const html = generateGridHTML(1, 4, undefined, true, 0);
    expect(html).not.toContain('background:');
  });

  test('omits background on placeholder when color is undefined', () => {
    const html = generateGridHTML(3, 5, undefined, true, 0);
    expect(html).toContain('class="golden-grid__box golden-grid__box--placeholder"');
    expect(html).not.toContain('background:');
  });

  test('single square with no color omits background', () => {
    const html = generateGridHTML(1, 1, undefined, true, 0);
    expect(html).toContain('aspect-ratio: 1 / 1');
    expect(html).not.toContain('background:');
  });

  test('outline adds border-right and border-bottom to boxes', () => {
    const html = generateGridHTML(1, 4, '#333', true, 0, '2px solid #000000');
    expect(html).toContain('border-right: 2px solid #000000');
    expect(html).toContain('border-bottom: 2px solid #000000');
  });

  test('outline adds border-top and border-left to container', () => {
    const html = generateGridHTML(1, 4, '#333', true, 0, '2px solid #000000');
    expect(html).toContain('border-top: 2px solid #000000');
    expect(html).toContain('border-left: 2px solid #000000');
  });

  test('outline adds golden-grid--outlined class to container', () => {
    const html = generateGridHTML(1, 4, '#333', true, 0, '2px solid #000000');
    expect(html).toContain('class="golden-grid golden-grid--outlined"');
  });

  test('outline adds box-sizing CSS rule', () => {
    const html = generateGridHTML(1, 4, '#333', true, 0, '2px solid #000000');
    expect(html).toContain('box-sizing: border-box');
  });

  test('no outline omits border styles', () => {
    const html = generateGridHTML(1, 4, '#333', true, 0);
    expect(html).not.toContain('border-right:');
    expect(html).not.toContain('border-top:');
  });

  test('outline works on single square', () => {
    const html = generateGridHTML(1, 1, '#333', true, 0, '1px dashed #ff0000');
    expect(html).toContain('border-top: 1px dashed #ff0000');
    expect(html).toContain('border-right: 1px dashed #ff0000');
    expect(html).toContain('class="golden-grid golden-grid--outlined"');
  });

  test('outline applies border styles to placeholder box', () => {
    const html = generateGridHTML(3, 5, '#333', true, 0, '1px solid #000000');
    expect(html).toContain('class="golden-grid__box golden-grid__box--placeholder"');
    expect(html).toContain('border-right: 1px solid #000000');
  });

  test('outline accepts all valid CSS border styles', () => {
    ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'].forEach(style => {
      const html = generateGridHTML(1, 4, '#333', true, 0, `1px ${style} #000000`);
      expect(html).toContain(`border-right: 1px ${style} #000000`);
    });
  });
});
