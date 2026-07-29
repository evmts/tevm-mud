[**@tevm/mud**](../README.md)

***

[@tevm/mud](../globals.md) / CreateOptimisticHandlerOptions

# Type Alias: CreateOptimisticHandlerOptions\<TConfig\>

> **CreateOptimisticHandlerOptions**\<`TConfig`\> = `object`

Defined in: [createOptimisticHandler.ts:45](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L45)

Options for [createOptimisticHandler](../functions/createOptimisticHandler.md).

## See

https://mud.tevm.sh/api/create-optimistic-handler

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TConfig` *extends* `StoreConfig` | `StoreConfig` |

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | `Client` \| [`SessionClient`](SessionClient.md) | A base viem client. Must be connected to a chain. Write interception requires an EntryKit-style [SessionClient](SessionClient.md). | [createOptimisticHandler.ts:50](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L50) |
| <a id="config"></a> `config?` | `TConfig` | The store config. Type-level only: it narrows `TConfig` so table types flow through the read APIs. | [createOptimisticHandler.ts:69](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L69) |
| <a id="logginglevel"></a> `loggingLevel?` | `"debug"` \| `"error"` \| `"fatal"` \| `"info"` \| `"trace"` \| `"warn"` | The logging level for Tevm clients (default: `'warn'`) | [createOptimisticHandler.ts:71](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L71) |
| <a id="stash"></a> `stash` | `Stash`\<`TConfig`\> | The state manager (here stash) | [createOptimisticHandler.ts:54](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L54) |
| <a id="storeaddress"></a> `storeAddress` | `Address` | The address of the store contract | [createOptimisticHandler.ts:52](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L52) |
| <a id="sync"></a> `sync?` | `object` | Sync options. Only read by `OptimisticWrapperProvider` from `@tevm/mud/react`, which uses them to decide whether to mount MUD's `SyncProvider` with [CreateOptimisticHandlerResult.syncAdapter](CreateOptimisticHandlerResult.md#syncadapter). When calling `createOptimisticHandler` directly, drive `syncAdapter` yourself instead. | [createOptimisticHandler.ts:60](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L60) |
| `sync.enabled?` | `boolean` | Whether to enable sync (default: true) | [createOptimisticHandler.ts:63](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L63) |
| `sync.startBlock?` | `bigint` | The block number to start syncing from (default: 0n) | [createOptimisticHandler.ts:65](https://github.com/evmts/tevm-mud/blob/main/packages/mud/src/createOptimisticHandler.ts#L65) |
