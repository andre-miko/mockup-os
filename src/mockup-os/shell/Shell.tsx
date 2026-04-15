/**
 * Top-level builder chrome.
 *
 * Presentation rule (mandatory): when presentation mode is on, this
 * component renders its children with ZERO wrapping markup. No padding,
 * no flex container, no toolbar residue. This is enforced by the early
 * return below — do not reintroduce a wrapper in the presentation branch.
 */

import { type ReactNode } from 'react';
import clsx from 'clsx';
import { useBuilderStore, VIEWPORT_SIZES } from '@framework/store';
import { LeftPanel } from './panels/LeftPanel';
import { RightPanel } from './panels/RightPanel';
import { TopBar } from './panels/TopBar';
import { PromptBar } from './panels/PromptBar';
import { Viewport } from './Viewport';
import { KeybindProvider } from './KeybindProvider';

export function Shell({ children }: { children: ReactNode }) {
  const presentationMode = useBuilderStore((s) => s.presentationMode);
  const viewport = useBuilderStore((s) => s.viewport);

  // CRITICAL: in presentation mode we must not wrap the mockup. The
  // mockup owns the viewport entirely, exactly like the shipped app.
  if (presentationMode) {
    return (
      <KeybindProvider>
        <div id="mockup-root" className="min-h-screen w-full">
          {children}
        </div>
      </KeybindProvider>
    );
  }

  const vp = VIEWPORT_SIZES[viewport];

  return (
    <KeybindProvider>
      <div className="flex h-screen w-screen flex-col bg-shell-bg text-shell-text">
        <TopBar />
        <PromptBar />
        <div className="flex min-h-0 flex-1">
          <LeftPanel />
          <main className="flex min-w-0 flex-1 items-start justify-center overflow-auto bg-shell-bg p-6">
            <div
              className={clsx(
                'relative overflow-hidden rounded-lg border border-shell-border bg-white text-black shadow-2xl',
                vp.width === null && 'w-full min-h-full',
              )}
              style={vp.width ? { width: vp.width } : undefined}
            >
              <Viewport>{children}</Viewport>
            </div>
          </main>
          <RightPanel />
        </div>
      </div>
    </KeybindProvider>
  );
}
