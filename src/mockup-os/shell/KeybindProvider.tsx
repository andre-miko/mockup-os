import { useEffect, type ReactNode } from 'react';
import { useBuilderStore } from '@framework/store';

/**
 * Global keybinds. Intentionally small — the builder is mouse-driven
 * and these are just escape hatches.
 *
 *   H — hide/show shell
 *   P — toggle presentation mode
 */
export function KeybindProvider({ children }: { children: ReactNode }) {
  const toggleShell = useBuilderStore((s) => s.toggleShell);
  const togglePresentation = useBuilderStore((s) => s.togglePresentation);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      }
      if (e.key === 'h' || e.key === 'H') toggleShell();
      if (e.key === 'p' || e.key === 'P') togglePresentation();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleShell, togglePresentation]);

  return <>{children}</>;
}
