[**@tevm/mud**](../README.md)

***

[@tevm/mud](../globals.md) / CreateOptimisticHandlerResult

# Type Alias: CreateOptimisticHandlerResult\<TConfig\>

> **CreateOptimisticHandlerResult**\<`TConfig`\> = `object`

Defined in: [createOptimisticHandler.ts:79](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L79)

The value returned by [createOptimisticHandler](../functions/createOptimisticHandler.md).

## See

https://mud.tevm.sh/api/create-optimistic-handler

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TConfig` *extends* `StoreConfig` | `StoreConfig` |

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="_"></a> `_` | `object` | Internal escape hatch. Not covered by semver — may change in any release. | [createOptimisticHandler.ts:114](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L114) |
| `_.cleanup` | () => `Promise`\<`void`\> | Unsubscribes from the txpool and the stash. Await this on teardown. Never throws. | [createOptimisticHandler.ts:124](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L124) |
| `_.internalClient` | `MemoryClient` | Tevm client used while replaying the pool; its storage reads serve the overlay built so far. | [createOptimisticHandler.ts:118](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L118) |
| `_.optimisticClient` | `MemoryClient` | Tevm client owning the optimistic txpool; its storage reads serve the finished overlay. | [createOptimisticHandler.ts:116](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L116) |
| `_.optimisticStoreSubscribers` | `StoreSubscribers` | Store-level optimistic subscribers. | [createOptimisticHandler.ts:120](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L120) |
| `_.optimisticTableSubscribers` | `TableSubscribers` | Table-level optimistic subscribers. | [createOptimisticHandler.ts:122](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L122) |
| <a id="getoptimisticrecord"></a> `getOptimisticRecord` | \<`TTable`, `TDefaultValue`\>(`args`) => `GetRecordResult`\<`TTable`, `TDefaultValue`\> | Optimistic `getRecord`. Same arguments as `@latticexyz/stash`'s `getRecord` minus `stash`; `state` defaults to the optimistic state. | [createOptimisticHandler.ts:89](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L89) |
| <a id="getoptimisticrecords"></a> `getOptimisticRecords` | \<`TTable`\>(`args`) => `GetRecordsResult`\<`TTable`\> | Optimistic `getRecords`. Same arguments as `@latticexyz/stash`'s `getRecords` minus `stash`. | [createOptimisticHandler.ts:96](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L96) |
| <a id="getoptimisticstate"></a> `getOptimisticState` | () => `State`\<`TConfig`\> | Returns the canonical stash state with the optimistic overlay applied. A fresh object on every call — do not compare by identity. | [createOptimisticHandler.ts:84](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L84) |
| <a id="subscribeoptimisticstate"></a> `subscribeOptimisticState` | (`args`) => `Unsubscribe` | Subscribes to both canonical stash updates and optimistic overlay updates. | [createOptimisticHandler.ts:101](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L101) |
| <a id="subscribetx"></a> `subscribeTx` | (`args`) => `Unsubscribe` | Subscribes to the lifecycle of every intercepted write: `simulating` → `optimistic` → `confirmed` | `reverted`. See [TxStatus](TxStatus.md). | [createOptimisticHandler.ts:106](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L106) |
| <a id="syncadapter"></a> `syncAdapter` | `SyncAdapter` | A `@latticexyz/store-sync` adapter that writes canonical logs into the stash through the same coordinator as optimistic recomputes, and evicts optimistic txs once their canonical counterpart lands. Use this instead of MUD's default sync adapter. | [createOptimisticHandler.ts:112](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L112) |
