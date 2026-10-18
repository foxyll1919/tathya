import React, { useCallback, useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Modal surface used by every overlay in the app (quote options, design
 * panel, delete confirmation, share sheet).
 *
 * Handles the four things hand-rolled overlays usually skip:
 *   - Escape to dismiss, with a busy guard so a running export can't be
 *     closed out from under the user,
 *   - focus moved into the sheet on open and returned to the trigger on
 *     close,
 *   - a Tab loop so focus can't escape behind the scrim,
 *   - `role="dialog"` + `aria-modal` so screen readers scope to it.
 *
 * `variant` is layout only:
 *   bottom — action sheet anchored to the bottom edge (mobile default)
 *   rail   — right-hand rail on ≥900px, bottom sheet below that
 *   center — centred dialog, for confirmations
 */
export default function Sheet({
  onClose,
  labelledBy,
  describedBy,
  dismissable = true,
  variant = 'bottom',
  zIndex = 90,
  panelClassName = '',
  children,
}) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector(FOCUSABLE);
      (first || panel).focus({ preventScroll: true });
    }

    return () => {
      const target = restoreFocusRef.current;
      if (target && document.contains(target)) {
        target.focus({ preventScroll: true });
      }
    };
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        if (!dismissable) return;
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [dismissable, onClose]
  );

  return (
    <div className={`sheet-root sheet-root--${variant}`} style={{ zIndex }}>
      <div
        className="sheet-scrim"
        aria-hidden="true"
        onClick={dismissable ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`sheet-panel sheet-surface ${panelClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  );
}