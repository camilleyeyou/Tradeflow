# Deferred Items — 260723-oop

Out-of-scope discoveries found during execution. Not fixed (per scope boundary rule) — logged here for visibility.

## `apps/web/package-lock.json` is stale relative to `package.json`

`node_modules` did not exist in this worktree. `npm ci` failed with multiple
"Missing X from lock file" errors (e.g. `@webassemblyjs/*`, `terser`, `jest-worker`,
`ajv-formats`, etc.), meaning the committed lockfile was already out of sync with
`package.json` before this quick task began. `npm install` was used instead (not
`npm ci`) to unblock local `tsc --noEmit` / `npm run build` verification, and the
resulting `package-lock.json` diff was reverted (`git checkout --`) since
regenerating the lockfile is unrelated to this task's scope and file list.

Pre-existing, unrelated to this task's changes. Recommend running `npm install`
+ committing the refreshed lockfile in its own follow-up so `npm ci` works again
in CI/deploy environments.
