import test from 'ava';
import { SMTPServer } from 'smtp-server';

import { SMTPConnection } from '../email.js';

const port = 6666;

test('accepts a custom logger', async (t) => {
	const logger = () => {
		/** ø */
	};
	t.is(Reflect.get(new SMTPConnection({ logger }), 'log'), logger);
});

test('can connect without ssl', async (t) => {
	return await t.notThrowsAsync(
		new Promise<void>((resolve, reject) => {
			const server = new SMTPServer().listen(port, () => {
				const connection = new SMTPConnection({ port });
				connection.connect((err) => {
					server.close();
					connection.close(true);
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				}, port);
			});
		})
	);
});
test('can connect with ssl', async (t) => {
	return await t.notThrowsAsync(
		new Promise<void>((resolve, reject) => {
			const server = new SMTPServer({ secure: true }).listen(port + 1, () => {
				const connection = new SMTPConnection({ port: port + 1, tls: true });
				connection.connect((err) => {
					server.close();
					connection.close(true);
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				}, port);
			});
		})
	);
});
