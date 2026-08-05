"use client";

import { useState, useEffect } from "react";

/**
 * Whether this account can push leads to LuxWeb CRM. Studio-internal, so it's
 * false for essentially every user — the UI hides the button entirely.
 */
export function useCrmPush(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch("/api/crm/send");
        if (!res.ok) return;
        const body = (await res.json()) as { enabled?: boolean };
        if (active && body.enabled) setEnabled(true);
      } catch {
        // Leave it off — the button just doesn't appear.
      }
    }
    check();
    return () => {
      active = false;
    };
  }, []);

  return enabled;
}
