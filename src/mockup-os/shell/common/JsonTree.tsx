import { useState } from 'react';
import clsx from 'clsx';

type Path = ReadonlyArray<string | number>;

/**
 * Minimal collapsible JSON tree.
 *
 * Renders in a scrollable `<pre>`. Arrays and objects are expandable per
 * level; primitives render inline with lightweight colouring (string,
 * number, boolean, null). No dep; see the inline renderer below.
 *
 * `maxHeightClass` exposes the scroll container's height so callers can
 * drop it into tight panels (tailwind class, e.g. `max-h-64`) or let it
 * grow to fit their parent (`max-h-full`).
 *
 * When `onChange` is provided, primitive leaves render as inline editable
 * controls (text / number / checkbox). Structural edits (adding or removing
 * keys, changing a leaf's type) are intentionally out of scope — this is a
 * quick "what does this look like with different values?" affordance.
 */
export function JsonTree({
  value,
  maxHeightClass = 'max-h-64',
  onChange,
}: {
  value: unknown;
  maxHeightClass?: string;
  onChange?: (next: unknown) => void;
}) {
  const onLeafChange = onChange
    ? (path: Path, leaf: unknown) => onChange(setAtPath(value, path, leaf))
    : undefined;
  return (
    <pre
      className={clsx(
        'overflow-auto font-mono text-[10.5px] leading-relaxed text-shell-text',
        maxHeightClass,
      )}
    >
      <JsonNode
        value={value}
        depth={0}
        name={undefined}
        path={[]}
        onLeafChange={onLeafChange}
      />
    </pre>
  );
}

/** Human-readable one-liner for the root of a JSON value. */
export function summariseJson(value: unknown): string {
  if (Array.isArray(value)) return `array · ${value.length}`;
  if (value && typeof value === 'object') {
    return `object · ${Object.keys(value as Record<string, unknown>).length}`;
  }
  if (value === null) return 'null';
  return typeof value;
}

function setAtPath(root: unknown, path: Path, leaf: unknown): unknown {
  if (path.length === 0) return leaf;
  const [head, ...rest] = path;
  if (typeof head === 'number') {
    const arr = Array.isArray(root) ? root.slice() : [];
    arr[head] = setAtPath(arr[head], rest, leaf);
    return arr;
  }
  const obj = root && typeof root === 'object' ? { ...(root as Record<string, unknown>) } : {};
  obj[head] = setAtPath(obj[head], rest, leaf);
  return obj;
}

function JsonNode({
  value,
  depth,
  name,
  path,
  onLeafChange,
}: {
  value: unknown;
  depth: number;
  name: string | number | undefined;
  path: Path;
  onLeafChange: ((path: Path, leaf: unknown) => void) | undefined;
}) {
  if (Array.isArray(value)) {
    return (
      <ArrayNode value={value} depth={depth} name={name} path={path} onLeafChange={onLeafChange} />
    );
  }
  if (value !== null && typeof value === 'object') {
    return (
      <ObjectNode
        value={value as Record<string, unknown>}
        depth={depth}
        name={name}
        path={path}
        onLeafChange={onLeafChange}
      />
    );
  }
  return (
    <Leaf value={value} depth={depth} name={name} path={path} onLeafChange={onLeafChange} />
  );
}

function ArrayNode({
  value,
  depth,
  name,
  path,
  onLeafChange,
}: {
  value: unknown[];
  depth: number;
  name: string | number | undefined;
  path: Path;
  onLeafChange: ((path: Path, leaf: unknown) => void) | undefined;
}) {
  const [open, setOpen] = useState(depth < 1);
  const indent = '  '.repeat(depth);
  return (
    <>
      <Row indent={indent}>
        <Toggle open={open} onToggle={() => setOpen((o) => !o)} />
        {name !== undefined && <Key name={name} />}[
        <Count>{value.length}</Count>
        {!open && '…]'}
      </Row>
      {open && (
        <>
          {value.map((item, i) => (
            <JsonNode
              key={i}
              value={item}
              depth={depth + 1}
              name={i}
              path={[...path, i]}
              onLeafChange={onLeafChange}
            />
          ))}
          <Row indent={indent}>]</Row>
        </>
      )}
    </>
  );
}

