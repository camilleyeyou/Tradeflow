# Deferred Items — Phase 06

Items discovered during plan execution that are out of scope for the current plan and were not fixed.

## 06-01

- **Nested git repository at `apps/web/.git`**: `apps/web` contains its own `.git` directory (history: single commit `d76a2a2 feat: initial commit`), separate from the root repository's history. It is not configured as a git submodule, so `git status`/`git add` run with cwd inside `apps/web` operate against the *nested* repo and show a completely different (and much larger) set of pending changes than `git status` run from the repo root. All commits made in this plan were made from the repo root and landed in the root repo's history (verified via `git log` at both locations), so this did not affect correctness of this plan's commits. However, it is a latent footgun for anyone running git commands from inside `apps/web` expecting root-repo semantics. Not fixed here — unrelated to FIX-03/04/05/06 and outside this plan's file scope.
