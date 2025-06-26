import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	resolve: {
		alias: {
			'@': '/src',
		},
	},
	base: '/',
	build: {
		outDir: 'build',
		rollupOptions: {
			input: {
				main: './index.html',
			},
			output: {
				assetFileNames: 'assets/[name][extname]',
				chunkFileNames: 'assets/[name].js',
				entryFileNames: 'assets/[name].js',
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
