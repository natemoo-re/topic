import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import topic from 'topic-dev';

// https://astro.build/config
export default defineConfig({
    adapter: node(),
    integrations: [
        topic()
    ],
    experimental: {
        integrations: true
    }
});
