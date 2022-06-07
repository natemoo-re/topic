export default function createDeck(opts = {}) {
	return {
		name: 'topic.dev',
		hooks: {
			'astro:config:setup': async ({ injectRoute }) => {
				injectRoute({
                    pattern: '/[...slug]',
                    entryPoint: 'topic.dev/pages/slides'
                })
				return
			},
		},
	};
}
