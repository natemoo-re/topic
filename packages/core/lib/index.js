export default function createTopic(opts = {}) {
	return {
		name: 'topic.dev',
		hooks: {
			'astro:config:setup': async ({ injectRoute }) => {
				injectRoute({
                    pattern: '/[...slug]',
                    entryPoint: '@topic.dev/core/pages/slides'
                })
			},
		},
	};
}
