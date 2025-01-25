import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	resolve: {
		alias: {
			'@': '/src',
		},
	},
	build: {
		outDir: 'build',
		assetsDir: 'assets',
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
