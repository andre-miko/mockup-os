/**
 * CI-friendly registry validator.
 *
 * Iterates every discovered project under `/Projects/` and runs
 * `validateRegistry` against each. Exits non-zero on any error-level
 * issue across any project. Warnings are printed but do not fail.
 *
 * Run with `npm run validate`.
 */

import { discoverProjects } from './lib/discover-projects';
import { validateRegistry } from '../src/mockup-os/framework/validation';

async function main() {
  const projects = await discoverProjects();

  if (projects.length === 0) {
    console.error('No projects discovered under /Projects/. Nothing to validate.');
    process.exit(1);
  }

  let totalErrors = 0;

  for (const project of projects) {
    const { meta, screens, journeys, fixtures, config } = project;
    const report = validateRegistry({ screens, journeys, fixtures, config });

    console.log(`\n──────── ${meta.name} (${meta.id}) ────────`);

    if (report.warnings.length) {
      console.log(`${report.warnings.length} warning(s):`);
      for (const w of report.warnings) {
        const sub = w.subject ? ` [${w.subject}]` : '';
        console.log(`  ⚠  ${w.code}${sub} — ${w.message}`);
      }
    }

    if (report.errors.length) {
      totalErrors += report.errors.length;
      console.error(`${report.errors.length} error(s):`);
      for (const e of report.errors) {
        const sub = e.subject ? ` [${e.subject}]` : '';
        console.error(`  ✖  ${e.code}${sub} — ${e.message}`);
      }
    }

    if (report.ok && report.warnings.length === 0) {
      console.log(
        `✔ Registry OK — ${screens.length} screens, ${journeys.length} journeys, ${fixtures.length} fixtures.`,
      );
    } else if (report.ok) {
      console.log(
        `✔ ${screens.length} screens, ${journeys.length} journeys, ${fixtures.length} fixtures (warnings only).`,
      );
    }
  }

  if (totalErrors > 0) {
    console.error(
      `\n✖ Validation failed: ${totalErrors} error(s) across ${projects.length} project(s).`,
    );
    process.exit(1);
  }

  console.log(`\n✔ All ${projects.length} project(s) valid.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
