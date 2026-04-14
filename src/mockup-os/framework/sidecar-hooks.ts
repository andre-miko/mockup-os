/**
 * React integration for the sidecar client.
 *
 * `useSidecarHealth` polls `/readyz` on mount and every 15s. Consumers use
 * the returned status (`unknown` / `online` / `offline`) to decide whether
 * to show a feature or its disabled fallback.
 */

import { useEffect, useState } from 'react';
import { sidecar, type SidecarHealth } from './sidecar-client';

export type SidecarStatus = 'unknown' | 'online' | 'offline';

const POLL_INTERVAL_MS = 15_000;

export function useSidecarHealth(): {
  status: SidecarStatus;
  health: SidecarHealth | null;
  baseUrl: string;
  refresh: () => void;
} {
  const [status, setStatus] = useState<SidecarStatus>('unknown');
  const [health, setHealth] = useState<SidecarHealth | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      const result = await sidecar.health();
      if (cancelled) return;
      if (result.status === 'ok') {
        setStatus('online');
        setHealth(result.data);
      } else {
        setStatus('offline');
        setHealth(null);
      }
    };

    probe();
    const id = window.setInterval(probe, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [nonce]);

  return {
    status,
    health,
    baseUrl: sidecar.baseUrl,
    refresh: () => setNonce((n) => n + 1),
  };
}
