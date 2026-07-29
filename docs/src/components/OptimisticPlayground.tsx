'use client'

import { useEffect, useRef, useState } from 'react'

type Phase = 'idle' | 'simulating' | 'optimistic' | 'confirmed' | 'reverted'

type TxEvent = {
	id: number
	status: Exclude<Phase, 'idle'>
	message: string
	hash?: string
}

const BASE_COUNT = 41

export function OptimisticPlayground() {
	const [phase, setPhase] = useState<Phase>('idle')
	const [count, setCount] = useState(BASE_COUNT)
	const [events, setEvents] = useState<TxEvent[]>([])
	const [willRevert, setWillRevert] = useState(false)
	const [flashKey, setFlashKey] = useState(0)
	const timers = useRef<Array<ReturnType<typeof setTimeout>>>([])
	const txSeq = useRef(0)

	useEffect(() => () => timers.current.forEach(clearTimeout), [])

	const later = (ms: number, fn: () => void) => {
		timers.current.push(setTimeout(fn, ms))
	}

	const pushEvent = (event: Omit<TxEvent, 'id'>) => {
		setEvents((prev) => [...prev.slice(-7), { ...event, id: Date.now() + Math.random() }])
	}

	const send = () => {
		if (phase === 'simulating' || phase === 'optimistic') return
		timers.current.forEach(clearTimeout)
		timers.current = []

		const hash = `0x${(txSeq.current += 1).toString(16).padStart(4, '0')}…${Math.random()
			.toString(16)
			.slice(2, 6)}`
		const revert = willRevert

		setEvents([])
		setPhase('simulating')
		pushEvent({ status: 'simulating', message: 'eth_call against Tevm — simulating increment()' })

		later(900, () => {
			setPhase('optimistic')
			setCount(BASE_COUNT + 1)
			setFlashKey((k) => k + 1)
			pushEvent({
				status: 'optimistic',
				message: 'stash updated optimistically — UI re-renders now',
				hash,
			})
		})

		later(2600, () => {
			if (revert) {
				setPhase('reverted')
				setCount(BASE_COUNT)
				setFlashKey((k) => k + 1)
				pushEvent({
					status: 'reverted',
					message: 'canonical tx reverted — optimistic record rolled back',
					hash,
				})
			} else {
				setPhase('confirmed')
				pushEvent({
					status: 'confirmed',
					message: 'canonical tx mined — optimistic state reconciled',
					hash,
				})
			}
		})
	}

	const reset = () => {
		timers.current.forEach(clearTimeout)
		timers.current = []
		setPhase('idle')
		setCount(BASE_COUNT)
		setEvents([])
	}

	const pending = phase === 'optimistic'

	return (
		<div>
			<div className="tevm-mud-playground">
				<div className="tevm-mud-panel">
					<div className="tevm-mud-panel-header">
						<span>stash — app:Counter</span>
						<span className={`tevm-status-badge tevm-status-badge--${phase}`}>{phase}</span>
					</div>
					<table className="tevm-mud-table">
						<thead>
							<tr>
								<th>key</th>
								<th>field</th>
								<th>value</th>
							</tr>
						</thead>
						<tbody>
							<tr key={flashKey} className={flashKey > 0 ? 'tevm-mud-flash' : undefined}>
								<td>0x00…01</td>
								<td>value</td>
								<td>
									<span className="tevm-mud-value" data-pending={pending}>
										{count}
										{pending ? ' ⏳' : ''}
									</span>
								</td>
							</tr>
							<tr>
								<td>0x00…01</td>
								<td>lastUpdatedBy</td>
								<td>0xf39F…2266</td>
							</tr>
						</tbody>
					</table>
					<div className="tevm-mud-controls">
						<button
							type="button"
							className="tevm-button tevm-button--primary"
							onClick={send}
							disabled={phase === 'simulating' || phase === 'optimistic'}
						>
							Send increment()
						</button>
						<button type="button" className="tevm-button" onClick={reset}>
							Reset
						</button>
						<label className="tevm-mud-toggle">
							<input
								type="checkbox"
								checked={willRevert}
								onChange={(e) => setWillRevert(e.target.checked)}
							/>
							canonical tx reverts
						</label>
					</div>
				</div>
				<div className="tevm-mud-panel">
					<div className="tevm-mud-panel-header">
						<span>subscribeTxStatus — events</span>
					</div>
					<div className="tevm-mud-events">
						{events.length === 0 ? (
							<div className="tevm-mud-event">
								<span className="tevm-mud-event-status">—</span>
								<span>send a transaction to watch the TxStatus stream</span>
							</div>
						) : (
							events.map((event) => (
								<div className="tevm-mud-event" key={event.id}>
									<span className={`tevm-mud-event-status tevm-mud-event-status--${event.status}`}>
										{event.status}
									</span>
									<span>
										{event.message}
										{event.hash ? (
											<>
												{' '}
												<span className="tevm-mud-event-hash">{event.hash}</span>
											</>
										) : null}
									</span>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
