/**
 * AST-aware mutations of a project's `mockups/index.ts`.
 *
 * The sidecar's CRUD endpoints call into here. We use `ts-morph` (a thin
 * TypeScript-Compiler-API wrapper) so formatting and surrounding screens
 * stay intact across edits — regex rewrites would break commenting, line
 * endings, and any non-canonical author style.
 *
 * All operations are local: open the source file, mutate, save. No
 * cross-file refactors. If the index format ever drifts from the
 * "array of `defineScreen({...})` calls" shape, the locator throws
 * `ScreenNotFoundError` and the handler returns 404 / 422 — the file is
 * never partially written.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  Project,
  SyntaxKind,
  type ArrayLiteralExpression,
  type CallExpression,
  type ObjectLiteralExpression,
  type PropertyAssignment,
  type SourceFile,
  type StringLiteral,
} from 'ts-morph';

export class ScreenNotFoundError extends Error {
  constructor(public readonly screenId: string) {
    super(`Screen not found in mockups/index.ts: ${screenId}`);
    this.name = 'ScreenNotFoundError';
  }
}

export class IndexShapeError extends Error {
  constructor(message: string) {
    super(`mockups/index.ts: ${message}`);
    this.name = 'IndexShapeError';
  }
}

interface ScreensArrayLocator {
  source: SourceFile;
  array: ArrayLiteralExpression;
}

function loadIndex(projectRoot: string): ScreensArrayLocator {
  const indexPath = join(projectRoot, 'mockups', 'index.ts');
  if (!existsSync(indexPath)) {
    throw new IndexShapeError(`expected file at ${indexPath}`);
  }
  const project = new Project({
    skipFileDependencyResolution: true,
    skipAddingFilesFromTsConfig: true,
    compilerOptions: { allowJs: false },
    manipulationSettings: {
      // Match the existing house style: trailing commas on multi-line
      // array elements and object members.
      useTrailingCommas: true,
    },
  });
  const source = project.addSourceFileAtPath(indexPath);

  const screensVar = source.getVariableDeclaration('screens');
  if (!screensVar) {
    throw new IndexShapeError('no `screens` named export found');
  }
  const init = screensVar.getInitializer();
  if (!init) throw new IndexShapeError('`screens` has no initializer');
  // The initializer may be an array literal directly or a typed-cast like
  // `[...] as Screen[]`. Walk down to the array literal.
  const arrayLit = init.getKind() === SyntaxKind.ArrayLiteralExpression
    ? (init as ArrayLiteralExpression)
    : (init.getFirstDescendantByKind(SyntaxKind.ArrayLiteralExpression) ?? null);
  if (!arrayLit) throw new IndexShapeError('`screens` initializer is not an array literal');
  return { source, array: arrayLit };
}

interface ScreenElement {
  index: number;
  call: CallExpression;
  obj: ObjectLiteralExpression;
}

function listScreenElements(array: ArrayLiteralExpression): ScreenElement[] {
  const out: ScreenElement[] = [];
  array.getElements().forEach((el, index) => {
    if (el.getKind() !== SyntaxKind.CallExpression) return;
    const call = el as CallExpression;
    const fn = call.getExpression().getText();
    if (fn !== 'defineScreen') return;
    const args = call.getArguments();
    if (args.length === 0) return;
    const arg = args[0];
    if (arg.getKind() !== SyntaxKind.ObjectLiteralExpression) return;
    out.push({ index, call, obj: arg as ObjectLiteralExpression });
  });
  return out;
}

function findById(array: ArrayLiteralExpression, screenId: string): ScreenElement {
  const elements = listScreenElements(array);
  for (const el of elements) {
    const idProp = el.obj.getProperty('id');
    if (!idProp || idProp.getKind() !== SyntaxKind.PropertyAssignment) continue;
    const init = (idProp as PropertyAssignment).getInitializer();
    if (init && init.getKind() === SyntaxKind.StringLiteral) {
      if ((init as StringLiteral).getLiteralText() === screenId) return el;
    }
  }
  throw new ScreenNotFoundError(screenId);
}

function getStringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
  const prop = obj.getProperty(name);
  if (!prop || prop.getKind() !== SyntaxKind.PropertyAssignment) return undefined;
  const init = (prop as PropertyAssignment).getInitializer();
  if (init && init.getKind() === SyntaxKind.StringLiteral) {
    return (init as StringLiteral).getLiteralText();
  }
  return undefined;
}

function setStringProp(obj: ObjectLiteralExpression, name: string, value: string): void {
  const prop = obj.getProperty(name);
  if (prop && prop.getKind() === SyntaxKind.PropertyAssignment) {
    (prop as PropertyAssignment).setInitializer(JSON.stringify(value));
    return;
  }
  // No existing property — append it.
  obj.addPropertyAssignment({ name, initializer: JSON.stringify(value) });
}

// ─── public API ─────────────────────────────────────────────────────

export interface DuplicateResult {
  newScreenId: string;
  newRoute: string;
  rewrotePath: string;
}

/**
 * Duplicate the screen with the given id. The new screen shares its
 * React component reference with the original; only the id, route, and
 * title are tweaked. Status is reset to `draft`. The duplicate is
 * inserted directly after the original in the array.
 *
 * Throws `ScreenNotFoundError` if the id does not exist, `IndexShapeError`
 * if the source file isn't in the expected shape.
 */
