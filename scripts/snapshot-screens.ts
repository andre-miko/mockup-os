/**
 * Capture per-screen PNG snapshots via Playwright (chromium).
 *
 * Iterates every screen in the project (or only those at or above
 * `--min-status`) and writes one PNG per screen to
 * `Projects/<id>/artifacts/snapshots/<screen.id>.png`.
 *
 * Requires `npm run dev` to be running (or another base URL via
 * `--base-url`). The script presses `H` on each page after navigation to
 * hide the builder shell so the screenshot is the mockup as the user
 * would see it shipped.
 *
 * Usage:
 *
 *   npm run snapshot                                    # all projects, status >= approved
 *   npm run snapshot -- --project example-project
 *   npm run snapshot -- --base-url http://localhost:5174
 *   npm run snapshot -- --min-status draft              # snapshot every screen
 *   npm run snapshot -- --width 1280 --height 800       # viewport
 */

import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { discoverProjects, type DiscoveredProject } from './lib/discover-projects';
import type { ScreenStatus } from '../src/mockup-os/framework/types';

interface CliArgs {
  project?: string;
  baseUrl: string;
  width: number;
  height: number;
  minStatus: ScreenStatus;
  full: boolean;
}

const STATUS_ORDER: Record<ScreenStatus, number> = {
  draft: 0,
  'in-review': 1,
  approved: 2,
  shipped: 3,
  deprecated: -1, // skip deprecated regardless of min-status
};

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    baseUrl: 'http://localhost:5173',
    width: 1280,
    height: 800,
    minStatus: 'approved',
    full: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project' && argv[i + 1]) out.project = argv[++i];
    else if (a === '--base-url' && argv[i + 1]) out.baseUrl = argv[++i];
    else if (a === '--width' && argv[i + 1]) out.width = Number(argv[++i]);
    else if (a === '--height' && argv[i + 1]) out.height = Number(argv[++i]);
    else if (a === '--min-status' && argv[i + 1])
      out.minStatus = argv[++i] as ScreenStatus;
    else if (a === '--full') out.full = true;
  }
  return out;
}

function eligible(status: ScreenStatus, min: ScreenStatus): boolean {
  if (status === 'deprecated') return false;
  return (STATUS_ORDER[status] ?? -1) >= (STATUS_ORDER[min] ?? 0);
}

async function snapshotProject(project: DiscoveredProject, args: CliArgs) {
  const eligibleScreens = project.screens
    .filter((s) => eligible(s.status, args.minStatus))
    // routes with `:` parameters need a real value; skip parametric routes
    // for v1 — author can author per-state fixtures the screen reads from,
    // but the route segment itself can't be derived without a sample.
    .filter((s) => !s.route.includes(':'));

  if (eligibleScreens.length === 0) {
    console.log(
      `${project.meta.id}: no screens at status ≥ ${args.minStatus} with concrete routes — skipping.`,
    );
    return [];
  }

  const outDir = join(project.rootPath, 'artifacts', 'snapshots');
  // Idempotent: clear and re-create so deleted screens don't leave stale PNGs.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const captured: { id: string; path: string }[] = [];
  try {
    const context = await browser.newContext({
      viewport: { width: args.width, height: args.height },
    });

    for (const screen of eligibleScreens) {
      const url = `${args.baseUrl}${screen.route}`;
      const page = await context.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15_000 });
        // Hide the builder chrome so the screenshot shows the mockup as
        // the end user would see it. The P keybind toggles presentation mode.
        await page.keyboard.press('p');
        // Tiny settle to let the layout transition complete.
        await page.waitForTimeout(150);
        const path = join(outDir, `${screen.id}.png`);
        await page.screenshot({ path, fullPage: args.full });
        captured.push({ id: screen.id, path });
        console.log(`  ✔ ${screen.id} ${screen.route}`);
      } catch (err) {
        console.error(
          `  ✖ ${screen.id} ${screen.route} — ${err instanceof Error ? err.message : err}`,
        );
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  return captured;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Probe the base URL first so we fail fast with a clear message rather
  // than letting Playwright timeout cryptically per page.
  try {
    const probe = await fetch(args.baseUrl);
    if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
  } catch (err) {
    console.error(
      `Cannot reach ${args.baseUrl}. Start \`npm run dev\` (or pass --base-url).`,
    );
    console.error(`Underlying: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const all = await discoverProjects();
  const projects = args.project ? all.filter((p) => p.meta.id === args.project) : all;
  if (projects.length === 0) {
    console.error(
      args.project
        ? `No project with id "${args.project}".`
        : 'No projects discovered under /Projects/.',
    );
    process.exit(1);
  }

  let total = 0;
  for (const project of projects) {
    console.log(`──────── ${project.meta.name} (${project.meta.id}) ────────`);
    const captured = await snapshotProject(project, args);
    total += captured.length;
  }

  console.log(`\n✔ Captured ${total} screenshot(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
