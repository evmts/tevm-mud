// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOptimisticRecords } from './useOptimisticRecords.js'

const mocks = vi.hoisted(() => ({
	getRecords: vi.fn(),
	state: { source: 'canonical' },
	wrapper: undefined as undefined | { getOptimisticRecords: ReturnType<typeof vi.fn> },
}))

vi.mock('@latticexyz/stash/internal', () => ({
	getRecords: mocks.getRecords,
}))

vi.mock('./useOptimisticState.js', () => ({
	useOptimisticState: (selector: (state: typeof mocks.state) => unknown) => selector(mocks.state),
}))

vi.mock('./useOptimisticWrapper.js', () => ({
	useOptimisticWrapper: () => mocks.wrapper,
}))

describe('useOptimisticRecords', () => {
	beforeEach(() => {
		mocks.getRecords.mockReset()
		mocks.wrapper = undefined
	})

	it('returns canonical records as an array outside the provider', () => {
		const records = {
			first: { key: 'first', score: 1 },
			second: { key: 'second', score: 2 },
		}
		const args = { table: { label: 'Players' } }
		mocks.getRecords.mockReturnValue(records)

		const { result } = renderHook(() => useOptimisticRecords(args as never))

		expect(result.current).toEqual(Object.values(records))
		expect(mocks.getRecords).toHaveBeenCalledWith({ state: mocks.state, ...args })
	})

	it('returns optimistic records when a provider is mounted', () => {
		const records = {
			first: { key: 'first', score: 3 },
		}
		const getOptimisticRecords = vi.fn().mockReturnValue(records)
		const args = { table: { label: 'Players' } }
		mocks.wrapper = { getOptimisticRecords }

		const { result } = renderHook(() => useOptimisticRecords(args as never))

		expect(result.current).toEqual(Object.values(records))
		expect(getOptimisticRecords).toHaveBeenCalledWith({ state: mocks.state, ...args })
		expect(mocks.getRecords).not.toHaveBeenCalled()
	})

	it('returns an empty array when the table has no records', () => {
		mocks.getRecords.mockReturnValue({})

		const { result } = renderHook(() => useOptimisticRecords({ table: {} } as never))

		expect(result.current).toEqual([])
	})
})
