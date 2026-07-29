import type { Hex } from 'viem'

/**
 * The status of an intercepted MUD write, emitted through `subscribeTx`.
 *
 * `id` is the 4-byte identifier appended to the transaction calldata, and is stable across the whole
 * lifecycle of one write. `optimistic` is emitted twice: once when the local simulation succeeds (no
 * `hash` yet), and once when the real transaction has been broadcast (with `hash`). Narrow with
 * `'hash' in status`.
 *
 * @example
 * ```ts
 * optimistic.subscribeTx({
 *   subscriber: (status) => {
 *     console.log(status.id, status.status, 'hash' in status ? status.hash : '(local only)')
 *   },
 * })
 * ```
 * @see https://mud.tevm.sh/guides/transaction-status
 */
export type TxStatus = {
	/** The 4-byte hex identifier appended to the tx calldata; stable across the tx lifecycle. */
	id: string
	/** `Date.now()` when the status was emitted. */
	timestamp: number
} & (
	| {
			status:
				| 'simulating' // optimistic tx running
				| 'optimistic' // optimistic tx mined
	  }
	| {
			status:
				| 'optimistic' // in this case tx has been broadcast as well as we have a tx hash
				| 'confirmed' // tx mined and confirmed
				| 'reverted' // tx reverted
			hash: Hex
	  }
)

/**
 * A subscriber notified for every {@link TxStatus} transition.
 *
 * Exceptions thrown by a subscriber are caught and logged by the handler's internal notifier; the remaining
 * subscribers still run.
 */
export type TxStatusSubscriber = (status: TxStatus) => void

/**
 * Curried helper that turns a set of subscribers into a subscribe function. This is the primitive behind
 * `handler.subscribeTx`.
 *
 * @param subscribers - The set the subscriber is added to. Owned by the caller.
 * @returns A subscribe function; calling it returns an unsubscribe function. Neither throws.
 * @example
 * ```ts
 * import { subscribeTxStatus, type TxStatusSubscriber } from '@tevm/mud'
 *
 * const subscribers = new Set<TxStatusSubscriber>()
 * const unsubscribe = subscribeTxStatus(subscribers)((status) => console.log(status.status))
 * unsubscribe()
 * ```
 * @see https://mud.tevm.sh/api/subscribe-tx-status
 */
export const subscribeTxStatus = (subscribers: Set<TxStatusSubscriber>) => (subscriber: TxStatusSubscriber) => {
	subscribers.add(subscriber)
	return () => {
		subscribers.delete(subscriber)
	}
}

/**
 * Curried helper that notifies every subscriber of a {@link TxStatus}.
 *
 * A subscriber that throws is logged with `console.warn` and skipped, so one bad subscriber cannot break
 * the others or the write pipeline.
 *
 * @param subscribers - The subscribers to notify.
 * @returns A function accepting the status to broadcast. Never throws.
 * @example
 * ```ts
 * notifyTxStatus(subscribers)({ id: '0x12345678', status: 'simulating', timestamp: Date.now() })
 * ```
 */
export const notifyTxStatus = (subscribers: Set<TxStatusSubscriber>) => (status: TxStatus) => {
	subscribers.forEach((subscriber) => {
		try {
			subscriber(status)
		} catch (error) {
			console.warn('TxStatus subscriber failed:', error)
		}
	})
}
