## Description

<!-- Provide a brief description of what this PR introduces, fixes, or refactors. -->

## Type of Change

- [ ] **New Spec Package** (`specs/practice/` or `specs/challenges/`)
- [ ] **Spec Fix / Refactor**
- [ ] **UI / Design System** (`src/components/`, `DESIGN.md`)
- [ ] **WASM Runner / Sandbox** (`runner-wasm/`)
- [ ] **Documentation / RFC**
- [ ] **Database / Migration** (local-only verified)

## Verification Checklist

Please verify the following before requesting review:

### General
- [ ] Tested locally with `pnpm dev` in Mock Mode (zero cloud keys).
- [ ] `pnpm lint` passed with zero errors.
- [ ] `pnpm build` completed cleanly without TypeScript errors.

### For Spec Packages
- [ ] Directory name matches `specId` (e.g. `prac-042-something` or `sys-042-something`).
- [ ] `manifest.json` conforms to `specs/schema.json` (schema `1.1.0`).
- [ ] `pnpm preflight:specs -- <specId>` passed:
  - `starter/` fails verification.
  - `solution/` passes verification.
- [ ] `defenseGate.keywords` are technical concepts that align with the reference diff.

### For UI Changes
- [ ] Follows the Cashmere & Concrete design language in `DESIGN.md`:
  - Matte Cashmere chassis (`#E6E2DD`), Concrete well (`#D8D3CC`), Charcoal ink (`#1D1F23`).
  - Strict `rounded-none` on structural plates.
  - No decorative gradients or floating shadows.
  - Inter for typography; JetBrains Mono strictly for telemetry, hashes, paths, and code.