export function duplicateScreen(projectRoot: string, screenId: string): DuplicateResult {
  const { source, array } = loadIndex(projectRoot);
  const target = findById(array, screenId);

  // Pick a fresh id and route — avoid collisions with any existing entries.
  const allIds = new Set(
    listScreenElements(array)
      .map((el) => getStringProp(el.obj, 'id'))
      .filter((s): s is string => Boolean(s)),
  );
  const allRoutes = new Set(
    listScreenElements(array)
      .map((el) => getStringProp(el.obj, 'route'))
      .filter((s): s is string => Boolean(s)),
  );

  const originalRoute = getStringProp(target.obj, 'route') ?? '/';
  const originalTitle = getStringProp(target.obj, 'title') ?? screenId;

  const newScreenId = nextAvailable(`${screenId}.copy`, allIds, (_, i) => `${screenId}.copy${i}`);
  const newRoute = nextAvailable(
    `${originalRoute}-copy`,
    allRoutes,
    (_, i) => `${originalRoute}-copy${i}`,
  );

  // Insert a textual copy of the existing call right after the original.
  const callText = target.call.getFullText().trimStart();
  array.insertElement(target.index + 1, callText);

  // Re-locate the freshly-inserted element and patch its id/route/title/status.
  const inserted = listScreenElements(array)[target.index + 1];
  setStringProp(inserted.obj, 'id', newScreenId);
  setStringProp(inserted.obj, 'route', newRoute);
  setStringProp(inserted.obj, 'title', `${originalTitle} (copy)`);
  setStringProp(inserted.obj, 'status', 'draft');

  source.saveSync();

  return {
    newScreenId,
    newRoute,
    rewrotePath: source.getFilePath(),
  };
}

export interface DeleteResult {
  removedScreenId: string;
  rewrotePath: string;
}

export function deleteScreen(projectRoot: string, screenId: string): DeleteResult {
  const { source, array } = loadIndex(projectRoot);
  const target = findById(array, screenId);
  array.removeElement(target.index);
  source.saveSync();
  return { removedScreenId: screenId, rewrotePath: source.getFilePath() };
}

export interface SetStatusResult {
  screenId: string;
  previousStatus: string;
  newStatus: string;
  rewrotePath: string;
}

export function setScreenStatus(
  projectRoot: string,
  screenId: string,
  newStatus: string,
): SetStatusResult {
  const valid = ['draft', 'in-review', 'approved', 'shipped', 'deprecated'];
  if (!valid.includes(newStatus)) {
    throw new Error(`invalid status "${newStatus}" — allowed: ${valid.join(', ')}`);
  }
  const { source, array } = loadIndex(projectRoot);
  const target = findById(array, screenId);
  const previousStatus = getStringProp(target.obj, 'status') ?? 'draft';
  setStringProp(target.obj, 'status', newStatus);
  source.saveSync();
  return { screenId, previousStatus, newStatus, rewrotePath: source.getFilePath() };
}

