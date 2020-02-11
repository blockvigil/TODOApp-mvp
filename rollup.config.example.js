import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import config from 'sapper/config/rollup.js';
import pkg from './package.json';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

const onwarn = (warning, onwarn) => (warning.code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(warning.message)) || onwarn(warning);

process.env.API_PREFIX = process.env.API_PREFIX || 'https://beta.ethvigil.com/api';
process.env.WS_URL = process.env.WS_URL || 'wss://beta.ethvigil.com/ws';
process.env.EVAPI_PREFIX = process.env.EVAPI_PREFIX || 'https://beta-api.ethvigil.com/v0.1';
process.env.API_KEY = process.env.API_KEY || 'WRITE-API-KEY-HERE';
process.env.API_READ_KEY = process.env.API_READ_KEY || 'READONLY-API-KEY-HERE';
process.env.TODO_CONTRACT_ADDRESS = process.env.TODO_CONTRACT_ADDRESS || '0xContractAddress'

export default {
	client: {
		input: config.client.input(),
		output: config.client.output(),
		plugins: [
			replace({
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode),
				'process.env.API_PREFIX': JSON.stringify(process.env.API_PREFIX),
				'process.env.WS_URL': JSON.stringify(process.env.WS_URL),
				'process.env.EVAPI_PREFIX': JSON.stringify(process.env.EVAPI_PREFIX),
				'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
				'process.env.API_READ_KEY': JSON.stringify(process.env.API_READ_KEY),
				'process.env.TODO_CONTRACT_ADDRESS': JSON.stringify(process.env.TODO_CONTRACT_ADDRESS)
			}),
			svelte({
				dev,
				hydratable: true,
				emitCss: true
			}),
			resolve({
				browser: true,
				dedupe: ['svelte']
			}),
			commonjs(),

			legacy && babel({
				extensions: ['.js', '.mjs', '.html', '.svelte'],
				runtimeHelpers: true,
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

		onwarn,
	},

	server: {
		input: config.server.input(),
		output: config.server.output(),
		plugins: [
			json({
				// All JSON files will be parsed by default,
				// but you can also specifically include/exclude files
				include: 'node_modules/**',
				exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],

				// for tree-shaking, properties will be declared as
				// variables, using either `var` or `const`
				preferConst: true, // Default: false

				// specify indentation for the generated default export —
				// defaults to '\t'
				indent: '  ',

				// ignores indent and generates the smallest code
				compact: true, // Default: false

				// generate a named export for every property of the JSON object
				namedExports: true // Default: true
			}),
			replace({
				'process.browser': false,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			svelte({
				generate: 'ssr',
				dev
			}),
			resolve({
				dedupe: ['svelte']
			}),
			commonjs()
		],
		external: Object.keys(pkg.dependencies).concat(
			require('module').builtinModules || Object.keys(process.binding('natives'))
		),

		onwarn,
	},

	serviceworker: {
		input: config.serviceworker.input(),
		output: config.serviceworker.output(),
		plugins: [
			resolve(),
			replace({
				'process.browser': true,
				'process.env.NODE_ENV': JSON.stringify(mode)
			}),
			commonjs(),
			!dev && terser()
		],

		onwarn,
	}
};
