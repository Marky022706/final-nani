import assert from 'node:assert/strict';
import { test } from 'node:test';

const VITE_PORT = 5173;
const VITE_URL = `http://localhost:${VITE_PORT}`;

function generateValidIsbn13() {
  const prefix = '978' + Math.floor(100000000 + Math.random() * 900000000).toString().padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(prefix[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${prefix.slice(0, 3)}-${prefix.slice(3, 6)}-${prefix.slice(6, 11)}-${prefix.slice(11, 12)}-${checkDigit}`;
}

test('Bulk Import API returns 201 and complete summary on valid books', async () => {
  // 1. Log in as superadmin
  const loginRes = await fetch(`${VITE_URL}/api/login`, {
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

  assert.equal(loginRes.status, 200, 'Expected login to return 200');
  const loginData = await loginRes.json();
  const token = loginData.token;
  assert.ok(token, 'Expected token from login');

  // 2. Perform bulk import of unique records
  const uniqueAcc = `BPL-ACC-${Date.now().toString().slice(-4)}`;
  const uniqueIsbn = generateValidIsbn13();

  const importRes = await fetch(`${VITE_URL}/api/books/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: 'all_or_nothing',
      rows: [
        {
          file_row_num: 2,
          title: 'Automated Test Book For Modal Verification',
          author: 'Maria Clara',
          category: 'Filipiniana',
          format: 'Hardcover',
          accession_number: uniqueAcc,
          availability: 'Available',
          quantity: '2',
          isbn: uniqueIsbn
        }
      ]
    })
  });

  const importData = await importRes.json();
  if (importRes.status !== 201) {
    console.error('Import error response:', JSON.stringify(importData, null, 2));
  }
  assert.equal(importRes.status, 201, `Expected 201 Created, got ${importRes.status}`);
  assert.equal(importData.success, true);
  assert.equal(importData.imported_count, 1);
  assert.equal(importData.total_copies_created, 2);
  assert.ok(importData.summary, 'Expected import response to contain summary object');
  assert.equal(importData.summary.valid_rows, 1);
  assert.equal(importData.summary.invalid_rows, 0);
  assert.equal(importData.summary.total_rows, 1);
});

test('Bulk Import API aborts in all_or_nothing mode on errors', async () => {
  const loginRes = await fetch(`${VITE_URL}/api/login`, {
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
  const { token } = await loginRes.json();

  const importRes = await fetch(`${VITE_URL}/api/books/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      mode: 'all_or_nothing',
      rows: [
        {
          file_row_num: 2,
          title: '', // Missing title
          author: 'Some Author',
          quantity: '1',
          accession_number: 'BPL-ACC-9999'
        }
      ]
    })
  });

  assert.equal(importRes.status, 422, `Expected 422 for invalid all-or-nothing row, got ${importRes.status}`);
  const data = await importRes.json();
  assert.equal(data.success, false);
  assert.match(data.message, /Import aborted/i);
});
