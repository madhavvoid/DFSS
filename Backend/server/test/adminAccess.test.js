import assert from 'node:assert/strict';
import test from 'node:test';
import { config } from '../config/env.js';
import { requireAdmin } from '../middleware/auth.js';

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('admin access rejects emails outside the configured allowlist', () => {
  const response = mockResponse();
  let continued = false;

  requireAdmin({ user: { email: 'user@example.com' } }, response, () => { continued = true; });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error, 'Administrator access required');
  assert.equal(continued, false);
});

test('admin access accepts configured email addresses case-insensitively', () => {
  config.adminEmails.push('admin@example.com');
  const response = mockResponse();
  let continued = false;

  try {
    requireAdmin({ user: { email: 'ADMIN@example.com' } }, response, () => { continued = true; });
  } finally {
    config.adminEmails.pop();
  }

  assert.equal(response.statusCode, 200);
  assert.equal(continued, true);
});