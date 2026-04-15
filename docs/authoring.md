# Authoring a mockup

Everything about a mockup lives in one place: the product's `index.ts`.

## 1. Create the screen component

```tsx
// Projects/example-project/mockups/screens/NewScreen.tsx
import { AppFrameBody, AppFrameHeader, PageHeader } from '@mockups/_system';

export function NewScreen() {
  return (
    <>
      <AppFrameHeader>
        <div className="text-sm font-medium">New screen</div>
      </AppFrameHeader>
      <AppFrameBody>
        <PageHeader title="New screen" />
      </AppFrameBody>
    </>
  );
}
```

## 2. Register it

```ts
// Projects/example-project/mockups/index.ts
const NewScreen = lazy(() =>
  import('./screens/NewScreen').then((m) => ({ default: m.NewScreen })),
);

defineScreen({
  id: 'finch.new-screen',
  title: 'New screen',
  route: '/finch/new',
  description: 'What this screen is for.',
  layoutFamily: 'detail',
  viewport: 'responsive',
  journeys: ['finch.daily-check'],
  states: [{ id: 'default', label: 'Default' }],
  defaultStateId: 'default',
  fixtures: [],
  components: [],
  status: 'draft',
  version: '0.1.0',
  relatedScreens: [],
  knownGaps: [],
  component: NewScreen,
}),
```

## 3. Validate

```sh
npm run validate
```

If you introduced any broken references, duplicate ids, or orphan screens, the validator will tell you before the reviewer does.

## 4. (Optional) Regenerate docs

```sh
npm run docs:build
```

## Using fixtures and state

Inside a screen, call `useScreenState(screenId)` to react to the currently selected state, and `useFixture(id)` to pull fixture data. Mockups **must not** depend on the shell's zustand store directly.

## Editing from the running shell

Most metadata can also be edited from the right-panel inspector while `npm run dev:all` is running:

- **Status** — set via the status dropdown. Writes through the sidecar as an AST mutation of `mockups/index.ts`.
- **Known gaps** — add, edit, or remove inline via the Known Gaps panel.
- **Fixtures** — edit JSON in place in the Data panel. Edits take effect immediately via in-memory overrides; "Save" persists to `data/<fid>.json` through the sidecar, "Revert" clears the override.
- **Duplicate / delete** — buttons on the screen header run AST-safe CRUD through the sidecar; formatting and comments are preserved.

All of these operations go through `scripts/sidecar/`. The frontend never touches `node:fs` directly.

## Ghost screens

If you list a route in `docs/sitemap.md` that doesn't yet have a `defineScreen(...)` entry, the router renders a "✨ Proposed screen" placeholder. That's the integration point for `/new-screen` — the agent reads the sitemap entry and scaffolds the real screen in place.
