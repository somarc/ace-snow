# ACE × ServiceNow Field Journal

A living, evidence-backed record of Adobe Co-Innovation Engineering work with ServiceNow, built on AEM Edge Delivery Services.

The journal follows one visible reasoning trace:

> Signal → Boundary → Evidence → Decision → Next

## Environments

- Preview: <https://main--ace-snow--somarc.aem.page/>
- Live: <https://main--ace-snow--somarc.aem.live/>
- Feature previews use `https://{branch}--ace-snow--somarc.aem.page/`.

DA is the canonical content source. Journal pages, navigation, and authored media do not live in Git. Use the approved local `da-cli` for content, preview, publishing, and audit operations; see [`docs/AUTHORING.md`](docs/AUTHORING.md).

## Project contracts

- [`DIRECTION.md`](DIRECTION.md) — visual law, design-token roles, media boundaries, and acceptance gate.
- [`docs/AUTHORING.md`](docs/AUTHORING.md) — routes, metadata, section modifiers, block shapes, Canvas invariants, and authoring workflow.
- [`AGENTS.md`](AGENTS.md) — EDS engineering and release requirements.

## Local development

```sh
npm install
npx -y @adobe/aem-cli up --no-open --forward-browser-logs
```

The local site is served at <http://localhost:3000/>. To inspect draft DA content, use the matching draft path.

## Quality checks

```sh
npm test
npm run lint
```

The block tests verify that Canvas prose, image, and block identities survive decoration and that repeated decoration is deterministic.

## Publishing path

1. Author or update content through local `da-cli` in the external operational workspace.
2. Dry-run and commit DA writes separately.
3. Push code to a feature branch and validate the feature preview.
4. Run DA content, block, semantic, responsive, accessibility, Canvas, and performance checks.
5. Open a pull request with a representative feature-preview URL.
6. Publish canonical content only after the code review and merge gate is satisfied.
