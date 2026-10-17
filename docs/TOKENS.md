# Token contract

Kit components read only `--sk-*` custom properties. Defaults live in
`src/styles/tokens.css` at zero specificity, so a site overrides them with a
plain `:root` rule and dark themes override them under their own selector.

| Token | Used for | Default |
| --- | --- | --- |
| `--sk-color-text` | Body text in kit components | `currentColor` |
| `--sk-color-muted` | Resting icon buttons, secondary text | 65% of `currentColor` |
| `--sk-color-accent` | Hover, focus ring | `#1f5f8b` |
| `--sk-color-success` | Copied and other success states | `#1d7a3e` |
| `--sk-color-danger` | Failed states | `#b42318` |
| `--sk-color-surface-hover` | Hover background on quiet buttons | 8% of `currentColor` |
| `--sk-focus-ring` | Focus outline | `2px solid var(--sk-color-accent)` |
| `--sk-focus-offset` | Focus outline offset | `2px` |
| `--sk-radius-sm` | Small controls | `4px` |
| `--sk-motion-fast` | State transitions | `160ms` |
| `--sk-ease` | Transition easing | `ease` |
| `--sk-space-1` … `--sk-space-7` | Spacing scale | `0.25rem` … `3rem` |
| `--sk-target-min` | Minimum touch target | `2.75rem` |

## Mapping a site onto the contract

Point the tokens at the site's existing variables once, in the site's global
stylesheet:

```css
:root {
	--sk-color-accent: var(--accent);
	--sk-color-success: var(--status-ongoing-fg);
	--sk-color-danger: var(--danger);
	--sk-radius-sm: var(--radius-sm);
}
```

Because the right-hand side is a `var()`, a dark theme that redefines the
site's own variables updates the kit components too.

## Adding a token

Add a token only when a kit component needs a value that differs between
sites. Name it `--sk-<category>-<role>`, give it a neutral default in
`tokens.css`, and document it here.
