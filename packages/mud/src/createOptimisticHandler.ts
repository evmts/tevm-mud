import {
	type GetRecordArgs,
	type GetRecordResult,
	type GetRecordsArgs,
	type GetRecordsResult,
	getRecord,
	getRecords,
	type Key,
	type MutableState,
	type Stash,
	type State,
	type StoreConfig,
	type StoreSubscribers,
	type StoreUpdatesSubscriber,
	subscribeStash,
	type TableRecord,
	type TableSubscribers,
	type Unsubscribe,
} from '@latticexyz/stash/internal'
import { storeEventsAbi } from '@latticexyz/store'
import { type Table } from '@latticexyz/store/internal'
import type { SyncAdapter } from '@latticexyz/store-sync'
import { createCommon } from '@tevm/common'
import { createLogger } from '@tevm/logger'
import { createMemoryClient, type MemoryClient } from '@tevm/memory-client'
import { type Address, createAddressFromString } from '@tevm/utils'
import { bytesToHex, type Client, type Hex, parseEventLogs } from 'viem'
import { getTransaction } from 'viem/actions'
import { mudStoreGetStorageAtOverride } from './internal/decorators/mudStoreGetStorageAtOverride.js'
import { mudStoreWriteRequestOverride } from './internal/decorators/mudStoreWriteRequestOverride.js'
import { ethjsLogToAbiLog } from './internal/ethjsLogToAbiLog.js'
import { applyStashUpdates, notifyStashSubscribers, type PendingStashUpdate } from './internal/mud/applyUpdates.js'
import { createStorageAdapter } from './internal/mud/createStorageAdapter.js'
import { createSyncAdapter } from './internal/mud/createSyncAdapter.js'
import { createStateUpdateCoordinator } from './internal/stateUpdateCoordinator.js'
import { matchOptimisticTxCounterpart } from './internal/txIdentifier.js'
import { subscribeTxStatus, type TxStatusSubscriber } from './subscribeTx.js'
import type { SessionClient } from './types.js'

/**
 * Options for {@link createOptimisticHandler}.
 *
 * @see https://mud.tevm.sh/api/create-optimistic-handler
 */
export type CreateOptimisticHandlerOptions<TConfig extends StoreConfig = StoreConfig> = {
	/**
	 * A base viem client. Must be connected to a chain. Write interception requires an
	 * EntryKit-style {@link SessionClient}.
	 */
	client: Client | SessionClient
	/** The address of the store contract */
	storeAddress: Address
	/** The state manager (here stash) */
	stash: Stash<TConfig>
	/**
	 * Sync options. Only read by `OptimisticWrapperProvider` from `@tevm/mud/react`, which uses them to
	 * decide whether to mount MUD's `SyncProvider` with {@link CreateOptimisticHandlerResult.syncAdapter}.
	 * When calling `createOptimisticHandler` directly, drive `syncAdapter` yourself instead.
	 */
	sync?:
		| {
				/** Whether to enable sync (default: true) */
				enabled?: boolean
				/** The block number to start syncing from (default: 0n) */
				startBlock?: bigint
		  }
		| undefined
	/** The store config. Type-level only: it narrows `TConfig` so table types flow through the read APIs. */
	config?: TConfig | undefined // for typing
	/** The logging level for Tevm clients (default: `'warn'`) */
	loggingLevel?: 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn' | undefined
}

/**
 * The value returned by {@link createOptimisticHandler}.
 *
 * @see https://mud.tevm.sh/api/create-optimistic-handler
 */
