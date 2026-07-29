import { type GetRecordsArgs, getRecords, type TableRecord } from '@latticexyz/stash/internal'
import type { Table } from '@latticexyz/store/internal'
import { deepEqual } from '../internal/utils/deepEqual.js'
import { useOptimisticState } from './useOptimisticState.js'
import { useOptimisticWrapper } from './useOptimisticWrapper.js'

/** The result of {@link useOptimisticRecords}: always an array, never `undefined`. */
export type UseOptimisticRecordsResult<table extends Table = Table> = readonly TableRecord<table>[]

/**
 * Reads every record of a table from the optimistic state and re-renders when they change.
 *
 * Same arguments as `getRecords` from `@latticexyz/stash`, minus `stash` and `state`. Results are compared
 * with a deep equality check, so a sync round producing identical records does not re-render. Outside an
 * `OptimisticWrapperProvider` this falls back to a plain stash read.
 *
 * @param args - Table and optional query arguments.
 * @returns The records as an array; `[]` when there are none.
 * @example
 * ```tsx
 * import { useOptimisticRecords } from '@tevm/mud/react'
 * import mudConfig from '../mud.config'
 *
 * const players = useOptimisticRecords({ table: mudConfig.tables.app__Position })
 * ```
 * @see https://mud.tevm.sh/api/react#useoptimisticrecords
 */
export const useOptimisticRecords = <const TTable extends Table>(
	args: Omit<GetRecordsArgs<TTable>, 'stash' | 'state'>,
): UseOptimisticRecordsResult<TTable> => {
	const wrapper = useOptimisticWrapper()
	return (
		useOptimisticState(
			(state) => {
				const records = wrapper ? wrapper.getOptimisticRecords({ state, ...args }) : getRecords({ state, ...args })
				return Object.values(records)
			},
			{
				isEqual: deepEqual,
			},
		) ?? []
	)
}
