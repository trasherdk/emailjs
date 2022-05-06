export default {
	extensions: {
		ts: 'module',
	},
	environmentVariables: {
		NODE_TLS_REJECT_UNAUTHORIZED: '0',
	},
	files: ['test/*.ts'],
	nodeArguments: ['--loader=ts-node/esm'],
	// crashes v8 entirely
	workerThreads: false,
};
