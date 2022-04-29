import test from 'ava';
import { SMTPServer } from 'smtp-server';

import { AUTH_METHODS, SMTPConnection } from '../email.js';

let port = 2000;

function connect({
	authMethods = [],
	authOptional = false,
	secure = false,
}: {
	authMethods?: (keyof typeof AUTH_METHODS)[];
	authOptional?: boolean;
	secure?: boolean;
} = {}) {
	return new Promise<void>((resolve, reject) => {
		const server = new SMTPServer({
			authMethods,
			secure: secure,
			onAuth(auth, _session, callback) {
				const { accessToken, method, username, password } = auth;
				if (
					(method === AUTH_METHODS.XOAUTH2 && password != null
						? accessToken === 'pooh'
						: username === 'pooh') &&
					(method === AUTH_METHODS.XOAUTH2 && password == null
						? accessToken === 'honey'
						: password === 'honey')
				) {
					callback(null, { user: 'pooh' });
				} else {
					return callback(new Error('invalid user / pass'));
				}
			},
		});
		const p = port++;
		server.listen(p, () => {
			const options = Object.assign(
				{
					port: p,
					authentication: authMethods,
				},
				authOptional
					? { ssl: secure }
					: { ssl: secure, user: 'pooh', password: 'honey' }
			);
			new SMTPConnection(options).connect((err) => {
				server.close(() => {
					if (err) {
						reject(err.message);
					} else {
						resolve();
					}
				});
			});
		});
	});
}

test('no authentication (unencrypted) should succeed', async (t) => {
	await t.notThrowsAsync(connect({ authOptional: true }));
});

test('no authentication (encrypted) should succeed', async (t) => {
	await t.notThrowsAsync(connect({ authOptional: true, secure: true }));
});

test('PLAIN authentication (unencrypted) should succeed', async (t) => {
	await t.notThrowsAsync(connect({ authMethods: [AUTH_METHODS.PLAIN] }));
});

test('PLAIN authentication (encrypted) should succeed', async (t) => {
	await t.notThrowsAsync(
		connect({ authMethods: [AUTH_METHODS.PLAIN], secure: true })
	);
});

test('LOGIN authentication (unencrypted) should succeed', async (t) => {
	await t.notThrowsAsync(connect({ authMethods: [AUTH_METHODS.LOGIN] }));
});

test('LOGIN authentication (encrypted) should succeed', async (t) => {
	await t.notThrowsAsync(
		connect({ authMethods: [AUTH_METHODS.LOGIN], secure: true })
	);
});

test('XOAUTH2 authentication (unencrypted) should succeed', async (t) => {
	await t.notThrowsAsync(connect({ authMethods: [AUTH_METHODS.XOAUTH2] }));
});

test('XOAUTH2 authentication (encrypted) should succeed', async (t) => {
	await t.notThrowsAsync(
		connect({ authMethods: [AUTH_METHODS.XOAUTH2], secure: true })
	);
});