function ObjectNode({
  value,
  depth,
  name,
  path,
  onLeafChange,
}: {
  value: Record<string, unknown>;
  depth: number;
  name: string | number | undefined;
  path: Path;
  onLeafChange: ((path: Path, leaf: unknown) => void) | undefined;
}) {
  const [open, setOpen] = useState(depth < 1);
  const indent = '  '.repeat(depth);
  const keys = Object.keys(value);
  return (
    <>
      <Row indent={indent}>
        <Toggle open={open} onToggle={() => setOpen((o) => !o)} />
        {name !== undefined && <Key name={name} />}
        {'{'}
        <Count>{keys.length}</Count>
        {!open && '…}'}
      </Row>
      {open && (
        <>
          {keys.map((k) => (
            <JsonNode
              key={k}
              value={value[k]}
              depth={depth + 1}
              name={k}
              path={[...path, k]}
              onLeafChange={onLeafChange}
            />
          ))}
          <Row indent={indent}>{'}'}</Row>
        </>
      )}
    </>
  );
}

function Leaf({
  value,
  depth,
  name,
  path,
  onLeafChange,
}: {
  value: unknown;
  depth: number;
  name: string | number | undefined;
  path: Path;
  onLeafChange: ((path: Path, leaf: unknown) => void) | undefined;
}) {
  const indent = '  '.repeat(depth);
  return (
    <Row indent={indent}>
      {name !== undefined && <Key name={name} />}
      {onLeafChange ? (
        <EditableLeafValue
          value={value}
          onCommit={(next) => onLeafChange(path, next)}
        />
      ) : (
        <LeafValue value={value} />
      )}
    </Row>
  );
}

function Row({ indent, children }: { indent: string; children: React.ReactNode }) {
  return (
    <div>
      <span>{indent}</span>
      {children}
    </div>
  );
}

function Toggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mr-1 inline-block w-3 text-shell-muted"
      aria-label={open ? 'Collapse' : 'Expand'}
    >
      {open ? '▾' : '▸'}
    </button>
  );
}

function Key({ name }: { name: string | number }) {
  const label = typeof name === 'string' ? `"${name}"` : name;
  return <span className="text-shell-muted">{label}: </span>;
}

function Count({ children }: { children: number }) {
  return <span className="ml-1 text-shell-muted">{children}</span>;
}

function LeafValue({ value }: { value: unknown }) {
  if (value === null) return <span className="text-shell-muted">null</span>;
  if (typeof value === 'string')
    return <span className="text-emerald-300">&quot;{value}&quot;</span>;
  if (typeof value === 'number')
    return <span className="text-sky-300">{value}</span>;
  if (typeof value === 'boolean')
    return <span className="text-amber-300">{String(value)}</span>;
  return <span className="text-shell-muted">{String(value)}</span>;
}

function EditableLeafValue({
  value,
  onCommit,
}: {
  value: unknown;
  onCommit: (next: unknown) => void;
}) {
  // Booleans toggle inline (no edit mode). null and unknown types fall back
  // to the read-only rendering — changing types is out of scope for v1.
  if (typeof value === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => onCommit(!value)}
        className="rounded px-1 text-amber-300 hover:bg-white/5"
        title="Click to toggle"
      >
        {String(value)}
      </button>
    );
  }
  if (typeof value === 'string') {
    return <EditableString value={value} onCommit={onCommit} />;
  }
  if (typeof value === 'number') {
    return <EditableNumber value={value} onCommit={onCommit} />;
  }
  return <LeafValue value={value} />;
}

function EditableString({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="rounded px-1 text-left text-emerald-300 hover:bg-white/5"
        title="Click to edit"
      >
        &quot;{value}&quot;
      </button>
    );
  }
  const commit = () => {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  };
  return (
    <input
      autoFocus
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
      className="rounded border border-shell-border bg-shell-bg px-1 font-mono text-[10.5px] text-emerald-300 outline-none focus:border-sky-400"
    />
  );
}

function EditableNumber({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (next: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        className="rounded px-1 text-left text-sky-300 hover:bg-white/5"
        title="Click to edit"
      >
        {value}
      </button>
    );
  }
  const commit = () => {
    setEditing(false);
    const parsed = Number(draft);
    if (!Number.isNaN(parsed) && parsed !== value) onCommit(parsed);
  };
  return (
    <input
      autoFocus
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
      className="w-24 rounded border border-shell-border bg-shell-bg px-1 font-mono text-[10.5px] text-sky-300 outline-none focus:border-sky-400"
    />
  );
}
