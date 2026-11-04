import assert from 'node:assert/strict';
import test from 'node:test';

test('verification email uses the Resend HTTPS API when configured', async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.RESEND_FROM;
  const previousFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.RESEND_FROM = 'TPCM <verified@example.com>';

  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response('{}', { status: requests.length === 1 ? 200 : 403 });
  };

  try {
    const { sendVerificationCode } = await import('../services/emailService.js');
    await sendVerificationCode({ email: 'user@example.com', code: '123456', channel: 'email' });
    await assert.rejects(
      sendVerificationCode({ email: 'user@example.com', code: '654321', channel: 'email' }),
      /Resend could not deliver.*HTTP 403/
    );

    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, 'https://api.resend.com/emails');
    assert.equal(requests[0].options.headers.Authorization, 'Bearer test-resend-key');
    assert.deepEqual(JSON.parse(requests[0].options.body).to, ['user@example.com']);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = previousFrom;
  }
});
