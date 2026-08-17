import { generateGoldenGridLayout } from '../utils/gridGenerator';
import {
  focusIndexAt,
  spiralCamera,
  spiralEye,
  spiralWindow,
  toCssTransform,
} from '../utils/spiralCamera';

const fib = (n: number): number[] => {
  const seq = [1, 1];
  while (seq.length < n) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
  return seq;
};

describe('focusIndexAt', () => {
  it('focuses the last (largest) square at depth zero', () => {
    expect(focusIndexAt(0, 15)).toBe(14);
    expect(focusIndexAt(5, 15)).toBe(9);
  });
});

describe('spiralCamera', () => {
  const layout = generateGoldenGridLayout(fib(15), true, 0);

  it('scales the focused square to the fill ratio of the smaller side', () => {
    const frame = spiralCamera(layout, 0, 1200, 800);
    expect(frame.scale).toBeCloseTo((0.62 * 800) / 610, 5);
    expect(frame.rotationDeg).toBe(0);
  });

  it('centres the focused square in layout coordinates', () => {
    const frame = spiralCamera(layout, 0, 1200, 800);
    const largest = layout.squares[14];
    expect(frame.centerX).toBeCloseTo(largest.x + largest.size / 2, 5);
    expect(frame.centerY).toBeCloseTo(largest.y + largest.size / 2, 5);
  });

  it('interpolates scale geometrically between steps', () => {
    const frame = spiralCamera(layout, 0.5, 1000, 1000);
    expect(frame.scale).toBeCloseTo((0.62 * 1000) / Math.sqrt(610 * 377), 5);
  });

  it('rotates 90 degrees per step, direction following handedness', () => {
    expect(spiralCamera(layout, 2, 800, 600).rotationDeg).toBe(180);
    expect(spiralCamera(layout, 2, 800, 600, { clockwise: false }).rotationDeg).toBe(-180);
  });

  it('keeps every whole-depth frame identically oriented (self-similarity)', () => {
    // The invariant behind the rotation sign: at every whole depth, the
    // next-deeper square must appear at the SAME screen angle from centre.
    // With the sign inverted this alternates by ~180 degrees frame to frame.
    const screenAngle = (depth: number): number => {
      const frame = spiralCamera(layout, depth, 1000, 1000);
      const sq = layout.squares[14 - depth - 1];
      const rad = (frame.rotationDeg * Math.PI) / 180;
      const cx = sq.x + sq.size / 2 - frame.centerX;
      const cy = sq.y + sq.size / 2 - frame.centerY;
      const sx = cx * frame.scale;
      const sy = cy * frame.scale;
      const rx = sx * Math.cos(rad) - sy * Math.sin(rad);
      const ry = sx * Math.sin(rad) + sy * Math.cos(rad);
      return Math.atan2(ry, rx);
    };
    const reference = screenAngle(0);
    for (let depth = 1; depth < 5; depth++) {
      expect(screenAngle(depth)).toBeCloseTo(reference, 1);
    }
  });

  it('honours a custom fill ratio', () => {
    const frame = spiralCamera(layout, 0, 1000, 1000, { fillRatio: 1 });
    expect(frame.scale).toBeCloseTo(1000 / 610, 5);
  });

  it('clamps interpolation at the deepest square', () => {
    const frame = spiralCamera(layout, 14, 800, 600);
    expect(frame.scale).toBeCloseTo(0.62 * 600, 5);
  });

  it('rejects any depth outside [0, count - 1], including fractional overshoot', () => {
    expect(() => spiralCamera(layout, 99, 800, 600)).toThrow('outside the layout');
    expect(() => spiralCamera(layout, -0.5, 800, 600)).toThrow('outside the layout');
    expect(() => spiralCamera(layout, 14.5, 800, 600)).toThrow('outside the layout');
    expect(() => spiralCamera(layout, NaN, 800, 600)).toThrow('outside the layout');
  });

  it('works on un-normalized layouts — only centres and sizes matter', () => {
    // generateGoldenGridLayout leaves negative offsets in place; the camera
    // must not assume a 0-based origin.
    const hasNegative = layout.squares.some((s) => s.x < 0 || s.y < 0);
    expect(hasNegative).toBe(true);
    const frame = spiralCamera(layout, 3, 640, 480);
    expect(Number.isFinite(frame.centerX)).toBe(true);
    expect(Number.isFinite(frame.centerY)).toBe(true);
  });
});

describe('toCssTransform', () => {
  it('composes centre, rotation, scale, and focus in that order', () => {
    const layout = generateGoldenGridLayout(fib(5), true, 0);
    const frame = spiralCamera(layout, 1, 1200, 800);
    const css = toCssTransform(frame, 1200, 800);
    expect(css).toBe(
      `translate(600px, 400px) rotate(${frame.rotationDeg}deg) ` +
        `scale(${frame.scale}) translate(${-frame.centerX}px, ${-frame.centerY}px)`
    );
  });
});

