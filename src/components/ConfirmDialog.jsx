import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Sheet from './Sheet';

/**
 * Destructive-action confirmation. Replaces `window.confirm`, which cannot
 * be styled, is announced inconsistently, and blocks the main thread.
 */
export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const [armed, setArmed] = useState(false);

  // Second click required within 3s — guards against a stray double-tap.
  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <Sheet
      onClose={onCancel}
      labelledBy="confirm-title"
      describedBy="confirm-description"
      variant="center"
      zIndex={140}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--danger-fg)',
        }}
      >
        <AlertTriangle size={18} aria-hidden="true" />
        <h2 className="sheet-panel__title" id="confirm-title">
          {title}
        </h2>
      </div>
      <p className="sheet-panel__body" id="confirm-description">
        {description}
      </p>
      <div className="sheet-panel__actions">
        <button type="button" className="chrome-row" onClick={onCancel}>
          <span style={{ textAlign: 'center', width: '100%' }}>{cancelLabel}</span>
        </button>
        <button
          type="button"
          className="chrome-row chrome-row--danger"
          onClick={armed ? onConfirm : () => setArmed(true)}
        >
          <span style={{ textAlign: 'center', width: '100%' }}>{armed ? `Tap Again to ${confirmLabel}` : confirmLabel}</span>
        </button>
      </div>
    </Sheet>
  );
}