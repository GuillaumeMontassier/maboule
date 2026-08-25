# Fetch boulodromes by map viewport (bbox) instead of the whole dataset

The map currently refetches the full filtered dataset on every filter
change and remounts `BoulodromesMap` in the process, which resets Leaflet's
zoom/pan to its hardcoded default — the actual cause of the "map zooms out
when I filter" complaint, not a scale problem (the dataset is 64 rows
total). We're adopting viewport-scoped fetching anyway (`GET
/api/boulodromes?bbox=...` on every pan/zoom, already built server-side in
Phase 3 via a PostGIS `&&` bbox query but never used by the client), with
pill filters applied client-side over whatever's currently loaded, because
it's the direction the map is expected to grow toward (more data folded
into the main layer, wider coverage) and the server capability is already
sitting there unused.

## Considered Options

- **Fetch once, filter entirely client-side** — simpler, no moveend
  listener/debounce, fully sufficient at the current 64-row scale. Not
  rejected outright: documented here as the fallback if bbox-scoping adds
  UX complexity (loading flicker, debounce tuning) without a real payoff in
  practice — revisit this ADR if so.

## Consequences

- `BoulodromeSearch`'s search results and `BoulodromeHistoryEntry` history
  entries must carry their own coordinates for `flyTo`, instead of relying
  on the selected boulodrome being present in the now viewport-scoped
  dataset (a search hit or history entry is often *outside* the current
  viewport by construction).
- `BoulodromesMap` must stop unmounting/remounting on every data fetch
  (pan/zoom-triggered or filter-triggered) so Leaflet's zoom/pan state
  survives — required regardless of which option above is used.
- The "loading flicker" risk named above under Considered Options did
  materialize, but not as an inherent cost of bbox-scoping itself: the
  always-mounted map still rendered a full-viewport `isFetching`/`error`
  block (`.status`, `height: 100vh`, leftover from the pre-bbox conditional
  render) on every pan/zoom-triggered refetch, not just the first load. Fixed
  by distinguishing first load (blocking, no data yet) from background
  refetch (silent on success, small transient indicator on error) instead of
  a single undifferentiated loading state — see ticket 37. Doesn't warrant
  falling back to fetch-once-filter-client-side.
