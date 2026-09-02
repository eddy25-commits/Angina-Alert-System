"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "checking" | "denied" | "off" | "on" | "error";

export default function NotificationSetup() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    }
    check().catch(() => setStatus("error"));
  }, []);

  async function enable() {
    setError(null);
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setError("Push notifications aren't configured on the server yet.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      if (!res.ok) throw new Error("Server rejected the subscription");
      setStatus("on");
    } catch {
      setError("Couldn't turn on notifications. Please try again.");
      setStatus("error");
    }
  }

  async function disable() {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setStatus("off");
    } catch {
      setError("Couldn't turn off notifications. Please try again.");
    }
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="text-sm text-hl-mist">
        Push notifications aren&apos;t supported in this browser.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-hl-mist">
        Notifications are blocked for HeartLink in your browser settings.
        Enable them there to receive alerts.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between rounded-xl border border-hl-line bg-hl-paper-dim px-4 py-3.5">
        <span className="text-sm font-medium text-hl-ink">
          Alert notifications
        </span>
        {status === "on" ? (
          <button
            type="button"
            onClick={disable}
            className="text-sm font-medium text-hl-mist"
          >
            Turn off
          </button>
        ) : (
          <button
            type="button"
            onClick={enable}
            className="text-sm font-medium text-hl-blue-700"
          >
            Turn on
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-hl-alert-deep">{error}</p>}
    </div>
  );
}
