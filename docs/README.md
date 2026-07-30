# `@tevm/mud` docs

The documentation site for [`@tevm/mud`](../packages/mud), built with
[Vocs](https://vocs.dev) 2.7.2 and deployed to <https://mud.tevm.sh>.

```sh
pnpm --filter @tevm/mud-docs dev     # local dev server
pnpm --filter @tevm/mud-docs build   # production build
pnpm --filter @tevm/mud-docs preview # serve the production build
```

Pages live in `src/pages` (vocs 2.x moved them from `pages/` to `<srcDir>/pages`),
static assets in `public/`, and site config in `vocs.config.ts`.

## Deployment

Vercel. `vercel.json` pins the install and build commands; the build itself is
detected by Vocs — when `VERCEL` is set it selects the Vercel adapter and emits
the Build Output API directory, so no `outputDirectory` should be configured.

To (re)create the Vercel project from this directory:

```sh
vercel link --project tevm-mud-docs
vercel domains add mud.tevm.sh tevm-mud-docs
vercel --prod
```

The `mud.tevm.sh` DNS record must point at Vercel per the instructions
`vercel domains add` prints for the `tevm.sh` zone.

The [Docs workflow](../.github/workflows/docs.yml) builds the site on every PR and
push that touches `docs/` or `packages/mud/src/`. Pushes to `main` deploy the
prebuilt output to the production Vercel project. The repository needs
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` Actions secrets.
