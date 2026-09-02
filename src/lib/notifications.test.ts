import test from 'node:test';
import assert from 'node:assert/strict';

import { buildNotificationPayload, getVapidConfig } from './notifications-core';

test('buildNotificationPayload includes alert details and deep link', () => {
  const payload = buildNotificationPayload({
    title: 'HeartLink alert',
    body: 'Your trusted contact reported chest pain',
    alertId: 'abc-123',
  });

  assert.equal(payload.title, 'HeartLink alert');
  assert.equal(payload.body, 'Your trusted contact reported chest pain');
  assert.equal(payload.data.url, '/app/alerts/abc-123');
});

test('getVapidConfig rejects incomplete VAPID config', () => {
  assert.throws(() => {
    getVapidConfig({
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'public-key',
      VAPID_PRIVATE_KEY: '',
      VAPID_SUBJECT: 'mailto:support@example.com',
    });
  }, /VAPID/);
});
