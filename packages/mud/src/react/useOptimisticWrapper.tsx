import type { Stash, StoreConfig } from '@latticexyz/stash/internal'
import { SyncProvider } from '@latticexyz/store-sync/react'
import React, { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react'
import type { Client } from 'viem'
import {
	type CreateOptimisticHandlerOptions,
	type CreateOptimisticHandlerResult,
	createOptimisticHandler,
} from '../createOptimisticHandler.js'
import type { SessionClient } from '../types.js'

interface OptimisticWrapperContextType<TConfig extends StoreConfig> extends CreateOptimisticHandlerResult<TConfig> {}
const OptimisticWrapperContext = createContext<OptimisticWrapperContextType<StoreConfig> | undefined>(undefined)

interface OptimisticWrapperProviderProps<TConfig extends StoreConfig> extends CreateOptimisticHandlerOptions<TConfig> {
	children: ReactNode
}

// Create a global registry for handlers by key
// We need to do that work now as otherwise we get both multiple writeContract wrappers (next one will wrap the previous wrapper itself) and multiple txPool subscriptions
// that apply the same txs inconsistently
// This is awful and obviously needs to be fixed as soon as there is a better solution
type HandlerRegistryEntry = {
	handlerResult: CreateOptimisticHandlerResult<StoreConfig>
	refCount: number
}

const handlerRegistry = new WeakMap<
	Client | SessionClient,
	Map<string, WeakMap<Stash<StoreConfig>, HandlerRegistryEntry>>
>()

const getOrCreateHandler = (options: CreateOptimisticHandlerOptions<StoreConfig>): HandlerRegistryEntry => {
	let handlersByStore = handlerRegistry.get(options.client)
	if (!handlersByStore) {
		handlersByStore = new Map()
		handlerRegistry.set(options.client, handlersByStore)
	}

	let handlersByStash = handlersByStore.get(options.storeAddress)
	if (!handlersByStash) {
		handlersByStash = new WeakMap()
		handlersByStore.set(options.storeAddress, handlersByStash)
	}

	let entry = handlersByStash.get(options.stash)
	if (!entry) {
		entry = {
			handlerResult: createOptimisticHandler(options),
			refCount: 0,
		}
		handlersByStash.set(options.stash, entry)
	}

	return entry
}

/**
 * Provider component that initializes the optimistic handler and makes its utilities available
 * to child components via the OptimisticWrapperContext.
 *
 * Takes every option of `createOptimisticHandler` plus `children`. When `sync` is provided and not
 * disabled, and the client has a chain, it also renders MUD's `SyncProvider` with the handler's
 * `syncAdapter` — do not mount `SyncProvider` yourself in that case.
 *
 * Handlers are cached in a registry keyed by `client → storeAddress → stash` and ref-counted, so mounting
 * the provider twice (StrictMode included) does not create two `writeContract` wrappers or two txpool
 * subscriptions. `_.cleanup()` runs when the last consumer unmounts.
 *
 * @throws {Error} `'Client must be connected to a chain'` (from `createOptimisticHandler`) if
 * `client.chain` is undefined. Guard on the client being ready before mounting.
 * @example
 * ```tsx
 * import { OptimisticWrapperProvider } from '@tevm/mud/react'
 * import mudConfig from '../mud.config'
 *
 * <OptimisticWrapperProvider
 *   client={sessionClient}
 *   storeAddress={worldAddress}
 *   stash={stash}
 *   config={mudConfig}
 *   sync={{ enabled: true, startBlock: 0n }}
 * >
 *   <Game />
 * </OptimisticWrapperProvider>
 * ```
 * @see https://mud.tevm.sh/api/react#optimisticwrapperprovider
 */
export const OptimisticWrapperProvider: React.FC<OptimisticWrapperProviderProps<StoreConfig>> = ({
	children,
	...options
}) => {
	const { client, storeAddress, stash, sync, config, loggingLevel } = options

	const registryEntry = useMemo(
		() => getOrCreateHandler({ client, storeAddress, stash, sync, config, loggingLevel }),
		[client, storeAddress, stash, sync, config, loggingLevel],
	)
	const handlerResult = registryEntry.handlerResult

	useEffect(() => {
		registryEntry.refCount++
		return () => {
			registryEntry.refCount--
			if (registryEntry.refCount === 0) {
				handlerRegistry.get(client)?.get(storeAddress)?.delete(stash)
				handlerResult._.cleanup().catch(console.error)
			}
		}
	}, [client, handlerResult, registryEntry, stash, storeAddress])

	if (sync && (sync.enabled === undefined || sync.enabled) && client.chain) {
		return (
			<OptimisticWrapperContext.Provider value={handlerResult}>
				<SyncProvider
					chainId={client.chain.id}
					address={storeAddress}
					startBlock={sync.startBlock ?? 0n}
					adapter={handlerResult.syncAdapter}
				>
					{children}
				</SyncProvider>
			</OptimisticWrapperContext.Provider>
		)
	}

	return <OptimisticWrapperContext.Provider value={handlerResult}>{children}</OptimisticWrapperContext.Provider>
}

/**
 * Custom hook to access the optimistic handler utilities from the OptimisticContext.
 *
 * Returns `undefined` when called outside an `OptimisticWrapperProvider` — the return type is
 * non-optional for ergonomics, so guard before use if the component can render outside the provider.
 *
 * @returns The handler returned by `createOptimisticHandler`, or `undefined` outside a provider.
 * @example
 * ```tsx
 * const wrapper = useOptimisticWrapper()
 *
 * useEffect(() => {
 *   if (!wrapper) return
 *   return wrapper.subscribeTx({ subscriber: (status) => console.log(status.status) })
 * }, [wrapper])
 * ```
 * @see https://mud.tevm.sh/api/react#useoptimisticwrapper
 */
export const useOptimisticWrapper = <TConfig extends StoreConfig>(): OptimisticWrapperContextType<TConfig> => {
	const context = useContext(OptimisticWrapperContext) as OptimisticWrapperContextType<TConfig>
	return context
}
