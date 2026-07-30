import { createLogger } from '@tevm/logger'
import { createMemoryClient } from '@tevm/memory-client'
import { type Address, type EIP1193RequestFn, pad } from 'viem'
import { beforeEach, describe, expect, it } from 'vitest'
import { testContract } from '../../../test/prepare.js'
import { state } from '../../../test/state.js'
import { mudStoreGetStorageAtOverride } from './mudStoreGetStorageAtOverride.js'

const getState = () => state
const client = createMemoryClient()
const records = Object.values(state.records.app.TestTable).slice(0, 2)
const mudStoreRequestOverride = mudStoreGetStorageAtOverride(
	{ request: (async () => {}) as EIP1193RequestFn },
	'internal',
	createLogger({ name: '@tevm/mud', level: 'debug' }),
)({
	getState,
	storeAddress: testContract.address,
})

describe('mudStoreGetStorageAtOverride', () => {
	beforeEach(async () => {
		await client.tevmDeploy({
			abi: testContract.abi,
			bytecode: testContract.bytecode,
			addToBlockchain: true,
		})

		for (const values of records) {
			await client.tevmContract({
				// @ts-expect-error - Object.values cannot preserve the generated contract argument tuple.
				...testContract.write.set(...Object.values(values)),
				addToBlockchain: true,
			})
		}
	})

	it('should calculate and return the correct value for any data slot from the client override', async () => {
		for (const { key1, key2 } of records) {
			const { accessList } = await client.tevmContract({
				...testContract.read.get(key1, key2),
				addToBlockchain: true,
				createAccessList: true,
			})

			const slots = [...(accessList?.[testContract.address.toLowerCase() as Address] ?? [])]
			for (const slot of slots) {
				const value = await client.getStorageAt({ address: testContract.address, slot })
				if (!value) return
				// skip the storeAddress slot
				if (value.toLowerCase() === testContract.address.toLowerCase()) continue

				const actualStorage = pad(value, { size: 32 })
				const overrideStorage = await mudStoreRequestOverride({
					method: 'eth_getStorageAt',
					params: [testContract.address, slot],
					id: 1,
					jsonrpc: '2.0',
				})

				expect(actualStorage).toEqual(overrideStorage)
			}
		}
	})
})
