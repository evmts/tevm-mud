import type { State, StoreConfig } from '@latticexyz/stash/internal'
import { useCallback, useDebugValue, useMemo, useSyncExternalStore } from 'react'
import { deepEqual } from '../internal/utils/deepEqual.js'
import { memoize } from '../internal/utils/memoize.js'
import { useOptimisticWrapper } from './useOptimisticWrapper.js'

/** Options for {@link useOptimisticState}. */
export type UseOptimisticStateOptions<T> = {
	/**
	 * Optional equality function.
	 * Must be a stable function, otherwise you may end up with this hook rerendering infinitely.
	 * @default deepEqual
	 */
	isEqual?: (a: T, b: T) => boolean
}

/**
 * Subscribes to the merged optimistic + canonical state through `useSyncExternalStore` and returns a
 * selected slice of it.
 *
 * This is the primitive {@link useOptimisticRecord} and {@link useOptimisticRecords} are built on.
 * Returns `undefined` when rendered outside an `OptimisticWrapperProvider`.
 *
 * @param selector - Picks a value out of the state. Called on every update.
 * @param opts - Optional equality function used to suppress re-renders; defaults to a deep equality check.
 * Must be a stable reference, otherwise the component re-renders infinitely.
 * @returns The selected slice, or `undefined` when there is no provider above.
 * @example
 * ```tsx
 * import { getRecords } from '@latticexyz/stash/internal'
 * import { useOptimisticState } from '@tevm/mud/react'
 * import mudConfig from '../mud.config'
 *
 * const playerCount = useOptimisticState(
 *   (state) => Object.keys(getRecords({ state, table: mudConfig.tables.app__Position })).length,
 * )
 * ```
 * @see https://mud.tevm.sh/api/react#useoptimisticstate
 */
export const useOptimisticState = <TConfig extends StoreConfig, T>(
	/**
	 * Selector to pick values from state.
	 * Be aware of the stability of both the `selector` and the return value, otherwise you may end up with unnecessary re-renders.
	 */
	selector: (state: State<TConfig>) => T,
	/**
	 * Optional equality function.
	 */
	opts: UseOptimisticStateOptions<T> = {},
): T | undefined => {
	const { isEqual = deepEqual } = opts
	const wrapper = useOptimisticWrapper<TConfig>()

	const subscribe = useCallback(
		(subscriber: () => void) => {
			if (!wrapper) return () => {}
			return wrapper.subscribeOptimisticState({ subscriber })
		},
		[wrapper],
	)
	const getSnapshot = useMemo(
		() => (wrapper ? memoize(() => selector(wrapper.getOptimisticState()), isEqual) : () => undefined),
		[isEqual, selector, wrapper],
	)

	const slice = useSyncExternalStore(subscribe, getSnapshot)

	useDebugValue(slice)
	return slice
}
