import assert from 'node:assert/strict';
import { test } from 'node:test';

const VITE_PORT = 5173;
const VITE_URL = `http://localhost:${VITE_PORT}`;

test('Member Bulk Import API validates and imports records correctly', async () => {
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

  // 2. Test template download
  const templateRes = await fetch(`${VITE_URL}/api/members/import/template`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  assert.equal(templateRes.status, 200, 'Expected template download to return 200');
  const templateCsv = await templateRes.text();
  assert.ok(templateCsv.includes('First Name*'), 'Template must include First Name header');
  assert.ok(templateCsv.includes('Email Address*'), 'Template must include Email Address header');

  // 3. Test validation endpoint
  const testEmail1 = `test.member.${Date.now()}@example.ph`;
  const testEmail2 = `test.member2.${Date.now()}@example.ph`;

  const validateRes = await fetch(`${VITE_URL}/api/members/import/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      rows: [
        {
          file_row_num: 2,
          first_name: 'Juan',
          last_name: 'Testmember',
          email: testEmail1,
          phone: '+63 917 111 2233',
          membership_type: 'Student',
          status: 'active'
        },
        {
          file_row_num: 3,
          first_name: 'Maria',
          last_name: 'Testmember',
          email: testEmail2,
          phone: '+63 918 333 4455',
          membership_type: 'Faculty',
          status: 'active'
        }
      ]
    })
  });

  assert.equal(validateRes.status, 200, 'Expected validation to return 200');
  const validateData = await validateRes.json();
  assert.equal(validateData.success, true);
  assert.equal(validateData.summary.valid_rows, 2);
  assert.equal(validateData.summary.issue_rows, 0);

  // 4. Test import execution
  const importRes = await fetch(`${VITE_URL}/api/members/import`, {
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
          first_name: 'Juan',
          last_name: 'Testmember',
          email: testEmail1,
          phone: '+63 917 111 2233',
          membership_type: 'Student',
          status: 'active'
        },
        {
          file_row_num: 3,
          first_name: 'Maria',
          last_name: 'Testmember',
          email: testEmail2,
          phone: '+63 918 333 4455',
          membership_type: 'Faculty',
          status: 'active'
        }
      ]
    })
  });

  assert.equal(importRes.status, 200, 'Expected import to return 200');
  const importData = await importRes.json();
  assert.equal(importData.success, true);
  assert.equal(importData.imported_count, 2);
  assert.ok(importData.imported_members.length === 2);
  assert.ok(importData.imported_members[0].member_id.startsWith('BPL-'));

  console.log('✓ All Member Bulk Upload tests passed successfully!');
});
