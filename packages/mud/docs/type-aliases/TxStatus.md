[**@tevm/mud**](../README.md)

***

[@tevm/mud](../globals.md) / TxStatus

# Type Alias: TxStatus

> **TxStatus** = `object` & \{ `status`: `"simulating"` \| `"optimistic"`; \} \| \{ `hash`: `Hex`; `status`: `"optimistic"` \| `"confirmed"` \| `"reverted"`; \}

Defined in: [subscribeTx.ts:21](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/subscribeTx.ts#L21)

The status of an intercepted MUD write, emitted through `subscribeTx`.

`id` is the 4-byte identifier appended to the transaction calldata, and is stable across the whole
lifecycle of one write. `optimistic` is emitted twice: once when the local simulation succeeds (no
`hash` yet), and once when the real transaction has been broadcast (with `hash`). Narrow with
`'hash' in status`.

## Type Declaration

### id

> **id**: `string`

The 4-byte hex identifier appended to the tx calldata; stable across the tx lifecycle.

### timestamp

> **timestamp**: `number`

`Date.now()` when the status was emitted.

## Example

```ts
optimistic.subscribeTx({
  subscriber: (status) => {
    console.log(status.id, status.status, 'hash' in status ? status.hash : '(local only)')
  },
})
```

## See

https://mud.tevm.sh/guides/transaction-status
