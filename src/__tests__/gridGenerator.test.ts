import { generateGoldenGridLayout } from '../utils/gridGenerator';

const seq = [1, 1, 2, 3, 5];

describe('generateGoldenGridLayout', () => {
  test('throws when sequence has fewer than 2 numbers', () => {
    expect(() => generateGoldenGridLayout([1])).toThrow();
  });

  test('throws for invalid rotation values', () => {
    expect(() => generateGoldenGridLayout(seq, true, 45)).toThrow();
    expect(() => generateGoldenGridLayout(seq, true, 1)).toThrow();
  });

  test('returns one square per element in the sequence', () => {
    expect(generateGoldenGridLayout(seq).squares).toHaveLength(seq.length);
  });

  test('each square size matches the corresponding sequence value', () => {
    const { squares } = generateGoldenGridLayout(seq);
    squares.forEach((sq, i) => expect(sq.size).toBe(seq[i]));
  });

  test('width and height are positive', () => {
    const { width, height } = generateGoldenGridLayout(seq);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  test('all squares fit within the reported bounding box', () => {
    const layout = generateGoldenGridLayout(seq);
    layout.squares.forEach(sq => {
      expect(sq.x).toBeGreaterThanOrEqual(layout.minX);
      expect(sq.y).toBeGreaterThanOrEqual(layout.minY);
      expect(sq.x + sq.size - 1).toBeLessThanOrEqual(layout.minX + layout.width - 1);
      expect(sq.y + sq.size - 1).toBeLessThanOrEqual(layout.minY + layout.height - 1);
    });
  });

  test('clockwise and counter-clockwise produce different square positions', () => {
    const cw = generateGoldenGridLayout(seq, true);
    const ccw = generateGoldenGridLayout(seq, false);
    const differs = cw.squares.some((sq, i) =>
      sq.x !== ccw.squares[i].x || sq.y !== ccw.squares[i].y
    );
    expect(differs).toBe(true);
  });

  test('rotation 0 and 180 share the same width/height', () => {
    const r0 = generateGoldenGridLayout(seq, true, 0);
    const r180 = generateGoldenGridLayout(seq, true, 180);
    expect(r180.width).toBe(r0.width);
    expect(r180.height).toBe(r0.height);
  });

  test('rotation 90 and 270 swap width and height relative to 0', () => {
    const r0 = generateGoldenGridLayout(seq, true, 0);
    const r90 = generateGoldenGridLayout(seq, true, 90);
    const r270 = generateGoldenGridLayout(seq, true, 270);
    expect(r90.width).toBe(r0.height);
    expect(r90.height).toBe(r0.width);
    expect(r270.width).toBe(r0.height);
    expect(r270.height).toBe(r0.width);
  });

  test('all four valid rotations are accepted', () => {
    [0, 90, 180, 270].forEach(r => {
      expect(() => generateGoldenGridLayout(seq, true, r)).not.toThrow();
    });
  });

  test('right-direction placement is reached with a 6-element sequence', () => {
    // The direction cycle is [bottom, left, top, right] for CW.
    // Squares at indices 2-5 use directions 0-3; index 5 is the first to hit "right".
    const sixSeq = [1, 1, 2, 3, 5, 8];
    const layout = generateGoldenGridLayout(sixSeq);
    expect(layout.squares).toHaveLength(6);
    // The 6th square (index 5) should be placed to the right of the bounding box,
    // meaning its x is the furthest right of all squares.
    const lastSq = layout.squares[5];
    const othersMaxX = layout.squares.slice(0, 5).reduce((m, s) => Math.max(m, s.x), -Infinity);
    expect(lastSq.x).toBeGreaterThan(othersMaxX);
  });

  test('works with the minimum two-element sequence', () => {
    const layout = generateGoldenGridLayout([1, 1]);
    expect(layout.squares).toHaveLength(2);
    expect(layout.width).toBeGreaterThan(0);
  });
});
