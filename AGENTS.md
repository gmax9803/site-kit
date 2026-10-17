# AGENTS.md

## Project

site-kit holds what gmax9803's Astro sites share: components, their scripts
and styles, the UI rulebook, the frontend review skill, and the `site-kit
check` command used in each site's CI.

Sites install it as a git dependency pinned to a tag
(`github:gmax9803/site-kit#vX.Y.Z`), so a change here reaches a site only when
that site bumps the tag.

## Read first

- `docs/UI-GUIDELINES.md`: the rules every site follows
- `docs/TOKENS.md`: the CSS custom properties components may use

## Rules

- Components are plain Astro with no framework and no build step. Scripts are
  plain JavaScript modules.
- Components style themselves only with `--sk-*` tokens, and every selector in
  their CSS is wrapped in `:where()` so sites can override it.
- Every visible string is a prop with an English default. Sites translate.
- A new component gets an entry on the demo page (`demo/src/pages/index.astro`)
  in each of its states, and a test in `tests/`.
- Breaking changes to a component's props or markup bump the minor version
  while below 1.0, and the release notes say how to migrate.
- Keep dependencies minimal; anything added here is installed by every site.

## Validation

```bash
pnpm install
pnpm run validate
```

This builds the demo, runs the tests (which drive the demo in Chromium), and
runs `site-kit check` on the demo. In a container where Playwright's own
Chromium isn't installed, set `SITE_KIT_CHROMIUM` to a Chromium binary.

## Releasing

1. Update `version` in `package.json` and add a section to `CHANGELOG.md`.
2. Merge to `master`, then tag `vX.Y.Z` on that commit and push the tag.
3. In each site, bump the dependency to the new tag and run its validation.
