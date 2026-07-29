[**@tevm/mud**](../README.md)

***

[@tevm/mud](../globals.md) / subscribeTxStatus

# Function: subscribeTxStatus()

> **subscribeTxStatus**(`subscribers`): (`subscriber`) => () => `void`

Defined in: [subscribeTx.ts:65](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/subscribeTx.ts#L65)

Curried helper that turns a set of subscribers into a subscribe function. This is the primitive behind
`handler.subscribeTx`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subscribers` | `Set`\<[`TxStatusSubscriber`](../type-aliases/TxStatusSubscriber.md)\> | The set the subscriber is added to. Owned by the caller. |

## Returns

A subscribe function; calling it returns an unsubscribe function. Neither throws.

(`subscriber`) => () => `void`

## Example

```ts
import { subscribeTxStatus, type TxStatusSubscriber } from '@tevm/mud'

const subscribers = new Set<TxStatusSubscriber>()
const unsubscribe = subscribeTxStatus(subscribers)((status) => console.log(status.status))
unsubscribe()
```

## See

https://mud.tevm.sh/api/subscribe-tx-status
