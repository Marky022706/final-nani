import assert from 'node:assert/strict';
import { test } from 'node:test';

const VITE_PORT = 5173;
const BACKEND_PORT = 8000;
const VITE_URL = `http://localhost:${VITE_PORT}`;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

test('Health endpoint directly responds from backend', async () => {
  const res = await fetch(`${BACKEND_URL}/up`);
  assert.equal(res.status, 200, 'Expected Laravel health check /up to return 200');
});

test('Login through Vite proxy returns 200 for valid credentials', async () => {
  const res = await fetch(`${VITE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      identifier: 'superadmin@balingasag.gov.ph',
      password: 'admin123'
    })
  });

  assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);
  const data = await res.json();
  assert.ok(data.token, 'Expected response to contain Sanctum personal access token');
  assert.equal(data.user.role, 'super_admin');
  assert.equal(data.user.email, 'superadmin@balingasag.gov.ph');
  assert.ok(data.user.privileges, 'Expected user to have privileges object');
});

test('Login through Vite proxy returns 401 for incorrect password', async () => {
  const res = await fetch(`${VITE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      identifier: 'superadmin@balingasag.gov.ph',
      password: 'incorrect-password'
    })
  });

  assert.equal(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
  const data = await res.json();
  assert.match(data.message, /Invalid credentials/i);
});

test('Login through Vite proxy returns 422 for missing fields', async () => {
  const res = await fetch(`${VITE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 422, `Expected 422 Unprocessable Content, got ${res.status}`);
  const data = await res.json();
  assert.ok(data.errors, 'Expected validation errors');
});
