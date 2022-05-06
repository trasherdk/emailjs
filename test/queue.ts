import { performance } from 'perf_hooks';

import test from 'ava';
import { SMTPServer } from 'smtp-server';

import { SMTPClient, Message } from '../email.js';

const port = 7777;

test('synchronous queue failures are handled gracefully by client', async (t) => {
	const tlsClient = new SMTPClient({ port, timeout: 200, tls: true });
	const secureServer = new SMTPServer({ secure: true });

	let attemptCount = 0;
	let failureCount = 0;

	const mailQueue: (() => Promise<void>)[] = [];
	function* mailQueueGenerator() {
		while (mailQueue.length > 0) {
			yield mailQueue.shift();
		}
	}

	await t.throwsAsync(
		new Promise<void>((resolve, reject) => {
			secureServer
				.on('error', () => {
					/** intentionally swallow errors */
				})
				.listen(port, async () => {
					const mailTask = async () => {
						try {
							await tlsClient.sendAsync(
								new Message({
									from: 'piglet@gmail.com',
									to: 'pooh@gmail.com',
									subject: 'this is a test TEXT message from emailjs',
									text: 'hello friend, i hope this message finds you well.',
								})
							);
							resolve();
						} catch (err) {
							if (attemptCount < 5) {
								void mailQueue.push(mailTask);
							} else {
								reject(err);
							}
							throw err;
						}
					};
					void mailQueue.push(mailTask);
					for (const task of mailQueueGenerator()) {
						const now = performance.now();
						const initialAttemptCount = attemptCount++;
						try {
							t.log(
								`Attempting task #${attemptCount}...${
									attemptCount > 1
										? ` (succeeded: ${
												initialAttemptCount - failureCount
										  } / ${initialAttemptCount})`
										: ''
								}`
							);
							await task?.();
							t.log(
								`Task succeeded (${Math.round(performance.now() - now)}ms).`
							);
						} catch (err) {
							failureCount++;
							t.log(
								`Task failed: ${err.message} (${Math.round(
									performance.now() - now
								)}ms)`
							);
						}
					}
					t.log(
						`Finished after ${attemptCount} attempts (succeeded: ${
							attemptCount - failureCount
						} / ${attemptCount}).`
					);
				});
		})
	);

	t.log(
		`SMTPClient ${JSON.stringify(
			{
				// @ts-expect-error need to check protected prop
				ready: tlsClient.ready,
				// @ts-expect-error need to check protected prop
				sending: tlsClient.sending,
				state: tlsClient.smtp.state(),
			},
			null,
			'\t'
		).replace(/"/g, '')}`
	);

	// @ts-expect-error need to check protected prop
	t.false(tlsClient.ready);
	// @ts-expect-error need to check protected prop
	t.false(tlsClient.sending);
	t.is(tlsClient.smtp.state(), 0);
});
