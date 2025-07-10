import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		preact(),
	],
	resolve: {
		alias: {
			'@': './src',
		},
	},
	build: {
		rollupOptions: {
			output: {
				format: 'iife',
				inlineDynamicImports: true,
				entryFileNames: 'assets/bundle.js',
				assetFileNames: 'assets/[name].[ext]'
			},
		},
		target: 'es2020',
		minify: 'terser'
	},
});
