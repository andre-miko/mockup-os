/**
 * Generate per-project docs into `Projects/<id>/artifacts/docs/`.
 *
 * Iterates every discovered project. For each, writes one Markdown file
 * per screen, per journey, plus an index README, into that project's own
 * artifacts folder so projects stay self-contained.
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { discoverProjects, type DiscoveredProject } from './lib/discover-projects';
import { validateRegistry } from '../src/mockup-os/framework/validation';

function screenDoc(s: DiscoveredProject['screens'][number]): string {
  return [
    `# ${s.title}`,
    '',
    `> \`${s.route}\` · ${s.status} · v${s.version} · ${s.layoutFamily} · ${s.viewport}`,
    '',
    s.description,
    '',
    '## States',
    '',
    ...(s.states.length
      ? s.states.map(
          (st) =>
            `- **${st.label}** (\`${st.id}\`)${st.description ? ` — ${st.description}` : ''}`,
        )
      : ['_No states declared._']),
    '',
    '## Journeys',
    '',
    ...(s.journeys.length ? s.journeys.map((j) => `- \`${j}\``) : ['_Not part of any journey._']),
    '',
    '## Related',
    '',
    ...(s.relatedScreens.length
      ? s.relatedScreens.map((id) => `- \`${id}\``)
      : ['_No related screens._']),
    '',
    '## Known gaps',
    '',
    ...(s.knownGaps.length
      ? s.knownGaps.map((g) => `- **${g.severity}** — ${g.description}`)
      : ['_None._']),
    '',
    '## Components',
    '',
    ...(s.components.length
      ? s.components.map((c) => `- ${c.name} — \`${c.path}\``)
      : ['_None declared._']),
    '',
  ].join('\n');
}

function journeyDoc(j: DiscoveredProject['journeys'][number]): string {
  return [
    `# ${j.title}`,
    '',
    j.description,
    '',
    '## Steps',
    '',
    ...j.steps.map((id, i) => `${i + 1}. \`${id}\``),
    '',
  ].join('\n');
}

function indexDoc(project: DiscoveredProject): string {
  const { meta, screens, journeys, fixtures } = project;
  return [
    `# ${meta.name} — generated documentation`,
    '',
    `_Auto-generated for project \`${meta.id}\` v${meta.version}. Do not edit by hand._`,
    '',
    `## Screens (${screens.length})`,
    '',
    ...screens.map((s) => `- [${s.title}](screens/${s.id}.md) — \`${s.route}\` · ${s.status}`),
    '',
    `## Journeys (${journeys.length})`,
    '',
    ...journeys.map((j) => `- [${j.title}](journeys/${j.id}.md) — ${j.steps.length} steps`),
    '',
    `## Fixtures (${fixtures.length})`,
    '',
    ...fixtures.map((f) => `- \`${f.id}\`${f.description ? ` — ${f.description}` : ''}`),
    '',
  ].join('\n');
}

function buildProject(project: DiscoveredProject) {
  const out = join(project.rootPath, 'artifacts', 'docs');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, 'screens'), { recursive: true });
  mkdirSync(join(out, 'journeys'), { recursive: true });

  for (const s of project.screens) {
    writeFileSync(join(out, 'screens', `${s.id}.md`), screenDoc(s), 'utf8');
  }
  for (const j of project.journeys) {
    writeFileSync(join(out, 'journeys', `${j.id}.md`), journeyDoc(j), 'utf8');
  }
  writeFileSync(join(out, 'README.md'), indexDoc(project), 'utf8');

  console.log(
    `✔ ${project.meta.id}: ${project.screens.length} screens, ${project.journeys.length} journeys → ${out}`,
  );
}

async function main() {
  const projects = await discoverProjects();

  if (projects.length === 0) {
    console.error('No projects discovered under /Projects/. Nothing to build.');
    process.exit(1);
  }

  for (const project of projects) {
    const report = validateRegistry({
      screens: project.screens,
      journeys: project.journeys,
      fixtures: project.fixtures,
      config: project.config,
    });
    if (!report.ok) {
      console.error(
        `Cannot build docs for ${project.meta.id} — registry has errors. Run \`npm run validate\`.`,
      );
      process.exit(1);
    }
    buildProject(project);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
