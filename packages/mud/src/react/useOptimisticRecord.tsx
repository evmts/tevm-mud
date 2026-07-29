import { type GetRecordArgs, getRecord, type Key, type TableRecord } from '@latticexyz/stash/internal'
import type { Table } from '@latticexyz/store/internal'
import { useOptimisticState } from './useOptimisticState.js'
import { useOptimisticWrapper } from './useOptimisticWrapper.js'

/**
 * The result of {@link useOptimisticRecord}: non-optional when a `defaultValue` is provided.
 */
export type UseOptimisticRecordResult<
	TTable extends Table = Table,
	TDefaultValue extends Omit<TableRecord<TTable>, keyof Key<TTable>> | undefined = undefined,
> = TDefaultValue extends undefined ? TableRecord<TTable> | undefined : TableRecord<TTable>

/**
 * Reads one record from the optimistic state and re-renders when it changes.
 *
 * Same arguments as `getRecord` from `@latticexyz/stash`, minus `stash` and `state`. Outside an
 * `OptimisticWrapperProvider` this transparently falls back to a plain stash read, so components stay
 * usable in tests and before a session client exists.
 *
 * @param args - Table, key and optional `defaultValue`.
 * @returns The record; non-optional when `defaultValue` is provided, otherwise possibly `undefined`.
 * @example
 * ```tsx
 * import { useOptimisticRecord } from '@tevm/mud/react'
 * import mudConfig from '../mud.config'
 *
 * const position = useOptimisticRecord({
 *   table: mudConfig.tables.app__Position,
 *   key: { player },
 *   defaultValue: { x: 0, y: 0 },
 * })
 * ```
 * @see https://mud.tevm.sh/api/react#useoptimisticrecord
 */
export const useOptimisticRecord = <
	const TTable extends Table,
	const TDefaultValue extends Omit<TableRecord<TTable>, keyof Key<TTable>> | undefined = undefined,
>(
	args: Omit<GetRecordArgs<TTable, TDefaultValue>, 'stash' | 'state'>,
): UseOptimisticRecordResult<TTable, TDefaultValue> => {
	const wrapper = useOptimisticWrapper()
	return useOptimisticState((state) =>
		wrapper ? wrapper.getOptimisticRecord({ state, ...args }) : getRecord({ state, ...args }),
	) as UseOptimisticRecordResult<TTable, TDefaultValue>
}
