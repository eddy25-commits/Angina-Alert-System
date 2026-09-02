export type NotificationPayload = {
  title: string;
  body: string;
  data?: {
    url?: string;
  };
};

export function getVapidConfig(env: Partial<NodeJS.ProcessEnv> = process.env) {
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT ?? "mailto:support@example.com";

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY."
    );
  }

  return { publicKey, privateKey, subject };
}

export function buildNotificationPayload({
  title,
  body,
  alertId,
}: {
  title: string;
  body: string;
  alertId: string;
}): NotificationPayload & { data: { url: string } } {
  return {
    title,
    body,
    data: {
      url: `/app/alerts/${alertId}`,
    },
  };
}
