import { builtinModules } from 'module';
import typescript from '@rollup/plugin-typescript';

export default {
	input: 'email.ts',
	output: {
		file: 'email.js',
		format: 'es',
		sourcemap: true,
		footer: `
			/**
			 * @typedef {{ [index: string]: any }} AddressObject
			 * @typedef {{ [index: string]: any }} AddressToken
			 * @typedef {{ [index: string]: any }} ConnectOptions
			 * @typedef {{ [index: string]: any }} MessageAttachment
			 * @typedef {{ [index: string]: any }} MessageHeaders
			 * @typedef {{ [index: string]: any }} MessageStack
			 * @typedef {{ [index: string]: any }} SMTPConnectionOptions
			 * @typedef {Function} SMTPCommandCallback
			 */
			/**
			 * @template {Message | MessageHeaders} T
			 * @typedef {<T>(err: Error, msg: T) => void} MessageCallback
			 */
		`
			.trim()
			.replace(/\t/g, ''),
	},
	external: builtinModules,
	plugins: [
		typescript({ removeComments: false, include: ['email.ts', 'smtp/*'] }),
	],
};
