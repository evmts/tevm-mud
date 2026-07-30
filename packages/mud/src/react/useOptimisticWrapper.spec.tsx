// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OptimisticWrapperProvider, useOptimisticWrapper } from './useOptimisticWrapper.js'

const mocks = vi.hoisted(() => ({
	createOptimisticHandler: vi.fn(),
}))

vi.mock('../createOptimisticHandler.js', () => ({
	createOptimisticHandler: mocks.createOptimisticHandler,
}))

const createHandler = () => ({
	_: {
		cleanup: vi.fn().mockResolvedValue(undefined),
	},
	getOptimisticRecord: vi.fn(),
	getOptimisticRecords: vi.fn(),
	getOptimisticState: vi.fn(),
	subscribeOptimisticState: vi.fn(),
	subscribeTx: vi.fn(),
	syncAdapter: vi.fn(),
})

const createProps = () => ({
	client: { chain: { id: 1 } },
	storeAddress: '0x0000000000000000000000000000000000000001' as const,
	stash: {},
})

describe('useOptimisticWrapper', () => {
	beforeEach(() => {
		mocks.createOptimisticHandler.mockReset()
	})

	it('returns undefined outside the provider', () => {
		const { result } = renderHook(() => useOptimisticWrapper())

		expect(result.current).toBeUndefined()
	})

	it('exposes the handler and cleans it up after unmount', async () => {
		const handler = createHandler()
		const props = createProps()
		mocks.createOptimisticHandler.mockReturnValue(handler)
		const wrapper = ({ children }: PropsWithChildren) => (
			<OptimisticWrapperProvider
				client={props.client as never}
				storeAddress={props.storeAddress}
				stash={props.stash as never}
			>
				{children}
			</OptimisticWrapperProvider>
		)

		const { result, unmount } = renderHook(() => useOptimisticWrapper(), { wrapper })

		expect(result.current).toBe(handler)
		expect(mocks.createOptimisticHandler).toHaveBeenCalledOnce()

		unmount()
		await waitFor(() => expect(handler._.cleanup).toHaveBeenCalledOnce())
	})

	it('reuses one handler for providers with the same client, address, and stash', async () => {
		const handler = createHandler()
		const props = createProps()
		mocks.createOptimisticHandler.mockReturnValue(handler)
		const wrapper = ({ children }: PropsWithChildren) => (
			<OptimisticWrapperProvider
				client={props.client as never}
				storeAddress={props.storeAddress}
				stash={props.stash as never}
			>
				{children}
			</OptimisticWrapperProvider>
		)

		const first = renderHook(() => useOptimisticWrapper(), { wrapper })
		const second = renderHook(() => useOptimisticWrapper(), { wrapper })

		expect(first.result.current).toBe(handler)
		expect(second.result.current).toBe(handler)
		expect(mocks.createOptimisticHandler).toHaveBeenCalledOnce()

		first.unmount()
		expect(handler._.cleanup).not.toHaveBeenCalled()

		second.unmount()
		await waitFor(() => expect(handler._.cleanup).toHaveBeenCalledOnce())
	})
})
