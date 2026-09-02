import { describe, it, expect } from "vitest";
import { buildNotificationPayload, getVapidConfig } from "./notifications-core";

describe("buildNotificationPayload", () => {
  it("includes alert details and deep link", () => {
    const payload = buildNotificationPayload({
      title: "HeartLink alert",
      body: "Your trusted contact reported chest pain",
      alertId: "abc-123",
    });

    expect(payload.title).toBe("HeartLink alert");
    expect(payload.body).toBe("Your trusted contact reported chest pain");
    expect(payload.data.url).toBe("/app/alerts/abc-123");
  });
});

describe("getVapidConfig", () => {
  it("rejects incomplete VAPID config", () => {
    expect(() =>
      getVapidConfig({
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: "public-key",
        VAPID_PRIVATE_KEY: "",
        VAPID_SUBJECT: "mailto:support@example.com",
      })
    ).toThrow(/VAPID/);
  });

  it("accepts a complete config and defaults the subject", () => {
    const config = getVapidConfig({
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "public-key",
      VAPID_PRIVATE_KEY: "private-key",
    });
    expect(config.publicKey).toBe("public-key");
    expect(config.privateKey).toBe("private-key");
    expect(config.subject).toBe("mailto:support@example.com");
  });
});
