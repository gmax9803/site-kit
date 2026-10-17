# Changelog

## 0.1.1

- `site-kit check --update-baseline` records today's errors in
  `site-kit-baseline.json`, so a site can adopt the checks and gate only new
  problems while it fixes old ones.
- Form field check: trusts a specific `autocomplete` token (for example
  `tel-national` on a text input) and skips fields that aren't visible, such
  as honeypots.
- `CopyButton`: copied and failed colors keep their specificity so a site's
  button class can't hide them; no hidden "Copy failed" sizer when
  `promptText` replaces the failed state; type declarations for
  `scripts/copy-button.js`.

## 0.1.0

- `CopyButton` component, icon-only or with visible text, with copied and
  failed states, a stable width, a live-region announcement and an optional
  prompt fallback. Exports `copyText` and `copyFromButton` for page scripts.
- Token contract (`styles/tokens.css`, `docs/TOKENS.md`).
- UI rulebook (`docs/UI-GUIDELINES.md`) and `frontend-review` skill.
- `site-kit check`: html-validate, axe (WCAG 2.2 AA), sideways-scroll and form
  field checks, with screenshots at each width.
- Reusable `site-checks` GitHub Actions workflow.