export interface SetStringFieldResult {
  screenId: string;
  field: string;
  previousValue: string | undefined;
  newValue: string;
  rewrotePath: string;
}

/**
 * Update a plain string property on a screen (title, description, …).
 * The caller is trusted to pass a field name this object actually carries;
 * an unknown name is appended rather than rejected so future-added fields
 * don't need a code change here.
 */
export function setScreenStringField(
  projectRoot: string,
  screenId: string,
  field: string,
  newValue: string,
): SetStringFieldResult {
  const allowed = ['title', 'description'];
  if (!allowed.includes(field)) {
    throw new Error(`invalid field "${field}" — allowed: ${allowed.join(', ')}`);
  }
  const { source, array } = loadIndex(projectRoot);
  const target = findById(array, screenId);
  const previousValue = getStringProp(target.obj, field);
  setStringProp(target.obj, field, newValue);
  source.saveSync();
  return { screenId, field, previousValue, newValue, rewrotePath: source.getFilePath() };
}

export interface KnownGapInput {
  id: string;
  description: string;
  severity: 'info' | 'warn' | 'blocker';
}

export interface SetKnownGapsResult {
  screenId: string;
  count: number;
  rewrotePath: string;
}

/**
 * Replace a screen's `knownGaps` array wholesale. We rewrite the initializer
 * as generated text rather than mutating existing elements so the old array
 * layout (inline empty vs multi-line with entries) lines up with the new
 * content automatically.
 */
export function setScreenKnownGaps(
  projectRoot: string,
  screenId: string,
  gaps: KnownGapInput[],
): SetKnownGapsResult {
  const allowedSeverity = new Set(['info', 'warn', 'blocker']);
  for (const g of gaps) {
    if (typeof g.id !== 'string' || !g.id) {
      throw new Error('every known-gap entry needs a non-empty id');
    }
    if (typeof g.description !== 'string') {
      throw new Error('every known-gap entry needs a description');
    }
    if (!allowedSeverity.has(g.severity)) {
      throw new Error(`invalid severity "${g.severity}" — allowed: info, warn, blocker`);
    }
  }
  const seenIds = new Set<string>();
  for (const g of gaps) {
    if (seenIds.has(g.id)) throw new Error(`duplicate known-gap id "${g.id}"`);
    seenIds.add(g.id);
  }

  const { source, array } = loadIndex(projectRoot);
  const target = findById(array, screenId);
  const initText = renderKnownGapsInitializer(gaps);

  const prop = target.obj.getProperty('knownGaps');
  if (prop && prop.getKind() === SyntaxKind.PropertyAssignment) {
    (prop as PropertyAssignment).setInitializer(initText);
  } else {
    target.obj.addPropertyAssignment({ name: 'knownGaps', initializer: initText });
  }

  source.saveSync();
  return { screenId, count: gaps.length, rewrotePath: source.getFilePath() };
}

function renderKnownGapsInitializer(gaps: KnownGapInput[]): string {
  if (gaps.length === 0) return '[]';
  const lines = gaps.map((g) => {
    return [
      '  {',
      `    id: ${JSON.stringify(g.id)},`,
      `    description: ${JSON.stringify(g.description)},`,
      `    severity: ${JSON.stringify(g.severity)},`,
      '  }',
    ].join('\n');
  });
  return `[\n${lines.join(',\n')},\n]`;
}

// ─── helpers ────────────────────────────────────────────────────────

function nextAvailable(
  preferred: string,
  taken: Set<string>,
  variant: (preferred: string, n: number) => string,
): string {
  if (!taken.has(preferred)) return preferred;
  for (let i = 2; i < 1000; i++) {
    const candidate = variant(preferred, i);
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error(`could not find an available variant of ${preferred}`);
}
