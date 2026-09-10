import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getOrderPulse } from "@/lib/maket.functions";

const playChime = (): void => {
  try {
    const AudioCtor = window.AudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch {
    // Sound is optional; some browsers block audio before a tap.
  }
};

/** Polls for new pending orders and alerts the seller while the app is open. */
export function useNewOrderAlerts(): void {
  const queryClient = useQueryClient();
  const lastSeenRef = useRef<string | null>(null);
  const initialisedRef = useRef(false);

  const { data } = useQuery({
    queryKey: ["order-pulse"],
    queryFn: () => getOrderPulse(),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!data) return;
    const latest = data.latestOrderId;

    if (!initialisedRef.current) {
      initialisedRef.current = true;
      lastSeenRef.current = latest;
      return;
    }

    if (!latest || latest === lastSeenRef.current) return;
    lastSeenRef.current = latest;

    playChime();
    toast.success("New order received", {
      description: data.buyerName ? `From ${data.buyerName} — waiting for review.` : undefined,
      duration: 8000,
    });
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
    void queryClient.invalidateQueries({ queryKey: ["shop-overview"] });
  }, [data, queryClient]);

  // Instant push from the database whenever a buyer creates an order.
  useEffect(() => {
    const channel = supabase
      .channel("seller-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as { id?: string; buyer_name?: string } | null;
          if (!row?.id || row.id === lastSeenRef.current) return;
          lastSeenRef.current = row.id;
          initialisedRef.current = true;

          playChime();
          toast.success("New order received", {
            description: row.buyer_name ? `From ${row.buyer_name} — waiting for review.` : undefined,
            duration: 8000,
          });
          void queryClient.invalidateQueries({ queryKey: ["orders"] });
          void queryClient.invalidateQueries({ queryKey: ["shop-overview"] });
          void queryClient.invalidateQueries({ queryKey: ["order-pulse"] });
        },
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["orders"] });
        void queryClient.invalidateQueries({ queryKey: ["shop-overview"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
