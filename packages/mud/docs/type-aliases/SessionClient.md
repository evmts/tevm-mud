[**@tevm/mud**](../README.md)

***

[@tevm/mud](../globals.md) / SessionClient

# Type Alias: SessionClient

> **SessionClient** = `BundlerClient`\<`Transport`, `Chain`, `SmartAccount`, `Client`\> & `object`

Defined in: [types.ts:22](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/types.ts#L22)

The client shape `@tevm/mud` can intercept writes on — EntryKit's session client.

`createOptimisticHandler` wraps `writeContract` only when `client.type === 'bundlerClient'` and the client
exposes `writeContract`, which is exactly this shape. `userAddress` is the user's main (smart) account —
the address MUD tables are keyed by, and the `caller` used for the local simulation so `_msgSender()`
matches what happens on chain — as opposed to the session signer that actually signs.

## Type Declaration

### userAddress

> `readonly` **userAddress**: `Address`

The user's main account address; MUD tables are keyed by this, not by the session signer.

### writeContract

> **writeContract**: (`args`) => `Promise`\<`WriteContractReturnType`\>

The write path `@tevm/mud` wraps to simulate each MUD write locally before it is confirmed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | `WriteContractParameters` |

#### Returns

`Promise`\<`WriteContractReturnType`\>

## Example

```ts
import { useSessionClient } from '@latticexyz/entrykit/internal'
import type { SessionClient } from '@tevm/mud'

const { data } = useSessionClient()
const client: SessionClient | undefined = data
```

## See

https://mud.tevm.sh/api/types#sessionclient
