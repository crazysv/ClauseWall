"use client";

// ============================================
// PUSH NOTIFICATION REGISTRATION
// Client-side push notification setup utility
// ============================================

/**
 * Check if push notifications are supported by the browser
 */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Register for push notifications
 * Returns the subscription JSON string, or null on failure
 */
export async function registerPushNotifications(): Promise<string | null> {
  try {
    if (!isPushSupported()) {
      console.warn("[TimeBomb Push] Push notifications not supported");
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[TimeBomb Push] Permission denied");
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // Get VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn("[TimeBomb Push] VAPID public key not configured");
      return null;
    }

    // Convert VAPID key to Uint8Array
    const keyBytes = urlBase64ToUint8Array(vapidKey);
    // Convert to ArrayBuffer to satisfy stricter TypeScript
    const applicationServerKey = new Uint8Array(keyBytes).buffer as ArrayBuffer;

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    const subscriptionJson = JSON.stringify(subscription);
    console.log("[TimeBomb Push] Subscribed successfully");
    return subscriptionJson;
  } catch (error) {
    console.error("[TimeBomb Push] Registration failed:", error);
    return null;
  }
}

/**
 * Unregister push notifications
 */
export async function unregisterPush(): Promise<void> {
  try {
    if (!isPushSupported()) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log("[TimeBomb Push] Unsubscribed");
    }
  } catch (error) {
    console.error("[TimeBomb Push] Unregister failed:", error);
  }
}

/**
 * Check if push notifications are currently enabled
 */
export async function isPushEnabled(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

/**
 * Convert a base64 URL-encoded string to a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}
