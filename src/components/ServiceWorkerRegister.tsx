"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }

  return output;
}

async function subscribeToPush() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

  const isAppRoute = window.location.pathname.startsWith("/app");
  if (!isAppRoute) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const permission = Notification.permission;
  if (permission === "denied") return;

  const registration = await navigator.serviceWorker.ready;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const response = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
    }),
  });

  if (response.status === 401) {
    return;
  }

  if (!response.ok) {
    throw new Error(`Push subscription failed: ${response.status}`);
  }
}

/**
 * Registers the service worker and, when permission is available, requests a
 * browser push subscription for the current user.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("HeartLink: service worker registration failed", err);
    });

    if (window.location.pathname.startsWith("/app") && Notification.permission === "granted") {
      void subscribeToPush();
      return;
    }

    if (window.location.pathname.startsWith("/app") && Notification.permission === "default") {
      void Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          void subscribeToPush();
        }
      });
    }
  }, []);

  return null;
}
