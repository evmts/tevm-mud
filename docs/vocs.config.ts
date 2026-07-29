import { defineConfig } from 'vocs/config'

export default defineConfig({
	title: 'Tevm MUD',
	titleTemplate: '%s · Tevm MUD',
	description: 'Optimistic MUD state powered by a local Tevm EVM in the browser',
	baseUrl: process.env.VERCEL_ENV === 'production' ? 'https://mud.tevm.sh' : process.env.VERCEL_URL,
	rootDir: '.',
	renderStrategy: 'full-static',
	logoUrl: {
		light: '/tevm-logo-light.png',
		dark: '/tevm-logo-dark.png',
	},
	iconUrl: '/tevm-logo.webp',
	ogImageUrl: 'https://vocs.dev/api/og?logo=%logo&title=%title&description=%description',
	// vocs 2.x: `theme.accentColor` / `theme.colorScheme` moved to the top level.
	accentColor: 'light-dark(#0085FF, #4DA6FF)',
	colorScheme: 'light dark',
	banner: {
		content: '`@tevm/mud` tracks the MUD release cadence and releases independently of Tevm core.',
		dismissable: true,
		variant: 'info',
	},
	editLink: {
		link: 'https://github.com/evmts/tevm-mud/edit/main/docs/src/pages/:path',
		text: 'Edit on GitHub',
	},
	socials: [
		{ icon: 'github', link: 'https://github.com/evmts/tevm-mud' },
		{ icon: 'x', link: 'https://x.com/tevmtools' },
	],
	topNav: [
		{ text: 'Getting started', link: '/getting-started/installation', match: '/getting-started' },
		{ text: 'Guides', link: '/guides/react', match: '/guides' },
		{ text: 'API', link: '/api/create-optimistic-handler', match: '/api' },
		{
			text: 'Ecosystem',
			items: [
				{ text: 'Tevm', link: 'https://tevm.sh' },
				{ text: 'Tevm Node', link: 'https://node.tevm.sh' },
				{ text: 'MUD', link: 'https://mud.dev' },
			],
		},
	],
	sidebar: [
		{ text: 'What is @tevm/mud?', link: '/' },
		{
			text: 'Getting started',
			collapsed: false,
			items: [
				{ text: 'Installation', link: '/getting-started/installation' },
				{ text: 'Quickstart', link: '/getting-started/quickstart' },
			],
		},
		{
			text: 'Guides',
			collapsed: false,
			items: [
				{ text: 'React', link: '/guides/react' },
				{ text: 'Transaction status', link: '/guides/transaction-status' },
				{ text: 'Syncing canonical state', link: '/guides/sync' },
				{ text: 'How it works', link: '/guides/how-it-works' },
				{ text: 'Troubleshooting', link: '/guides/troubleshooting' },
			],
		},
		{
			text: 'API reference',
			collapsed: false,
			items: [
				{ text: 'createOptimisticHandler', link: '/api/create-optimistic-handler' },
				{ text: 'subscribeTxStatus', link: '/api/subscribe-tx-status' },
				{ text: 'React hooks', link: '/api/react' },
				{ text: 'Types', link: '/api/types' },
			],
		},
		{ text: 'Tevm & the split repos', link: '/ecosystem' },
	],
})
