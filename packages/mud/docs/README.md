**@tevm/mud**

***

# @tevm/mud

Optimistic MUD state powered by Tevm.

`@tevm/mud` connects a MUD stash to a Tevm-backed local execution
environment. Game clients can show the expected result of a pending transaction
immediately, subscribe to optimistic state, and reconcile that state as the
canonical transaction is confirmed.

## Install

```sh
pnpm add @tevm/mud tevm
```

Install React and React DOM when using the `@tevm/mud/react` hooks.

```ts
import { createOptimisticHandler } from '@tevm/mud'

const optimistic = createOptimisticHandler({
	client,
	storeAddress,
	stash,
	config,
})

const currentState = optimistic.getOptimisticState()
```

See the [repository](https://github.com/evmts/tevm-mud) for development
instructions and [mud.tevm.sh](https://mud.tevm.sh/) for API documentation.
