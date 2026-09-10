import { createServerFn } from "@tanstack/react-start";

/** Absolute origin of the current request, used to build absolute share-image URLs. */
export const getSiteOrigin = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const host = getRequestHeader("host") ?? "";
  const proto = getRequestHeader("x-forwarded-proto") ?? "https";
  return { origin: host ? `${proto}://${host}` : "" };
});
