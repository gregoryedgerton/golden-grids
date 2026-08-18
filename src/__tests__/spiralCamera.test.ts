import { generateGoldenGridLayout } from '../utils/gridGenerator';
import {
  focusIndexAt,
  spiralCamera,
  spiralEye,
  spiralWindow,
  tileTransform,
  toCssTileTransform,
  toCssTransform,
  toNativeTileTransform,
  toNativeTransform,
  trailForRotation,
  trailToRotateDeg,
} from '../utils/spiralCamera';
import type { SpiralTrail } from '../utils/spiralCamera';

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

  it('rejects an unmeasured or degenerate viewport', () => {
    // A zero-sized container mid-layout is a real state; the consumer should
    // skip the frame rather than render an invalid one.
    expect(() => spiralCamera(layout, 0, 0, 600)).toThrow('positive finite dimensions');
    expect(() => spiralCamera(layout, 0, 800, NaN)).toThrow('positive finite dimensions');
    expect(() => spiralCamera(layout, 0, -800, 600)).toThrow('positive finite dimensions');
  });

  it('rejects a non-finite or non-positive fill ratio', () => {
    // An invalid scale() is discarded by the browser, silently freezing the
    // previous frame — fail loudly instead.
    expect(() => spiralCamera(layout, 0, 800, 600, { fillRatio: NaN })).toThrow('fillRatio');
    expect(() => spiralCamera(layout, 0, 800, 600, { fillRatio: Infinity })).toThrow('fillRatio');
    expect(() => spiralCamera(layout, 0, 800, 600, { fillRatio: 0 })).toThrow('fillRatio');
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
  it('composes anchor, rotation, scale, and focus in that order', () => {
    const layout = generateGoldenGridLayout(fib(5), true, 0);
    const frame = spiralCamera(layout, 1, 1200, 800);
    const css = toCssTransform(frame, 1200, 800);
    expect(css).toBe(
      `translate(600px, 400px) rotate(${frame.rotationDeg}deg) ` +
        `scale(${frame.scale}) translate(${-frame.centerX}px, ${-frame.centerY}px)`
    );
  });

  it('defaults the anchor to the viewport centre', () => {
    const layout = generateGoldenGridLayout(fib(5), true, 0);
    const frame = spiralCamera(layout, 0, 1000, 600);
    expect(toCssTransform(frame, 1000, 600)).toContain('translate(500px, 300px)');
  });

  it('pins the focus to a custom anchor — an edge-flush dial', () => {
    // The focused square is min(vw,vh) at fillRatio 1; anchoring its centre
    // at half that size puts its left edge at x = 0.
    const layout = generateGoldenGridLayout(fib(5), true, 0);
    const frame = spiralCamera(layout, 0, 1200, 800);
    const css = toCssTransform(frame, 1200, 800, { x: 400, y: 400 });
    expect(css).toContain('translate(400px, 400px)');
  });

  it('rejects a non-finite anchor', () => {
    const layout = generateGoldenGridLayout(fib(5), true, 0);
    const frame = spiralCamera(layout, 0, 1200, 800);
    expect(() => toCssTransform(frame, 1200, 800, { x: NaN, y: 0 })).toThrow('finite');
    expect(() => toCssTransform(frame, 1200, 800, { x: 0, y: Infinity })).toThrow('finite');
  });
});

