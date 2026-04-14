# Authoring a mockup

Everything about a mockup lives in one place: the product's `index.ts`.

## 1. Create the screen component

```tsx
// src/mockup-os/mockups/finch/screens/NewScreen.tsx
import { AppFrameBody, AppFrameHeader, PageHeader } from '../../_system';

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
// src/mockup-os/mockups/finch/index.ts
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
