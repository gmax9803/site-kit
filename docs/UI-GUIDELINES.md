# UI guidelines

Rules every site using site-kit follows. They exist because each one was
missed at least once. Agents and people both read this before UI work.

`site-kit check` enforces the rules marked **(checked)**. The rest are on the
review list in `skills/frontend-review/SKILL.md`.

When a new UI mistake comes up in any site, add a rule here (and a check, if
one can catch it) instead of fixing it in that site alone.

## Reuse before building

- Look in `@gmax9803/site-kit/components` first. If the kit has it, use it and
  style it through tokens and `class`, never by copying it into the site.
- If two sites need the same behavior, it belongs in the kit. Build it there,
  with a demo entry and a test, then use it from the sites.
- Never hand-roll clipboard, share, disclosure or form-validation logic in a
  page script when a kit component covers it.

## Spacing and layout

- Use the spacing scale (`--sk-space-1` to `--sk-space-7`, or the site's own
  mapped scale). No one-off values like `0.55rem` or `13px`.
- Space between siblings comes from the parent's `gap`, not from margins on
  the children.
- Related things sit closer together than unrelated things: a label is nearer
  its field than the previous field.
- Keep the reading width to about 60 to 75 characters (`max-inline-size`).
- No horizontal scroll at 360px wide **(checked)**. Long words, URLs, code and
  tables wrap or scroll inside their own box.
- Design mobile first. Check 360px, about 768px and 1280px.

## Buttons and links

- A link goes somewhere; a button does something. Never a `<div>` or `<a>`
  without `href` acting as a button.
- Every `<button>` has an explicit `type` **(checked)**.
- One primary action per group. It comes first in reading order (left on wide
  screens, top when stacked). Secondary actions are visually quieter.
- Destructive actions are never the primary style and sit apart from the
  primary action.
- Hit area at least 44×44px for touch controls (`--sk-target-min`); never below
  24×24px **(checked)**. Small icon buttons extend their hit area with a
  pseudo-element rather than growing visually.
- Icon-only buttons have an `aria-label` **(checked)**. If a button has visible
  text, the accessible name contains that text.
- A button's width does not jump when its label changes (Copy → Copied). Stack
  the labels in one grid cell, as `CopyButton` does.

## Choosing the right control

| Situation | Use |
| --- | --- |
| 2 to 5 options, pick one | Radio buttons or a segmented control **(checked: dropdowns with 3 or fewer choices)** |
| 6 or more options, pick one | `<select>` |
| Many options with search | Combobox (`<input list>` or a kit component) |
| Pick any number | Checkboxes |
| On/off that applies immediately | Switch (`role="switch"` on a checkbox) |
| On/off submitted with a form | Checkbox |
| Show or hide a section | `<details>`/`<summary>` |

- A dropdown never holds actions; that's a menu button.
- Don't put a placeholder option that can be submitted. Use `required` with an
  empty-value first option.

## Forms and inputs

- Every field has a visible `<label>` **(checked)**. Placeholders are examples,
  never the label.
- Use the input type that matches the data **(checked)**: `email`, `tel`,
  `url`, `number` only for quantities (not phone numbers, ZIP codes or card
  numbers; use `inputmode="numeric"` on a text input for those).
- Set `autocomplete` on personal fields **(checked)**: `name`, `email`, `tel`,
  `postal-code`, `organization`, and so on.
- Mark the minority: if most fields are required, mark the optional ones
  "(optional)" rather than starring every required one.
- Validation messages appear next to the field, say how to fix it, and are tied
  to it with `aria-describedby`. Don't validate while someone is still typing
  their first entry; validate on blur and on submit.
- On submit failure, keep everything the person typed and move focus to the
  first field with an error.
- Disable the submit button only while a request is in flight, and show that
  it's working. Never disable it to signal invalid input.
- Group related radios or checkboxes in a `<fieldset>` with a `<legend>`.
- Server-side validation always repeats client-side validation.

## Feedback and states

- Every interactive element has visible hover, focus-visible, active and
  disabled states. Focus outlines are never removed without a replacement.
- Actions confirm in place (a check mark, a short message) and announce through
  an `aria-live` region. Avoid toasts for things that happened where the person
  is looking.
- Confirmation states revert on their own after about 2 seconds.
- Loading states keep the layout's size so nothing jumps.

## Accessibility

- WCAG 2.2 AA is the floor **(checked with axe)**: contrast, names, roles,
  landmarks, heading order, language.
- One `<h1>` per page; headings don't skip levels.
- Every page has `<main>`, and repeated navigation is in `<nav>`.
- Images that carry meaning have alt text; decorative images use `alt=""`.
- Everything works with a keyboard alone, in a logical order.
- Respect `prefers-reduced-motion`: transitions become instant.
- Text in other languages is wrapped in an element with `lang`.

## Motion

- Transitions are short (`--sk-motion-fast`, 120 to 200ms) and only on color,
  opacity and transform.
- No motion on page load. Nothing loops.

## Content and translation

- Text lives in the site's content or i18n files, not in components. Kit
  components take every visible string as a prop.
- Don't invent facts, prices, credentials or testimonials. Use clear
  placeholders.
- Leave room for translations to be about 30% longer than English.

## Verifying UI work

1. `pnpm run validate` passes (it runs the build and `site-kit check`).
2. Look at the change in a browser at 360px and 1280px, in light and dark mode
   if the site has both.
3. Use it with the keyboard alone.
4. Go through `skills/frontend-review/SKILL.md`.