describe('spiralWindow', () => {
  it('holds the focus fully opaque and marks it focused', () => {
    expect(spiralWindow(14, 0, 15)).toEqual({ opacity: 1, hidden: false, focused: true });
  });

  it('fades with distance and leaves paint exactly when opacity hits zero', () => {
    expect(spiralWindow(13, 0, 15).opacity).toBe(1);
    expect(spiralWindow(12, 0, 15).opacity).toBeCloseTo(1 / 3, 2);
    const gone = spiralWindow(11, 0, 15);
    expect(gone.opacity).toBe(0);
    expect(gone.hidden).toBe(true);
  });

  it('hides content whose rendered opacity rounds to zero', () => {
    // Raw opacity just inside the boundary (≈0.0003) rounds to 0.000 — the
    // consumer renders 0, so hidden must agree with what is rendered.
    const nearZero = spiralWindow(9, 2.4995, 15);
    expect(nearZero.opacity).toBe(0);
    expect(nearZero.hidden).toBe(true);
  });

  it('agrees with itself at the fade boundary', () => {
    // A gap between "invisible" and "gone" would leave transparent content
    // focusable — the boundary is one number by design.
    const atBoundary = spiralWindow(9, 2.5, 15);
    expect(atBoundary.opacity).toBe(0);
    expect(atBoundary.hidden).toBe(true);
  });

  it('windows around the current focus', () => {
    expect(spiralWindow(9, 5, 15).focused).toBe(true);
    expect(spiralWindow(14, 5, 15).hidden).toBe(true);
  });

  it('rejects an inverted window', () => {
    // fadeSteps <= holdSteps flips the ramp's denominator: opacity 2 at four
    // steps out, growing with distance, and nothing ever hidden.
    expect(() => spiralWindow(9, 0, 15, { holdSteps: 3, fadeSteps: 2 })).toThrow(
      'Legibility window'
    );
    expect(() => spiralWindow(9, 0, 15, { holdSteps: 1, fadeSteps: 1 })).toThrow(
      'Legibility window'
    );
    // Negative-but-ordered distances hide the focus itself.
    expect(() => spiralWindow(9, 0, 15, { holdSteps: -1, fadeSteps: 0 })).toThrow(
      'Legibility window'
    );
    // NaN bypasses ordering comparisons; Infinity yields opacity NaN outside
    // the hold. Both come from parsed config and must fail loudly.
    expect(() => spiralWindow(9, 0, 15, { holdSteps: NaN, fadeSteps: 2 })).toThrow(
      'Legibility window'
    );
    expect(() =>
      spiralWindow(9, 0, 15, { holdSteps: 1, fadeSteps: Infinity })
    ).toThrow('Legibility window');
    // A NaN depth (scroll ratio against a zero-sized container) or index must
    // fail loudly, not return opacity NaN with hidden false.
    expect(() => spiralWindow(9, NaN, 15)).toThrow('finite depth');
    expect(() => spiralWindow(NaN, 0, 15)).toThrow('finite depth');
    expect(() => spiralWindow(9, 0, NaN)).toThrow('finite depth');
  });

  it('honours custom hold and fade distances', () => {
    const wide = spiralWindow(11, 0, 15, { holdSteps: 3, fadeSteps: 5 });
    expect(wide.opacity).toBe(1);
    const narrow = spiralWindow(13, 0, 15, { holdSteps: 0.25, fadeSteps: 0.5 });
    expect(narrow.hidden).toBe(true);
  });
});

describe('spiralEye', () => {
  it('sits at the centre of the smallest square', () => {
    const layout = generateGoldenGridLayout(fib(10), true, 0);
    const smallest = layout.squares[0];
    expect(spiralEye(layout)).toEqual({
      x: smallest.x + smallest.size / 2,
      y: smallest.y + smallest.size / 2,
    });
  });

  it('converges: deeper layouts keep the eye in a stable neighbourhood', () => {
    // The eye of a Fibonacci spiral drifts less than a unit as squares are
    // added; assert the 12- and 15-square eyes are within the smallest
    // square's own size of each other once coordinates are aligned to the
    // largest square, which both layouts share.
    const a = generateGoldenGridLayout(fib(12), true, 0);
    const b = generateGoldenGridLayout(fib(15), true, 0);
    const anchorA = a.squares[a.squares.length - 1];
    const anchorB = b.squares[b.squares.length - 1];
    const eyeA = spiralEye(a);
    const eyeB = spiralEye(b);
    const relA = { x: eyeA.x - anchorA.x, y: eyeA.y - anchorA.y };
    const relB = {
      x: (eyeB.x - anchorB.x) / (anchorB.size / anchorA.size),
      y: (eyeB.y - anchorB.y) / (anchorB.size / anchorA.size),
    };
    expect(Math.abs(relA.x - relB.x)).toBeLessThan(anchorA.size);
    expect(Math.abs(relA.y - relB.y)).toBeLessThan(anchorA.size);
  });
});