export type CreateOptimisticHandlerResult<TConfig extends StoreConfig = StoreConfig> = {
	/**
	 * Returns the canonical stash state with the optimistic overlay applied.
	 * A fresh object on every call — do not compare by identity.
	 */
	getOptimisticState: () => State<TConfig>
	/**
	 * Optimistic `getRecord`. Same arguments as `@latticexyz/stash`'s `getRecord` minus `stash`;
	 * `state` defaults to the optimistic state.
	 */
	getOptimisticRecord: <
		TTable extends Table,
		TDefaultValue extends Omit<TableRecord<TTable>, keyof Key<TTable>> | undefined = undefined,
	>(
		args: Omit<GetRecordArgs<TTable, TDefaultValue>, 'stash'>,
	) => GetRecordResult<TTable, TDefaultValue>
	/** Optimistic `getRecords`. Same arguments as `@latticexyz/stash`'s `getRecords` minus `stash`. */
	getOptimisticRecords: <TTable extends Table>(args: Omit<GetRecordsArgs<TTable>, 'stash'>) => GetRecordsResult<TTable>
	/**
	 * Subscribes to both canonical stash updates and optimistic overlay updates.
	 * @returns An unsubscribe function that detaches from both.
	 */
	subscribeOptimisticState: (args: { subscriber: StoreUpdatesSubscriber }) => Unsubscribe
	/**
	 * Subscribes to the lifecycle of every intercepted write: `simulating` → `optimistic` →
	 * `confirmed` | `reverted`. See {@link TxStatus}.
	 */
	subscribeTx: (args: { subscriber: TxStatusSubscriber }) => Unsubscribe
	/**
	 * A `@latticexyz/store-sync` adapter that writes canonical logs into the stash through the same
	 * coordinator as optimistic recomputes, and evicts optimistic txs once their canonical counterpart lands.
	 * Use this instead of MUD's default sync adapter.
	 */
	syncAdapter: SyncAdapter
	/** Internal escape hatch. Not covered by semver — may change in any release. */
	_: {
		/** Tevm client owning the optimistic txpool; its storage reads serve the finished overlay. */
		optimisticClient: MemoryClient
		/** Tevm client used while replaying the pool; its storage reads serve the overlay built so far. */
		internalClient: MemoryClient
		/** Store-level optimistic subscribers. */
		optimisticStoreSubscribers: StoreSubscribers
		/** Table-level optimistic subscribers. */
		optimisticTableSubscribers: TableSubscribers
		/** Unsubscribes from the txpool and the stash. Await this on teardown. Never throws. */
		cleanup: () => Promise<void>
	}
}

/**
 * Initializes the optimistic handlers (storage and send transaction interceptors), and returns optimistic methods.
 *
 * Creates two forked Tevm `MemoryClient`s (one to replay the local txpool, one to serve reads from the
 * finished optimistic overlay), wraps `writeContract` on the client so every MUD write is simulated locally
 * before it is confirmed on chain, and starts watching the txpool and the stash so the optimistic overlay is
 * recomputed whenever either changes.
 *
 * The canonical `stash` is never mutated by the optimistic overlay: reads apply pending updates to a clone.
 *
 * Write interception currently requires an EntryKit-style {@link SessionClient} (`client.type === 'bundlerClient'`
 * with a `writeContract` method). With any other client the handler still syncs, reads and subscribes, but no
 * optimistic updates are produced.
 *
 * Always `await result._.cleanup()` on teardown to unsubscribe from the txpool and the stash.
 *
 * @param options - See {@link CreateOptimisticHandlerOptions}.
 * @returns The optimistic read, subscription and sync APIs. See {@link CreateOptimisticHandlerResult}.
 * @throws {Error} `'Client must be connected to a chain'` if `client.chain` is undefined — Tevm derives its
 * chain common (hardfork, chain id, EIPs) from it.
 * @example
 * ```ts
 * import { createStash } from '@latticexyz/stash/internal'
 * import { createOptimisticHandler } from '@tevm/mud'
 * import mudConfig from './mud.config'
 * import { client } from './client'
 *
 * const stash = createStash(mudConfig)
 * const optimistic = createOptimisticHandler({
 *   client,
 *   storeAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
 *   stash,
 *   config: mudConfig,
 * })
 *
 * const unsubscribe = optimistic.subscribeOptimisticState({
 *   subscriber: ({ updates }) => console.log(updates),
 * })
 *
 * const position = optimistic.getOptimisticRecord({
 *   table: mudConfig.tables.app__Position,
 *   key: { player: client.userAddress },
 *   defaultValue: { x: 0, y: 0 },
 * })
 *
 * unsubscribe()
 * await optimistic._.cleanup()
 * ```
 * @see https://mud.tevm.sh/api/create-optimistic-handler
 */
