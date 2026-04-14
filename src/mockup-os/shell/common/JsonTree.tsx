import { useState } from 'react';
import clsx from 'clsx';

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
 */
export function JsonTree({
  value,
  maxHeightClass = 'max-h-64',
}: {
  value: unknown;
  maxHeightClass?: string;
}) {
  return (
    <pre
      className={clsx(
        'overflow-auto font-mono text-[10.5px] leading-relaxed text-shell-text',
        maxHeightClass,
      )}
    >
      <JsonNode value={value} depth={0} name={undefined} />
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

function JsonNode({
  value,
  depth,
  name,
}: {
  value: unknown;
  depth: number;
  name: string | number | undefined;
}) {
  if (Array.isArray(value)) {
    return <ArrayNode value={value} depth={depth} name={name} />;
  }
  if (value !== null && typeof value === 'object') {
    return <ObjectNode value={value as Record<string, unknown>} depth={depth} name={name} />;
  }
  return <Leaf value={value} depth={depth} name={name} />;
}

function ArrayNode({
  value,
  depth,
  name,
}: {
  value: unknown[];
  depth: number;
  name: string | number | undefined;
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
            <JsonNode key={i} value={item} depth={depth + 1} name={i} />
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
}: {
  value: Record<string, unknown>;
  depth: number;
  name: string | number | undefined;
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
            <JsonNode key={k} value={value[k]} depth={depth + 1} name={k} />
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
}: {
  value: unknown;
  depth: number;
  name: string | number | undefined;
}) {
  const indent = '  '.repeat(depth);
  return (
    <Row indent={indent}>
      {name !== undefined && <Key name={name} />}
      <LeafValue value={value} />
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
