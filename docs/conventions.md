# Docs

Authoring conventions for documentation in this repo.

## Layout

- `docs/` — hand-written framework guides (this folder).
- `artifacts/docs/` — output of `npm run docs:build`. **Do not edit by hand.**
- `artifacts/handoff/<version>/` — output of `npm run handoff`. Intended to be shared with engineering stakeholders.

## What to document by hand

- Framework concepts (types, registry, validation, shell contract).
- Product intent and cross-product design principles.
- Decisions that don't fit cleanly in metadata (e.g., accessibility stance).

## What is auto-generated

Everything derived from the registry: per-screen docs, per-journey docs, fixture lists. Edit the metadata in `src/mockup-os/mockups/<product>/index.ts` and re-run `npm run docs:build`.

## Conventions

- Titles match the screen title exactly.
- Descriptions are one to three sentences.
- Known gaps are *intentional* — unknown gaps belong in an issue, not in metadata.
