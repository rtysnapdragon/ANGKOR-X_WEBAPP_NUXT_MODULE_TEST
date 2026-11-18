# OpenCode Project Memory

This folder stores durable implementation memory for this project. It is loaded into opencode sessions through the root `opencode.json` `instructions` list.

## Files

- `implementations.md` — dated log of meaningful implementation work, decisions, verification, and caveats.

## Usage

- Read `implementations.md` before changing related code.
- Append a new dated entry after completing meaningful work.
- Update an existing entry instead of duplicating it when the same feature changes.
- Record: goal, status, files, behavior/contracts, verification, caveats, and follow-ups.
- Keep notes factual and concise.
- Never store secrets, tokens, credentials, or private user data.

## Entry Template

```markdown
## YYYY-MM-DD — Short Title

Status: planned | in progress | implemented | blocked

### Goal

### Files

### Implementation

### Contracts / Decisions

### Verification

### Caveats / Follow-ups
```
