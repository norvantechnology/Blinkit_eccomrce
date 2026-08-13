'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Browser / Android back closes an overlay instead of leaving the page.
 * Dummy history entry is pushed while open; X/close also unwinds it.
 */
export function useCloseOnPopstate(open: boolean, onClose: () => void) {
  const pushed = useRef(false);
  const closingViaUi = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      pushed.current = false;
      closingViaUi.current = false;
      return;
    }

    window.history.pushState({ overlay: true }, '');
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
    return () => window.removeEventListener('popstate', onPop);
  }, [open]);

  return useCallback(() => {
    if (pushed.current) {
      closingViaUi.current = true;
      onCloseRef.current();
      window.history.back();
      return;
    }
    onCloseRef.current();
  }, []);
}
