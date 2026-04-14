---
name: appframe-patterns
description: How to compose screens with the shared layout primitives (AppFrame, AppFrameHeader, AppFrameBody, PageHeader, Card, Button, Stat, EmptyState). Use whenever creating or modifying a screen TSX.
---

# AppFrame & primitive patterns

Every project's screens render inside a product layout (declared in
`project.config.ts#layouts`). The product layout wraps `<Outlet />` with
`<AppFrame productName nav user>`. Inside each screen, compose with the
primitives from `@mockups/_system`.

## Standard screen shape

```tsx
import { AppFrameBody, AppFrameHeader, Button, Card, PageHeader } from '@mockups/_system';
import { useFixture, useScreenState } from '@framework/hooks';

export function MyScreen() {
  const state = useScreenState('product.my-screen');
  const data = useFixture<MyData>('product.my-fixture')?.data;

  return (
    <>
      <AppFrameHeader>
        {/* Breadcrumb on the left, primary action on the right */}
        <BreadcrumbOrTitle />
        <PrimaryAction />
      </AppFrameHeader>
      <AppFrameBody>
        <PageHeader title="..." description="..." actions={<...>} />
        {/* Content cards / lists */}
      </AppFrameBody>
    </>
  );
}
```

## Layout primitives (read from `mockups/_system/AppFrame.tsx` and `ui.tsx`)

- `AppFrameHeader` — sticky 56-px header inside the layout's content area. Two-slot flex.
- `AppFrameBody` — scrollable body with `p-6`. Wrap your main content here.
- `PageHeader` — `{ title, description?, actions? }`.
- `Card` — rounded surface with shadow. Pass `className` to override padding (e.g., `p-0` for table cards).
- `Button` — variants `primary` / `secondary` / `ghost` / `danger`. Adds disabled opacity automatically.
- `Stat` — labelled metric with optional delta indicator.
- `EmptyState` — centered dashed-border treatment for empty data.

## Don't

- Don't import from `@shell/*` inside screens — that breaks presentation mode.
- Don't import from `@framework/store` directly — go through hooks.
- Don't render React Router `<Outlet>` inside screen files. The product
  layout owns the outlet.

## Do

- Read fixtures via `useFixture<T>(id)` so the Data tab and validator can
  reason about dependencies.
- Drive state-dependent UI via `useScreenState(screenId)` — switching states
  in the right panel will update the screen live.
- For permission-gated UI, see `permissions-authoring.md`.
