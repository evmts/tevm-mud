[**@tevm/mud**](../README.md)

***

[@tevm/mud](../globals.md) / createOptimisticHandler

# Function: createOptimisticHandler()

> **createOptimisticHandler**\<`TConfig`\>(`options`): [`CreateOptimisticHandlerResult`](../type-aliases/CreateOptimisticHandlerResult.md)\<`TConfig`\>

Defined in: [createOptimisticHandler.ts:178](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L178)

Initializes the optimistic handlers (storage and send transaction interceptors), and returns optimistic methods.

Creates two forked Tevm `MemoryClient`s (one to replay the local txpool, one to serve reads from the
finished optimistic overlay), wraps `writeContract` on the client so every MUD write is simulated locally
before it is confirmed on chain, and starts watching the txpool and the stash so the optimistic overlay is
recomputed whenever either changes.

The canonical `stash` is never mutated by the optimistic overlay: reads apply pending updates to a clone.

Write interception currently requires an EntryKit-style [SessionClient](../type-aliases/SessionClient.md) (`client.type === 'bundlerClient'`
with a `writeContract` method). With any other client the handler still syncs, reads and subscribes, but no
optimistic updates are produced.

Always `await result._.cleanup()` on teardown to unsubscribe from the txpool and the stash.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TConfig` *extends* `StoreConfig` | `StoreConfig` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`CreateOptimisticHandlerOptions`](../type-aliases/CreateOptimisticHandlerOptions.md)\<`TConfig`\> | See [CreateOptimisticHandlerOptions](../type-aliases/CreateOptimisticHandlerOptions.md). |

## Returns

[`CreateOptimisticHandlerResult`](../type-aliases/CreateOptimisticHandlerResult.md)\<`TConfig`\>

The optimistic read, subscription and sync APIs. See [CreateOptimisticHandlerResult](../type-aliases/CreateOptimisticHandlerResult.md).

## Throws

`'Client must be connected to a chain'` if `client.chain` is undefined — Tevm derives its
chain common (hardfork, chain id, EIPs) from it.

## Example

```ts
import { createStash } from '@latticexyz/stash/internal'
import { createOptimisticHandler } from '@tevm/mud'
import mudConfig from './mud.config'
import { client } from './client'

const stash = createStash(mudConfig)
const optimistic = createOptimisticHandler({
  client,
  storeAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  stash,
  config: mudConfig,
})

const unsubscribe = optimistic.subscribeOptimisticState({
  subscriber: ({ updates }) => console.log(updates),
})

const position = optimistic.getOptimisticRecord({
  table: mudConfig.tables.app__Position,
  key: { player: client.userAddress },
  defaultValue: { x: 0, y: 0 },
})

unsubscribe()
await optimistic._.cleanup()
```

## See

https://mud.tevm.sh/api/create-optimistic-handler
