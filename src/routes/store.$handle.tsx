import { createFileRoute, redirect } from "@tanstack/react-router";

/** Friendly alias so /store/<handle> lands on the same public shop page as /s/<handle>. */
export const Route = createFileRoute("/store/$handle")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/s/$handle", params: { handle: params.handle.toLowerCase() } });
  },
});
