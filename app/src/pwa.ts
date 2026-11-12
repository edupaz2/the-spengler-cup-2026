export interface Notifier {
  requestPermission(): Promise<"granted" | "denied" | "default">;
  show(title: string, body: string): void;
}

/** Ask for notification permission and show a sample reminder. Never throws. */
export async function requestReminder(n: Notifier | undefined): Promise<"granted" | "denied" | "unsupported"> {
  if (!n) return "unsupported";
  try {
    const result = await n.requestPermission();
    if (result !== "granted") return "denied";
    n.show("The Spengler Cup", "Your new deck is ready. Come and open it.");
    return "granted";
  } catch {
    return "denied";
  }
}

export function browserNotifier(): Notifier | undefined {
  if (typeof Notification === "undefined") return undefined;
  return {
    requestPermission: () => Notification.requestPermission(),
    show: (title, body) => { new Notification(title, { body, icon: "icons/icon-192.png" }); },
  };
}

export function registerServiceWorker(): void {
  if ("serviceWorker" in navigator && import.meta.env?.PROD) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline support is optional */ });
  }
}
