# ACE × ServiceNow Journal Authoring Contract

DA is the canonical content source. Do not add journal pages, navigation, or media as Git fixtures. Use the local `da-cli` for every content read, write, preview, publish, and audit operation.

## Routes

- `/` — editorial landing page
- `/journal/` — chronological archive
- `/journal/<stable-slug>` — permanent entry page
- `/field-guides/<stable-slug>` — evergreen synthesis when the corpus warrants it
- `/about/` — scope, method, and evidence policy

Keep dates in metadata rather than URLs. An updated investigation retains its route.

## Entry metadata

Each dated entry uses one body Metadata block nested in its final section.

Required fields:

| Field | Contract |
| --- | --- |
| Title | Entry title and index title |
| Description | Concise deck/thesis |
| Publication Date | ISO date (`YYYY-MM-DD`) |
| Last Updated | ISO date (`YYYY-MM-DD`) |
| Entry Type | Field Note, Investigation, Experiment, Decision, Release, or Field Guide |
| Status | Observed, Testing, Validated, Decided, or Superseded |
| Workstream | One controlled primary workstream |
| Systems | Comma-separated controlled system names |
| Confidence | One or more comma-separated values: Runtime Observed, Locally Reproduced, Source-Proven, Client-Reported, or Hypothesis |
| Takeaway | One-sentence durable conclusion |
| Template | `journal-entry` |
| Image | Optional canonical social/cover image |

Confidence and workflow status are independent. A decided recommendation can still contain client-runtime unknowns.

Page templates:

- `journal-home` — editorial landing page
- `journal-index` — chronological archive
- `journal-entry` — dated entry using the complete metadata contract above
- `journal-method` — undated method/about page; requires Title, Description, Template, Nav, Footer, and Robots metadata

Initial workstreams:

- Asset Integrity & Delivery
- Authoring Guardrails
- Preview & Stakeholder Trust
- Change Intelligence
- Platform Foundations

Initial systems vocabulary:

- AMS AEM Sites
- AEMaaCS Sites
- AEMaaCS Assets
- Dynamic Media
- Oak
- FileVault
- Cloud Manager / Content Copy
- Core Components
- Assets UI / NUI
- AEM Launches
- JCR Versions
- Sling Jobs
- Workfront

## Entry narrative

Use semantic default content for the story. A major investigation generally follows:

1. **Signal** — what was observed or requested?
2. **Boundary** — which system owns the behavior and what is out of scope?
3. **Evidence** — what did source, runtime, tests, or client reports prove?
4. **Reading** — what does that evidence mean?
5. **Decision** — what is recommended now?
6. **Risk** — what remains unsafe, unknown, or reversible?
7. **Next** — what will be tested, shipped, or revisited?

These are editorial headings, not mandatory decorative blocks. Short entries may combine them. Keep essential conclusions visible without opening tabs or operating controls.

## Section modifiers

Section metadata owns section paint, width, exterior spacing, and sibling composition.

- `ace-cover` — homepage cover composition
- `ace-entry-lead` — journal entry or method-page lead
- `ace-now` — current question / state / next checkpoint rail
- `ace-threads` — curated workstream overview
- `ace-ledger` — chronological journal region
- `ace-guides` — evergreen models and field guides
- `ace-evidence` — evidence and confidence band
- `ace-inverse` — reusable high-contrast section
- `ace-wide` — wide figure/table measure
- `ace-quiet` — low-emphasis transition or method section

Do not style a section from a nested block stylesheet. Do not infer section roles from heading text or route position.

## Journal Hero block

The `Journal Hero` block supplies stable layout cells for Canvas editing.

Authored shape:

| Journal Hero | |
| --- | --- |
| Cover image | Eyebrow, H1, deck, and ordinary links |
| Fact | Fact | Fact |

Contract:

- First row: one media cell and one copy cell, in either order.
- The initial release intentionally omits media because no generated candidate passed the cover gate; a copy-only first row is a supported, deliberate type-first state.
- Optional later row(s): concise factual items.
- One H1 on the page.
- An optional eyebrow is a paragraph immediately before the H1. If it is omitted, begin the copy cell with the H1.
- A CTA row is an ordinary paragraph whose first link is bold. Inline links in the deck remain ordinary links.
- Links remain ordinary semantic links; no whole-card or stretched-link overlay.
- The decorator adds classes only. It never replaces, clones, or moves authored fields or images.
- On narrow viewports, copy and media remain separate flow regions and the 16:9 cover remains uncropped. On wide viewports, the copy may overlay the authored type-safe field. Do not change this to a centered portrait `cover` crop.

### Evidence Ledger variant

Choose `Journal Hero (Evidence Ledger)` for the locked homepage composition.
Do not use this variant as a generic hero or card layout.

Authored shape:

| Journal Hero (Evidence Ledger) | |
| --- | --- |
| Claim | Latest evidence dossier |
| Signal | Boundary | Evidence | Decision | Next |

