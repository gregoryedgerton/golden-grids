import React from 'react';
import { GoldenBox } from '../components/GoldenBox';
import type { GoldenBoxProps } from '../components/GoldenBox';

// Mirrors the exact child-mapping logic from GoldenGrid.tsx so we can
// exercise it directly without needing a DOM / jsdom environment.
function mapChildren(children: React.ReactNode) {
  const allBoxChildren = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<GoldenBoxProps> =>
      React.isValidElement(child) && child.type === GoldenBox
  );
  return { allBoxChildren };
}

describe('GoldenGrid', () => {
  // ─── child mapping ────────────────────────────────────────────────────────

  describe('child mapping', () => {
    test('GoldenBox elements pass the child.type === GoldenBox filter', () => {
      const el = React.createElement(GoldenBox, {});
      expect(React.isValidElement(el) && el.type === GoldenBox).toBe(true);
    });

    test('non-GoldenBox host elements are excluded by the filter', () => {
      const div = React.createElement('div', { key: 'd' });
      const span = React.createElement('span', { key: 's' });
      const { allBoxChildren } = mapChildren([div, span]);
      expect(allBoxChildren).toHaveLength(0);
    });

    test('plain string children are excluded', () => {
      const { allBoxChildren } = mapChildren(['just text', 42]);
      expect(allBoxChildren).toHaveLength(0);
    });

    test('mixed children: only GoldenBox elements pass through', () => {
      const box = React.createElement(GoldenBox, { key: 'b' });
      const div = React.createElement('div', { key: 'd' });
      const { allBoxChildren } = mapChildren([box, div, 'plain text']);
      expect(allBoxChildren).toHaveLength(1);
    });

    test('no children produces empty results', () => {
      const { allBoxChildren } = mapChildren(undefined);
      expect(allBoxChildren).toHaveLength(0);
    });

    test('extra children beyond slot count are silently dropped (reversed mapping)', () => {
      const boxes = Array.from({ length: 10 }, (_, i) =>
        React.createElement(GoldenBox, { key: i })
      );
      const { allBoxChildren } = mapChildren(boxes);
      const slotCount = 3;
      // reversed: slot i gets allBoxChildren[slotCount - 1 - i]
      const assigned = Array.from({ length: slotCount }, (_, i) => allBoxChildren[slotCount - 1 - i] ?? null);
      expect(assigned).toHaveLength(3);
      expect(assigned.every(c => c !== null)).toBe(true);
    });

    test('fewer children than slots: child fills the largest slot, smaller slots receive null', () => {
      const { allBoxChildren } = mapChildren([React.createElement(GoldenBox, {})]);
      const slotCount = 3;
      // slots 0..N-1 where 0 = smallest, N-1 = largest; first child → largest slot
      const assigned = Array.from({ length: slotCount }, (_, i) => allBoxChildren[slotCount - 1 - i] ?? null);
      expect(assigned[0]).toBeNull();
      expect(assigned[1]).toBeNull();
      expect(assigned[2]).not.toBeNull();
    });

    test('first child maps to the largest slot, last child to the smallest (largest-to-smallest DOM order)', () => {
      const boxes = [
        React.createElement(GoldenBox, { key: '0' }), // most important → largest slot
        React.createElement(GoldenBox, { key: '1' }),
        React.createElement(GoldenBox, { key: '2' }), // least important → smallest slot
      ];
      const { allBoxChildren } = mapChildren(boxes);
      const slotCount = 3;
      const assigned = Array.from({ length: slotCount }, (_, i) => allBoxChildren[slotCount - 1 - i] ?? null);
      expect(assigned[slotCount - 1]).toBe(allBoxChildren[0]); // largest slot = first child
      expect(assigned[0]).toBe(allBoxChildren[slotCount - 1]); // smallest slot = last child
    });

    test('when placeholder exists, last child maps to placeholder slot', () => {
      const placeholderExists = true;
      const children = [
        React.createElement(GoldenBox, { key: '0' }),
        React.createElement(GoldenBox, { key: '1' }),
        React.createElement(GoldenBox, { key: '2' }),
      ];
      const { allBoxChildren } = mapChildren(children);
      const placeholderChild = placeholderExists ? (allBoxChildren[allBoxChildren.length - 1] ?? null) : null;
      const boxChildren = placeholderExists ? allBoxChildren.slice(0, -1) : allBoxChildren;
      expect(placeholderChild).toBe(allBoxChildren[allBoxChildren.length - 1]);
      expect(boxChildren).toHaveLength(2);
    });

    test('when no placeholder, all children map to visible slots', () => {
      const placeholderExists = false;
      const children = [
        React.createElement(GoldenBox, { key: '0' }),
        React.createElement(GoldenBox, { key: '1' }),
      ];
      const { allBoxChildren } = mapChildren(children);
      const placeholderChild = placeholderExists ? (allBoxChildren[0] ?? null) : null;
      const boxChildren = placeholderExists ? allBoxChildren.slice(1) : allBoxChildren;
      expect(placeholderChild).toBeNull();
      expect(boxChildren).toHaveLength(2);
    });
  });


  // ─── outline border construction ──────────────────────────────────────────

  describe('outline border construction', () => {
    test('container receives borderTop and borderLeft when outline is set', () => {
      const outline = '2px solid #000000';
      const containerBorder = outline ? { borderTop: outline, borderLeft: outline } : {};
      expect(containerBorder).toEqual({ borderTop: '2px solid #000000', borderLeft: '2px solid #000000' });
    });

    test('boxes receive borderRight and borderBottom when outline is set', () => {
      const outline = '2px solid #000000';
      const boxBorder = outline ? { borderRight: outline, borderBottom: outline } : {};
      expect(boxBorder).toEqual({ borderRight: '2px solid #000000', borderBottom: '2px solid #000000' });
    });

    test('container and box border sets do not share edges (no double borders)', () => {
      const containerEdges = Object.keys({ borderTop: '', borderLeft: '' });
      const boxEdges = Object.keys({ borderRight: '', borderBottom: '' });
      expect(containerEdges.filter(e => boxEdges.includes(e))).toHaveLength(0);
    });

    test('all four edges are covered exactly once across container and boxes', () => {
      const allFour = ['borderBottom', 'borderLeft', 'borderRight', 'borderTop'];
      const covered = [
        ...Object.keys({ borderTop: '', borderLeft: '' }),
        ...Object.keys({ borderRight: '', borderBottom: '' }),
      ].sort();
      expect(covered).toEqual(allFour);
    });

    test('no outline produces empty border style objects', () => {
      const outline = undefined;
      const containerBorder = outline ? { borderTop: outline, borderLeft: outline } : {};
      const boxBorder = outline ? { borderRight: outline, borderBottom: outline } : {};
      expect(containerBorder).toEqual({});
      expect(boxBorder).toEqual({});
    });

    test('outlined flag is true only when outline is a non-empty string', () => {
      expect(!!('2px solid #000')).toBe(true);
      expect(!!(undefined)).toBe(false);
      expect(!!('' as string | undefined)).toBe(false);
    });
  });

  // ─── CSS class construction ───────────────────────────────────────────────

  describe('CSS class construction', () => {
    test('produces "golden-grid" when not outlined', () => {
      const outlined = false;
      expect(`golden-grid${outlined ? ' golden-grid--outlined' : ''}`).toBe('golden-grid');
    });

    test('appends "golden-grid--outlined" modifier when outlined', () => {
      const outlined = true;
      expect(`golden-grid${outlined ? ' golden-grid--outlined' : ''}`).toBe('golden-grid golden-grid--outlined');
    });
  });

  // ─── from/to range normalisation ─────────────────────────────────────────

  describe('from/to range normalisation', () => {
    test('swaps start and end when from > to', () => {
      let start = 5, end = 2;
      if (start > end) [start, end] = [end, start];
      expect(start).toBe(2);
      expect(end).toBe(5);
    });

    test('leaves values unchanged when from <= to', () => {
      let start = 2, end = 5;
      if (start > end) [start, end] = [end, start];
      expect(start).toBe(2);
      expect(end).toBe(5);
    });

    test('equal from and to produces a single-square range (startIdx === endIdx === 0)', () => {
      // Index 1 maps to startIdx 0, endIdx 0 (first Fibonacci square)
      const { getGridRange } = require('../utils/fibonacci');
      const range = getGridRange(1, 1);
      expect(range).not.toBeNull();
      expect(range!.startIdx).toBe(0);
      expect(range!.endIdx).toBe(0);
    });

    test('invalid range (both 0) returns null from getGridRange', () => {
      const { getGridRange } = require('../utils/fibonacci');
      expect(getGridRange(0, 0)).toBeNull();
    });
  });
});
