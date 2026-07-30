// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOptimisticState } from './useOptimisticState.js'

const mocks = vi.hoisted(() => ({
	wrapper: undefined as
		| undefined
		| {
				getOptimisticState: () => { score: number }
				subscribeOptimisticState: (args: { subscriber: () => void }) => () => void
		  },
}))

vi.mock('./useOptimisticWrapper.js', () => ({
	useOptimisticWrapper: () => mocks.wrapper,
}))

describe('useOptimisticState', () => {
	beforeEach(() => {
		mocks.wrapper = undefined
	})

	it('returns undefined outside an OptimisticWrapperProvider', () => {
		const { result } = renderHook(() => useOptimisticState((state) => state))

		expect(result.current).toBeUndefined()
	})

	it('subscribes, selects optimistic state, and unsubscribes on unmount', () => {
		let state = { score: 1 }
		let notify = () => {}
		const unsubscribe = vi.fn()
		mocks.wrapper = {
			getOptimisticState: () => state,
			subscribeOptimisticState: ({ subscriber }) => {
				notify = subscriber
				return unsubscribe
			},
		}

		const { result, unmount } = renderHook(() =>
			useOptimisticState((value) => (value as unknown as { score: number }).score),
		)
		expect(result.current).toBe(1)

		act(() => {
			state = { score: 2 }
			notify()
		})
		expect(result.current).toBe(2)

		unmount()
		expect(unsubscribe).toHaveBeenCalledOnce()
	})
})
