import { generateGoldenGridLayout, placementToRotateDeg } from '../utils/gridGenerator';

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

describe('placementToRotateDeg', () => {
  // No skipped squares — desired placement maps directly to rotation
  test('startIdx < 2: placement "right" → 0', () => {
    expect(placementToRotateDeg('right', true, 0)).toBe(0);
    expect(placementToRotateDeg('right', true, 1)).toBe(0);
  });

  test('startIdx < 2: placement "bottom" → 90', () => {
    expect(placementToRotateDeg('bottom', true, 0)).toBe(90);
  });

  test('startIdx < 2: placement "left" → 180', () => {
    expect(placementToRotateDeg('left', true, 0)).toBe(180);
  });

  test('startIdx < 2: placement "top" → 270', () => {
    expect(placementToRotateDeg('top', true, 0)).toBe(270);
  });

  // CW spiral — natural direction of square[startIdx] without rotation:
  //   startIdx=2 → bottom (90), 3 → left (180), 4 → top (270), 5 → right (0)
  test('CW startIdx=2 "right": corrects from natural BOTTOM', () => {
    // desiredDeg=0, naturalDeg=90 → (0-90+360)%360 = 270
    expect(placementToRotateDeg('right', true, 2)).toBe(270);
  });

  test('CW startIdx=3 "right": corrects from natural LEFT', () => {
    // desiredDeg=0, naturalDeg=180 → (0-180+360)%360 = 180
    expect(placementToRotateDeg('right', true, 3)).toBe(180);
  });

  test('CW startIdx=4 "right": corrects from natural TOP', () => {
    // desiredDeg=0, naturalDeg=270 → (0-270+360)%360 = 90
    expect(placementToRotateDeg('right', true, 4)).toBe(90);
  });

  test('CW startIdx=5 "right": natural is already RIGHT, no correction', () => {
    expect(placementToRotateDeg('right', true, 5)).toBe(0);
  });

  test('CW cycle repeats at startIdx=6 (same as startIdx=2)', () => {
    expect(placementToRotateDeg('right', true, 6)).toBe(
      placementToRotateDeg('right', true, 2)
    );
  });

  // CCW spiral — natural direction of square[startIdx] without rotation:
  //   startIdx=2 → top (270), 3 → left (180), 4 → bottom (90), 5 → right (0)
  test('CCW startIdx=2 "right": corrects from natural TOP', () => {
    // desiredDeg=0, naturalDeg=270 → (0-270+360)%360 = 90
    expect(placementToRotateDeg('right', false, 2)).toBe(90);
  });

  test('CCW startIdx=3 "right": corrects from natural LEFT', () => {
    // desiredDeg=0, naturalDeg=180 → (0-180+360)%360 = 180
    expect(placementToRotateDeg('right', false, 3)).toBe(180);
  });

  test('CCW startIdx=4 "right": corrects from natural BOTTOM', () => {
    // desiredDeg=0, naturalDeg=90 → (0-90+360)%360 = 270
    expect(placementToRotateDeg('right', false, 4)).toBe(270);
  });

  test('CCW startIdx=5 "right": natural is already RIGHT, no correction', () => {
    expect(placementToRotateDeg('right', false, 5)).toBe(0);
  });

  // Verify desired directions other than "right" with skipped squares
  test('CW startIdx=2 "bottom": (90-90+360)%360 = 0', () => {
    expect(placementToRotateDeg('bottom', true, 2)).toBe(0);
  });

  test('CW startIdx=2 "left": (180-90+360)%360 = 90', () => {
    expect(placementToRotateDeg('left', true, 2)).toBe(90);
  });

  test('CW startIdx=2 "top": (270-90+360)%360 = 180', () => {
    expect(placementToRotateDeg('top', true, 2)).toBe(180);
  });
});
