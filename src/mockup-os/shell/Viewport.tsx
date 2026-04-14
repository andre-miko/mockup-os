/**
 * The framed viewport inside the shell.
 *
 * This is only rendered when the shell is visible. It deliberately adds
 * no padding or layout — the mockup inside should look the same here as
 * it does in presentation mode, modulo the surrounding chrome.
 */

import type { ReactNode } from 'react';

export function Viewport({ children }: { children: ReactNode }) {
  return <div className="min-h-[600px] w-full">{children}</div>;
}
