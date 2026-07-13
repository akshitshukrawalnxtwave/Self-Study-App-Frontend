import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react';

type SplitLayoutProps = {
  left: ReactNode;
  right: ReactNode;
  defaultLeftPercent?: number;
};

const MIN_PERCENT = 25;
const MAX_PERCENT = 75;

export function SplitLayout({ left, right, defaultLeftPercent = 50 }: SplitLayoutProps) {
  const [leftPercent, setLeftPercent] = useState(defaultLeftPercent);
  const layoutRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updateSplit = useCallback((clientX: number) => {
    const layout = layoutRef.current;
    if (!layout) return;

    const rect = layout.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setLeftPercent(Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, percent)));
  }, []);

  const stopDragging = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const onResizerPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onResizerPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      updateSplit(event.clientX);
    },
    [updateSplit],
  );

  const onResizerPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      event.currentTarget.releasePointerCapture(event.pointerId);
      stopDragging();
    },
    [stopDragging],
  );

  useEffect(() => {
    return () => stopDragging();
  }, [stopDragging]);

  return (
    <div className="teach-layout" ref={layoutRef}>
      <aside
        className="teach-panel teach-panel--left"
        style={{ flex: `0 0 ${leftPercent}%` }}
      >
        {left}
      </aside>
      <div
        className="teach-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-valuemin={MIN_PERCENT}
        aria-valuemax={MAX_PERCENT}
        aria-valuenow={Math.round(leftPercent)}
        aria-label="Resize chat and lesson panels"
        onPointerDown={onResizerPointerDown}
        onPointerMove={onResizerPointerMove}
        onPointerUp={onResizerPointerUp}
        onPointerCancel={onResizerPointerUp}
      />
      <main className="teach-panel teach-panel--right">{right}</main>
    </div>
  );
}
