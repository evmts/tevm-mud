# `@tevm/mud`

`@tevm/mud` connects [MUD](https://mud.dev/) applications to
[Tevm](https://tevm.sh/) so game clients can execute pending writes locally and
present optimistic MUD state while the transaction is being confirmed.

This repository is the standalone home of the MUD integration. It was extracted
from [`evmts/tevm-monorepo`](https://github.com/evmts/tevm-monorepo) with its Git
history intact. The integration releases independently from Tevm core and follows
the MUD release cadence. Tevm itself remains the execution layer and is installed
as a peer dependency.

## Install

```sh
pnpm add @tevm/mud tevm
```

Add React when using the `@tevm/mud/react` entry point:

```sh
pnpm add react react-dom
```

The main entry point exports `createOptimisticHandler`, which accepts a connected
Viem client, a MUD store address, and a MUD stash:

```ts
import { createOptimisticHandler } from '@tevm/mud'

const optimistic = createOptimisticHandler({
	client,
	storeAddress,
	stash,
	config,
})

const state = optimistic.getOptimisticState()
const unsubscribe = optimistic.subscribeTx({
	subscriber: (status) => console.log(status),
})

await optimistic._.cleanup()
unsubscribe()
```

React hooks are available from the React subpath:

```ts
import { useOptimisticRecord } from '@tevm/mud/react'
```

API documentation is published at [mud.tevm.sh](https://mud.tevm.sh/). General
Tevm documentation remains at [tevm.sh](https://tevm.sh/).

## Development

This repository uses Node 24 and pnpm 9:

```sh
nvm use
corepack enable
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Package releases are managed with
[Changesets](https://github.com/changesets/changesets). Add a changeset with
`pnpm changeset`; merging the generated release pull request publishes public npm
packages with provenance through GitHub Actions.

## License

MIT
