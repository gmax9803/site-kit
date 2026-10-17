---
name: frontend-review
description: Review UI changes on a site that uses @gmax9803/site-kit before calling them done. Use after building or changing any page, component, form, button or style.
---

# Frontend review

Run this before saying UI work is finished. The rules come from
`node_modules/@gmax9803/site-kit/docs/UI-GUIDELINES.md`; read it if you
haven't in this task.

## 1. Reuse

- Did you build something the kit already has (copy button, form field, icon
  button)? Replace it with the kit component.
- Did you build something another site already has? Stop and move it into the
  kit instead (see the kit's AGENTS.md).

## 2. Automated checks

Run the site's full gate and fix every error it reports:

```bash
pnpm run validate
```

That includes `site-kit check`, which validates the HTML and renders each page
at 360px and 1280px for accessibility, sideways scroll and form field types.
Read the warnings too and fix the ones your change caused.

## 3. Look at it

Open the changed pages in a browser at 360px and 1280px wide (and in dark mode
if the site has one). Check, for each changed screen:

- Spacing uses the scale, siblings are spaced with `gap`, and related items are
  closer together than unrelated ones.
- One primary action per group, first in reading order.
- The right control for the number of choices (radios for 2 to 5, select for 6
  or more; no dropdown with two options).
- Inputs have visible labels, the right `type`, `autocomplete`, and errors that
  sit next to the field.
- Buttons don't change width when their label changes.
- Nothing overlaps, truncates or wraps awkwardly, including in the longest
  translation.

## 4. Use it

- Tab through the change with the keyboard alone. Focus is visible and the
  order makes sense.
- Trigger each state: hover, focus, active, disabled, loading, success, error,
  empty.
- With reduced motion on, nothing animates.

## 5. Report

In your summary, list what you checked and anything you couldn't check (for
example, no browser available). If you found a new kind of UI mistake, propose
a rule for UI-GUIDELINES.md.