export const createOptimisticHandler = <TConfig extends StoreConfig = StoreConfig>({
	client,
	storeAddress,
	stash,
	loggingLevel,
}: CreateOptimisticHandlerOptions<TConfig>): CreateOptimisticHandlerResult<TConfig> => {
	if (!client.chain) throw new Error('Client must be connected to a chain')
	const transport = 'client' in client ? client.client : client
	const logger = createLogger({ name: '@tevm/mud', level: loggingLevel ?? 'warn' })
	logger.debug('Creating optimistic handler')

	// Create optimistic subscribers
	const optimisticTableSubscribers: TableSubscribers = {}
	const optimisticStoreSubscribers: StoreSubscribers = new Set()
	// Create tx status subscribers
	const txStatusSubscribers: Set<TxStatusSubscriber> = new Set()

	// View-only optimistic logs
	let optimisticLogs: PendingStashUpdate[] = []
	// Internal logs that build up during execution for the internal client to read the current state as it runs the txs
	let internalLogs: PendingStashUpdate[] = []

	// Optimistic hashes of transactions already handled while syncing their incoming canonical counterpart
	const syncedOptimisticHashes: Set<Hex> = new Set()
	const stateUpdateCoordinator = createStateUpdateCoordinator()

	// View function that applies optimistic or internal logs on top of the canonical state
	function getStateView(logs: PendingStashUpdate[]): State<TConfig> {
		const localState: MutableState = {
			config: stash.get().config,
			records: structuredClone(stash.get().records),
		}

		const localStash = {
			get: () => localState,
			_: {
				state: localState,
				tableSubscribers: {},
				storeSubscribers: new Set(),
				derivedTables: {},
			},
		} satisfies Stash

		// Apply provided logs without notifications
		applyStashUpdates({ stash: localStash, updates: logs })

		return {
			config: localState.config,
			records: localState.records,
		} as State<TConfig>
	}

	// Get the optimistic state
	const getOptimisticView = () => getStateView(optimisticLogs)
	// Get the internal optimistic state at the latest applied tx
	const getInternalView = () => getStateView(internalLogs)

	// Function that processes transactions and updates logs
	// we want to execute this function serially so there won't be multiple invocations modifying the same internalLogs variable
	async function processTransactionsAndUpdateLogs(): Promise<void> {
		const vm = await internalClient.transport.tevm.getVm()
		const txPool = await optimisticClient.transport.tevm.getTxPool()

		if (txPool.txsInPool === 0) {
			logger.debug('No txs in pool, clearing logs and returning canonical state.')
			if (optimisticLogs.length > 0) {
				const previousOptimisticState = getOptimisticView()
				const canonicalState = stash.get()
				const updatesToCanonical = optimisticLogs.map(({ table, key }) => ({
					table,
					key,
					value: getRecord({ state: canonicalState, table, key }) ?? undefined,
				}))
				optimisticLogs = []
				internalLogs = []

				const notificationStash = {
					get: () => previousOptimisticState,
					_: {
						state: previousOptimisticState,
						tableSubscribers: optimisticTableSubscribers,
						storeSubscribers: optimisticStoreSubscribers,
						derivedTables: {},
					},
				} satisfies Stash

				notifyStashSubscribers({ stash: notificationStash, updates: updatesToCanonical })
			} else {
				internalLogs = []
			}
			return
		}

		logger.debug({ txsInPool: txPool.txsInPool }, 'Processing transactions.')

		const orderedTxs = await txPool.txsByPriceAndNonce()
		const vmCopy = await vm.deepCopy()

		// Reset internal logs for this execution
		internalLogs = []

		// Create adapter that reads from internal view
		const internalState = getInternalView()
		const internalStash = {
			get: () => internalState,
			_: {
				state: internalState,
				tableSubscribers: {},
				storeSubscribers: new Set(),
				derivedTables: {},
			},
		} satisfies Stash

		const adapter = createStorageAdapter({ stash: internalStash })

		// Process each transaction, building up internal logs
		for (const tx of orderedTxs) {
			logger.debug(
				{ tx, hash: bytesToHex(tx.hash()) },
				`Running tx ${orderedTxs.indexOf(tx) + 1}/${orderedTxs.length}.`,
			)

			// clear cache to force the fork request to not hit cache and go through our `getStorageAt` interceptor
			// TODO: we absolutely don't want to do this, also it clears some non-data-related slots that could have stayed cached
			vmCopy.stateManager._baseState.forkCache.storage.clearStorage(createAddressFromString(storeAddress))
			const txResult = await vmCopy.runTx({
				tx,
				skipBalance: true,
				skipNonce: true,
				skipHardForkValidation: true,
				skipBlockGasLimitValidation: true,
			})

			if (txResult.execResult.exceptionError) throw txResult.execResult.exceptionError

			const storeEventsLogs = parseEventLogs({
				abi: storeEventsAbi,
				logs: txResult.receipt.logs.map((log) => ethjsLogToAbiLog(storeEventsAbi, log)),
			})

			// Get updates and add to internal logs (builds up incrementally)
			const updates = await adapter({ logs: storeEventsLogs, blockNumber: 0n })
			internalLogs.push(...updates)
		}

		// When finished, update optimistic logs
		optimisticLogs = [...internalLogs]

		// Notify subscribers if requested
		if (optimisticLogs.length > 0) {
			const optimisticState = getOptimisticView()
			const notificationStash = {
				get: () => optimisticState,
				_: {
					state: optimisticState,
					tableSubscribers: optimisticTableSubscribers,
					storeSubscribers: optimisticStoreSubscribers,
					derivedTables: {},
				},
			} satisfies Stash

			notifyStashSubscribers({ stash: notificationStash, updates: optimisticLogs })
		}

		logger.debug({ txsInPool: txPool.txsInPool }, 'Finished processing transactions and notified subscribers.')
	}

	// TODO: we don't want to have two clients but that's a workaround because we apply different getStorageAt interceptors:
	// - internalClient: used during _optimisticStateView:runTx and uses a mudStoreGetStorageAtOverride that builds up the optimistic state
	// as the pool txs are executed (so the getStorageAt override reads the current optimistic state SO FAR, at each tx)
	// - optimisticClient: used for the write interceptor, and uses a mudStoreGetStorageAtOverride that always reads the optimistic state
	// from the _optimisticStateView
	// const internalClient = createForkRequestOverrideClient(getInternalView, 'internal')
	// const optimisticClient = createForkRequestOverrideClient(getOptimisticView, 'optimistic')
	const internalClient = createMemoryClient({
		fork: {
			transport: {
				request: mudStoreGetStorageAtOverride(
					transport,
					'internal',
					logger,
				)({ getState: getInternalView, storeAddress }),
			},
			blockTag: 'latest',
		},
		common: createCommon(client.chain),
		...(loggingLevel ? { loggingLevel } : {}),
	})
	const optimisticClient = createMemoryClient({
		fork: {
			transport: {
				request: mudStoreGetStorageAtOverride(
					transport,
					'optimistic',
					logger,
				)({ getState: getOptimisticView, storeAddress }),
			},
			blockTag: 'latest',
		},
		common: createCommon(client.chain),
		...(loggingLevel ? { loggingLevel } : {}),
	})

	mudStoreWriteRequestOverride(
		client,
		logger,
	)({
		memoryClient: optimisticClient,
		storeAddress,
		txStatusSubscribers,
	})

	// Update subscribers when the optimistic state changes or when the canonical state changes (and it's been synced to the optimistic state)
	const _subscribeToOptimisticState = async () => {
		logger.debug('Subscribing to optimistic state')
		const txPool = await optimisticClient.transport.tevm.getTxPool()
		// The latest published TxPool returns void here, while newer Tevm release
		// candidates return an unsubscribe callback. Support both APIs so this
		// integration can use published caret ranges without leaking callbacks once
		// the unsubscribe-capable release becomes latest.
		const txPoolEvents = txPool as unknown as {
			on: (event: 'txadded' | 'txremoved', callback: (hash: string) => void) => (() => void) | void
		}

		const unsubscribeTxAdded = txPoolEvents.on('txadded', () => {
			logger.debug('Tx added, updating optimistic state.')
			stateUpdateCoordinator.queueOptimisticUpdate(() => processTransactionsAndUpdateLogs())
		})

		const unsubscribeTxRemoved = txPoolEvents.on('txremoved', (hash) => {
			logger.debug('Tx removed, updating optimistic state.')
			if (!syncedOptimisticHashes.has(hash as Hex))
				stateUpdateCoordinator.queueOptimisticUpdate(() => processTransactionsAndUpdateLogs())
			else {
				logger.debug(
					{ optimisticTxHash: hash },
					'Skipping txremoved update for tx that is being handled by the canonical sync.',
				)
				syncedOptimisticHashes.delete(hash as Hex) // cleanup
			}
		})

		const unsubscribeStash = subscribeStash({
			stash,
			subscriber: () => {
				logger.debug('Stash updated, updating optimistic state.')
				processTransactionsAndUpdateLogs() // this listener is triggered during a queued canonical update already
			},
		})

		return () => {
			if (typeof unsubscribeTxAdded === 'function') unsubscribeTxAdded()
			if (typeof unsubscribeTxRemoved === 'function') unsubscribeTxRemoved()
			unsubscribeStash()
		}
	}

	const unsubscribe = _subscribeToOptimisticState()

	return {
		getOptimisticState: () => getOptimisticView(),
		getOptimisticRecord: ({ state, ...args }) => getRecord({ ...args, state: state ?? getOptimisticView() }),
		getOptimisticRecords: ({ state, ...args }) => getRecords({ ...args, state: state ?? getOptimisticView() }),
		subscribeOptimisticState: ({ subscriber }) => {
			// Subscribe both to the canonical and the optimistic state
			stash._.storeSubscribers.add(subscriber)
			optimisticStoreSubscribers.add(subscriber)
			return () => {
				stash._.storeSubscribers.delete(subscriber)
				optimisticStoreSubscribers.delete(subscriber)
			}
		},
		subscribeTx: ({ subscriber }) => subscribeTxStatus(txStatusSubscribers)(subscriber),
		syncAdapter: createSyncAdapter({
			stash,
			stateUpdateCoordinator,
			onTx: async ({ hash }) => {
				if (!hash) return
				const txPool = await optimisticClient.transport.tevm.getTxPool()

				const tx = await getTransaction(transport, { hash })
				const data = tx?.input
				if (!data) return

				const optimisticTxHash = await matchOptimisticTxCounterpart(txPool, data)
				if (optimisticTxHash) {
					logger.debug({ hash, optimisticTxHash }, 'Marking optimistic tx as being handled during canonical sync.')
					syncedOptimisticHashes.add(optimisticTxHash)
					if (txPool.getByHash(optimisticTxHash)) txPool.removeByHash(optimisticTxHash)
				}
			},
		}),
		_: {
			optimisticClient,
			internalClient,
			optimisticStoreSubscribers,
			optimisticTableSubscribers,
			cleanup: async () => {
				try {
					logger.debug('Cleaning up optimistic handler')
					;(await unsubscribe)()
					// TODO: how do we completely get rid of a client?
				} catch (error) {
					console.error('Error cleaning up optimistic handler', error)
				}
			},
		},
	}
}
