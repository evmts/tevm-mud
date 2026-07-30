// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOptimisticRecord } from './useOptimisticRecord.js'

const mocks = vi.hoisted(() => ({
	getRecord: vi.fn(),
	state: { source: 'canonical' },
	wrapper: undefined as undefined | { getOptimisticRecord: ReturnType<typeof vi.fn> },
}))

vi.mock('@latticexyz/stash/internal', () => ({
	getRecord: mocks.getRecord,
}))

vi.mock('./useOptimisticState.js', () => ({
	useOptimisticState: (selector: (state: typeof mocks.state) => unknown) => selector(mocks.state),
}))

vi.mock('./useOptimisticWrapper.js', () => ({
	useOptimisticWrapper: () => mocks.wrapper,
}))

describe('useOptimisticRecord', () => {
	beforeEach(() => {
		mocks.getRecord.mockReset()
		mocks.wrapper = undefined
	})

	it('reads from the canonical stash state outside the provider', () => {
		const record = { key: 'player', score: 1 }
		const args = { table: { label: 'Players' }, key: { player: '0x01' } }
		mocks.getRecord.mockReturnValue(record)

		const { result } = renderHook(() => useOptimisticRecord(args as never))

		expect(result.current).toBe(record)
		expect(mocks.getRecord).toHaveBeenCalledWith({ state: mocks.state, ...args })
	})

	it('uses the optimistic wrapper when a provider is mounted', () => {
		const record = { key: 'player', score: 2 }
		const getOptimisticRecord = vi.fn().mockReturnValue(record)
		const args = { table: { label: 'Players' }, key: { player: '0x01' } }
		mocks.wrapper = { getOptimisticRecord }

		const { result } = renderHook(() => useOptimisticRecord(args as never))

		expect(result.current).toBe(record)
		expect(getOptimisticRecord).toHaveBeenCalledWith({ state: mocks.state, ...args })
		expect(mocks.getRecord).not.toHaveBeenCalled()
	})
})
