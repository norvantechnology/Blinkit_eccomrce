'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Browser / Android back closes an overlay instead of leaving the page.
 * Dummy history entry is pushed while open; X/close also unwinds it.
 */
export function useCloseOnPopstate(open: boolean, onClose: () => void) {
  const pushed = useRef(false);
  const closingViaUi = useRef(false);
  const skipUnwind = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    skipUnwind.current = false;
    window.history.pushState({ __bkOverlay: true }, '');
    pushed.current = true;

    const onPop = () => {
      pushed.current = false;
      if (closingViaUi.current) {
        closingViaUi.current = false;
        return;
      }
      onCloseRef.current();
    };

    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Closed without dismiss — drop the dummy entry (unless navigating away).
      if (pushed.current && !skipUnwind.current) {
        pushed.current = false;
        closingViaUi.current = true;
        window.history.back();
      }
      pushed.current = false;
    };
  }, [open]);

  /** Close via X / overlay click — unwind dummy history entry. */
  const dismiss = useCallback(() => {
    if (pushed.current) {
      closingViaUi.current = true;
      pushed.current = false;
      onCloseRef.current();
      window.history.back();
      return;
    }
    onCloseRef.current();
  }, []);

  /**
   * Close and run navigation that replaces the overlay history entry
   * (avoids leftover dummy back-stack entries).
   */
  const dismissThen = useCallback((navigate: () => void) => {
    skipUnwind.current = true;
    pushed.current = false;
    closingViaUi.current = true;
    onCloseRef.current();
    navigate();
  }, []);

  return { dismiss, dismissThen };
}
