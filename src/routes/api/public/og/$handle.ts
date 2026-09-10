import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const paramsSchema = z.object({ handle: z.string().trim().min(1).max(40) });

/**
 * Stable link-preview image for a public store.
 * Redirects to the newest active product photo, or the branded cover image.
 */
export const Route = createFileRoute("/api/public/og/$handle")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const origin = new URL(request.url).origin;
        const fallback = `${origin}/store-cover.jpg`;

        const parsed = paramsSchema.safeParse(params);
        if (!parsed.success) return Response.redirect(fallback, 302);

        try {
          const { createPublicSupabaseClient } = await import("@/lib/supabase-public.server");
          const supabase = createPublicSupabaseClient();

          const { data: seller } = await supabase
            .from("sellers")
            .select("id")
            .eq("tiktok_handle", parsed.data.handle.toLowerCase())
            .maybeSingle();

          if (!seller) return Response.redirect(fallback, 302);

          const { data: product } = await supabase
            .from("products")
            .select("image_url")
            .eq("seller_id", seller.id)
            .eq("is_active", true)
            .not("image_url", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!product?.image_url) return Response.redirect(fallback, 302);

          const { data: signed } = await supabase.storage
            .from("product-images")
            .createSignedUrl(product.image_url, 60 * 60 * 24);

          return Response.redirect(signed?.signedUrl ?? fallback, 302);
        } catch {
          return Response.redirect(fallback, 302);
        }
      },
    },
  },
});
