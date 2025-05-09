import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	base: './',
	resolve: {
		alias: {
			'@': '/src',
		},
	},
	build: {
		outDir: 'build',
		rollupOptions: {
			input: {
				main: './index.html',
			},
			output: {
				assetFileNames: '[name][extname]',
				chunkFileNames: '[name].js',
				entryFileNames: '[name].js',
			},
		},
	},
	server: {
		host: true,
		port: 3000,
	},
	plugins: [react()],
	optimizeDeps: {
		force: true,
	},
});
