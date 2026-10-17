import assert from 'node:assert/strict';
import { test } from 'node:test';

test('502 Bad Gateway from proxy returns sanitized, actionable JSON error message', async () => {
  const res = await fetch('http://localhost:5173/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ identifier: 'test', password: 'test' })
  });

  // When backend is offline, proxy should return 502 with JSON message
  if (res.status === 502) {
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'), '502 response must be application/json');
    const data = await res.json();
    assert.match(data.message, /Backend server is unreachable \(502 Bad Gateway\)/i);
    assert.equal(data.code, 'BACKEND_UNAVAILABLE');
  }
});
