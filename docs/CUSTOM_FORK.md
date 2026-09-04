# Custom fork notes

This branch (`custom`) carries a few patches on top of upstream
[oss-apps/split-pro](https://github.com/oss-apps/split-pro) and is rebuilt automatically as
`ghcr.io/<owner>/splitpro`.

## Patches (one commit each, keep them small and additive)

| Commit           | What                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `custom(ci)`     | `.github/workflows/sync-upstream.yml` (daily rebase on the latest upstream tag) and `publish-custom.yml` (build + push to GHCR) |
| `custom(theme)`  | Per-user colour mode + accent (`User.themeMode`, `User.themeAccent`), `ThemePicker` in Account, `src/styles/custom-theme.css`   |
| `custom(banner)` | Group banner image (`Group.bannerImage`), `GroupBanner` component, `MainLayout` renders its `header` prop                       |
| `custom(polish)` | Page header band with tab icon (`PageHeader`), `HeroCard` + `BalanceHeroCard` on `/balances` and the group summary              |
| `custom(link)`   | `/stats` proxied to the separate `splitpro-stats` service (rewrite + middleware skip), entries in Account and group statistics  |

Rules: prefer new files; edit upstream files by single-line insertions at stable anchors; never
touch `package.json` / `pnpm-lock.yaml`; English i18n keys only (`public/locales/en/common.json`).

## Upstream sync

Create a fine-grained personal access token limited to this repository with **Contents,
Workflows, Actions and Issues: read/write**, and store it as the repository secret `SYNC_TOKEN`
(Settings → Secrets and variables → Actions). Without it the workflow can still tag and publish the
current commit, but it cannot push a rebase: `GITHUB_TOKEN` is never allowed to push commits that
modify `.github/workflows/*`.

**`custom` must be the default branch of the fork** (Settings → General → Default branch).
GitHub only runs `schedule` triggers and offers the "Run workflow" button for workflows that live
on the default branch; `main` is a plain mirror of upstream without these workflows.

`sync-upstream.yml` runs daily: fetches upstream tags, rebases `custom` onto the newest `vX.Y.Z`,
type-checks, pushes, tags `vX.Y.Z-custom.N` and dispatches `publish-custom.yml`. On conflict it
opens an issue with the manual steps. Disable the upstream `publish.yaml` / `postgres.yaml`
workflows in the fork's Actions tab (they target runners a fork does not have).

Manual rebase:

```bash
git fetch upstream --tags
git checkout custom
git rebase vX.Y.Z          # resolve, then
git push --force-with-lease origin custom
```

Then run _Sync upstream_ manually (check "force_tag") to publish a new image.

## Local checks (same as CI)

```bash
pnpm prettier --check . && pnpm lint && pnpm tsgo --noEmit && pnpm test
SKIP_ENV_VALIDATION=true pnpm build --no-lint
```

The husky pre-commit hook needs `pnpm` on the PATH; `git commit --no-verify` is acceptable when
the checks above were run by hand.

## Deployment

See `deploy/compose.synology.yml` in the `splitpro-stats` repository for the full stack (Postgres,
this image, the stats service). The image expects the stats service to be reachable as
`http://splitpro-stats:3100` (build arg `STATS_INTERNAL_URL`).
