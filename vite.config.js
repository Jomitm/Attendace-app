import { defineConfig } from 'vite';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { readBuildMeta } = require('./scripts/build-meta.cjs');
const buildMeta = readBuildMeta(process.cwd());

export default defineConfig({
    root: './',
    define: {
        __APP_BUILD_META__: JSON.stringify(buildMeta)
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: './index.html',
            },
        },
    },
    server: {
        port: 3000,
    },
});
