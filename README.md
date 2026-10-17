# site-kit

What gmax9803's Astro sites share, built and tested once:

- **Components** (`src/components/`): `CopyButton`
- **Token contract** (`src/styles/tokens.css`, [`docs/TOKENS.md`](docs/TOKENS.md)): the CSS custom properties components use, mapped onto each site's palette
- **UI rulebook** ([`docs/UI-GUIDELINES.md`](docs/UI-GUIDELINES.md)): spacing, buttons, controls, forms, states and accessibility rules for people and agents
- **Agent skill** ([`skills/frontend-review/SKILL.md`](skills/frontend-review/SKILL.md)): the review an agent runs before calling UI work done
- **`site-kit check`**: html-validate, axe (WCAG 2.2 AA), sideways-scroll and form field checks on a built site, with screenshots
- **Reusable CI** (`.github/workflows/site-checks.yml`)

The demo page in `demo/` shows every component in every state.

## Using it in a site

1. Install a tagged version:

   ```bash
   pnpm add -D github:gmax9803/site-kit#v0.1.1
   ```

2. Map the tokens once in the site's global stylesheet (see [`docs/TOKENS.md`](docs/TOKENS.md)).

3. Use components:

   ```astro
   ---
   import CopyButton from '@gmax9803/site-kit/components/CopyButton.astro';
   ---
   <CopyButton value="hello@example.com" label="Copy email address" />
   <CopyButton target="#fingerprint" text="Copy" label="Copy fingerprint" />
   ```

4. Run the checks after the build in the site's `validate` script:

   ```json
   "validate": "pnpm run build && site-kit check"
   ```

5. Call the reusable workflow from `.github/workflows/checks.yml`:

   ```yaml
   name: Checks
   on:
     pull_request:
     push:
       branches: [master]
   jobs:
     checks:
       uses: gmax9803/site-kit/.github/workflows/site-checks.yml@v0.1.1
   ```

   Adopting the checks on a site with existing problems? Run
   `site-kit check --update-baseline` once to record them in
   `site-kit-baseline.json`. They then show as known and pass, any new error
   still fails, and the run tells you when a known one is fixed.

6. Point agents at the shared rules from the site's `AGENTS.md`:

   ```markdown
   ## UI work

   Follow `node_modules/@gmax9803/site-kit/docs/UI-GUIDELINES.md`, use kit
   components before writing new ones, and run the review in
   `node_modules/@gmax9803/site-kit/skills/frontend-review/SKILL.md` before
   calling UI work done.
   ```

## Developing

```bash
pnpm install
pnpm run validate
```

To try an unreleased change in a site, point the site at your checkout with
`pnpm link ../site-kit`, and switch back to the tag before merging.
