---
name: permissions-authoring
description: How to declare and consume permissions in Mockup OS screens. Use whenever a screen has destructive or role-gated UI (delete, create, edit), or when a permission needs to be added to project.config.ts.
---

# Permissions authoring

Permissions are declared centrally in `Projects/<id>/project.config.ts`
under `permissions: [...]`. Screens opt into a permission by listing its id
in `ScreenDefinition.permissions: string[]`. The Right-panel exposes a
toggle + denied-mode picker per permission the current screen declares.

## 1. Declare in `project.config.ts`

```ts
{
  id: 'record.delete',
  label: 'Delete record',
  description: 'Lets the user delete an owned record such as an account or transfer.',
  default: true,                              // granted by default in the builder?
  modes: ['hidden', 'disabled', 'denied-message'],  // modes the user can pick from
  defaultMode: 'disabled',                    // mode applied when denied
}
```

- `id` is dotted: `<area>.<verb>` (e.g., `record.delete`, `transfer.create`, `settings.edit`).
- `default: true` means the toggle starts ON. Use `false` for risky permissions.
- `modes` MUST include `defaultMode`.

## 2. Reference from a screen

```ts
defineScreen({
  id: 'finch.accounts.detail',
  // ...other fields
  permissions: ['record.delete'],
})
```

The validator (`unknown-permission`) errors if you reference an undeclared id,
and warns (`permission-not-applied-by-any-screen`) if a permission is declared
but no screen consumes it.

## 3. Consume in the component

```tsx
import { usePermission } from '@framework/permissions';

const del = usePermission('record.delete');

if (!del.granted && del.mode === 'hidden') return null;

return (
  <Button
    variant="danger"
    disabled={!del.granted && (del.mode === 'disabled' || del.mode === 'read-only')}
    title={!del.granted ? del.definition?.description : undefined}
    onClick={() => {
      if (!del.granted && del.mode === 'denied-message') {
        // surface a message inline or via toast
        return;
      }
      // perform the action
    }}
  >
    Delete
  </Button>
);
```

## Mode semantics — author chooses per call site

- **hidden** — element is omitted entirely (most invisible; user doesn't know it exists).
- **disabled** — element renders but is non-interactive; tooltip explains why.
- **denied-message** — element renders enabled; clicking surfaces a message.
- **read-only** — for forms; render fields without inputs.

`hide vs disable vs message` is a UX decision. The framework gives you `mode`;
you decide what each mode looks like for *this particular* button.

## Don't

- Don't gate large layout decisions inside `usePermission`. Permissions are
  for *individual interactive elements*, not for whole pages. Use journeys /
  routes for page-level access.
- Don't fail closed on unknown permission ids. The hook returns
  `{ granted: true, mode: 'hidden' }` for unknown ids on purpose so screens
  remain portable across projects with different permission lists.
