/**
 * AppFrame — the mockup-side app shell.
 *
 * This is the chrome the *mocked product* ships with (its own sidebar,
 * top nav, etc). It lives on the mockup side so presentation mode shows
 * exactly what the real product will look like.
 */

import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import clsx from 'clsx';

export interface AppFrameNavItem {
  to: string;
  label: string;
  icon?: ReactNode;
  /** Treat this item as active only on exact match (no descendants). */
  end?: boolean;
}

export function AppFrame({
  productName,
  nav,
  children,
  user,
}: {
  productName: string;
  nav: AppFrameNavItem[];
  children: ReactNode;
  user?: { name: string; email: string };
}) {
  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-900">
      <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white">
        <div className="flex h-14 items-center border-b border-zinc-200 px-4">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            {productName}
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2 rounded px-2.5 py-2 text-sm',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-zinc-700 hover:bg-zinc-100',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="border-t border-zinc-200 p-3">
            <div className="text-xs font-medium">{user.name}</div>
            <div className="text-[11px] text-zinc-500">{user.email}</div>
          </div>
        )}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function AppFrameHeader({ children }: { children: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6">
      {children}
    </header>
  );
}

export function AppFrameBody({ children }: { children: ReactNode }) {
  return <main className="flex-1 overflow-y-auto p-6">{children}</main>;
}
