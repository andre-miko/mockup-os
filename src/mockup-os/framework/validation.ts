/**
 * Registry validation.
 *
 * Runs at dev-time and in CI (via scripts/validate-registry.ts) to catch
 * the structural problems that make generated mockups feel unreliable:
 * duplicate ids, broken route/journey/fixture references, orphaned
 * screens, and missing default states.
 *
 * Keep checks pure and side-effect free so they can run in Node scripts
 * without pulling the React runtime.
 */

import type {
  FixtureDefinition,
  JourneyDefinition,
  ProjectConfig,
  ScreenDefinition,
} from './types';

export type ValidationSeverity = 'error' | 'warn';

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  subject?: string;
}

export interface ValidationReport {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  all: ValidationIssue[];
}

interface ValidateInput {
  screens: ReadonlyArray<ScreenDefinition>;
  journeys: ReadonlyArray<JourneyDefinition>;
  fixtures: ReadonlyArray<FixtureDefinition>;
  /** Optional. Enables permission/section declaration checks when provided. */
  config?: ProjectConfig;
}

export function validateRegistry(input: ValidateInput): ValidationReport {
  const issues: ValidationIssue[] = [];
  const push = (i: ValidationIssue) => issues.push(i);

  const screenIds = new Set<string>();
  const screenRoutes = new Set<string>();
  for (const s of input.screens) {
    if (screenIds.has(s.id)) {
      push({
        severity: 'error',
        code: 'duplicate-screen-id',
        message: `Duplicate screen id: ${s.id}`,
        subject: s.id,
      });
    }
    screenIds.add(s.id);

    if (!s.route.startsWith('/')) {
      push({
        severity: 'error',
        code: 'invalid-route',
        message: `Screen ${s.id} route must start with "/": ${s.route}`,
        subject: s.id,
      });
    }
    if (screenRoutes.has(s.route)) {
      push({
        severity: 'error',
        code: 'duplicate-route',
        message: `Duplicate route: ${s.route}`,
        subject: s.route,
      });
    }
    screenRoutes.add(s.route);

    if (s.defaultStateId) {
      const found = s.states.some((st) => st.id === s.defaultStateId);
      if (!found) {
        push({
          severity: 'error',
          code: 'unknown-default-state',
          message: `Screen ${s.id} defaults to unknown state ${s.defaultStateId}`,
          subject: s.id,
        });
      }
    } else if (s.states.length > 0) {
      push({
        severity: 'warn',
        code: 'missing-default-state',
        message: `Screen ${s.id} has states but no defaultStateId`,
        subject: s.id,
      });
    }
  }

  const journeyIds = new Set<string>();
  for (const j of input.journeys) {
    if (journeyIds.has(j.id)) {
      push({
        severity: 'error',
        code: 'duplicate-journey-id',
        message: `Duplicate journey id: ${j.id}`,
        subject: j.id,
      });
    }
    journeyIds.add(j.id);

    if (j.steps.length === 0) {
      push({
        severity: 'warn',
        code: 'empty-journey',
        message: `Journey ${j.id} has no steps`,
        subject: j.id,
      });
    }

    for (const stepId of j.steps) {
      if (!screenIds.has(stepId)) {
        push({
          severity: 'error',
          code: 'missing-journey-step',
          message: `Journey ${j.id} references unknown screen ${stepId}`,
          subject: j.id,
        });
      }
    }
  }

  const fixtureIds = new Set<string>();
  for (const f of input.fixtures) {
    if (fixtureIds.has(f.id)) {
      push({
        severity: 'error',
        code: 'duplicate-fixture-id',
        message: `Duplicate fixture id: ${f.id}`,
        subject: f.id,
      });
    }
    fixtureIds.add(f.id);
    if (f.screenId && !screenIds.has(f.screenId)) {
      push({
        severity: 'error',
        code: 'fixture-screen-missing',
        message: `Fixture ${f.id} references unknown screen ${f.screenId}`,
        subject: f.id,
      });
    }
  }

  // Every screen must be reachable from a journey OR explicitly declare
  // an empty journey list. Silent orphans are the biggest source of
  // "we forgot about that page" handoff failures.
  const reachable = new Set<string>();
  for (const j of input.journeys) for (const step of j.steps) reachable.add(step);

  for (const s of input.screens) {
    if (s.journeys.length === 0 && !reachable.has(s.id)) {
      push({
        severity: 'warn',
        code: 'orphan-screen',
        message: `Screen ${s.id} is not part of any journey`,
        subject: s.id,
      });
    }
    for (const jid of s.journeys) {
      if (!journeyIds.has(jid)) {
        push({
          severity: 'error',
          code: 'screen-journey-missing',
          message: `Screen ${s.id} lists unknown journey ${jid}`,
          subject: s.id,
        });
      }
    }
    for (const fid of s.fixtures) {
      if (!fixtureIds.has(fid)) {
        push({
          severity: 'error',
          code: 'screen-fixture-missing',
          message: `Screen ${s.id} lists unknown fixture ${fid}`,
          subject: s.id,
        });
      }
    }
    for (const relId of s.relatedScreens) {
      if (!screenIds.has(relId)) {
        push({
          severity: 'warn',
          code: 'broken-related-link',
          message: `Screen ${s.id} links to unknown related screen ${relId}`,
          subject: s.id,
        });
      }
    }
  }

  // Permission + section declaration checks (only when project config is
  // supplied — validators run by older callers keep working unchanged).
  if (input.config) {
    const permissionIds = new Set((input.config.permissions ?? []).map((p) => p.id));
    const sectionIds = new Set((input.config.sections ?? []).map((s) => s.id));

    // Duplicate permission / section ids in config.
    const seenPerm = new Set<string>();
    for (const p of input.config.permissions ?? []) {
      if (seenPerm.has(p.id)) {
        push({
          severity: 'error',
          code: 'duplicate-permission-id',
          message: `Duplicate permission id: ${p.id}`,
          subject: p.id,
        });
      }
      seenPerm.add(p.id);
      if (!p.modes.includes(p.defaultMode)) {
        push({
          severity: 'error',
          code: 'invalid-permission-default-mode',
          message: `Permission ${p.id} defaultMode "${p.defaultMode}" is not listed in modes`,
          subject: p.id,
        });
      }
    }

    const seenSection = new Set<string>();
    for (const section of input.config.sections ?? []) {
      if (seenSection.has(section.id)) {
        push({
          severity: 'error',
          code: 'duplicate-section-id',
          message: `Duplicate section id: ${section.id}`,
          subject: section.id,
        });
      }
      seenSection.add(section.id);
      for (const sid of section.screenIds) {
        if (!screenIds.has(sid)) {
          push({
            severity: 'error',
            code: 'section-screen-missing',
            message: `Section ${section.id} lists unknown screen ${sid}`,
            subject: section.id,
          });
        }
      }
    }

    // Per-screen references into the project config.
    const permissionUsage = new Map<string, number>();
    const sectionUsage = new Map<string, number>();
    for (const s of input.screens) {
      for (const pid of s.permissions ?? []) {
        if (!permissionIds.has(pid)) {
          push({
            severity: 'error',
            code: 'unknown-permission',
            message: `Screen ${s.id} references unknown permission ${pid}`,
            subject: s.id,
          });
        } else {
          permissionUsage.set(pid, (permissionUsage.get(pid) ?? 0) + 1);
        }
      }
      for (const sid of s.sections ?? []) {
        if (!sectionIds.has(sid)) {
          push({
            severity: 'error',
            code: 'unknown-section',
            message: `Screen ${s.id} references unknown section ${sid}`,
            subject: s.id,
          });
        } else {
          sectionUsage.set(sid, (sectionUsage.get(sid) ?? 0) + 1);
        }
      }
    }

    // Warn on unused permissions — a declared permission with no screen that
    // honours it is almost certainly dead config.
    for (const p of input.config.permissions ?? []) {
      const applied = (permissionUsage.get(p.id) ?? 0) > 0;
      if (!applied) {
        push({
          severity: 'warn',
          code: 'permission-not-applied-by-any-screen',
          message: `Permission ${p.id} is declared but no screen references it`,
          subject: p.id,
        });
      }
    }

    // Warn on empty sections — neither the section's own screenIds nor any
    // screen's `sections: [...]` list includes a member.
    for (const section of input.config.sections ?? []) {
      const hasDirectMembers = section.screenIds.length > 0;
      const hasReverseMembers = (sectionUsage.get(section.id) ?? 0) > 0;
      if (!hasDirectMembers && !hasReverseMembers) {
        push({
          severity: 'warn',
          code: 'section-empty',
          message: `Section ${section.id} has no screens`,
          subject: section.id,
        });
      }
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warn');
  return { ok: errors.length === 0, errors, warnings, all: issues };
}
