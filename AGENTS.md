## Agent skills

### Issue tracker

Issues and PRDs for this repo live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

This repo uses the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context domain documentation layout. See `docs/agents/domain.md`.

## Git commits

Use a concise Conventional Commits-style prefix for commit messages:

- `feat:` for user-facing features or behavior additions
- `fix:` for bug fixes
- `test:` for test-only changes
- `docs:` for documentation-only changes
- `style:` for formatting or presentation changes that do not alter behavior
- `refactor:` for restructuring code without changing behavior
- `chore:` for maintenance, tooling, dependency, or build changes

Keep the subject imperative, lowercase after the prefix when natural, and under roughly 72 characters. Do not mix unrelated work in one commit; split feature, test, docs, and dependency changes when they can stand alone.

## Verification

Run automated tests and type checks when they are relevant. Do not proactively open a browser or run browser-automation visual checks for UI changes unless the user explicitly asks for that; the user will handle manual browser verification.

## shadcn components

Do not directly modify shadcn-generated/shared UI primitives under `apps/extension/components/ui/` for page-specific styling, theme tuning, or one-off visual fixes. Keep those components vendor-like and stable. Prefer page-level composition, wrapper components, `className` overrides at the call site, or design tokens in `apps/extension/assets/tailwind.css`.

Only edit `apps/extension/components/ui/` when the user explicitly asks to change the shared primitive itself, when fixing a confirmed bug in the primitive that affects all usages, or when intentionally updating/regenerating the shadcn component. If such an edit is necessary, call it out before making the change.