The claim cell requires exactly one H1 and a deck. It may also contain the
eyebrow and ordinary CTA links described above.

The latest evidence dossier requires:

- authored date;
- entry type and text-visible status;
- linked H2 entry title;
- one-sentence finding;
- concise Boundary, Evidence, Decision, and Next facts;
- optional systems/workstream;
- optional approved media with useful alt text.

The dossier image is omitted entirely until it passes the documented media
gate. Never author or generate a placeholder, empty media frame, stock image,
or synthetic fallback.

The second row contains exactly five cells in canonical order: Signal,
Boundary, Evidence, Decision, and Next. Each cell contains an authored strong
label and a concise current-investigation example. The decorator may add one
separate five-button control group that changes only emphasis and announces
the selected step. It never moves, clones, wraps, hides, or replaces the five
authored cells. Without JavaScript, all five explanations remain visible in
source order.

If the method row is missing, extra, reordered, or malformed, keep all
authored content visible and omit the generated controls rather than
inventing or mislabeling stages. If Canvas replaces the block's inner DOM,
decoration must remove stale controls and rebuild exactly one valid group.
During in-place Canvas edits, the generated controls revalidate against the
authored labels; malformed labels remove the controls until the canonical
five-stage sequence is restored.

Homepage source order for this direction is:

1. `ace-cover, evidence-ledger-cover` with the hero variant (the comma is
   required so DA serializes two section classes rather than one combined
   `ace-cover-evidence-ledger-cover` class);
2. `ace-ledger` with the complete current-first `Journal Feed`;
3. `ace-threads`;
4. `ace-guides`;
5. `ace-inverse` method close.

The current dossier entry deliberately repeats as the first ledger row. Keep
its date, status, linked title, finding, workstream, and systems synchronized
during every journal update. The prior numeric cover facts are not part of
this variant because manually maintained counts can become misleading.

## Journal Feed block

The `Journal Feed` block is an authored chronological ledger. Append one row for each visible entry.

Authored shape:

| Journal Feed | | | |
| --- | --- | --- | --- |
| Date | Type + status | H3 linked title + one-sentence thesis | Systems / workstream |

Contract:

- Rows are newest first on the homepage and archive.
- The linked title is the explicit navigation target.
- Status and type are text, never color-only.
- Date remains an authored semantic value; the visual date column is not a generated pseudo-label.
- The decorator adds role classes only and preserves every authored node and Canvas marker.
- Native index-backed discovery may be added after the live corpus and ordering contract justify it. Do not fetch the entire index merely to sort or facet in the browser.

## Data Table block

Use `Data Table` for comparison matrices and evidence tables. EDS interprets an ordinary authored HTML table as a block named after its first header cell, so raw tables are not a supported journal contract.

Authored shape:

| Data Table | | |
| --- | --- | --- |
| Header | Header | Optional header |
| Value | Value | Optional value |

Contract:

- The first authored row becomes `<thead>` with column-scoped `<th>` cells.
- Later rows become `<tbody>` rows with `<td>` cells.
- Every authored paragraph, list, link, code span, and Canvas marker moves intact into its semantic cell.
- The original block wrapper and `data-block-index` survive exactly once.
- Extra rows and cells remain visible; an empty block does not throw.
- The block owns narrow-screen horizontal scrolling without making the page itself scroll horizontally.
- The scroll owner is keyboard-focusable and names itself as a scrollable data table.

## Canvas invariants

For every block and shared decorator:

- preserve the original block wrapper and `data-block-index`;
- preserve each marked heading, paragraph, list, quote, preformatted field, and image exactly once;
- put role classes on stable rows/cells, not on semantic fields that Canvas reconstructs;
- support `.prosemirror-editor > .ProseMirror > <semantic field>` geometry;
- never wrap editable content in generated anchors or buttons;
- avoid document/window listeners, persistent timers, and repeat-render leaks;
- keep overlays non-intercepting;
- prove image selection and replacement map to one canonical image;
- make repeated decoration deterministic and idempotent.
- recover when Canvas replaces only a block's inner authored DOM while retaining its outer wrapper; never trust a persistent `data-decorated` flag as proof that current descendants are decorated.

## Ongoing entry workflow

1. Check DA authentication and remaining validity.
2. Resolve the implementation and operational workspace roots.
3. Fetch the target page through `da content get`.
4. Create or edit the entry in the operational content root.
5. Run `da content fix-sections` without `--write` and review the result.
6. Dry-run `da content put`.
7. Repeat with root `--commit` only after reviewing the exact target.
8. Dry-run and commit preview separately.
9. Validate `plain.html`, the decorated browser experience, block contracts, responsiveness, accessibility, and Canvas layout/split.
10. Publish only with explicit live intent; rebuild and validate the native index when discovery depends on it.

Use the locally installed command authority:

```sh
node /Users/mhess/aem/aem-code/da/da-cli/bin/da.js --help
```

Never call the DA Admin or Helix Admin APIs directly for journal operations.
