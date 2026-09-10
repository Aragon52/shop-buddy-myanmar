const SW_URL = "/sw.js";

const PREVIEW_HOST_PREFIXES = ["id-preview--", "preview--"];
const PREVIEW_ZONES = [
  "lovableproject.com",
  "lovableproject-dev.com",
  "beta.lovable.dev",
];

function isPreviewHost(host: string): boolean {
  if (PREVIEW_HOST_PREFIXES.some((prefix) => host.startsWith(prefix))) return true;
  return PREVIEW_ZONES.some((zone) => host === zone || host.endsWith(`.${zone}`));
}

async function unregisterAppServiceWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => {
        const scriptUrl =
          registration.active?.scriptURL ??
          registration.waiting?.scriptURL ??
          registration.installing?.scriptURL ??
          "";
        return scriptUrl.endsWith(SW_URL);
      })
      .map((registration) => registration.unregister()),
  );
}

/** Registers the offline worker only in the real published app, never in dev or Lovable preview. */
export async function registerServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const host = window.location.hostname;
  const refused =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    isPreviewHost(host) ||
    new URL(window.location.href).searchParams.get("sw") === "off";

  if (refused) {
    await unregisterAppServiceWorkers();
    return;
  }

  try {
    await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  } catch {
    // Offline support is optional; the app keeps working online without it.
  }
}
