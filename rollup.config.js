import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import babel from '@rollup/plugin-babel';
import {terser} from 'rollup-plugin-terser';
import config from 'sapper/config/rollup.js';
import pkg from './package.json';
import sveltePreprocess from 'svelte-preprocess';
import typescript from "@rollup/plugin-typescript";

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const sourcemap = dev ? "inline" : false;
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

const preprocess = sveltePreprocess({
	postcss: true,
});

const onwarn = (warning, onwarn) =>
	(warning.code === 'MISSING_EXPORT' && /'preload'/.test(warning.message)) ||
	(warning.code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(warning.message)) ||
	(warning.code === 'THIS_IS_UNDEFINED') ||
	onwarn(warning);

export default {
	client: {
		input: config.client.input().replace(/\.js$/, ".ts"),
		output: {...config.client.output(), sourcemap},
		plugins: [
			replace({
				'process.browser': true,
				preventAssignment: true,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			svelte({
				//dev,
				emitCss: true,
				compilerOptions: {
					hydratable: true,
				},
				preprocess: [preprocess],
			}),
			resolve({
				browser: true,
				dedupe: ['svelte']
			}),
			commonjs({
				sourceMap: !!sourcemap,
			}),
			typescript({
				noEmitOnError: !dev,
				sourceMap: !!sourcemap,
			}),

			legacy && babel({
				extensions: ['.js', '.mjs', '.html', '.svelte'],
				babelHelpers: 'runtime',
				exclude: ['node_modules/@babel/**'],
				presets: [
					['@babel/preset-env', {
						targets: '> 0.25%, not dead'
					}]
				],
				plugins: [
					'@babel/plugin-syntax-dynamic-import',
					['@babel/plugin-transform-runtime', {
						useESModules: true
					}]
				]
			}),

			!dev && terser({
				module: true
			})
		],

		preserveEntrySignatures: false,
		onwarn,
	},

	server: {
		input: {server: config.server.input().server.replace(/\.js$/, ".ts")},
		output: {...config.server.output(), sourcemap},
		plugins: [
			replace({
				'process.browser': false,
				preventAssignment: true,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			svelte({
				compilerOptions: {
					generate: 'ssr',
					hydratable: true,
				},
				//dev,
				preprocess: [preprocess],
			}),
			resolve({
				dedupe: ['svelte']
			}),
			commonjs({
				sourceMap: !!sourcemap,
			}),
			typescript({
				noEmitOnError: !dev,
				sourceMap: !!sourcemap,
			}),
		],
		external: Object.keys(pkg.dependencies).concat(require('module').builtinModules),

		preserveEntrySignatures: 'strict',
		onwarn,
	},

	serviceworker: {
		input: config.serviceworker.input().replace(/\.js$/, ".ts"),
		output: {...config.serviceworker.output(), sourcemap},
		plugins: [
			resolve(),
			replace({
				'process.browser': true,
				preventAssignment: true,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			commonjs({
				sourceMap: !!sourcemap,
			}),
			typescript({
				noEmitOnError: !dev,
				sourceMap: !!sourcemap,
			}),
			!dev && terser()
		],

		preserveEntrySignatures: false,
		onwarn,
	}
};
