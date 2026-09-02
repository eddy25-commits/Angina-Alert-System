import * as webPush from "web-push";
import { createServiceClient } from "@/lib/supabase/server";
import {
  buildNotificationPayload,
  getVapidConfig,
} from "./notifications-core";

export type { NotificationPayload } from "./notifications-core";

export async function sendAlertNotification({
  recipientUserId,
  alertId,
  title,
  body,
}: {
  recipientUserId: string;
  alertId: string;
  title: string;
  body: string;
}) {
  const { publicKey, privateKey, subject } = getVapidConfig();
  webPush.setVapidDetails(subject, publicKey, privateKey);

  const supabase = createServiceClient();
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, is_active")
    .eq("user_id", recipientUserId)
    .eq("is_active", true);

  if (error) {
    console.error("HeartLink: failed to load push subscriptions", error);
    return { sent: 0 };
  }

  if (!subscriptions?.length) {
    return { sent: 0 };
  }

  const payload = JSON.stringify(
    buildNotificationPayload({
      title,
      body,
      alertId,
    })
  );

  const expiredIds: string[] = [];
  let sent = 0;

  for (const subscription of subscriptions) {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    try {
      await webPush.sendNotification(pushSubscription, payload);
      sent += 1;
    } catch (err) {
      console.warn("HeartLink: push delivery failed", err);
      expiredIds.push(subscription.id);
    }
  }

  if (expiredIds.length) {
    await supabase
      .from("push_subscriptions")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in("id", expiredIds);
  }

  return { sent };
}