describe('spiralWindow', () => {
  it('holds the focus fully opaque and marks it focused', () => {
    expect(spiralWindow(14, 0, 15)).toEqual({ opacity: 1, hidden: false, focused: true });
  });

  it('fades OUTWARD with distance and leaves paint exactly at zero', () => {
    // Depth 5 focuses index 9; larger squares are behind the camera.
    expect(spiralWindow(10, 5, 15).opacity).toBe(1);
    expect(spiralWindow(11, 5, 15).opacity).toBeCloseTo(1 / 3, 2);
    const gone = spiralWindow(12, 5, 15);
    expect(gone.opacity).toBe(0);
    expect(gone.hidden).toBe(true);
  });

  it('never fades the interior — squares emerge from the centre, small but present', () => {
    // The asymmetry the production dial proved: a faded interior renders the
    // spiral's centre as a hole, and a fade-in reads as materializing rather
    // than approaching. Inward squares hold full presence at ANY distance.
    expect(spiralWindow(0, 0, 15)).toEqual({ opacity: 1, hidden: false, focused: false });
    expect(spiralWindow(7, 0, 15).opacity).toBe(1);
    expect(spiralWindow(0, 5, 15).hidden).toBe(false);
  });

  it('hides content whose rendered opacity rounds to zero', () => {
    // Outward 2.4995: raw opacity ≈0.0003 rounds to 0.000 — the consumer
    // renders 0, so hidden must agree with what is rendered.
    const nearZero = spiralWindow(12, 4.4995, 15);
    expect(nearZero.opacity).toBe(0);
    expect(nearZero.hidden).toBe(true);
  });

  it('agrees with itself at the fade boundary', () => {
    // A gap between "invisible" and "gone" would leave transparent content
    // focusable — the boundary is one number by design.
    const atBoundary = spiralWindow(12, 4.5, 15);
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
    expect(() => spiralWindow(9, NaN, 15)).toThrow('inside');
    expect(() => spiralWindow(NaN, 0, 15)).toThrow('inside');
    expect(() => spiralWindow(9, 0, NaN)).toThrow('squareCount');
    // Structurally out-of-range coordinates are refused too — depth 15 in a
    // 15-square layout is outside [0, 14], as is a negative index.
    expect(() => spiralWindow(0, 15, 15)).toThrow('inside');
    expect(() => spiralWindow(-1, 0, 15)).toThrow('inside');
  });

  it('honours custom hold and fade distances', () => {
    // Depth 5 focuses index 9; outward 3 inside a hold of 3 stays opaque…
    const wide = spiralWindow(12, 5, 15, { holdSteps: 3, fadeSteps: 5 });
    expect(wide.opacity).toBe(1);
    // …and outward 1 beyond a 0.5 fade is gone.
    const narrow = spiralWindow(10, 5, 15, { holdSteps: 0.25, fadeSteps: 0.5 });
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

describe('trailToRotateDeg', () => {
  const SIDES: SpiralTrail[] = ['right', 'bottom', 'left', 'top'];

  /**
   * Measure where the interior actually lands: the depth-0 frame with the
   * focused square filling a square viewport, so anything past the focus
   * half-size is overhang, and the largest overhang is the trail.
   */
  const measure = (count: number, rotate: number, clockwise: boolean): SpiralTrail => {
    const layout = generateGoldenGridLayout(fib(count), clockwise, rotate);
    const frame = spiralCamera(layout, 0, 1000, 1000, { fillRatio: 1, clockwise });
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const square of layout.squares) {
      for (const [cx, cy] of [
        [square.x, square.y],
        [square.x + square.size, square.y],
        [square.x, square.y + square.size],
        [square.x + square.size, square.y + square.size],
      ]) {
        const x = (cx - frame.centerX) * frame.scale;
        const y = (cy - frame.centerY) * frame.scale;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    const half = 500;
    const overhang: Record<SpiralTrail, number> = {
      right: maxX - half,
      bottom: maxY - half,
      left: -half - minX,
      top: -half - minY,
    };
    return SIDES.reduce((best, side) =>
      overhang[side] > overhang[best] ? side : best
    );
  };

  it('trails where it says it will, for every count and both handednesses', () => {
    for (let count = 2; count <= 20; count += 1) {
      for (const side of SIDES) {
        for (const clockwise of [true, false]) {
          const rotate = trailToRotateDeg(side, clockwise, count);
          expect([0, 90, 180, 270]).toContain(rotate);
          expect(measure(count, rotate, clockwise)).toBe(side);
        }
      }
    }
  });

  it('answers differently for different counts — the reason it exists', () => {
    // Fifteen squares trail downward at 180; five squares at the same
    // rotation trail upward, off the top. A filtered consumer must re-solve.
    expect(trailForRotation(180, true, 15)).toBe('bottom');
    expect(trailForRotation(180, true, 5)).toBe('top');
    expect(trailToRotateDeg('bottom', true, 15)).toBe(180);
    expect(trailToRotateDeg('bottom', true, 5)).toBe(0);
  });

  it('is the inverse of trailForRotation', () => {
    for (let count = 2; count <= 12; count += 1) {
      for (const rotate of [0, 90, 180, 270]) {
        for (const clockwise of [true, false]) {
          const side = trailForRotation(rotate, clockwise, count);
          expect(trailToRotateDeg(side, clockwise, count)).toBe(rotate);
        }
      }
    }
  });

  it('rejects an unknown side or an unusable count', () => {
    expect(() => trailToRotateDeg('sideways' as SpiralTrail, true, 8)).toThrow(/Unknown trail side/);
    expect(() => trailToRotateDeg('right', true, 1)).toThrow(/at least 2/);
    expect(() => trailToRotateDeg('right', true, 4.5)).toThrow(/at least 2/);
  });

  it('rejects a rotation the layout could not have been built with', () => {
    expect(() => trailForRotation(45, true, 8)).toThrow(/Invalid rotation/);
    expect(() => trailForRotation(90, true, 0)).toThrow(/at least 2/);
  });

  it("reads an omitted handedness as clockwise, like the generator", () => {
    // generateGoldenGridLayout(fib, undefined, rotate) builds a CLOCKWISE
    // layout; solving as counter-clockwise here would hand back a rotation
    // for a spiral the caller never built — trailing the opposite way at odd
    // counts.
    expect(trailToRotateDeg('right', undefined, 3)).toBe(
      trailToRotateDeg('right', true, 3)
    );
    expect(trailForRotation(90, undefined, 3)).toBe(trailForRotation(90, true, 3));
    expect(measure(3, trailToRotateDeg('right', undefined, 3), true)).toBe('right');
  });
});

describe('toNativeTransform', () => {
  const layout = generateGoldenGridLayout(fib(15), true, 0);

  /** Apply an RN transform array (centre pivot) to a stage point. */
  const applyNative = (
    entries: ReturnType<typeof toNativeTransform>,
    point: { x: number; y: number },
    stage: { width: number; height: number }
  ) => {
    const tx = (entries[0] as { translateX: number }).translateX;
    const ty = (entries[1] as { translateY: number }).translateY;
    const deg = parseFloat((entries[2] as { rotate: string }).rotate);
    const s = (entries[3] as { scale: number }).scale;
    const rad = (deg * Math.PI) / 180;
    const mid = { x: stage.width / 2, y: stage.height / 2 };
    const dx = (point.x - mid.x) * s;
    const dy = (point.y - mid.y) * s;
    return {
      x: mid.x + tx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: mid.y + ty + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  };

  it('lands every point exactly where the CSS matrix does', () => {
    // The RN decomposition pivots about the view centre, the CSS one about
    // 0 0 — same mapping, different origin. Equality of the MAPPING is the
    // whole contract: check the focus centre and off-centre corners, at a
    // whole and a fractional depth, default and explicit anchors.
    const stage = { width: layout.width, height: layout.height };
    for (const depth of [0, 3.5]) {
      for (const anchor of [undefined, { x: 100, y: 640 }] as const) {
        const frame = spiralCamera(layout, depth, 960, 720, { fillRatio: 1 });
        const native = toNativeTransform(frame, 960, 720, stage, anchor);
        const rad = (frame.rotationDeg * Math.PI) / 180;
        const a = anchor ?? { x: 480, y: 360 };
        for (const point of [
          { x: frame.centerX, y: frame.centerY },
          { x: 0, y: 0 },
          { x: layout.width, y: layout.height / 3 },
        ]) {
          const cssX =
            a.x +
            frame.scale *
              ((point.x - frame.centerX) * Math.cos(rad) -
                (point.y - frame.centerY) * Math.sin(rad));
          const cssY =
            a.y +
            frame.scale *
              ((point.x - frame.centerX) * Math.sin(rad) +
                (point.y - frame.centerY) * Math.cos(rad));
          const rn = applyNative(native, point, stage);
          expect(rn.x).toBeCloseTo(cssX, 9);
          expect(rn.y).toBeCloseTo(cssY, 9);
        }
      }
    }
  });

  it('emits entries in CSS list order with a degree-string rotation', () => {
    const frame = spiralCamera(layout, 2, 800, 600);
    const native = toNativeTransform(frame, 800, 600, {
      width: layout.width,
      height: layout.height,
    });
    expect(Object.keys(native[0])).toEqual(['translateX']);
    expect(Object.keys(native[1])).toEqual(['translateY']);
    expect(native[2]).toEqual({ rotate: `${frame.rotationDeg}deg` });
    expect(native[3]).toEqual({ scale: frame.scale });
  });

  it('rejects a non-finite anchor or a degenerate stage', () => {
    const frame = spiralCamera(layout, 0, 800, 600);
    expect(() =>
      toNativeTransform(frame, 800, 600, { width: 0, height: 10 })
    ).toThrow(/positive finite/);
    expect(() =>
      toNativeTransform(frame, 800, 600, { width: NaN, height: 10 })
    ).toThrow(/positive finite/);
    expect(() =>
      toNativeTransform(frame, 800, 600, { width: 10, height: 10 }, { x: NaN, y: 0 })
    ).toThrow(/must be finite/);
  });
});

describe('tileTransform', () => {
  const layout = generateGoldenGridLayout(fib(15), true, 0);

  it('lands every tile corner exactly where the stage matrix would', () => {
    // The whole point: camera ∘ placement composed per tile must be the SAME
    // mapping as one camera matrix over squares at layout coordinates — only
    // the rasterization differs. Check the tile's four texture-box corners.
    const frame = spiralCamera(layout, 3.5, 960, 720, { fillRatio: 1 });
    const anchor = { x: 360, y: 360 };
    const rad = (frame.rotationDeg * Math.PI) / 180;
    for (const square of [layout.squares[0], layout.squares[7], layout.squares[14]]) {
      const tile = tileTransform(frame, square, 960, 720, { anchor, texturePx: 512 });
      const tileRad = (tile.rotationDeg * Math.PI) / 180;
      for (const [u, v] of [[0, 0], [512, 0], [0, 512], [512, 512]] as const) {
        // Through the tile decomposition…
        const tx = tile.translateX + tile.scale * (Math.cos(tileRad) * u - Math.sin(tileRad) * v);
        const ty = tile.translateY + tile.scale * (Math.sin(tileRad) * u + Math.cos(tileRad) * v);
        // …and through the stage mapping of the same layout point.
        const px = square.x + (u / 512) * square.size;
        const py = square.y + (v / 512) * square.size;
        const sx = anchor.x + frame.scale * (Math.cos(rad) * (px - frame.centerX) - Math.sin(rad) * (py - frame.centerY));
        const sy = anchor.y + frame.scale * (Math.sin(rad) * (px - frame.centerX) + Math.cos(rad) * (py - frame.centerY));
        expect(tx).toBeCloseTo(sx, 9);
        expect(ty).toBeCloseTo(sy, 9);
      }
    }
  });

  it('keeps the net raster scale near one at the focus', () => {
    // The raster-clamp fix in one number: the focused square's texture box
    // renders at ~viewportMin/texturePx regardless of how deep the dial is.
    for (const depth of [0, 7, 14]) {
      const frame = spiralCamera(layout, depth, 960, 720, { fillRatio: 1 });
      const focus = layout.squares[14 - depth];
      const tile = tileTransform(frame, focus, 960, 720, { texturePx: 512 });
      expect(tile.scale).toBeCloseTo(720 / 512, 9);
    }
  });

  it('emits the css and native forms of the same decomposition', () => {
    const frame = spiralCamera(layout, 2, 800, 600);
    const square = layout.squares[10];
    const tile = tileTransform(frame, square, 800, 600);
    expect(toCssTileTransform(frame, square, 800, 600)).toBe(
      `translate(${tile.translateX}px, ${tile.translateY}px) ` +
        `rotate(${tile.rotationDeg}deg) scale(${tile.scale})`
    );
    const native = toNativeTileTransform(frame, square, 800, 600);
    // Centre-pivot application over the 512 box lands the origin corner where
    // the top-left decomposition puts it.
    const tx = (native[0] as { translateX: number }).translateX;
    const ty = (native[1] as { translateY: number }).translateY;
    const rad = (tile.rotationDeg * Math.PI) / 180;
    const mid = 256;
    const x = mid + tx + tile.scale * (Math.cos(rad) * (0 - mid) - Math.sin(rad) * (0 - mid));
    const y = mid + ty + tile.scale * (Math.sin(rad) * (0 - mid) + Math.cos(rad) * (0 - mid));
    expect(x).toBeCloseTo(tile.translateX, 9);
    expect(y).toBeCloseTo(tile.translateY, 9);
  });

  it('rejects a non-finite anchor or a degenerate texture box', () => {
    const frame = spiralCamera(layout, 0, 800, 600);
    const square = layout.squares[0];
    expect(() =>
      tileTransform(frame, square, 800, 600, { anchor: { x: NaN, y: 0 } })
    ).toThrow(/must be finite/);
    expect(() =>
      tileTransform(frame, square, 800, 600, { texturePx: 0 })
    ).toThrow(/texturePx/);
  });
});
