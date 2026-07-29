import type { Address, Chain, Client, Transport, WriteContractParameters, WriteContractReturnType } from 'viem'
import type { BundlerClient, SmartAccount } from 'viem/account-abstraction'

/**
 * The client shape `@tevm/mud` can intercept writes on — EntryKit's session client.
 *
 * `createOptimisticHandler` wraps `writeContract` only when `client.type === 'bundlerClient'` and the client
 * exposes `writeContract`, which is exactly this shape. `userAddress` is the user's main (smart) account —
 * the address MUD tables are keyed by, and the `caller` used for the local simulation so `_msgSender()`
 * matches what happens on chain — as opposed to the session signer that actually signs.
 *
 * @example
 * ```ts
 * import { useSessionClient } from '@latticexyz/entrykit/internal'
 * import type { SessionClient } from '@tevm/mud'
 *
 * const { data } = useSessionClient()
 * const client: SessionClient | undefined = data
 * ```
 * @see https://mud.tevm.sh/api/types#sessionclient
 */
export type SessionClient = BundlerClient<Transport, Chain, SmartAccount, Client> & {
	/** The user's main account address; MUD tables are keyed by this, not by the session signer. */
	readonly userAddress: Address
	/** The write path `@tevm/mud` wraps to simulate each MUD write locally before it is confirmed. */
	writeContract: (args: WriteContractParameters) => Promise<WriteContractReturnType>
}
