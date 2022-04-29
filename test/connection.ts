import test from 'ava';
import { SMTPServer } from 'smtp-server';

import { SMTPConnection } from '../email.js';
import type { SMTPConnectionOptions } from '../email.js';

const port = 6666;
let counter = 0;

function testConnection(options: Partial<SMTPConnectionOptions> = {}) {
	const increment = counter++;
	return new Promise<void>((resolve, reject) => {
		const { ssl } = options;
		const server = new SMTPServer(ssl ? { secure: true } : undefined);
		server.listen(port + increment, () => {
			const connection = new SMTPConnection(options);
			connection.connect((err) => {
				server.close();
				connection.close(true);
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			}, port + increment);
		});
	});
}

test('accepts a custom logger', async (t) => {
	const logger = () => {
		/** ø */
	};
	t.is(Reflect.get(new SMTPConnection({ logger }), 'log'), logger);
});

test('can connect without encryption', async (t) => {
	return await t.notThrowsAsync(testConnection());
});

test('can connect with ssl', async (t) => {
	return await t.notThrowsAsync(testConnection({ ssl: true }));
});

test('can connect with tls', async (t) => {
	return await t.notThrowsAsync(testConnection({ tls: true }));
});

test('can connect with tls and ssl', async (t) => {
	return await t.notThrowsAsync(testConnection({ ssl: true, tls: true }));
});
