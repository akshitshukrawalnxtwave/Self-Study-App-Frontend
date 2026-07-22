import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react';

type TripleSplitLayoutProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  /** Defaults roughly match the redesign mockup proportions. */
  defaultWidths?: [number, number, number];
  storageKey?: string;
};

const MIN_LEFT = 12;
const MAX_LEFT = 32;
const MIN_CENTER = 22;
const MIN_RIGHT = 28;

type DragTarget = 'left' | 'right' | null;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalizeWidths(left: number, center: number, right: number): [number, number, number] {
  let l = clamp(left, MIN_LEFT, MAX_LEFT);
  let c = Math.max(center, MIN_CENTER);
  let r = Math.max(right, MIN_RIGHT);

  const total = l + c + r;
  if (Math.abs(total - 100) > 0.01) {
    const scale = 100 / total;
    l *= scale;
    c *= scale;
    r *= scale;
  }

  // Re-enforce mins after scaling by stealing from the largest pane.
  if (l < MIN_LEFT) {
    const need = MIN_LEFT - l;
    l = MIN_LEFT;
    if (c >= r) c -= need;
    else r -= need;
  }
  if (c < MIN_CENTER) {
    const need = MIN_CENTER - c;
    c = MIN_CENTER;
    if (r >= l) r -= need;
    else l -= need;
  }
  if (r < MIN_RIGHT) {
    const need = MIN_RIGHT - r;
    r = MIN_RIGHT;
    if (c >= l) c -= need;
    else l -= need;
  }

  const fix = 100 - (l + c + r);
  c += fix;
  return [l, c, r];
}

function readStoredWidths(storageKey: string | undefined, fallback: [number, number, number]) {
  if (!storageKey || typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed.every((n) => typeof n === 'number' && Number.isFinite(n))
    ) {
      return normalizeWidths(parsed[0], parsed[1], parsed[2]);
    }
  } catch {
    // ignore corrupt storage
  }
  return fallback;
}

export function TripleSplitLayout({
  left,
  center,
  right,
  defaultWidths = [18, 35, 47],
  storageKey = 'teach-panel-widths',
}: TripleSplitLayoutProps) {
  const [widths, setWidths] = useState<[number, number, number]>(() =>
    readStoredWidths(storageKey, normalizeWidths(...defaultWidths)),
  );
  const layoutRef = useRef<HTMLDivElement>(null);
  const dragTargetRef = useRef<DragTarget>(null);
  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(widths));
    } catch {
      // ignore quota
    }
  }, [widths, storageKey]);

  const stopDragging = useCallback(() => {
    dragTargetRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const updateFromPointer = useCallback((clientX: number) => {
    const layout = layoutRef.current;
    const target = dragTargetRef.current;
    if (!layout || !target) return;

    const rect = layout.getBoundingClientRect();
    if (rect.width <= 0) return;

    const xPercent = ((clientX - rect.left) / rect.width) * 100;
    const [leftW, , rightW] = widthsRef.current;

    if (target === 'left') {
      const nextLeft = clamp(xPercent, MIN_LEFT, MAX_LEFT);
      const remaining = 100 - nextLeft;
      const nextRight = clamp(rightW, MIN_RIGHT, remaining - MIN_CENTER);
      const nextCenter = remaining - nextRight;
      setWidths(normalizeWidths(nextLeft, nextCenter, nextRight));
      return;
    }

    // Dragging the chat | lesson divider: keep left fixed, split remaining.
    const nextRight = clamp(100 - xPercent, MIN_RIGHT, 100 - leftW - MIN_CENTER);
    const nextCenter = 100 - leftW - nextRight;
    setWidths(normalizeWidths(leftW, nextCenter, nextRight));
  }, []);

  const onPointerDown = useCallback((target: DragTarget) => {
    return (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragTargetRef.current = target;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      event.currentTarget.setPointerCapture(event.pointerId);
    };
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragTargetRef.current) return;
      updateFromPointer(event.clientX);
    },
    [updateFromPointer],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragTargetRef.current) return;
      event.currentTarget.releasePointerCapture(event.pointerId);
      stopDragging();
    },
    [stopDragging],
  );

  useEffect(() => () => stopDragging(), [stopDragging]);

  const [leftPct, centerPct, rightPct] = widths;

  return (
    <div className="workspace-main" ref={layoutRef}>
      <div className="workspace-pane workspace-pane--rail" style={{ flex: `0 0 ${leftPct}%` }}>
        {left}
      </div>

      <div
        className="workspace-resizer workspace-resizer--rail"
        role="separator"
        aria-orientation="vertical"
        aria-valuemin={MIN_LEFT}
        aria-valuemax={MAX_LEFT}
        aria-valuenow={Math.round(leftPct)}
        aria-label="Resize lesson sidebar"
        onPointerDown={onPointerDown('left')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div className="workspace-pane workspace-pane--chat" style={{ flex: `0 0 ${centerPct}%` }}>
        {center}
      </div>

      <div
        className="workspace-resizer workspace-resizer--lesson"
        role="separator"
        aria-orientation="vertical"
        aria-valuemin={MIN_RIGHT}
        aria-valuemax={100 - MIN_LEFT - MIN_CENTER}
        aria-valuenow={Math.round(rightPct)}
        aria-label="Resize chat and lesson panels"
        onPointerDown={onPointerDown('right')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div className="workspace-pane workspace-pane--lesson" style={{ flex: `1 1 ${rightPct}%` }}>
        {right}
      </div>
    </div>
  );
}
