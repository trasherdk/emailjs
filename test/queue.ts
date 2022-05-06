import test from 'ava';
import { SMTPServer } from 'smtp-server';
import { SMTPClient, Message } from '../email.js';

const port = 7777;

test('synchronous queue failures are handled gracefully by client', async (t) => {
	const mailQueue: (() => Promise<void>)[] = [];
	function* mailQueueGenerator() {
		while (mailQueue.length > 0) {
			yield mailQueue.shift();
		}
	}

	const tlsClient = new SMTPClient({ port, timeout: 100, tls: true });
	const secureServer = new SMTPServer({ secure: true });

	let tryCount = 0;
	secureServer.on('error', (err) =>
		t.log(`Try #${tryCount} failed: ${err.message}`)
	);

	await t.throwsAsync(
		new Promise<void>((resolve, reject) => {
			secureServer.listen(port, async () => {
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
						if (tryCount++ < 5) {
							void mailQueue.push(mailTask);
						} else {
							t.log(
								`SMTPClient ${JSON.stringify(
									{
										tries: --tryCount,
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
							reject(err);
						}
					}
				};
				void mailQueue.push(mailTask);
				for (const task of mailQueueGenerator()) {
					await task?.();
				}
			});
		})
	);
});
