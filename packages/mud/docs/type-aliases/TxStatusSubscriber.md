[**@tevm/mud**](../README.md)

***

[@tevm/mud](../globals.md) / TxStatusSubscriber

# Type Alias: TxStatusSubscriber

> **TxStatusSubscriber** = (`status`) => `void`

Defined in: [subscribeTx.ts:47](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/subscribeTx.ts#L47)

A subscriber notified for every [TxStatus](TxStatus.md) transition.

Exceptions thrown by a subscriber are caught and logged by the handler's internal notifier; the remaining
subscribers still run.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | [`TxStatus`](TxStatus.md) |

## Returns

`void`
