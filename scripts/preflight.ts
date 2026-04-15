/**
 * Preflight — automated checks for CHECKLIST.md sections that don't need
 * human eyes. Run with `npm run preflight` from `src/mockup-os/`.
 *
 * Groups:
 *   env        — Node / npm / Playwright binaries
 *   install    — node_modules / lockfile sanity
 *   static     — typecheck, lint, vitest, registry validator, validator
 *                negative case (deliberate break must exit non-zero)
 *   isolation  — the two non-negotiables: no mockup imports @shell or
 *                @framework/store; no frontend code touches node:fs
 *   sidecar    — optional, only if the sidecar is already running:
 *                /api/health and a path-traversal probe
 *
 * Flags:
 *   --skip <group>[,<group>...]   skip a group (e.g. --skip static,sidecar)
 *   --only <group>[,<group>...]   run only these groups
 *   --sidecar-url <url>           default http://localhost:5179
 *   --no-negative                 skip the registry negative case
 *
 * Exits 0 if every attempted check passes, 1 otherwise. Soft-skipped
 * checks (e.g. sidecar not running) do not fail the run.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── colour helpers ────────────────────────────────────────────────────

const COLOUR = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code: string, s: string) => (COLOUR ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = (s: string) => c('32', s);
const red = (s: string) => c('31', s);
const yellow = (s: string) => c('33', s);
const dim = (s: string) => c('2', s);
const bold = (s: string) => c('1', s);

// ─── paths ─────────────────────────────────────────────────────────────

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(HERE, '..');
const APP_DIR = join(REPO_ROOT, 'src', 'mockup-os');
const PROJECTS_DIR = join(REPO_ROOT, 'Projects');

// ─── args ──────────────────────────────────────────────────────────────

interface Args {
  skip: Set<string>;
  only: Set<string> | null;
  sidecarUrl: string;
  runNegative: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    skip: new Set(),
    only: null,
    sidecarUrl: 'http://localhost:5179',
    runNegative: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--skip') a.skip = new Set(argv[++i]?.split(',').filter(Boolean) ?? []);
    else if (v === '--only') a.only = new Set(argv[++i]?.split(',').filter(Boolean) ?? []);
    else if (v === '--sidecar-url') a.sidecarUrl = argv[++i] ?? a.sidecarUrl;
    else if (v === '--no-negative') a.runNegative = false;
  }
  return a;
}

const args = parseArgs(process.argv.slice(2));

// ─── result tracker ────────────────────────────────────────────────────

type Status = 'pass' | 'fail' | 'skip' | 'warn';
interface Check {
  group: string;
  name: string;
  status: Status;
  detail?: string;
}
const checks: Check[] = [];

function record(group: string, name: string, status: Status, detail?: string) {
  checks.push({ group, name, status, detail });
  const icon =
    status === 'pass' ? green('✓') : status === 'fail' ? red('✗') : status === 'warn' ? yellow('!') : dim('·');
  const line = `  ${icon} ${name}`;
  // eslint-disable-next-line no-console
  console.log(detail ? `${line} ${dim(detail)}` : line);
}

function enabled(group: string): boolean {
  if (args.only) return args.only.has(group);
  return !args.skip.has(group);
}

function heading(title: string) {
  // eslint-disable-next-line no-console
  console.log(`\n${bold(title)}`);
}

// ─── shell helpers ─────────────────────────────────────────────────────

function run(cmd: string, cmdArgs: string[], cwd: string) {
  return spawnSync(cmd, cmdArgs, { cwd, encoding: 'utf8', shell: process.platform === 'win32' });
}

function version(out: string): string {
  return out.trim().split(/\r?\n/)[0];
}

function parseMajor(v: string): number {
  const m = v.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

// ─── env ───────────────────────────────────────────────────────────────

function checkEnv() {
  if (!enabled('env')) return;
  heading('env');

  const node = run('node', ['--version'], APP_DIR);
  if (node.status === 0) {
    const v = version(node.stdout);
    const major = parseMajor(v);
    record('env', `Node installed (${v})`, major >= 20 ? 'pass' : 'fail', major < 20 ? 'need 20+' : undefined);
  } else {
    record('env', 'Node installed', 'fail', 'node not on PATH');
  }

  const npm = run('npm', ['--version'], APP_DIR);
  if (npm.status === 0) {
    const v = version(npm.stdout);
    const major = parseMajor(v);
    record('env', `npm installed (${v})`, major >= 10 ? 'pass' : 'warn', major < 10 ? 'recommend 10+' : undefined);
  } else {
    record('env', 'npm installed', 'fail', 'npm not on PATH');
  }

  const npx = run('npx', ['playwright', '--version'], APP_DIR);
  if (npx.status === 0) {
    record('env', `Playwright available (${version(npx.stdout)})`, 'pass');
  } else {
    record('env', 'Playwright available', 'warn', 'npx playwright --version failed (snapshot/e2e will not run)');
  }
}

// ─── install ───────────────────────────────────────────────────────────

function checkInstall() {
  if (!enabled('install')) return;
  heading('install');

  const nm = join(APP_DIR, 'node_modules');
  record('install', 'src/mockup-os/node_modules present', existsSync(nm) ? 'pass' : 'fail', existsSync(nm) ? undefined : 'run `npm install` in src/mockup-os');

  const lock = join(APP_DIR, 'package-lock.json');
  record('install', 'src/mockup-os/package-lock.json present', existsSync(lock) ? 'pass' : 'warn');

  const chromiumHint = existsSync(join(process.env.USERPROFILE ?? process.env.HOME ?? '', 'AppData', 'Local', 'ms-playwright'))
    || existsSync(join(process.env.HOME ?? '', '.cache', 'ms-playwright'));
  record(
    'install',
    'Playwright chromium downloaded',
    chromiumHint ? 'pass' : 'warn',
    chromiumHint ? undefined : 'run `npx playwright install chromium` if §8 snapshot is needed',
  );
}

// ─── static ────────────────────────────────────────────────────────────

function runNpmScript(script: string, label: string) {
  const r = run('npm', ['run', '--silent', script], APP_DIR);
  if (r.status === 0) {
    record('static', label, 'pass');
  } else {
    const tail = (r.stdout + r.stderr).trim().split(/\r?\n/).slice(-3).join(' | ');
    record('static', label, 'fail', tail || `exit ${r.status}`);
  }
}

function checkStatic() {
  if (!enabled('static')) return;
  heading('static');
  runNpmScript('typecheck', 'typecheck');
  runNpmScript('lint', 'lint');
  runNpmScript('test', 'vitest');
  runNpmScript('validate', 'registry validator (positive case)');

  if (!args.runNegative) {
    record('static', 'registry validator (negative case)', 'skip', '--no-negative');
    return;
  }

  // Deliberately break the example-project index by appending an invalid
  // defineScreen, run validate, expect non-zero, revert.
  const targetCandidates = [
    join(PROJECTS_DIR, 'example-project', 'mockups', 'index.ts'),
    join(PROJECTS_DIR, 'example-project', 'mockups', 'index.tsx'),
  ];
  const target = targetCandidates.find((p) => existsSync(p));
  if (!target) {
    record('static', 'registry validator (negative case)', 'skip', 'example-project index not found');
    return;
  }

  const original = readFileSync(target, 'utf8');
  const marker = '// __preflight_negative__';
  // Append push()es so the duplicates actually land in the exported `screens`
  // array. Bare `defineScreen(...)` statements at module scope are orphaned
  // and would not reach the validator.
  const dupLiteral =
    `defineScreen({ id: '__preflight_duplicate__', title: 'x', route: '/x', description: 'x', layoutFamily: 'detail', viewport: 'responsive', journeys: [], states: [{ id: 'default', label: 'default' }], defaultStateId: 'default', fixtures: [], components: [], status: 'draft', version: '0.0.0', relatedScreens: [], knownGaps: [], component: () => null })`;
  const injected =
    original +
    `\n${marker}\n` +
    `(screens as unknown as any[]).push(${dupLiteral});\n` +
    `(screens as unknown as any[]).push(${dupLiteral});\n`;

  try {
    writeFileSync(target, injected, 'utf8');
    const r = run('npm', ['run', '--silent', 'validate'], APP_DIR);
    if (r.status !== 0) {
      record('static', 'registry validator (negative case)', 'pass', 'duplicate id correctly rejected');
    } else {
      record('static', 'registry validator (negative case)', 'fail', 'validator passed on a broken registry');
    }
  } finally {
    writeFileSync(target, original, 'utf8');
  }
}

// ─── isolation ─────────────────────────────────────────────────────────

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (entry === 'node_modules' || entry === 'artifacts' || entry === '.git') continue;
      walk(p, out);
    } else if (/\.(t|j)sx?$/.test(entry)) {
      out.push(p);
    }
  }
  return out;
}

function grepPattern(files: string[], re: RegExp): { file: string; line: number; text: string }[] {
  const hits: { file: string; line: number; text: string }[] = [];
  for (const f of files) {
    const lines = readFileSync(f, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) hits.push({ file: f, line: i + 1, text: lines[i].trim() });
    }
  }
  return hits;
}

function checkIsolation() {
  if (!enabled('isolation')) return;
  heading('isolation');

  const mockupFiles = walk(PROJECTS_DIR);

  const shellHits = grepPattern(mockupFiles, /from\s+['"]@shell/);
  record(
    'isolation',
    'no mockup imports @shell',
    shellHits.length === 0 ? 'pass' : 'fail',
    shellHits.length === 0 ? undefined : `${shellHits.length} hit(s); first: ${relative(REPO_ROOT, shellHits[0].file)}:${shellHits[0].line}`,
  );

  const storeHits = grepPattern(mockupFiles, /from\s+['"]@framework\/store/);
  record(
    'isolation',
    'no mockup imports @framework/store',
    storeHits.length === 0 ? 'pass' : 'fail',
    storeHits.length === 0 ? undefined : `${storeHits.length} hit(s); first: ${relative(REPO_ROOT, storeHits[0].file)}:${storeHits[0].line}`,
  );

  // Frontend must not touch node:fs. Scope: src/mockup-os/, excluding tests.
  const frontendFiles = walk(APP_DIR).filter((f) => !/[\\/]tests[\\/]/.test(f));
  const fsHits = grepPattern(frontendFiles, /from\s+['"](node:fs|fs)['"]/);
  record(
    'isolation',
    'no frontend code imports node:fs',
    fsHits.length === 0 ? 'pass' : 'fail',
    fsHits.length === 0 ? undefined : `${fsHits.length} hit(s); first: ${relative(REPO_ROOT, fsHits[0].file)}:${fsHits[0].line}`,
  );
}

// ─── sidecar ───────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 2000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(to);
  }
}

async function checkSidecar() {
  if (!enabled('sidecar')) return;
  heading('sidecar');

  let health: Response | null = null;
  try {
    health = await fetchWithTimeout(`${args.sidecarUrl}/api/health`);
  } catch {
    record('sidecar', 'sidecar reachable', 'skip', `no response at ${args.sidecarUrl} — start it with \`npm run sidecar\` if you want this group checked`);
    return;
  }
  if (!health || !health.ok) {
    record('sidecar', 'sidecar reachable', 'fail', `health returned ${health?.status ?? '??'}`);
    return;
  }
  record('sidecar', 'sidecar /api/health returns 200', 'pass');

  // Path-traversal probe — attempt to read a brief file outside the project
  // root via a crafted project id. The sidecar must refuse.
  const probe = `${args.sidecarUrl}/api/projects/${encodeURIComponent('../../')}/brief`;
  try {
    const res = await fetchWithTimeout(probe);
    if (res.status >= 400 && res.status < 500) {
      record('sidecar', 'path traversal rejected (4xx)', 'pass', `status ${res.status}`);
    } else {
      record('sidecar', 'path traversal rejected (4xx)', 'fail', `sidecar answered ${res.status} to a traversal attempt`);
    }
  } catch (err) {
    record('sidecar', 'path traversal rejected (4xx)', 'warn', `probe errored: ${(err as Error).message}`);
  }
}

// ─── main ──────────────────────────────────────────────────────────────

async function main() {
  // eslint-disable-next-line no-console
  console.log(bold('Mockup OS preflight'));
  // eslint-disable-next-line no-console
  console.log(dim(`repo: ${REPO_ROOT}`));

  checkEnv();
  checkInstall();
  checkStatic();
  checkIsolation();
  await checkSidecar();

  const pass = checks.filter((c) => c.status === 'pass').length;
  const fail = checks.filter((c) => c.status === 'fail').length;
  const warn = checks.filter((c) => c.status === 'warn').length;
  const skip = checks.filter((c) => c.status === 'skip').length;

  // eslint-disable-next-line no-console
  console.log(
    `\n${bold('summary')}  ${green(`${pass} pass`)}  ${fail ? red(`${fail} fail`) : dim('0 fail')}  ${warn ? yellow(`${warn} warn`) : dim('0 warn')}  ${dim(`${skip} skip`)}`,
  );

  if (fail === 0) {
    // eslint-disable-next-line no-console
    console.log(
      `\n${green('Automated checks clean.')} Next stop: ${bold('CHECKLIST.md §2')} (Shell & runtime) — that needs human eyes.`,
    );
  } else {
    // eslint-disable-next-line no-console
    console.log(`\n${red('Fix the failures above before moving on to the manual sections.')}`);
  }

  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(2);
});
