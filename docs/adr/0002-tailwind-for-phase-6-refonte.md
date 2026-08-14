# Migrate to Tailwind CSS for Phase 6 (responsive, dark mode, visual refonte)

Phase 6 needs three things at once — mobile/desktop breakpoints, a dark mode
palette, and a general visual polish pass — on top of a client that
currently has zero media queries or CSS variables (`App.css` is
fixed-position, hardcoded-pixel CSS). We migrate to Tailwind CSS as the
foundation for all three, rather than hand-rolling breakpoints and CSS
custom properties, because Tailwind's `md:`/`dark:` variants solve exactly
this combination, and because this same migration was already reasoned
about (and then dropped) in an earlier draft of the roadmap for the same
reasons.

## Considered Options

- Hand-rolled CSS variables + `@media` queries — rejected: reinvents what
  Tailwind already provides, and stacking three chantiers (responsive, dark
  mode, refonte) on hand-written CSS is exactly what motivated considering
  Tailwind in the first place.

## Consequences

Every existing component's CSS (`App.css`, `BoulodromesMap.tsx`,
`BoulodromeSearch.tsx`, `RoutePanel.tsx`, `CheckboxFilter.tsx`,
`FreeAccessFilter.tsx`) gets rewritten to Tailwind utility classes as part
of Phase 6, rather than incrementally.

---

Numbered `0002`, not `0001`: `ROADMAP.md` already references
`docs/adr/0001-openrouteservice-over-self-hosted-osrm.md` (Phase 5), but
that file was lost — `docs/` was gitignored as a local-only directory
before it was ever committed. The `0001` slot is reserved for it rather
than reused here; ask to have it reconstructed separately if wanted.
